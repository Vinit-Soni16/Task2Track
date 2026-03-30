const OpenAI = require('openai');

let openai = null;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (err) {
  console.warn('⚠️ OpenAI client could not be initialized:', err.message);
}
/**
 * Fallback parser: extracts task info from text using basic NLP patterns
 */
function fallbackParse(text, users) {
  const lower = text.toLowerCase();
  
  // Extract priority
  let priority = 'medium';
  if (lower.includes('high priority') || lower.includes('urgent') || lower.includes('critical') || lower.includes('high')) {
    priority = 'high';
  } else if (lower.includes('low priority') || lower.includes('minor') || lower.includes('low')) {
    priority = 'low';
  }

  // Extract assignee
  let assigneeName = null;
  const assignPatterns = [
    /assign(?:ed)?\s+(?:to\s+)?(\w+(?:\s+\w+)?)/i,
    /to\s+(\w+(?:\s+\w+)?)\s+by/i,
    /for\s+(\w+(?:\s+\w+)?)\s/i,
  ];
  for (const pattern of assignPatterns) {
    const match = text.match(pattern);
    if (match) {
      const candidate = match[1].trim();
      // Check if it matches any user
      const found = users.find(u => u.name.toLowerCase().includes(candidate.toLowerCase()));
      if (found) {
        assigneeName = found.name;
        break;
      }
    }
  }

  // Extract deadline
  let deadline = null;
  const now = new Date();
  if (lower.includes('tomorrow')) {
    deadline = new Date(now.getTime() + 86400000).toISOString();
  } else if (lower.includes('next week')) {
    deadline = new Date(now.getTime() + 7 * 86400000).toISOString();
  } else if (lower.includes('today')) {
    deadline = now.toISOString();
  } else if (lower.includes('friday')) {
    const d = new Date(now);
    const dayOfWeek = d.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilFriday);
    deadline = d.toISOString();
  } else if (lower.includes('monday')) {
    const d = new Date(now);
    const dayOfWeek = d.getDay();
    const daysUntilMonday = (1 - dayOfWeek + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    deadline = d.toISOString();
  }

  // Extract title - remove priority keywords, assign patterns, deadline patterns
  let title = text
    .replace(/high\s*priority:?\s*/i, '')
    .replace(/low\s*priority:?\s*/i, '')
    .replace(/urgent:?\s*/i, '')
    .replace(/assign(?:ed)?\s+(?:to\s+)?\w+(?:\s+\w+)?\s*/i, '')
    .replace(/\s*by\s+(tomorrow|next week|today|friday|monday)\s*/i, '')
    .replace(/\s*to\s+\w+\s+by\s+\w+\s*/i, '')
    .trim();

  if (!title) title = text.trim();

  return {
    title: title.charAt(0).toUpperCase() + title.slice(1),
    description: '',
    assigneeName,
    deadline,
    priority,
    status: 'pending'
  };
}

/**
 * Parse natural language input into structured task data
 */
async function parseTaskFromText(text = '', users = []) {
  if (!text || text.trim() === '') return fallbackParse('', users);
  const userNames = users.map(u => u.name).join(', ');
  
  const prompt = `You are a task parser. Extract structured task information from this natural language input.

Available team members: ${userNames}

User input: "${text}"

Return a JSON object with these exact fields:
{
  "title": "task title extracted from input",
  "description": "brief description if any, otherwise empty string",
  "assigneeName": "name of the person to assign to (must match one from available team members, or null if not specified)",
  "deadline": "ISO date string if deadline mentioned (interpret 'tomorrow' as tomorrow's date, 'next week' as 7 days from now, etc.), or null",
  "priority": "high, medium, or low (default medium if not specified)",
  "status": "pending"
}

Today's date is: ${new Date().toISOString().split('T')[0]}

IMPORTANT: Return ONLY the JSON object, no other text or markdown.`;

  // Try OpenAI first, fallback to basic parsing
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a precise task parser that outputs only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const content = response.choices[0].message.content.trim();
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (error) {
      console.error('AI parse error (falling back to local parser):', error.message);
      return fallbackParse(text, users);
    }
  } else {
    console.log('Using fallback parser (no OpenAI client)');
    return fallbackParse(text, users);
  }
}

/**
 * Generate AI performance insights from team analytics data
 */
async function generateInsights(analyticsData) {
  if (openai) {
    try {
      const prompt = `You are a team performance analyst. Analyze this team data and provide 4-6 actionable insights.

Team Data:
${JSON.stringify(analyticsData, null, 2)}

Generate insights about:
1. Most productive team member
2. Team members who might be overloaded
3. Team members who are underutilized
4. Deadline compliance observations
5. Overall team health

Return a JSON array of insight objects:
[
  {
    "type": "success" | "warning" | "info" | "danger",
    "title": "Short title",
    "message": "Detailed insight message"
  }
]

IMPORTANT: Return ONLY the JSON array, no other text or markdown.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a team analytics expert that outputs only valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content.trim();
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const insights = JSON.parse(jsonStr);
      return insights;
    } catch (error) {
      console.error('AI insights error (using fallback):', error.message);
      return generateFallbackInsights(analyticsData);
    }
  } else {
    return generateFallbackInsights(analyticsData);
  }
}

/**
 * Fallback insights generator
 */
function generateFallbackInsights(analyticsData) {
  const insights = [];
  
  if (analyticsData.length === 0) {
    return [{ type: 'info', title: 'No Data', message: 'Add team members and tasks to see insights.' }];
  }

  const totalTasks = analyticsData.reduce((s, m) => s + m.totalTasks, 0);
  const totalCompleted = analyticsData.reduce((s, m) => s + m.completed, 0);
  const totalOverdue = analyticsData.reduce((s, m) => s + m.overdue, 0);
  
  const topPerformer = analyticsData.reduce((best, m) => (!best || m.completionRate > best.completionRate) ? m : best, null);
  
  if (topPerformer && topPerformer.totalTasks > 0) {
    insights.push({ type: 'success', title: 'Top Performer', message: `${topPerformer.name} leads with ${topPerformer.completionRate}% completion rate across ${topPerformer.totalTasks} tasks.` });
  }
  
  if (totalOverdue > 0) {
    insights.push({ type: 'danger', title: 'Overdue Tasks', message: `${totalOverdue} task(s) are past their deadline. Review and reassign if needed.` });
  }
  
  const overloadedMembers = analyticsData.filter(m => m.pending > 5);
  if (overloadedMembers.length > 0) {
    insights.push({ type: 'warning', title: 'Potential Overload', message: `${overloadedMembers.map(m => m.name).join(', ')} may be overloaded with ${overloadedMembers[0].pending}+ pending tasks.` });
  }
  
  const overallRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;
  insights.push({ type: 'info', title: 'Team Completion', message: `Overall team completion rate is ${overallRate}%. ${totalCompleted} of ${totalTasks} tasks completed.` });
  
  const idleMembers = analyticsData.filter(m => m.totalTasks === 0);
  if (idleMembers.length > 0) {
    insights.push({ type: 'warning', title: 'Underutilized', message: `${idleMembers.map(m => m.name).join(', ')} have no tasks assigned. Consider distributing work more evenly.` });
  }

  return insights;
}

module.exports = { parseTaskFromText, generateInsights };
