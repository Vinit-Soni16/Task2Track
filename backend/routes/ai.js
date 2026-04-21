const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth, adminOnly } = require('../middleware/auth');
const { parseTaskFromText, generateInsights } = require('../services/openai');
const { sendTaskAssignmentEmail } = require('../services/emailService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads/tasks directory exists relative to backend folder
const uploadDir = path.resolve(__dirname, '../uploads/tasks');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('[AI] Created uploads/tasks directory at:', uploadDir);
  } catch (err) {
    console.error('[AI] Failed to create uploads directory:', err);
  }
}

// Use Memory Storage for manual GridFS upload
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    cb(null, true); // Allow all for manual GridFS
  }
});

// POST /api/ai/parse-task (Supports text + optional file or fileUrl)
router.post('/parse-task', auth, adminOnly, upload.single('file'), async (req, res) => {
  console.log('[AI] Incoming request. Text length:', req.body.text?.length);
  try {
    const { text, fileUrl, attachmentType } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Please provide task description text' });
    }

    // Get all users for matching
    const users = await User.find().select('name email _id');
    
    // Parse with AI
    const parsed = await parseTaskFromText(text, users);

    // Find the assigned user
    let assignedTo = null;
    let matchedUser = null;
    if (parsed.assigneeName) {
      matchedUser = users.find(u => 
        u.name.toLowerCase().includes(parsed.assigneeName.toLowerCase()) ||
        parsed.assigneeName.toLowerCase().includes(u.name.toLowerCase())
      );
      if (matchedUser) {
        assignedTo = matchedUser._id;
      }
    }

    // Prepare attachment
    let attachment = { type: 'none', url: '', name: '' };
    if (req.file) {
      const filename = `ai-${Date.now()}-${path.parse(req.file.originalname).name}${path.extname(req.file.originalname)}`;
      const uploadStream = req.gridfsBucket.openUploadStream(filename, { contentType: req.file.mimetype });
      await new Promise((res, rej) => { uploadStream.end(req.file.buffer); uploadStream.on('finish', res); uploadStream.on('error', rej); });
      attachment = {
        type: 'file',
        url: `/api/files/${filename}`,
        name: req.file.originalname
      };
    } else if (fileUrl) {
      attachment = {
        type: 'url',
        url: fileUrl,
        name: 'Attachment Link'
      };
    } else if (attachmentType && attachmentType !== 'none') {
       // Support for passing attachment info if already uploaded/defined
       attachment.type = attachmentType;
       attachment.url = req.body.attachmentUrl || '';
       attachment.name = req.body.attachmentName || 'Attachment';
    }

    // Create the task
    const taskData = {
      title: parsed.title,
      description: parsed.description || '',
      assignedTo,
      deadline: parsed.deadline ? new Date(parsed.deadline) : null,
      priority: parsed.priority || 'medium',
      status: parsed.status || 'pending',
      createdBy: req.user._id,
      attachment
    };

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email');

    // Send instant notification if assigned
    if (matchedUser) {
      try {
        await sendTaskAssignmentEmail(populatedTask, matchedUser);
      } catch (emailErr) {
        console.error('Failed to send AI task assignment email:', emailErr);
      }
    }

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'ai_task_created',
      taskId: task._id,
      details: `AI created task: "${parsed.title}" file: ${attachment.type !== 'none'}`
    });

    res.status(201).json({
      task: populatedTask,
      parsed: {
        ...parsed,
        assignedUser: matchedUser ? matchedUser.name : 'Unassigned'
      }
    });
  } catch (error) {
    console.error('[AI] parse-task error details:', error);
    res.status(500).json({ 
      error: 'Failed to process AI request',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// POST /api/ai/insights - Generate AI insights (same as before)
router.post('/insights', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const tasks = await Task.find().populate('assignedTo', 'name email');

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
