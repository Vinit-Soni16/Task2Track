const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});


const FRONTEND_URL = process.env.FRONTEND_URL 

// ─── Shared email wrapper ───
function emailWrapper(headerBg, headerTitle, headerSub, bodyContent) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: ${headerBg}; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.85;">${headerSub}</p>
        <h1 style="margin: 6px 0 0 0; font-size: 22px;">${headerTitle}</h1>
      </div>
      <div style="background: #ffffff; padding: 28px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
        ${bodyContent}
        <div style="text-align: center; margin-top: 28px;">
          <a href="${FRONTEND_URL}/tasks" style="background: ${headerBg}; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">View in Dashboard</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Task2Track — Manage your tasks efficiently
        </p>
      </div>
    </div>
  `;
}

function taskBlock(task, borderColor) {
  const priorityColor = task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#10b981';
  return `
    <div style="background: #f8fafc; border-left: 4px solid ${borderColor}; padding: 18px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;">${task.title}</h3>
      ${task.description ? `<p style="margin: 0 0 10px 0; color: #64748b; font-size: 13px;">${task.description}</p>` : ''}
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 3px 0; color: #94a3b8; font-size: 12px; width: 80px;">Priority</td>
          <td style="padding: 3px 0; color: ${priorityColor}; font-weight: 600; font-size: 12px; text-transform: uppercase;">${task.priority}</td>
        </tr>
        ${task.deadline ? `
        <tr>
          <td style="padding: 3px 0; color: #94a3b8; font-size: 12px;">Deadline</td>
          <td style="padding: 3px 0; color: #334155; font-size: 12px; font-weight: 500;">
            ${new Date(task.deadline).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            at ${new Date(task.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </td>
        </tr>` : ''}
      </table>
    </div>
  `;
}

// ─── 1. TASK ASSIGNMENT EMAIL (sent to member immediately) ───
async function sendTaskAssignmentEmail(task, user) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${user.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">A new task has been assigned to you in <strong>Task2Track</strong>. Please check the details below:</p>
      ${taskBlock(task, '#6366f1')}
      <p style="color: #334155; font-size: 14px;">Please start working on this task and update its status regularly.</p>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `📋 New Task Assigned: ${task.title}`,
      html: emailWrapper('#6366f1', 'New Task Assigned', 'Notification', body)
    });
    console.log(`[EMAIL] Assignment email sent for "${task.title}" to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed assignment email for "${task.title}":`, error);
    return false;
  }
}

// ─── 2. TASK COMPLETION EMAIL (sent to admin when member completes) ───
async function sendTaskCompletionEmail(task, admin) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${admin.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Great news! A task has been marked as <strong>completed</strong>.</p>
      <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 8px 0; color: #064e3b; font-size: 16px;">${task.title}</h3>
        <p style="margin: 0; color: #065f46; font-size: 13px;">Assigned To: <strong>${task.assignedTo ? task.assignedTo.name : 'Unassigned'}</strong></p>
        <p style="margin: 4px 0 0 0; color: #065f46; font-size: 13px;">Completed: <strong>${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong></p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: admin.email,
      subject: `✅ Task Completed: ${task.title}`,
      html: emailWrapper('#10b981', 'Task Completed', 'Update', body)
    });
    console.log(`[EMAIL] Completion email sent for "${task.title}" to ${admin.email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed completion email for "${task.title}":`, error);
    return false;
  }
}

// ─── 3. DEADLINE REMINDER — 24 hours before ───
async function sendReminder24h(task, user) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${user.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">This is a reminder that you have <strong style="color: #f59e0b;">less than 24 hours</strong> to complete the following task:</p>
      ${taskBlock(task, '#f59e0b')}
      <p style="color: #334155; font-size: 14px;">⏳ Please prioritize this task and complete it before the deadline.</p>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `⚠️ 24 Hours Left: ${task.title}`,
      html: emailWrapper('#f59e0b', '24 Hours Remaining', 'Deadline Reminder', body)
    });
    console.log(`[EMAIL] 24h reminder sent for "${task.title}" to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed 24h reminder for "${task.title}":`, error.message);
    return false;
  }
}

// ─── 4. DEADLINE REMINDER — 12 hours before ───
async function sendReminder12h(task, user) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${user.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">Urgent reminder! You have <strong style="color: #ea580c;">only 12 hours left</strong> to complete this task:</p>
      ${taskBlock(task, '#ea580c')}
      <p style="color: #334155; font-size: 14px;">🔥 Time is running out. Please complete this task as soon as possible!</p>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `🔥 12 Hours Left: ${task.title}`,
      html: emailWrapper('#ea580c', '12 Hours Remaining', 'Urgent Reminder', body)
    });
    console.log(`[EMAIL] 12h reminder sent for "${task.title}" to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed 12h reminder for "${task.title}":`, error.message);
    return false;
  }
}

// ─── 5. DEADLINE REMINDER — 1 hour before ───
async function sendReminder1h(task, user) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${user.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">🚨 <strong style="color: #ef4444;">FINAL WARNING!</strong> You have <strong style="color: #ef4444;">only 1 hour</strong> left to complete this task:</p>
      ${taskBlock(task, '#ef4444')}
      <p style="color: #ef4444; font-size: 14px; font-weight: 600;">⚡ Complete this task RIGHT NOW or it will be marked as overdue!</p>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `🚨 1 Hour Left: ${task.title}`,
      html: emailWrapper('#ef4444', 'Final Warning — 1 Hour Left', 'Critical Reminder', body)
    });
    console.log(`[EMAIL] 1h reminder sent for "${task.title}" to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed 1h reminder for "${task.title}":`, error.message);
    return false;
  }
}

// ─── 6. OVERDUE — sent to BOTH member AND admin ───
async function sendOverdueToMember(task, user) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${user.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">❌ The deadline for the following task has <strong style="color: #ef4444;">passed</strong> and you have not completed it:</p>
      ${taskBlock(task, '#ef4444')}
      <p style="color: #ef4444; font-size: 14px; font-weight: 600;">Your admin has been notified. Please complete this task immediately or provide an update.</p>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `❌ Deadline Missed: ${task.title}`,
      html: emailWrapper('#dc2626', 'Task Deadline Missed', 'Overdue Alert', body)
    });
    console.log(`[EMAIL] Overdue email sent to member ${user.email} for "${task.title}"`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed overdue email to member for "${task.title}":`, error.message);
    return false;
  }
}

async function sendOverdueToAdmin(task, member, admin) {
  try {
    const body = `
      <p style="color: #64748b; font-size: 15px;">Hi ${admin.name},</p>
      <p style="color: #334155; font-size: 15px; line-height: 1.6;">⚠️ The following task assigned to <strong>${member.name}</strong> has <strong style="color: #ef4444;">missed its deadline</strong> and is still not completed:</p>
      ${taskBlock(task, '#ef4444')}
      <div style="background: #fef2f2; border: 1px solid #fee2e2; padding: 14px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0; color: #dc2626; font-size: 13px; font-weight: 600;">
          👤 ${member.name} (${member.email}) has not completed this task.
        </p>
        <p style="margin: 6px 0 0 0; color: #991b1b; font-size: 13px;">
          Please follow up with them to get this task completed.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Task2Track" <${process.env.SMTP_USER}>`,
      to: admin.email,
      subject: `🚩 ${member.name} Missed Deadline: ${task.title}`,
      html: emailWrapper('#dc2626', 'Team Member Missed Deadline', 'Admin Alert', body)
    });
    console.log(`[EMAIL] Overdue admin alert sent to ${admin.email} about ${member.name} for "${task.title}"`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed overdue admin email for "${task.title}":`, error.message);
    return false;
  }
}

module.exports = { 
  sendTaskAssignmentEmail, 
  sendTaskCompletionEmail,
  sendReminder24h,
  sendReminder12h,
  sendReminder1h,
  sendOverdueToMember,
  sendOverdueToAdmin
};
