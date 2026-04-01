const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const { 
  sendReminder24h, 
  sendReminder12h, 
  sendReminder1h, 
  sendOverdueToMember, 
  sendOverdueToAdmin 
} = require('./emailService');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function startDeadlineCron() {
  // Run every 10 minutes for accurate deadline tracking
  cron.schedule('*/10 * * * *', async () => {
    console.log('[CRON] Checking deadline reminders...');
    
    try {
      const now = new Date();

      // Find all incomplete tasks that have a deadline and an assigned user
      const tasks = await Task.find({
        status: { $ne: 'completed' },
        deadline: { $ne: null },
        assignedTo: { $ne: null }
      }).populate('assignedTo', 'name email').populate('createdBy', 'name email');

      // Get all admin users (for overdue notifications)
      const admins = await User.find({ role: 'admin' }).select('name email');

      console.log(`[CRON] Checking ${tasks.length} tasks with deadlines...`);

      for (const task of tasks) {
        if (!task.assignedTo || !task.assignedTo.email) continue;

        const deadline = new Date(task.deadline);
        const timeLeft = deadline.getTime() - now.getTime();
        const hoursLeft = timeLeft / (1000 * 60 * 60);

        // Ensure remindersSent exists
        if (!task.remindersSent) {
          task.remindersSent = { assigned: false, hours24: false, hours12: false, hour1: false, overdue: false };
        }

        // ─── 1 HOUR REMINDER ───
        // Send when <= 1 hour left and > 0 (not yet overdue)
        if (hoursLeft <= 1 && hoursLeft > 0 && !task.remindersSent.hour1) {
          const sent = await sendReminder1h(task, task.assignedTo);
          if (sent) {
            task.remindersSent.hour1 = true;
            task.remindersSent.hours24 = true; // Mark old ones as "handled"
            task.remindersSent.hours12 = true;
            task.lastEmailSent = now;
            await task.save();
            console.log(`[CRON] 1h reminder sent for "${task.title}"`);
          }
        }

        // ─── OVERDUE — deadline has passed ───
        // Send to BOTH member AND admin
        if (hoursLeft <= 0 && !task.remindersSent.overdue) {
          // Send to the assigned member
          const sentMember = await sendOverdueToMember(task, task.assignedTo);
          await sleep(500); // 500ms delay
          
          // Send to all admins
          for (const admin of admins) {
            await sendOverdueToAdmin(task, task.assignedTo, admin);
            await sleep(1000); // 1s delay between admins to avoid rate limits
          }

          if (sentMember) {
            task.remindersSent.overdue = true;
            task.remindersSent.hours24 = true;
            task.remindersSent.hours12 = true;
            task.remindersSent.hour1 = true;
            task.lastEmailSent = now;
            await task.save();
            console.log(`[CRON] Overdue emails sent for "${task.title}" to member + admin(s)`);
          }
        }
      }
    } catch (error) {
      console.error('[CRON] Deadline check error:', error);
    }
  });

  console.log('[CRON] Deadline reminder system started (checks every 10 minutes)');
  console.log('[CRON] Reminders at: 1h before deadline + overdue notification to member & admin');
}

module.exports = { startDeadlineCron };
