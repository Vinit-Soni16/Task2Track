'use client';

import { format } from 'date-fns';
import api from '../lib/api';
import { Paperclip, ExternalLink, Download } from 'lucide-react';

export default function TaskCard({ task, onTaskUpdate }) {
  const handleStatusChange = async (newStatus) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status: newStatus });
      onTaskUpdate(res.data);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const priorityColors = {
    high: 'border-l-red-500 bg-red-50/30',
    medium: 'border-l-amber-500 bg-amber-50/30',
    low: 'border-l-emerald-500 bg-emerald-50/30',
  };

  const statusColors = {
    completed: 'bg-emerald-100 text-emerald-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    pending: 'bg-slate-100 text-slate-600',
  };

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

  const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '');

  return (
    <div className={`bg-white rounded-xl border border-slate-200 border-l-4 ${priorityColors[task.priority]} p-4 card-hover animate-fadeIn`}>
      <div className="flex items-start justify-between mb-3">
        <h3 className={`font-medium text-sm ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
          {task.title}
        </h3>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusColors[task.status]}`}>
          {task.status.replace('-', ' ')}
        </span>
      </div>
      
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {task.assignedTo ? (
            <>
              <div className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-semibold">
                {task.assignedTo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <span className="text-slate-600">{task.assignedTo.name}</span>
            </>
          ) : (
            <span className="text-slate-400">Unassigned</span>
          )}
        </div>
        <span className={`${isOverdue ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
          {task.deadline ? format(new Date(task.deadline), 'MMM dd') : 'No deadline'}
        </span>
      </div>

      {/* Attachment */}
      {task.attachment && task.attachment.type !== 'none' && (
        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 transition-colors">
          {task.attachment.type === 'file' ? (
            <a
              href={`${API_BASE}${task.attachment.url}`}
              download={task.attachment.name}
              className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{task.attachment.name || 'Download File'}</span>
            </a>
          ) : (
            <a
              href={task.attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{task.attachment.name || 'Open Link'}</span>
            </a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>
    </div>
  );
}
