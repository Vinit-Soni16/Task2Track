'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, User, Calendar, Flag, Clock, Bot, UserCircle, Paperclip, Link, FileText, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { format } from 'date-fns';

export default function AIAssistant({ onTaskCreated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Attachment state
  const [showAttachments, setShowAttachments] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

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
    'Create a task for fixing the login bug and assign to Jatin Jogi',
    'Assign code review to Admin by tomorrow, priority high',
    'Task: Setup new server, assign to Technical, deadline Friday',
  ];

  const handleChatSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() && !attachmentFile && !attachmentUrl) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { 
      type: 'user', 
      text: userMsg || (attachmentFile ? `Attached: ${attachmentFile.name}` : `URL: ${attachmentUrl}`) 
    }]);
    
    setInput('');
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('text', userMsg);
      if (attachmentFile) formData.append('file', attachmentFile);
      if (attachmentUrl) formData.append('fileUrl', attachmentUrl);

      const res = await api.post('/ai/parse-task', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const task = res.data.task;
      const parsed = res.data.parsed;
      
      setMessages(prev => [...prev, {
        type: 'bot',
        text: '✅ Task created and assigned successfully!',
        task: {
          title: task.title,
          assignee: task.assignedTo?.name || parsed?.assignedUser || 'Unassigned',
          deadline: task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : 'No deadline',
          priority: task.priority,
          status: task.status,
          hasAttachment: task.attachment?.type !== 'none'
        }
      }]);
      
      // Reset attachments
      setAttachmentFile(null);
      setAttachmentUrl('');
      setShowAttachments(false);

      if (onTaskCreated) onTaskCreated(task);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to process your request. Try again.';
      setMessages(prev => [...prev, { type: 'bot', text: `❌ ${errMsg}`, isError: true }]);
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

      {isOpen && (
        <div className="fixed inset-x-4 bottom-20 sm:inset-auto sm:bottom-24 sm:right-6 w-auto sm:w-105 h-[calc(100vh-120px)] sm:h-150 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 animate-slideUp flex flex-col overflow-hidden">
          
          <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-5 py-5 text-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-inner">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Command Center</h3>
                  <p className="text-[10px] text-indigo-100 opacity-80 uppercase tracking-tighter">AI-Powered Task Engine</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="sm:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50">
            <div className="p-4 space-y-4">
              {messages.length === 0 && (
                <div className="animate-fadeIn">
                  <div className="flex gap-2.5 mb-6">
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm border border-slate-100 max-w-[90%]">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        I am ready for your commands! 🚀<br/>
                        <span className="text-xs text-slate-500 mt-1 block">Mention a task, a team member (like Jatin Jogi), and a deadline. You can also attach files or links below.</span>
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1 ml-1">Example Commands</p>
                  <div className="space-y-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(ex)}
                        className="w-full text-left px-4 py-3 text-xs text-slate-600 bg-white rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 hover:border-indigo-200 shadow-xs"
                      >
                        &quot;{ex}&quot;
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 animate-fadeIn ${msg.type === 'user' ? 'justify-end' : ''}`}>
                  {msg.type === 'bot' && (
                    <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <div className={`max-w-[85%] ${
                    msg.type === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none px-4 py-3 shadow-md'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 rounded-2xl rounded-tl-none px-4 py-3 border border-red-100 shadow-sm'
                        : 'bg-white rounded-2xl rounded-tl-none px-4 py-3 border border-slate-100 shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    
                    {msg.task && (
                      <div className="mt-3 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden text-slate-800">
                        <div className="px-3 py-2 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                          <p className="text-xs font-bold truncate">{msg.task.title}</p>
                          {msg.task.hasAttachment && <Paperclip className="w-3 h-3 text-indigo-500" />}
                        </div>
                        <div className="px-3 py-2.5 grid grid-cols-2 gap-y-3 gap-x-2">
                          <div className="flex items-center gap-2">
                            <UserCircle className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-600 truncate">{msg.task.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-medium text-slate-600 truncate">{msg.task.deadline}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Flag className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${getPriorityColor(msg.task.priority)}`}>
                              {msg.task.priority}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${getStatusColor(msg.task.status)}`}>
                              {msg.task.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {msg.type === 'user' && (
                    <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex gap-3 animate-fadeIn">
                  <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-none px-5 py-4 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="border-t border-slate-100 p-4 shrink-0 bg-white">
            {showAttachments && (
              <div className="mb-4 space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 animate-fadeIn transition-all backdrop-blur-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Attachments</span>
                  <button onClick={() => {
                    setShowAttachments(false);
                    setAttachmentFile(null);
                    setAttachmentUrl('');
                  }} className="text-slate-400 hover:text-red-500 transition-colors p-1"><X className="w-4 h-4" /></button>
                </div>
                
                <div className="space-y-2.5">
                  <div className="relative flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all">
                    <Link className="w-4 h-4 text-indigo-500 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Paste file URL or link..."
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                      className="w-full text-xs focus:outline-none bg-transparent"
                    />
                    {attachmentUrl && (
                      <button onClick={() => setAttachmentUrl('')} className="text-slate-300 hover:text-slate-500"><X className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      onChange={(e) => setAttachmentFile(e.target.files[0])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className={`flex items-center gap-2 px-3.5 py-2.5 bg-white border rounded-xl shadow-sm transition-all ${attachmentFile ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 group-hover:border-indigo-200'}`}>
                      <FileText className={`w-4 h-4 ${attachmentFile ? 'text-indigo-600' : 'text-purple-500'} shrink-0`} />
                      <span className={`text-xs truncate flex-1 ${attachmentFile ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                        {attachmentFile ? attachmentFile.name : 'Upload PDF or Image'}
                      </span>
                      {attachmentFile && (
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAttachmentFile(null); }} className="text-indigo-400 hover:text-red-500 z-20"><X className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleChatSubmit} className="flex items-center gap-2">
               <button 
                type="button"
                onClick={() => setShowAttachments(!showAttachments)}
                className={`p-3 rounded-2xl transition-all ${showAttachments ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter command (e.g. 'Task for Jatin...')"
                  className="w-full px-5 py-3.5 pr-12 bg-slate-100 border border-transparent rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-200 transition-all placeholder:text-slate-400 shadow-inner"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !attachmentFile)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-linear-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md group"
                >
                  {loading ? (
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
