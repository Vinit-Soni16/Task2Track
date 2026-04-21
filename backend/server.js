const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const fs = require('fs');

dotenv.config();

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const { startDeadlineCron } = require('./services/deadlineCron');

// GridFS Setup
let gridfsBucket;
const conn = mongoose.connection;
conn.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  console.log('[Server] GridFS Initialized');
});

const app = express();

// Attach GridFS to req for routes
app.use((req, res, next) => {
  req.gridfsBucket = gridfsBucket;
  next();
});

// Middleware 
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serving GridFS files (PERSISTENT STORAGE)
app.get('/api/files/:filename', async (req, res) => {
  try {
    if (!gridfsBucket) {
      return res.status(500).send('Server starting... please try again in a second.');
    }
    const file = await gridfsBucket.find({ filename: req.params.filename }).next();
    if (!file) return res.status(404).send('File not found in database');
    
    // Set headers
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    const ext = path.extname(file.filename).toLowerCase();
    const downloadExts = ['.pdf', '.docx', '.xlsx', '.ppt', '.pptx', '.doc', '.xls'];
    
    if (downloadExts.includes(ext)) {
      res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
    }

    const readStream = gridfsBucket.openDownloadStream(file._id);
    readStream.on('error', (err) => {
      res.status(500).send('Error streaming file');
    });
    readStream.pipe(res);
  } catch (err) {
    console.error('[GridFS] Serve Error:', err);
    res.status(500).send(err.message);
  }
});

// Ensure uploads directory exists with absolute paths
const uploadsPath = path.resolve(__dirname, 'uploads');
const uploadTasksPath = path.resolve(uploadsPath, 'tasks');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('[Server] Created uploads directory at:', uploadsPath);
}

if (!fs.existsSync(uploadTasksPath)) {
  fs.mkdirSync(uploadTasksPath, { recursive: true });
  console.log('[Server] Created uploads/tasks directory at:', uploadTasksPath);
}

// Debug middleware for uploads
app.use('/uploads', (req, res, next) => {
  console.log(`[Static] Request for: ${req.url}`);
  next();
});

// Serve uploads with explicit headers and subfolder mounting
app.use('/uploads/tasks', express.static(uploadTasksPath, {
  maxAge: '1d',
  setHeaders: (res, path) => {
    const ext = path.toLowerCase();
    if (ext.endsWith('.docx') || ext.endsWith('.xlsx') || ext.endsWith('.pdf') || 
        ext.endsWith('.ppt') || ext.endsWith('.pptx') || ext.endsWith('.doc') || 
        ext.endsWith('.xls') || ext.endsWith('.xlax')) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// Fallback for /uploads/tasks to help debug missing files on Render
app.get('/uploads/tasks/:filename', (req, res) => {
  const filePath = path.resolve(uploadTasksPath, req.params.filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send(`Cannot find file at: ${filePath}. Note: Render filesystem is ephemeral; files are lost on restart.`);
});

app.use('/uploads', express.static(uploadsPath));


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Seed admin users
async function seedAdmin() {
  try {
    const adminEmailsStr = process.env.ADMIN_EMAILS;
    if (adminEmailsStr) {
      const adminEmails = adminEmailsStr.split(',').map(e => e.trim());
      const adminPassword = process.env.ADMIN_PASSWORD ;
      
      for (const email of adminEmails) {
        if (!email) continue;
        
        const existing = await User.findOne({ email });
        
        if (!existing) {
          // Create name from email prefix (e.g. anjali -> Anjali)
          const prefix = email.split('@')[0];
          const adminName = prefix.charAt(0).toUpperCase() + prefix.slice(1);
          
          const admin = new User({
            name: adminName,
            email: email,
            password: adminPassword,
            role: 'admin'
          });
          await admin.save();
          console.log(`Admin user seeded: ${email}`);
        } else {
          // If they exist but aren't admin, upgrade them
          if (existing.role !== 'admin') {
            existing.role = 'admin';
            await existing.save();
            console.log(`Upgraded existing user ${email} to admin role.`);
          } else {
            console.log(`Admin user already exists: ${email}`);
          }
        }
      }
    }
    

  } catch (error) {
    console.error('Failed to seed admins:', error);
  }
}

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI?.startsWith('mongodb+srv://')) {
  const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  if (dnsServers.length > 0) {
    // Atlas SRV lookups can fail with some local routers/ISPs, so use explicit resolvers.
    dns.setServers(dnsServers);
    console.log('Using DNS servers for MongoDB SRV lookup:', dnsServers.join(', '));
  }
}

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 })
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed admin
    await seedAdmin();
    
    // Start deadline cron
    startDeadlineCron();
    
   app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
