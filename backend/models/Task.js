const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deadline: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastEmailSent: {
    type: Date,
    default: null
  },
  // Track which deadline reminders have been sent
  remindersSent: {
    assigned: { type: Boolean, default: false },
    hours24: { type: Boolean, default: false },
    hours12: { type: Boolean, default: false },
    hour1: { type: Boolean, default: false },
    overdue: { type: Boolean, default: false }
  },
  completedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  attachment: {
    type: { 
      type: String, 
      enum: ['file', 'url', 'none'], 
      default: 'none' 
    },
    url: { type: String, default: '' },
    name: { type: String, default: '' }
  },
  acknowledgment: {
    taggedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    type: { type: String, enum: ['file', 'url', 'none'], default: 'none' },
    url: { type: String, default: '' },
    name: { type: String, default: '' }
  }
});

// Auto-set completedAt when status changes to completed
taskSchema.pre('save', function() {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = null;
  }
});

module.exports = mongoose.model('Task', taskSchema);
