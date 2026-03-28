'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import TeamDistribution from '../../components/TeamDistribution';
import AIInsights from '../../components/AIInsights';
import AIAssistant from '../../components/AIAssistant';
import CalendarWidget from '../../components/CalendarWidget';
import MemberDashboardModal from '../../components/MemberDashboardModal';
import { Users, TrendingUp, Award, AlertTriangle, Sparkles, Eye, Building2 } from 'lucide-react';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState([]);
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchData();
  }, [user, authLoading]);

  const fetchData = async () => {
    try {
      const [analyticsRes, statsRes, tasksRes] = await Promise.all([
        api.get('/users/analytics'),
        api.get('/tasks/stats'),
        api.get('/tasks'),
      ]);
      setAnalytics(analyticsRes.data);
      setStats(statsRes.data);
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.post('/ai/insights');
      setInsights(res.data.insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
    setInsightsLoading(false);
  };

  const teamMembers = analytics.length;
  const totalTasks = stats?.total || 0;
  
  const topPerformer = analytics.reduce((best, current) => {
    if (!best || current.completionRate > best.completionRate) return current;
    return best;
  }, null);

  const needsAttention = analytics.reduce((worst, current) => {
    if (current.totalTasks === 0) return worst;
    if (!worst || current.overdue > worst.overdue) return current;
    return worst;
  }, null);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading admin dashboard...</span>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm sm:text-base">Team performance overview and AI insights</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <CalendarWidget tasks={tasks} />
            <button
              onClick={generateInsights}
              disabled={insightsLoading}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{insightsLoading ? 'Generating...' : 'Generate AI Insights'}</span>
              <span className="sm:hidden">{insightsLoading ? 'Loading...' : 'AI Insights'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard label="Team Members" value={teamMembers} icon={Users} color="slate" />
          <StatCard label="Total Tasks" value={totalTasks} icon={TrendingUp} color="indigo" />
          <div className="bg-white rounded-xl border border-emerald-200 p-4 sm:p-5 card-hover animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Top Performer</p>
                <p className="text-base sm:text-lg font-bold text-emerald-600 truncate">
                  {topPerformer?.name || '-'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  {topPerformer ? `${topPerformer.completionRate}% completion` : 'No data'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-500 shrink-0">
                <Award className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-4 sm:p-5 card-hover animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Needs Attention</p>
                <p className="text-base sm:text-lg font-bold text-slate-800 truncate">
                  {needsAttention?.name || '-'}
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                  {needsAttention ? `${needsAttention.overdue} pending tasks` : '0 pending tasks'}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-500 shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Team Distribution */}
        <div className="mb-6">
          <TeamDistribution data={analytics} />
        </div>

        {/* AI Insights */}
        {(insights.length > 0 || insightsLoading) && (
          <div className="mb-6">
            <AIInsights insights={insights} loading={insightsLoading} />
          </div>
        )}

        {/* Team Member Detail Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 animate-fadeIn">
          <h3 className="font-bold text-slate-800 mb-4">Team Members</h3>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-175">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Member</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Dept</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Done</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Pending</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Overdue</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Rate</th>
                  <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map(member => (
                  <tr key={member._id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                          {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                          <p className="text-xs text-slate-400 truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {member.department ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
                          <Building2 className="w-2.5 h-2.5" />
                          {member.department}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-sm text-slate-600">{member.totalTasks}</td>
                    <td className="py-3 px-4 text-center text-sm text-emerald-600 font-medium">{member.completed}</td>
                    <td className="py-3 px-4 text-center text-sm text-amber-600">{member.pending}</td>
                    <td className="py-3 px-4 text-center text-sm text-red-500 font-medium">{member.overdue}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${member.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{member.completionRate}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-medium hover:bg-indigo-100 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {analytics.map(member => (
              <div key={member._id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                      {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-semibold hover:bg-indigo-100 transition-colors shrink-0"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </button>
                </div>
                {member.department && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600">
                      <Building2 className="w-2.5 h-2.5" />
                      {member.department}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Total</p>
                    <p className="text-sm font-bold text-slate-700">{member.totalTasks}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Done</p>
                    <p className="text-sm font-bold text-emerald-600">{member.completed}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Pending</p>
                    <p className="text-sm font-bold text-amber-600">{member.pending}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Overdue</p>
                    <p className="text-sm font-bold text-red-500">{member.overdue}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${member.completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">{member.completionRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {analytics.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm">No team members found</p>
            </div>
          )}
        </div>
      </main>

      {user?.role === 'admin' && <AIAssistant onTaskCreated={() => fetchData()} />}

      {/* Member Dashboard Modal */}
      <MemberDashboardModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />
    </div>
  );
}
