'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, User, Calendar, Flag, Clock, Bot, UserCircle, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

export default function AIAssistant({ onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' or 'form'
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Form mode state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium',
    status: 'pending',
  });

  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const examples = [
    'Create a task for fixing the login bug',
    'Assign code review to Admin by Friday',
    'High priority: Update documentation',
  ];

  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/ai/parse-task', { text: userMsg });
      const task = res.data.task;
      const parsed = res.data.parsed;
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '✅ Task created successfully!',
        task: {
          title: task.title,
          assignee: task.assignedTo?.name || parsed?.assignedUser || 'Unassigned',
          deadline: task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : 'No deadline',
          priority: task.priority,
          status: task.status,
        }
      }]);
      
      if (onTaskCreated) onTaskCreated(task);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to process your request. Try again.';
      setMessages(prev => [...prev, { type: 'bot', text: `❌ ${errMsg}`, isError: true }]);
    }
    setLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim()) return;
    
    setLoading(true);
    setError('');

    const data = { ...formData };
    if (!data.assignedTo) delete data.assignedTo;
    if (!data.deadline) delete data.deadline;

    try {
      const res = await api.post('/tasks', data);
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '✅ Task created from form!',
        task: {
          title: res.data.title,
          assignee: res.data.assignedTo?.name || 'Unassigned',
          deadline: res.data.deadline ? format(new Date(res.data.deadline), 'MMM dd, yyyy') : 'No deadline',
          priority: res.data.priority,
          status: res.data.status,
        }
      }]);
      setFormData({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium', status: 'pending' });
      setMode('chat');
      if (onTaskCreated) onTaskCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create task');
    }
    setLoading(false);
  };

  const handleExampleClick = (text) => {
    setInput(text);
  };

  const getPriorityColor = (p) => {
    const map = { high: 'text-red-500 bg-red-50', medium: 'text-amber-500 bg-amber-50', low: 'text-emerald-500 bg-emerald-50' };
    return map[p] || map.medium;
  };

  const getStatusColor = (s) => {
    const map = { completed: 'text-emerald-600 bg-emerald-50', 'in-progress': 'text-blue-600 bg-blue-50', pending: 'text-slate-600 bg-slate-50' };
    return map[s] || map.pending;
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center z-50 transition-all duration-300 ${
          isOpen ? 'bg-slate-800 rotate-45 scale-90' : 'bg-linear-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-110 hover:shadow-xl'
        }`}
      >
        {isOpen ? (
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        ) : (
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-20 sm:inset-auto sm:bottom-24 sm:right-6 w-auto sm:w-100 h-[calc(100vh-120px)] sm:h-140 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 animate-slideUp flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-5 py-4 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">AI Task Assistant</h3>
                  <p className="text-[10px] text-indigo-200">Create tasks with natural language</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="sm:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Mode Tabs */}
            <div className="flex mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-0.5">
             
              <button
                onClick={() => setMode('form')}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                  mode === 'form' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/80 hover:text-white'
                }`}
              >
                📝 Quick Form
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {mode === 'chat' ? (
              <div className="p-4 space-y-3">
                {/* Welcome */}
                {messages.length === 0 && (
                  <div className="animate-fadeIn">
                    <div className="flex gap-2.5 mb-4">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                      <div className="bg-slate-50 rounded-xl rounded-tl-none px-4 py-3 max-w-[85%]">
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Hi! 👋 I can create tasks from natural language. Tell me what you need done, who to assign it to, and any deadline.
                        </p>
                      </div>
                    </div>
                    
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">Try these examples</p>
                    <div className="space-y-1.5">
                      {examples.map((ex, i) => (
                        <button
                          key={i}
                          onClick={() => handleExampleClick(ex)}
                          className="w-full text-left px-3.5 py-2.5 text-xs text-slate-600 bg-slate-50 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-transparent hover:border-indigo-200"
                        >
                          &quot;{ex}&quot;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2.5 animate-fadeIn ${msg.type === 'user' ? 'justify-end' : ''}`}>
                    {msg.type === 'bot' && (
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-indigo-600" />
                      </div>
                    )}
                    <div className={`max-w-[80%] ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white rounded-xl rounded-tr-none px-4 py-2.5'
                        : msg.isError
                          ? 'bg-red-50 text-red-600 rounded-xl rounded-tl-none px-4 py-2.5 border border-red-100'
                          : 'bg-slate-50 rounded-xl rounded-tl-none px-4 py-2.5'
                    }`}>
                      <p className="text-xs leading-relaxed">{msg.text}</p>
                      
                      {/* Task Card */}
                      {msg.task && (
                        <div className="mt-2.5 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                          <div className="px-3 py-2 border-b border-slate-100">
                            <p className="text-xs font-semibold text-slate-800">{msg.task.title}</p>
                          </div>
                          <div className="px-3 py-2 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-1.5">
                              <UserCircle className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-600">{msg.task.assignee}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-600">{msg.task.deadline}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Flag className="w-3 h-3 text-slate-400" />
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getPriorityColor(msg.task.priority)}`}>
                                {msg.task.priority}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${getStatusColor(msg.task.status)}`}>
                                {msg.task.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    {msg.type === 'user' && (
                      <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-2.5 animate-fadeIn">
                    <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="bg-slate-50 rounded-xl rounded-tl-none px-4 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Form Mode */
              <form onSubmit={handleFormSubmit} className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="What needs to be done?"
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add details (optional)"
                    rows={2}
                    className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <UserCircle className="w-3 h-3" /> Assign To
                    </label>
                    <select
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                    >
                      <option value="">Unassigned</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Flag className="w-3 h-3" /> Priority
                    </label>
                    <div className="flex mt-1 bg-slate-100 rounded-lg p-0.5">
                      {['low', 'medium', 'high'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className={`flex-1 py-2 rounded-md text-[10px] font-semibold capitalize transition-all ${
                            formData.priority === p
                              ? p === 'high' ? 'bg-red-500 text-white shadow-sm'
                                : p === 'medium' ? 'bg-amber-500 text-white shadow-sm'
                                : 'bg-emerald-500 text-white shadow-sm'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white appearance-none"
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="in-progress">🔄 In Progress</option>
                      <option value="completed">✅ Completed</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs border border-red-100">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !formData.title.trim()}
                  className="w-full py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating...
                    </span>
                  ) : '🚀 Create Task'}
                </button>
              </form>
            )}
          </div>

          {/* Chat Input (only in chat mode) */}
          {mode === 'chat' && (
            <div className="border-t border-slate-100 p-3 shrink-0 bg-white">
              <form onSubmit={handleChatSubmit} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your task..."
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {loading ? (
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
