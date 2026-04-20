'use client';

import { X, Calendar, Flag, Activity, Users, Paperclip, ExternalLink, Download, FileText, Clock, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import { useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SUPER_ADMIN_EMAILS = ['deepak@ad2ship.com', 'gaurishankar@ad2ship.com', 'mayank@ad2ship.com'];

export default function TaskViewModal({ isOpen, onClose, onEdit, task }) {
  const { user: currentUser } = useAuth();
  const API_BASE = useMemo(() => process.env.NEXT_PUBLIC_API_URL?.replace('/api', ''), []);

  const handleEdit = useCallback(() => {
    if (onEdit && task) {
      onEdit(task);
    }
  }, [onEdit, task]);

  if (!isOpen || !task) return null;

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 sm:p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 sm:p-8 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  task.status === 'in-progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-slate-50 text-slate-600 border-slate-200'
                }`}>
                  {task.status.replace('-', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                  'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}>
                  {task.priority}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight">
                {task.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {(task.createdBy?._id === currentUser?._id || SUPER_ADMIN_EMAILS.includes(currentUser?.email)) && (
                <button 
                  onClick={handleEdit}
                  className="p-2.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all shadow-sm group relative"
                  title="Edit Task"
                >
                  <Edit3 className="w-5 h-5 transition-transform group-hover:scale-110" />
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">Edit Task</span>
                </button>
              )}
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-2xl transition-all group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600 group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Assigned To</p>
                {task.assignedTo ? (
                  <p className="text-sm font-semibold text-slate-700">{task.assignedTo.name}</p>
                ) : (
                  <p className="text-sm font-semibold text-slate-400 italic">Unassigned</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Deadline</p>
                <p className={`text-sm font-semibold ${
                  task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed'
                    ? 'text-red-500' : 'text-slate-700'
                }`}>
                  {task.deadline ? format(new Date(task.deadline), 'MMMM dd, yyyy') : 'No deadline set'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Assigned By</p>
                <p className="text-sm font-semibold text-slate-700">{task.createdBy?.name || 'Admin'}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-lg">Task Description</h3>
            </div>
            <div className="bg-white border-l-4 border-indigo-100 p-6 rounded-r-2xl">
              {task.description ? (
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap text-base">
                  {task.description}
                </p>
              ) : (
                <p className="text-slate-400 italic text-base">No description provided for this task.</p>
              )}
            </div>
          </div>

          {/* Attachment Section */}
          {task.attachment && task.attachment.type !== 'none' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-800">
                <Paperclip className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-lg">Attachment</h3>
              </div>
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between gap-4 group hover:bg-indigo-50 transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                    {task.attachment.type === 'file' ? <FileText className="w-5 h-5" /> : <ExternalLink className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{task.attachment.name || (task.attachment.type === 'file' ? 'Uploaded File' : 'External Link')}</p>
                    <p className="text-[11px] text-indigo-500 font-medium uppercase tracking-wider">{task.attachment.type}</p>
                  </div>
                </div>
                {task.attachment.type === 'file' ? (
                  <a
                    href={`${API_BASE}${task.attachment.url}`}
                    download={task.attachment.name}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                ) : (
                  <a
                    href={task.attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Link
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-widest">Added {format(new Date(task.createdAt || Date.now()), 'MMM dd, hh:mm a')}</span>
          </div>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-all shadow-lg shadow-slate-200"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
