'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import TaskTable from '../../components/TaskTable';
import TaskCard from '../../components/TaskCard';
import TaskModal from '../../components/TaskModal';
import AIAssistant from '../../components/AIAssistant';
import SkeletonBase, { TableRowSkeleton } from '../../components/Skeleton';
import { Plus, List, LayoutGrid, Search, Filter } from 'lucide-react';

export default function TasksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('table');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');


  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        api.get('/tasks'),
        api.get('/users'),
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user?._id, authLoading, router, fetchData]);

  const handleCreateTask = useCallback(async (data) => {
    let payload = data;
    
    // Check if we need to send FormData
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
  }, [fetchData]);

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  }, [fetchData]);

  const handleTaskDelete = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  }, []);

  const handleAITaskCreated = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter, searchQuery]);

  if (authLoading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <SkeletonBase className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="lg:ml-60 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">My Tasks</h1>
            <p className="text-slate-500 mt-1 text-sm">Organize, track and manage your team's work</p>
          </div>
          {user?.role === 'admin' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 placeholder:text-slate-400"
              />
            </div>

            {/* Filters and Views */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <div className="w-px h-4 bg-slate-200 mx-1" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-sm font-medium text-slate-600 focus:outline-none"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-1.5 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Task Views */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <TaskTable tasks={filteredTasks} onTaskUpdate={handleTaskUpdate} onTaskDelete={handleTaskDelete} user={user} />
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12 bg-white">
                    <p className="text-slate-400 font-medium">No tasks found matching your criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <>
                <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
                <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
                <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
              </>
            ) : (
              <>
                {filteredTasks.map(task => (
                  <TaskCard key={task._id} task={task} onTaskUpdate={handleTaskUpdate} onTaskDelete={handleTaskDelete} user={user} />
                ))}
                {filteredTasks.length === 0 && (
                  <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
                    <p className="text-slate-400 font-medium">No tasks found matching your criteria</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
