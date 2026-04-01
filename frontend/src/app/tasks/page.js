'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import TaskTable from '../../components/TaskTable';
import TaskCard from '../../components/TaskCard';
import TaskModal from '../../components/TaskModal';
import TaskViewModal from '../../components/TaskViewModal';
import AIAssistant from '../../components/AIAssistant';
import SkeletonBase, { TableRowSkeleton } from '../../components/Skeleton';
import CustomSelect from '../../components/CustomSelect';
import { DEPARTMENTS } from '../../lib/constants';
import DateRangePicker from '../../components/DateRangePicker';
import { isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { Plus, List, LayoutGrid, Search, Clock, TrendingUp } from 'lucide-react';

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
  const [deptFilter, setDeptFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);


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
    const isEdit = !!data._id;
    
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
    
    if (isEdit) {
      const res = await api.put(`/tasks/${data._id}`, payload);
      setTasks(prev => prev.map(t => t._id === data._id ? res.data : t));
    } else {
      const res = await api.post('/tasks', payload);
      setTasks(prev => [res.data, ...prev]);
    }
  }, []);

  const handleTaskUpdate = useCallback((updatedTask) => {
    setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t));
  }, [fetchData]);

  const handleTaskDelete = useCallback((taskId) => {
    setTasks(prev => prev.filter(t => t._id !== taskId));
  }, []);

  const handleAITaskCreated = useCallback((task) => {
    setTasks(prev => [task, ...prev]);
  }, []);

  const handleTaskClick = useCallback((task) => {
    setSelectedTask(task);
    setShowViewModal(true);
  }, []);

  const handleEditFromView = useCallback((task) => {
    setShowViewModal(false);
    setSelectedTask(task);
    setShowModal(true);
  }, []);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    
    // Date range filter (by deadline)
    if (dateRange.start && dateRange.end) {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline);
      const isMatch = isWithinInterval(taskDate, { 
        start: startOfDay(dateRange.start), 
        end: endOfDay(dateRange.end) 
      });
      if (!isMatch) return false;
    }

    // If a member is specifically selected, show their tasks regardless of current department filter
    if (assigneeFilter !== 'all') {
      if (task.assignedTo?._id !== assigneeFilter) return false;
    } else if (deptFilter !== 'all') {
      const taskDept = (task.department || task.assignedTo?.department)?.trim().toLowerCase();
      const filterDept = deptFilter.trim().toLowerCase();
      if (taskDept !== filterDept) return false;
    }

    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) && !task.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }), [tasks, statusFilter, priorityFilter, deptFilter, searchQuery, assigneeFilter, dateRange]);

  const memberOptions = useMemo(() => [
    { value: 'all', label: 'All Members' },
    ...users.map(u => ({ value: u._id, label: u.name }))
  ], [users]);

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
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm w-full sm:w-auto"
                >
                  <Clock className="w-4 h-4 text-indigo-500" />
                  {dateRange.start && dateRange.end 
                    ? `${format(dateRange.start, 'MMM d')} - ${format(dateRange.end, 'MMM d')}`
                    : 'Select Date Range'
                  }
                </button>
                {isDatePickerOpen && (
                  <div className="fixed inset-0 z-40" onClick={() => setIsDatePickerOpen(false)} />
                )}
                {isDatePickerOpen && (
                  <DateRangePicker 
                    initialRange={dateRange}
                    onApply={(range) => {
                      setDateRange(range);
                      setIsDatePickerOpen(false);
                    }}
                    onCancel={() => setIsDatePickerOpen(false)}
                  />
                )}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm w-full sm:w-auto"
              >
                <Plus className="w-4 h-4" />
                New Task
              </button>
            </div>
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
              <div className="flex flex-wrap items-center gap-2 px-1 py-1 bg-slate-50 border border-slate-200 rounded-xl w-full xl:w-auto">
                <CustomSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'in-progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' }
                  ]}
                  className="!w-40 border-none bg-transparent"
                />
                <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
                <CustomSelect
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  options={[
                    { value: 'all', label: 'All Priority' },
                    { value: 'high', label: 'High' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'low', label: 'Low' }
                  ]}
                  className="!w-40 border-none bg-transparent"
                />
                <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
                <CustomSelect
                  value={deptFilter}
                  onChange={setDeptFilter}
                  options={DEPARTMENTS.map(d => ({ value: d, label: d === 'all' ? 'All Depts' : d }))}
                  className="!w-40 border-none bg-transparent"
                />
                <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />
                <CustomSelect
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  options={memberOptions}
                  className="!w-40 border-none bg-transparent"
                />
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
                <TaskTable 
                  tasks={filteredTasks} 
                  onTaskUpdate={handleTaskUpdate} 
                  onTaskDelete={handleTaskDelete} 
                  onTaskClick={handleTaskClick}
                  user={user} 
                />
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
                  <TaskCard 
                    key={task._id} 
                    task={task} 
                    onTaskUpdate={handleTaskUpdate} 
                    onTaskDelete={handleTaskDelete} 
                    onClick={handleTaskClick}
                    user={user} 
                  />
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
        onClose={() => {
          setShowModal(false);
          if (!showViewModal) setSelectedTask(null);
        }}
        onSubmit={handleCreateTask}
        users={users}
        task={selectedTask}
        currentUserDepartment={user?.department}
      />

      <TaskViewModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedTask(null);
        }}
        onEdit={handleEditFromView}
        task={selectedTask}
      />

      {user?.role === 'admin' && <AIAssistant onTaskCreated={handleAITaskCreated} />}
    </div>
  );
}
