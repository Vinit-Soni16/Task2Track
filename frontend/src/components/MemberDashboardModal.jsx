'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle, Clock, AlertCircle, Building2 } from 'lucide-react';
import api from '../lib/api';

const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export default function MemberDashboardModal({ isOpen, onClose, member }) {
  const [stats, setStats] = useState(null);
  const [memberTasks, setMemberTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (isOpen && member?._id) {
      fetchMemberData();
    }
    return () => {
      setStats(null);
      setMemberTasks([]);
      setLoading(true);
      setError('');
      setStatusFilter('all');
    };
  }, [isOpen, member?._id]);

  const fetchMemberData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, tasksRes] = await Promise.all([
        api.get(`/tasks/stats/${member._id}`),
        api.get(`/tasks?userId=${member._id}`)
      ]);
      setStats(statsRes.data);
      setMemberTasks(tasksRes.data);
    } catch (err) {
      console.error('Failed to fetch member data:', err);
      setError('Failed to load member data');
    }
    setLoading(false);
  };

  if (!isOpen || !member) return null;

  const filteredTasks = memberTasks.filter(t => {
    const isAssigned = t.assignedTo && (t.assignedTo._id === member._id || t.assignedTo === member._id);
    if (!isAssigned) return false;

    if (statusFilter === 'overdue') {
      const now = new Date();
      return t.status !== 'completed' && t.deadline && new Date(t.deadline) < now;
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;

    return true;
  });

  const pending = stats?.pending || 0;
  const inProgress = stats?.inProgress || 0;
  const completed = stats?.completed || 0;
  const total = stats?.total || 0;
  const completionRate = stats?.completionRate || 0;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-60 p-0 sm:p-4">
      <div 
        className="bg-slate-50 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl shadow-2xl animate-slideUp max-h-[92vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-linear-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-200 shrink-0">
              {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{member.name}&apos;s Dashboard</h2>
                {member.role === 'admin' && SUPER_ADMIN_EMAILS.includes(member.email) && (
                  <span className="px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase shrink-0">Admin</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">{member.email}</span>
                {member.department && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    <Building2 className="w-2.5 h-2.5" />
                    {member.department}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                window.location.href = `/tasks?assignee=${member._id}`;
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              View Full List
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors shrink-0">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">Loading dashboard...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button 
                onClick={() => setStatusFilter('all')}
                className={`text-left bg-white rounded-xl border p-3 sm:p-4 transition-all ${statusFilter === 'all' ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800">{total}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100 text-slate-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
              </button>
              <button 
                onClick={() => setStatusFilter('completed')}
                className={`text-left bg-white rounded-xl border p-3 sm:p-4 transition-all ${statusFilter === 'completed' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Done</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600">{completed}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
              </button>
              <button 
                onClick={() => setStatusFilter('in-progress')}
                className={`text-left bg-white rounded-xl border p-3 sm:p-4 transition-all ${statusFilter === 'in-progress' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">In Progress</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">{inProgress}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-500">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
              </button>
              <button 
                onClick={() => setStatusFilter('overdue')}
                className={`text-left bg-white rounded-xl border p-3 sm:p-4 transition-all ${statusFilter === 'overdue' ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-500">{stats?.overdue || 0}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                </div>
              </button>
            </div>

            {/* Task Ratio + Completion Rate side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Task Ratio - Simple bar visualization */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Task Ratio</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-red-600">Pending</span>
                      <span className="text-xs font-bold text-slate-700">{pending}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: total > 0 ? `${(pending/total)*100}%` : '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-600">In Progress</span>
                      <span className="text-xs font-bold text-slate-700">{inProgress}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: total > 0 ? `${(inProgress/total)*100}%` : '0%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-emerald-600">Completed</span>
                      <span className="text-xs font-bold text-slate-700">{completed}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: total > 0 ? `${(completed/total)*100}%` : '0%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 text-sm mb-3">Completion Rate</h3>
                <div className="flex items-center justify-center h-35">
                  <div className="text-center">
                    <div className="relative w-28 h-28 mx-auto">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle
                          cx="50" cy="50" r="42"
                          fill="none" stroke="#10b981" strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${completionRate * 2.64} 264`}
                          transform="rotate(-90 50 50)"
                          className="transition-all duration-700"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-slate-800">{completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Progress - simple bars */}
            {stats?.weeklyProgress && stats.weeklyProgress.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Weekly Progress</h3>
                <div className="flex items-end justify-between gap-2 h-32">
                  {stats.weeklyProgress.map((day, i) => {
                    const max = Math.max(...stats.weeklyProgress.map(d => d.completed), 1);
                    const height = (day.completed / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-700">{day.completed}</span>
                        <div className="w-full bg-slate-100 rounded-t-md relative" style={{ height: '100px' }}>
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-indigo-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">{day.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800 text-sm">Tasks {statusFilter !== 'all' && `(${statusFilter})`}</h3>
                {statusFilter !== 'all' && (
                  <button onClick={() => setStatusFilter('all')} className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700">
                    Show All
                  </button>
                )}
              </div>
              {filteredTasks.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No tasks found</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredTasks.slice(0, 10).map(task => (
                    <div key={task._id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                          {task.title}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                          {task.createdBy && ` • By ${task.createdBy.name}`}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2 shrink-0 ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {task.status === 'in-progress' ? 'In Progress' : task.status === 'completed' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
