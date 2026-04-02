'use client';

import { memo, useCallback, useMemo } from 'react';
import { format } from 'date-fns';
import api from '../lib/api';
import { Paperclip, ExternalLink, Download } from 'lucide-react';
import CustomSelect from './CustomSelect';

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

const TaskCard = memo(function TaskCard({ task, onTaskUpdate, onClick, user }) {
  const handleStatusChange = useCallback(async (newStatus) => {
    try {
      const res = await api.put(`/tasks/${task._id}`, { status: newStatus });
      onTaskUpdate(res.data);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  }, [task._id, onTaskUpdate]);

  const isOverdue = useMemo(() => 
    task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
  , [task.deadline, task.status]);

  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''), []);

  return (
    <div 
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${priorityColors[task.priority]} p-4 card-hover animate-fadeIn cursor-pointer`}
      onClick={() => onClick?.(task)}
    >
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
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                {task.assignedTo.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{task.assignedTo.name}</span>
                <span className="text-[9px] text-slate-400 truncate leading-none mt-0.5">
                  {task.department || task.assignedTo.department}
                  {task.createdBy && ` • By ${task.createdBy.name}`}
                </span>
              </div>
            </div>
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
        <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-100 transition-colors" onClick={e => e.stopPropagation()}>
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

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100" onClick={e => e.stopPropagation()}>
        <CustomSelect
          value={task.status}
          onChange={handleStatusChange}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'in-progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' }
          ]}
          className="w-40!"
        />
      </div>
    </div>
  );
});

export default TaskCard;
