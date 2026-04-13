const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { auth, adminOnly } = require('../middleware/auth');
const { sendTaskAssignmentEmail, sendTaskCompletionEmail } = require('../services/emailService');
const multer = require('multer');

// Ensure uploads/tasks directory exists
const uploadsDir = path.join(__dirname, '../uploads/tasks');
try { 
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('[Tasks Router] Created uploads/tasks directory at:', uploadsDir);
  }
} catch (err) {
  console.error('[Tasks Router] Error creating directory:', err);
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (err) {
      console.error('[Tasks Router] Error ensuring directory exists:', err);
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Use crypto for better randomness
    const randomstring = crypto.randomBytes(8).toString('hex');
    const filename = `${Date.now()}-${randomstring}${path.extname(file.originalname)}`;
    console.log('[Tasks Router] Saving file:', filename, 'Original:', file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// GET /api/tasks/test-email - Direct test for email configuration
router.get('/test-email', async (req, res) => {
  try {
    const { sendTaskAssignmentEmail } = require('../services/emailService');
    const mockTask = { title: 'Test Task from API', priority: 'high' };
    const mockUser = { name: 'Admin', email: process.env.ADMIN_EMAIL };

    // Attempt to send email
    const result = await sendTaskAssignmentEmail(mockTask, mockUser);

    if (result) {
      res.json({ success: true, message: 'Email sent successfully via the backend!' });
    } else {
      res.json({ success: false, message: 'Failed to send email. Check backend logs for detailed error or it was caught as false.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

// GET /api/tasks/repair/broken-attachments - Repair broken file references (Admin only)
router.get('/repair/broken-attachments', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads/tasks');
    
    // Get all actual files in uploads directory
    const actualFiles = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
    console.log('Actual files in uploads/tasks:', actualFiles);
    
    // Find all tasks with file attachments
    const tasksWithAttachments = await Task.find({
      'attachment.type': 'file',
      'attachment.url': { $regex: /^\/uploads\/tasks\// }
    });
    
    const brokenTasks = [];
    const fixedTasks = [];
    
    for (const task of tasksWithAttachments) {
      const fileName = task.attachment.url.replace('/uploads/tasks/', '');
      const fileExists = actualFiles.includes(fileName);
      
      if (!fileExists) {
        console.warn(`[BROKEN ATTACHMENT] Task ${task._id}: ${fileName} not found`);
        brokenTasks.push({
          taskId: task._id,
          title: task.title,
          storedName: fileName,
          url: task.attachment.url
        });
        
        // Clear the broken attachment
        task.attachment = { type: 'none' };
        await task.save();
        fixedTasks.push(task._id);
      }
    }
    
    res.json({
      success: true,
      message: `Found ${brokenTasks.length} broken attachments and cleared ${fixedTasks.length}`,
      brokenAttachments: brokenTasks,
      clearedTaskIds: fixedTasks,
      availableFiles: actualFiles
    });
  } catch (error) {
    console.error('Repair error:', error);
    res.status(500).json({ error: 'Failed to repair broken attachments', details: error.message });
  }
});

// GET /api/tasks - Get tasks (admin sees all, member sees own)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email department')
      .populate('createdBy', 'name email')
      .populate('acknowledgment.taggedAdmin', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/stats - Get task statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Initial match query based on role
    const matchQuery = userRole !== 'admin' 
      ? { assignedTo: userId } 
      : {};

    const stats = await Task.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          // General counts
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
                mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
                lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
                overdue: { 
                  $sum: { 
                    $cond: [
                      { 
                        $and: [
                          { $ne: ['$status', 'completed'] },
                          { $lt: ['$deadline', now] },
                          { $ne: ['$deadline', null] }
                        ] 
                      }, 1, 0 
                    ] 
                  } 
                }
              }
            }
          ],
          // Weekly progress (last 7 days)
          weekly: [
            {
              $match: {
                completedAt: { $gte: sevenDaysAgo },
                status: 'completed'
              }
            },
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const result = stats[0].counts[0] || {
      total: 0, completed: 0, inProgress: 0, pending: 0,
      highPriority: 0, mediumPriority: 0, lowPriority: 0, overdue: 0
    };

    // Format weekly progress for the frontend
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = stats[0].weekly.find(w => w._id === dateString);
      
      weeklyProgress.push({
        day: weekDays[date.getDay()],
        completed: dayData ? dayData.count : 0
      });
    }

    res.json({
      ...result,
      weeklyProgress,
      completionRate: result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/tasks/stats/:userId - Get task statistics for a specific user (Admin only)
router.get('/stats/:userId', auth, adminOnly, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [stats, userInfo] = await Promise.all([
      Task.aggregate([
        { $match: { assignedTo: new mongoose.Types.ObjectId(targetUserId) } },
        {
          $facet: {
            counts: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                  inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
                  pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                  highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
                  mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
                  lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } },
                  overdue: { 
                    $sum: { 
                      $cond: [
                        { 
                          $and: [
                            { $ne: ['$status', 'completed'] },
                            { $lt: ['$deadline', now] },
                            { $ne: ['$deadline', null] }
                          ] 
                        }, 1, 0 
                      ] 
                    } 
                  }
                }
              }
            ],
            weekly: [
              {
                $match: {
                  completedAt: { $gte: sevenDaysAgo },
                  status: 'completed'
                }
              },
              {
                $group: {
                  _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ]
          }
        }
      ]),
      User.findById(targetUserId).select('name email department')
    ]);

    const result = stats[0]?.counts[0] || {
      total: 0, completed: 0, inProgress: 0, pending: 0,
      highPriority: 0, mediumPriority: 0, lowPriority: 0, overdue: 0
    };

    // Format weekly progress
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = stats[0]?.weekly.find(w => w._id === dateString);
      
      weeklyProgress.push({
        day: weekDays[date.getDay()],
        completed: dayData ? dayData.count : 0
      });
    }

    res.json({
      ...result,
      weeklyProgress,
      completionRate: result.total > 0 ? Math.round((result.completed / result.total) * 100) : 0,
      user: userInfo
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// POST /api/tasks - Create task (Admin only)
router.post('/', auth, adminOnly, upload.single('file'), async (req, res) => {
  try {
    const { title, description, assignedTo, deadline, priority, status, attachmentType, attachmentUrl, department } = req.body;

    // Log file upload details for debugging
    if (attachmentType === 'file') {
      console.log('File upload details:', {
        originalname: req.file?.originalname,
        filename: req.file?.filename,
        size: req.file?.size,
        mimetype: req.file?.mimetype
      });
    }

    const taskData = {
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'pending',
      createdBy: req.user._id,
      department: department || req.user.department || '',
      attachment: { type: 'none' }
    };

    // Handle Attachment
    if (attachmentType === 'url' && attachmentUrl) {
      taskData.attachment = {
        type: 'url',
        url: attachmentUrl,
        name: 'External Link'
      };
    } else if (attachmentType === 'file' && req.file) {
      // Sanitize filename to prevent path traversal
      const safeFilename = path.basename(req.file.filename);
      taskData.attachment = {
        type: 'file',
        url: `/uploads/tasks/${safeFilename}`,
        name: req.file.originalname
      };
      console.log('Attachment URL:', taskData.attachment.url);
    }

    if (assignedTo) {
      taskData.assignedTo = assignedTo;
    }

    if (deadline) {
      taskData.deadline = new Date(deadline);
    }

    const task = new Task(taskData);
    await task.save();

    // Populate and return
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    // Log activity
    await ActivityLog.create({
      user: req.user._id,
      action: 'task_created',
      taskId: task._id,
      details: `Created task: ${title}`
    });

    // Send assignment email if user is assigned
    if (populatedTask.assignedTo && populatedTask.assignedTo.email) {
      sendTaskAssignmentEmail(populatedTask, populatedTask.assignedTo);
    }

    res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = req.body;
    const oldStatus = task.status;

    // Handle Attachment updates
    if (updates.attachmentType === 'url' && updates.attachmentUrl) {
      task.attachment = {
        type: 'url',
        url: updates.attachmentUrl,
        name: 'External Link'
      };
    } else if (updates.attachmentType === 'file' && req.file) {
      // Log file update details for debugging
      console.log('File update details:', {
        originalname: req.file?.originalname,
        filename: req.file?.filename,
        size: req.file?.size
      });
      
      const safeFilename = path.basename(req.file.filename);
      task.attachment = {
        type: 'file',
        url: `/uploads/tasks/${safeFilename}`,
        name: req.file.originalname
      };
      console.log('Updated attachment URL:', task.attachment.url);
    } else if (updates.attachmentType === 'none') {
      task.attachment = { type: 'none' };
    }

    // Acknowledgment logic removed to keep database light
    // Handling standard status updates only

    // Update other fields, but skip special ones handled above
    const skipFields = ['attachmentType', 'attachmentUrl', 'acknowledgmentType', 'acknowledgmentUrl', 'taggedAdmin'];
    Object.keys(updates).forEach(key => {
      if (skipFields.includes(key)) return;

      if (key === 'deadline' && updates[key]) {
        task[key] = new Date(updates[key]);
      } else {
        task[key] = updates[key];
      }
    });

    // Explicitly handle department update if provided
    if (updates.department !== undefined) {
      task.department = updates.department;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('acknowledgment.taggedAdmin', 'name email');

    // Log if status changed to completed
    if (oldStatus !== 'completed' && task.status === 'completed') {
      await ActivityLog.create({
        user: req.user._id,
        action: 'task_completed',
        taskId: task._id,
        details: `Completed task: ${task.title}`
      });
    } else {
      await ActivityLog.create({
        user: req.user._id,
        action: 'task_updated',
        taskId: task._id,
        details: `Updated task: ${task.title}`
      });
    }

    // Send emails based on updates
    if (populatedTask.assignedTo && populatedTask.assignedTo.email) {
      // If assignment changed
      if (updates.assignedTo && updates.assignedTo.toString() !== task.assignedTo?.toString()) {
        sendTaskAssignmentEmail(populatedTask, populatedTask.assignedTo);
      }

      // If status changed to completed, notify creator
      if (oldStatus !== 'completed' && populatedTask.status === 'completed') {
        if (populatedTask.createdBy && populatedTask.createdBy.email) {
          sendTaskCompletionEmail(populatedTask, populatedTask.createdBy);
        }
      }
    }

    res.json(populatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only admin or creator can delete
    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await Task.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      user: req.user._id,
      action: 'task_deleted',
      taskId: req.params.id,
      details: `Deleted task: ${task.title}`
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
