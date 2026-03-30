const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const { startDeadlineCron } = require('./services/deadlineCron');

const app = express();

// Middleware 
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

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
    
    // Remove old admin as requested
    const oldAdmin = await User.findOne({ email: 'vinit@ad2ship.com' });
    if (oldAdmin) {
      await User.deleteOne({ email: 'vinit@ad2ship.com' });
      console.log('Removed old admin: vinit@ad2ship.com');
    }
  } catch (error) {
    console.error('Failed to seed admins:', error);
  }
}

// Connect to MongoDB and start server
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Seed admin
    await seedAdmin();
    
    // Start deadline cron
    startDeadlineCron();
    
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
