const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config();

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const { startDeadlineCron } = require('./services/deadlineCron');

const app = express();

// Middleware 
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Ensure uploads directory exists
const fs = require('fs');
const uploadsPath = path.join(__dirname, 'uploads');
const uploadTasksPath = path.join(uploadsPath, 'tasks');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log('Created uploads directory');
}

if (!fs.existsSync(uploadTasksPath)) {
  fs.mkdirSync(uploadTasksPath, { recursive: true });
  console.log('Created uploads/tasks directory');
}

// Serve uploads with proper headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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
