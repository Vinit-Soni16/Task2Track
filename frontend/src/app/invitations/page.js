'use client';

import { useState } from 'react';
import { UserPlus, Mail, Building2, Send, CheckCircle2, AlertCircle, Sparkles, Users } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const DEPARTMENTS = [
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

export default function InvitationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Sales'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    if (user && !SUPER_ADMIN_EMAILS.includes(user.email)) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await api.post('/auth/invite', formData);
      setStatus({ 
        type: 'success', 
        message: `Invitation sent to ${formData.email} successfully!` 
      });
      setFormData({ name: '', email: '', department: 'Sales' });
    } catch (error) {
      console.error('Invitation failed:', error);
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.error || 'Failed to send invitation. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !SUPER_ADMIN_EMAILS.includes(user.email)) return null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen p-4 sm:p-8 pt-16 lg:pt-12">
        <div className="max-w-4xl mx-auto">
          {/* Clean Header */}
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Invite Manager
            </h1>
            <p className="text-slate-500 mt-2">
              Send an invitation to join the management team
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="lg:col-span-7">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 sm:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Enter full name"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                          <input
                            type="email"
                            required
                            placeholder="admin@ad2ship.com"
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Department</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <select
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          >
                            {DEPARTMENTS.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {status.message && (
                      <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                        status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p className="text-sm font-medium">{status.message}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-100"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Invitation
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-800 rounded-2xl p-8 text-white shadow-sm">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Important Note
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Invited users will receive an email with their login credentials immediately after submission.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      The default password for all new accounts is <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-indigo-300">Password@123</code>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Users are recommended to update their password from the profile settings upon first login.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-indigo-50">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">Admin Privileges</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Full access to manage tasks and view team reports.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
