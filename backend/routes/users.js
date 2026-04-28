const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const { auth, adminOnly, superAdminOnly } = require('../middleware/auth');

const router = express.Router();

// ... existing routes ...

// PUT /api/users/:id/role - Update user role (Super Admin only)
router.put('/:id/role', auth, superAdminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting super admins
    const SUPER_ADMIN_EMAILS = (process.env.SUPER_ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (SUPER_ADMIN_EMAILS.includes(user.email)) {
      return res.status(403).json({ error: 'Cannot change role of a Super Admin' });
    }

    user.role = role;
    await user.save();

    res.json({ message: `User role updated to ${role}`, user: { _id: user._id, role: user.role } });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});



// GET /api/users - Get all users (for assignment dropdowns)
router.get('/', auth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/profile - Update own profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, department, phone, password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (department !== undefined) user.department = department;
    if (phone !== undefined) user.phone = phone;
    if (password && password.length >= 6) user.password = password;

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/analytics - Per-user task analytics (admin only)
router.get('/analytics', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');

    // For admin analytics, we want to see all tasks to get a complete team overview
    const tasks = await Task.find().populate('assignedTo', 'name email');

    const analytics = users.map(user => {
      const userTasks = tasks.filter(t =>
        t.assignedTo && t.assignedTo._id.toString() === user._id.toString()
      );

      const totalTasks = userTasks.length;
      const completed = userTasks.filter(t => t.status === 'completed').length;
      const pending = userTasks.filter(t => t.status === 'pending').length;
      const inProgress = userTasks.filter(t => t.status === 'in-progress').length;
      const now = new Date();
      const overdue = userTasks.filter(t =>
        t.status !== 'completed' && t.deadline && new Date(t.deadline) < now
      ).length;
      const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        totalTasks,
        completed,
        pending,
        inProgress,
        overdue,
        completionRate
      };
    });

    // Sort by total tasks descending
    analytics.sort((a, b) => b.totalTasks - a.totalTasks);

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

module.exports = router;
