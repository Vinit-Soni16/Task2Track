const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth, adminOnly } = require('../middleware/auth');
const { parseTaskFromText, generateInsights } = require('../services/openai');

const router = express.Router();

// POST /api/ai/parse-task
router.post('/parse-task', auth, adminOnly, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide task description text' });
    }

    // Get all users for matching
    const users = await User.find().select('name email _id');
    
    // Parse with AI
    const parsed = await parseTaskFromText(text, users);

    // Find the assigned user if name was extracted
    let assignedTo = null;
    if (parsed.assigneeName) {
      const matchedUser = users.find(u => 
        u.name.toLowerCase().includes(parsed.assigneeName.toLowerCase()) ||
        parsed.assigneeName.toLowerCase().includes(u.name.toLowerCase())
      );
      if (matchedUser) {
        assignedTo = matchedUser._id;
      }
    }

    // Create the task
    const taskData = {
      title: parsed.title,
      description: parsed.description || '',
      assignedTo,
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      priority: parsed.priority || 'medium',
      status: parsed.status || 'pending',
      createdBy: req.user._id
    };

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'ai_task_created',
      taskId: task._id,
      details: `AI created task from: "${text}"`
    });

    res.status(201).json({
      task: populatedTask,
      parsed: {
        ...parsed,
        assignedUser: assignedTo ? users.find(u => u._id.toString() === assignedTo.toString())?.name : 'Unassigned'
      }
    });
  } catch (error) {
    console.error('AI parse-task error:', error);
    res.status(500).json({ error: 'Failed to create task from natural language. Please try again.' });
  }
});

// POST /api/ai/insights - Generate AI insights (admin only)
router.post('/insights', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const tasks = await Task.find().populate('assignedTo', 'name email');

    // Build analytics data for AI
    const analyticsData = users.map(user => {
      const userTasks = tasks.filter(t => 
        t.assignedTo && t.assignedTo._id.toString() === user._id.toString()
      );
      
      const now = new Date();
      return {
        name: user.name,
        role: user.role,
        totalTasks: userTasks.length,
        completed: userTasks.filter(t => t.status === 'completed').length,
        pending: userTasks.filter(t => t.status === 'pending').length,
        inProgress: userTasks.filter(t => t.status === 'in-progress').length,
        overdue: userTasks.filter(t => 
          t.status !== 'completed' && t.deadline && new Date(t.deadline) < now
        ).length,
        completionRate: userTasks.length > 0 
          ? Math.round((userTasks.filter(t => t.status === 'completed').length / userTasks.length) * 100) 
          : 0
      };
    });

    const insights = await generateInsights(analyticsData);

    res.json({ insights, analyticsData });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to generate AI insights' });
  }
});

module.exports = router;
