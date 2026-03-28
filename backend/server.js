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

// Seed admin user
async function seedAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL ;
    const existing = await User.findOne({ email: adminEmail });
    
    if (!existing) {
      const admin = new User({
        name: process.env.ADMIN_NAME ,
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD ,
        role: 'admin'
      });
      await admin.save();
      console.log(`Admin user seeded: ${adminEmail}`);
    } else {
      console.log(`Admin user already exists`);
    }
  } catch (error) {
    console.error('Failed to seed admin:', error);
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
