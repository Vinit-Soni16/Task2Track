'use client';

import { useState, memo, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';
import { CheckSquare, Square, Paperclip, ExternalLink, Download } from 'lucide-react';

const TaskTable = memo(function TaskTable({ tasks, onTaskUpdate, user }) {
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = useCallback(async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const res = await api.put(`/tasks/${taskId}`, { status: newStatus });
      onTaskUpdate(res.data);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
    setUpdatingId(null);
  }, [onTaskUpdate]);

  const getPriorityBadge = useCallback((priority) => {
    const colors = {
      high: 'bg-red-100 text-red-600',
      medium: 'bg-amber-100 text-amber-600',
      low: 'bg-emerald-100 text-emerald-600',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    );
  }, []);

  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''), []);

  const renderAttachment = useCallback((task) => {
    if (!task.attachment || task.attachment.type === 'none') return null;

    if (task.attachment.type === 'file') {
      const fileUrl = `${API_BASE}${task.attachment.url}`;
      return (
        <div className="mt-1 flex items-center gap-1.5">
          <a
            href={fileUrl}
            download={task.attachment.name}
            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition-all max-w-45"
          >
            <Download className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.attachment.name || 'Download'}</span>
          </a>
        </div>
      );
    }

    if (task.attachment.type === 'url') {
      return (
        <div className="mt-1 flex items-center gap-1.5">
          <a
            href={task.attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 transition-all max-w-45"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate">{task.attachment.name || task.attachment.url}</span>
          </a>
        </div>
      );
    }

    return null;
  }, [API_BASE]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1 sm:mx-0">
      <table className="w-full min-w-175">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-8"></th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Task</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Deadline</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task._id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
              <td className="py-3 px-4">
                <button 
                  onClick={() => handleStatusChange(task._id, task.status === 'completed' ? 'pending' : 'completed')}
                  disabled={updatingId === task._id}
                >
                  {task.status === 'completed' ? (
                    <CheckSquare className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                  )}
                </button>
              </td>
              <td className="py-3 px-4">
                <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-50">{task.description}</p>
                )}
                {renderAttachment(task)}
              </td>
              <td className="py-3 px-4">
                {task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold">
                      {task.assignedTo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="text-sm text-slate-600">{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">Unassigned</span>
                )}
              </td>
              <td className="py-3 px-4">
                <span className={`text-sm ${
                  task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
                    ? 'text-red-500 font-medium' : 'text-slate-600'
                }`}>
                  {task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : '-'}
                </span>
              </td>
              <td className="py-3 px-4">{getPriorityBadge(task.priority)}</td>
              <td className="py-3 px-4">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  disabled={updatingId === task._id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    task.status === 'completed'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : task.status === 'in-progress'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  } ${updatingId === task._id ? 'opacity-50' : ''}`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TaskTable;
