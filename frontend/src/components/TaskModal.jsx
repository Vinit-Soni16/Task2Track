'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { X, Paperclip, Link, FileText, Trash2, Users, Building2, Flag, Activity } from 'lucide-react';
import CustomSelect from './CustomSelect';

const DEPARTMENTS = [
  'All Departments',
  'Sales',
  'HR',
  'Shopify Development',
  'Performance Marketer',
  'Social Media',
  'Finance',
  'Graphic Designer',
  'Video Editor',
  'Technical',
  'Founder',
  'Vice President'
];

export default function TaskModal({ isOpen, onClose, onSubmit, users = [], task = null, currentUserDepartment = '' }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    department: currentUserDepartment,
    priority: 'medium',
    status: 'pending',
    attachmentType: 'none',
    attachmentUrl: '',
    file: null
  });
  const [errors, setErrors] = useState({});
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const isEdit = !!task;

  // Sync form data when task prop changes (Edit Mode)
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        assignedTo: task.assignedTo?._id || task.assignedTo || '',
        deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        attachmentType: task.attachment?.type || 'none',
        attachmentUrl: task.attachment?.url || '',
        file: null,
        department: task.department || task.assignedTo?.department || ''
      });
      if (task.department || task.assignedTo?.department) {
        setSelectedDept(task.department || task.assignedTo.department);
      }
    } else if (!isOpen) {
      // Reset on close
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        deadline: '',
        priority: 'medium',
        status: 'pending',
        attachmentType: 'none',
        attachmentUrl: '',
        file: null,
        department: currentUserDepartment
      });
      setErrors({});
      setSelectedDept(currentUserDepartment || 'All Departments');
    }
  }, [task, isOpen, currentUserDepartment]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Please assign to a member';
    if (!formData.deadline) newErrors.deadline = 'Deadline is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.status) newErrors.status = 'Status is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setLoading(true);
    try {
      const data = { ...formData };
      if (isEdit) data._id = task._id;
      
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} task:`, error);
    }
    setLoading(false);
  }, [formData, isEdit, task?._id, onSubmit, onClose, validate]);

  const filteredUsers = useMemo(() => {
    if (!selectedDept || selectedDept === 'All Departments') return users;
    return users.filter(u => u.department === selectedDept);
  }, [users, selectedDept]);

  const handleFileChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, file: e.target.files[0] }));
  }, []);

  const removeFile = useCallback(() => {
    setFormData(prev => ({ ...prev, file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl animate-slideUp max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">{isEdit ? 'Edit Task' : 'Create New Task'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({...formData, title: e.target.value});
                if (errors.title) setErrors({...errors, title: ''});
              }}
              placeholder="Enter task title"
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                errors.title ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.title && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.title}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({...formData, description: e.target.value});
                if (errors.description) setErrors({...errors, description: ''});
              }}
              placeholder="Enter task description"
              rows={3}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y transition-all ${
                errors.description ? 'border-red-500 bg-red-50' : 'border-slate-200'
              }`}
            />
            {errors.description && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Filter by Department"
              value={selectedDept}
              onChange={setSelectedDept}
              options={DEPARTMENTS}
              icon={Building2}
            />
            <CustomSelect
              label={
                <span className="flex items-center gap-1">
                  Assign To <span className="text-red-500">*</span>
                </span>
              }
              value={formData.assignedTo}
              onChange={(val) => {
                setFormData({...formData, assignedTo: val});
                if (errors.assignedTo) setErrors({...errors, assignedTo: ''});
              }}
              options={[
                { value: '', label: 'Unassigned' },
                ...filteredUsers.map(u => ({ value: u._id, label: u.name }))
              ]}
              icon={Users}
              placeholder="Select team member"
              error={errors.assignedTo}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1">
                Deadline <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => {
                  setFormData({...formData, deadline: e.target.value});
                  if (errors.deadline) setErrors({...errors, deadline: ''});
                }}
                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  errors.deadline ? 'border-red-500 bg-red-50' : 'border-slate-200'
                }`}
              />
              {errors.deadline && <p className="mt-1 text-[10px] text-red-500 font-medium">{errors.deadline}</p>}
            </div>
            <CustomSelect
              label={
                <span className="flex items-center gap-1">
                  Priority <span className="text-red-500">*</span>
                </span>
              }
              value={formData.priority}
              onChange={(val) => {
                setFormData({...formData, priority: val});
                if (errors.priority) setErrors({...errors, priority: ''});
              }}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' }
              ]}
              icon={Flag}
              error={errors.priority}
            />
          </div>

          <CustomSelect
            label={
              <span className="flex items-center gap-1">
                Status <span className="text-red-500">*</span>
              </span>
            }
            value={formData.status}
            onChange={(val) => {
              setFormData({...formData, status: val});
              if (errors.status) setErrors({...errors, status: ''});
            }}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'in-progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' }
            ]}
            icon={Activity}
            error={errors.status}
          />
          
          {/* Attachment Section */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-medium text-slate-700">Add Attachment (Optional)</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, attachmentType: formData.attachmentType === 'file' ? 'none' : 'file', attachmentUrl: ''})}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  formData.attachmentType === 'file' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Paperclip className="w-4 h-4" />
                Upload File
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, attachmentType: formData.attachmentType === 'url' ? 'none' : 'url', file: null})}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
                  formData.attachmentType === 'url' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Link className="w-4 h-4" />
                Add URL
              </button>
            </div>

            {formData.attachmentType === 'file' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group animate-fadeIn">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.docx,.xlsx,.ppt,.pptx,.doc,.xls,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {formData.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-sm text-slate-600 font-medium truncate">{formData.file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={removeFile}
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 text-sm hover:border-indigo-400 hover:text-indigo-500 transition-all flex flex-col items-center gap-1"
                  >
                    <Paperclip className="w-6 h-6" />
                    <span>{isEdit && task.attachment?.url ? 'Change file' : 'Choose a file from your device'}</span>
                  </button>
                )}
              </div>
            )}

            {formData.attachmentType === 'url' && (
              <div className="animate-fadeIn">
                <input
                  type="url"
                  placeholder="https://example.com/document"
                  value={formData.attachmentUrl}
                  onChange={(e) => setFormData({...formData, attachmentUrl: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Task' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
