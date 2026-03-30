'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, Lock, CheckSquare, Building2 } from 'lucide-react';

const DEPARTMENTS = [
  'Sales',
  'HR',
  'Shopify Development',
  'Performance Marketer',
  'Social Media',
  'Finance',
  'Graphic Designer',
  'Video Editor',
  'Technical'
];

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(name, email, password, department);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col-reverse lg:flex-row auth-gradient overflow-x-hidden">
      {useMemo(() => (
        <div className="hidden lg:flex w-1/2 bg-linear-to-br from-slate-800 to-slate-900 items-center justify-center p-12 overflow-hidden">
          <div className="max-w-lg text-center animate-fadeIn">
            <div className="w-full aspect-4/3 bg-linear-to-br from-slate-600/30 via-slate-500/20 to-slate-600/30 rounded-3xl mb-8 flex items-center justify-center overflow-hidden shadow-lg backdrop-blur-sm relative">
              <img 
                src="/Images/Task2Track_logo.WebP" 
                alt="Task2Track Logo" 
                className="w-full h-full object-cover  "
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Join your team</h2>
            <p className="text-slate-400 leading-relaxed">
              Create an account to start managing tasks and collaborating with your team.
            </p>
          </div>
        </div>
      ), [])}

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 lg:px-20 py-10 lg:py-0 min-h-dvh">
        {/* Logo */}
        <div className="flex items-center justify-center lg:justify-start gap-3 mb-8 lg:mb-12">
          <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shadow-lg">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800 tracking-tight">Task2Track</span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 max-w-md w-full mx-auto lg:mx-0 animate-fadeIn shadow-sm">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">Create an account</h1>
          <p className="text-slate-500 text-sm mb-6 sm:mb-8">Enter your details to get started</p>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm border border-red-100 animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <select
                  id="signup-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-300 appearance-none bg-white"
                  required
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all hover:border-slate-300"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              id="signup-submit"
              type="submit"
              disabled={loading}
              className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
