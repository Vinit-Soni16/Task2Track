'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import TaskTable from '../../components/TaskTable';
import TaskCard from '../../components/TaskCard';
import TaskModal from '../../components/TaskModal';
import AIAssistant from '../../components/AIAssistant';
import WeeklyProgress from '../../components/WeeklyProgress';
import PriorityDonut from '../../components/PriorityDonut';
import CompletionRate from '../../components/CompletionRate';
import CalendarWidget from '../../components/CalendarWidget';
import { TrendingUp, CheckCircle, Clock, AlertCircle, Plus, List, LayoutGrid, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, statsRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/tasks/stats'),
        api.get('/users'),
      ]);
      setTasks(tasksRes.data);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, []);

  const handleCreateTask = useCallback(async (data) => {
    let payload = data;
    
    // Convert to FormData if file is present
    if (data.file) {
      payload = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'file') {
          payload.append(key, data[key]);
        }
      });
      payload.append('file', data.file);
    }
    
    const res = await api.post('/tasks', payload);
    setTasks(prev => [res.data, ...prev]);
    fetchData();
  }, [fetchData]);

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
    fetchData();
  }, [fetchData]);

  const handleTaskDelete = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
    fetchData();
  }, [fetchData]);

  const handleAITaskCreated = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
    fetchData();
  }, [fetchData]);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter]);

  const importantTasks = useMemo(() => tasks.filter(t => t.priority === 'high' && t.status !== 'completed'), [tasks]);

  // Dashboard title based on role
  const dashboardTitle = user?.role === 'admin' 
    ? 'Admin Dashboard' 
    : `${user?.name || 'My'}'s Dashboard`;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="lg:ml-60 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{dashboardTitle}</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Welcome back, {user?.name}</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <CalendarWidget tasks={tasks} />
            {user?.role === 'admin' && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm flex-1 sm:flex-none"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Total Tasks" value={stats?.total || 0} icon={TrendingUp} color="slate" />
          <StatCard label="Completed" value={stats?.completed || 0} icon={CheckCircle} color="green" />
          <StatCard label="In Progress" value={stats?.inProgress || 0} icon={Clock} color="blue" />
          <StatCard label="Overdue" value={stats?.overdue || 0} icon={AlertCircle} color="red" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="xl:col-span-2">
            <WeeklyProgress data={stats?.weeklyProgress || []} />
          </div>
          <div className="w-full">
            <PriorityDonut 
              pending={stats?.pending || 0} 
              inProgress={stats?.inProgress || 0} 
              completed={stats?.completed || 0} 
            />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="mb-6">
          <CompletionRate rate={stats?.completionRate || 0} />
        </div>

        {/* Important Tasks */}
        {importantTasks.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 mb-6 animate-fadeIn">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-slate-800">Important Tasks</h3>
            </div>
            <div className="space-y-2">
              {importantTasks.map(task => (
                <div key={task._id} className="bg-red-50 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.deadline ? `Due: ${new Date(task.deadline).toLocaleDateString()}` : 'No deadline'}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-semibold self-start sm:self-auto">
                    High Priority
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tasks Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">Recent Tasks</h2>
            <Link 
              href="/tasks" 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
            >
              View All <TrendingUp className="w-3 h-3" rotate={90} />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <TaskTable 
                tasks={tasks.slice(0, 5)} 
                onTaskUpdate={handleTaskUpdate} 
                onTaskDelete={handleTaskDelete} 
              />
            </div>
            {tasks.length > 5 && (
              <div className="p-4 text-center border-t border-slate-100 bg-slate-50/30">
                <Link href="/tasks" className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
                  Showing 5 of {tasks.length} tasks. Click to view all.
                </Link>
              </div>
            )}
            {tasks.length === 0 && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">No tasks found. Create your first task to get started!</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <TaskModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateTask}
        users={users}
      />

      {user?.role === 'admin' && <AIAssistant onTaskCreated={handleAITaskCreated} />}
    </div>
  );
}
