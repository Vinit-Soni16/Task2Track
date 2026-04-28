'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import TeamDistribution from '../../components/TeamDistribution';
import AIInsights from '../../components/AIInsights';
import MemberDashboardModal from '../../components/MemberDashboardModal';
import { StatCardSkeleton, TableRowSkeleton } from '../../components/Skeleton';
import dynamic from 'next/dynamic';

const AIAssistant = dynamic(() => import('../../components/AIAssistant'), { ssr: false });
const CalendarWidget = dynamic(() => import('../../components/CalendarWidget'), { ssr: false });

import { Users, TrendingUp, Award, AlertTriangle, Sparkles, Eye, Building2, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const SUPER_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

const MemberRow = memo(({ member, router, onSelect, isSuperAdmin, onRoleChange }) => {
  const isMemberSuperAdmin = SUPER_ADMIN_EMAILS.includes(member.email);
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50">
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
              {member.role === 'admin' && isMemberSuperAdmin && (
                <span className="px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase">Admin</span>
              )}
            </div>
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
      <td className="py-3 px-4 text-center">
        <button 
          onClick={() => router.push(`/tasks?assignee=${member._id}`)}
          className="text-sm text-slate-600 hover:text-indigo-600 hover:font-bold transition-all"
        >
          {member.totalTasks}
        </button>
      </td>
      <td className="py-3 px-4 text-center">
        <button 
          onClick={() => router.push(`/tasks?assignee=${member._id}&status=completed`)}
          className="text-sm text-emerald-600 font-medium hover:scale-110 transition-transform"
        >
          {member.completed}
        </button>
      </td>
      <td className="py-3 px-4 text-center">
        <button 
          onClick={() => router.push(`/tasks?assignee=${member._id}&status=pending`)}
          className="text-sm text-amber-600 hover:scale-110 transition-transform"
        >
          {member.pending}
        </button>
      </td>
      <td className="py-3 px-4 text-center">
        <button 
          onClick={() => router.push(`/tasks?assignee=${member._id}&status=overdue`)}
          className="text-sm text-red-500 font-medium hover:scale-110 transition-transform"
        >
          {member.overdue}
        </button>
      </td>
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
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => onSelect(member)}
            className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-medium hover:bg-indigo-100 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
          
          {isSuperAdmin && !isMemberSuperAdmin && (
            <button
              onClick={() => onRoleChange(member._id, member.role === 'admin' ? 'member' : 'admin')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                member.role === 'admin' 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
              title={member.role === 'admin' ? 'Demote to Member' : 'Promote to Manager'}
            >
              <Award className="w-3 h-3" />
              {member.role === 'admin' ? 'Demote' : 'Promote'}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
});

MemberRow.displayName = 'MemberRow';

const MemberCard = memo(({ member, router, onSelect, isSuperAdmin, onRoleChange }) => {
  const isMemberSuperAdmin = SUPER_ADMIN_EMAILS.includes(member.email);
  return (
    <div className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50/50 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
            {member.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-800 truncate">{member.name}</p>
              {member.role === 'admin' && isMemberSuperAdmin && (
                <span className="px-1 py-0.5 bg-indigo-100 text-indigo-600 text-[8px] font-bold rounded uppercase">Admin</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">{member.email}</p>
          </div>
        </div>
        {member.department && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-600 shrink-0">
            {member.department}
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <button onClick={() => router.push(`/tasks?assignee=${member._id}`)} className="hover:bg-slate-100 rounded-lg py-1 transition-colors">
          <p className="text-[10px] text-slate-400 font-medium">Total</p>
          <p className="text-sm font-bold text-slate-700">{member.totalTasks}</p>
        </button>
        <button onClick={() => router.push(`/tasks?assignee=${member._id}&status=completed`)} className="hover:bg-slate-100 rounded-lg py-1 transition-colors">
          <p className="text-[10px] text-slate-400 font-medium">Done</p>
          <p className="text-sm font-bold text-emerald-600">{member.completed}</p>
        </button>
        <button onClick={() => router.push(`/tasks?assignee=${member._id}&status=pending`)} className="hover:bg-slate-100 rounded-lg py-1 transition-colors">
          <p className="text-[10px] text-slate-400 font-medium">Pending</p>
          <p className="text-sm font-bold text-amber-600">{member.pending}</p>
        </button>
        <button onClick={() => router.push(`/tasks?assignee=${member._id}&status=overdue`)} className="hover:bg-slate-100 rounded-lg py-1 transition-colors">
          <p className="text-[10px] text-slate-400 font-medium">Overdue</p>
          <p className="text-sm font-bold text-red-500">{member.overdue}</p>
        </button>
      </div>
      <div className="mt-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${member.completionRate}%` }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-500">{member.completionRate}%</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onSelect(member)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-semibold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <Eye className="w-3 h-3" />
            View Profile
          </button>
          
          {isSuperAdmin && !isMemberSuperAdmin && (
            <button
              onClick={() => onRoleChange(member._id, member.role === 'admin' ? 'member' : 'admin')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-colors ${
                member.role === 'admin' 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              }`}
            >
              <Award className="w-3 h-3" />
              {member.role === 'admin' ? 'Demote' : 'Promote'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

MemberCard.displayName = 'MemberCard';

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState([]);
  const [overallStats, setOverallStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const isSuperAdmin = useMemo(() => {
    return user && SUPER_ADMIN_EMAILS.includes(user.email);
  }, [user]);

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      fetchAnalytics(); // Refresh data
    } catch (err) {
      console.error('Failed to update role:', err);
      alert(err.response?.data?.error || 'Failed to update role');
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        api.get('/users/analytics'),
        api.get('/tasks/stats')
      ]);
      setAnalytics(analyticsRes.data);
      setOverallStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    fetchAnalytics();
  }, [user, authLoading, router, fetchAnalytics]);

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.post('/ai/insights', { analytics });
      setInsights(res.data.insights);
    } catch (err) {
      console.error('Failed to generate insights:', err);
    }
    setInsightsLoading(false);
  };

  const teamMembers = useMemo(() => analytics.length, [analytics]);
  const totalTasks = useMemo(() => {
    if (overallStats && overallStats.total !== undefined) {
      return overallStats.total;
    }
    return analytics.reduce((acc, curr) => acc + (curr.totalTasks || 0), 0);
  }, [analytics, overallStats]);
  
  const stats = useMemo(() => {
    if (overallStats) {
      return {
        completed: overallStats.completed || 0,
        inProgress: overallStats.inProgress || 0,
        overdue: overallStats.overdue || 0,
      };
    }
    return {
      completed: analytics.reduce((acc, curr) => acc + (curr.completed || 0), 0),
      inProgress: analytics.reduce((acc, curr) => acc + (curr.inProgress || 0), 0),
      overdue: analytics.reduce((acc, curr) => acc + (curr.overdue || 0), 0),
    };
  }, [analytics, overallStats]);

  const topPerformer = useMemo(() => {
    if (analytics.length === 0) return null;
    return [...analytics].sort((a, b) => b.completionRate - a.completionRate)[0];
  }, [analytics]);

  const needsAttention = useMemo(() => {
    if (analytics.length === 0) return null;
    return [...analytics].sort((a, b) => b.overdue - a.overdue)[0];
  }, [analytics]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      
      <main className="lg:ml-60 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">
              {isSuperAdmin ? 'Admin Dashboard' : 'Dashboard'}
            </h1>
            <p className="text-slate-500 mt-1">Manage your team and track performance</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateInsights}
              disabled={insightsLoading || analytics.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">{insightsLoading ? 'Generating...' : 'Generate AI Insights'}</span>
              <span className="sm:hidden">{insightsLoading ? 'Loading...' : 'AI Insights'}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Team Members" value={teamMembers} icon={Users} color="slate" />
              <StatCard 
                label="Total Tasks" 
                value={totalTasks} 
                icon={TrendingUp} 
                color="indigo" 
                clickable 
                onClick={() => router.push('/tasks')}
              />
              <StatCard 
                label="Completed" 
                value={stats?.completed || 0} 
                icon={CheckCircle} 
                color="green" 
                clickable 
                onClick={() => router.push('/tasks?status=completed')}
              />
              <StatCard 
                label="In Progress" 
                value={stats?.inProgress || 0} 
                icon={Clock} 
                color="blue" 
                clickable 
                onClick={() => router.push('/tasks?status=in-progress')}
              />
              <StatCard 
                label="Overdue" 
                value={stats?.overdue || 0} 
                icon={AlertCircle} 
                color="red" 
                clickable 
                onClick={() => router.push('/tasks?status=overdue')}
              />
            </>
          )}
        </div>

        {/* Extra Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {!loading && (
            <>
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
                      {needsAttention ? `${needsAttention.overdue} overdue tasks` : '0 overdue tasks'}
                    </p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-amber-50 text-amber-500 shrink-0">
                    <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
              </div>
            </>
          )}
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
                {loading ? (
                  <>
                    <TableRowSkeleton cols={8} />
                    <TableRowSkeleton cols={8} />
                    <TableRowSkeleton cols={8} />
                  </>
                ) : (
                  analytics.map(member => (
                    <MemberRow 
                      key={member._id} 
                      member={member} 
                      router={router} 
                      onSelect={setSelectedMember} 
                      isSuperAdmin={isSuperAdmin}
                      onRoleChange={handleRoleUpdate}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="h-40 bg-slate-50 animate-pulse rounded-xl" />
            ) : (
              analytics.map(member => (
                <MemberCard 
                  key={member._id} 
                  member={member} 
                  router={router} 
                  onSelect={setSelectedMember} 
                  isSuperAdmin={isSuperAdmin}
                  onRoleChange={handleRoleUpdate}
                />
              ))
            )}
          </div>
        </div>
      </main>

      <MemberDashboardModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
      />

      {user?.role === 'admin' && <AIAssistant analytics={analytics} />}
    </div>
  );
}
