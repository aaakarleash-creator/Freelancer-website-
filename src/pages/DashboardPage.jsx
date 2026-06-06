import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, DollarSign, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getUserLeads } from '../utils/leadService';
import { getLeaderboard } from '../utils/leaderboardService';
import { getUserEarnings } from '../utils/earningsService';

// ============================================================
// DashboardPage — main home view after login
// ============================================================

export default function DashboardPage({ onNavigate }) {
  const { currentUser } = useAuth();
  const [leads, setLeads] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch user's leads
      const { leads: leadsData, error: leadsError } = await getUserLeads(currentUser.id);
      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch leaderboard
      const { leaderboard: leaderboardData, error: leaderboardError } = await getLeaderboard();
      if (leaderboardError) throw leaderboardError;
      setLeaderboard(leaderboardData || []);

      // Fetch total earnings for current user
      const { data: earningsData, error: earningsError } = await getUserEarnings(currentUser.id);
      if (earningsError) throw earningsError;
      const total = (earningsData || []).reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
      setTotalEarnings(total || 0);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
    setLoading(false);
  }, [currentUser.id]);

  // Fetch real data on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchDashboardData();
    }
  }, [currentUser?.id, fetchDashboardData]);

  const totalLeads = leads.length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const recentLeads = leads.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-body mb-1">{greeting} 👋</p>
          <h1 className="font-display text-3xl font-bold">
            Welcome back,{' '}
            <span className="text-gradient">{currentUser?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 capitalize">
            {currentUser?.designation} · {currentUser?.role}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-dark-700 border border-dark-500 px-3 py-2 rounded-xl">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Dashboard
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Leads"
          value={totalLeads}
          sub="All time pipeline"
          trend={12}
        />
        <StatCard
          icon={CheckCircle2}
          label="Converted Clients"
          value={converted}
          sub={`${Math.round((converted/totalLeads)*100)}% conversion rate`}
          trend={8}
        />
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={`₹${totalEarnings.toLocaleString('en-IN')}`}
          sub="This month"
          accent
          trend={15}
        />
      </div>

      {/* Two-col section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent leads */}
        <div className="lg:col-span-2 bg-dark-700 border border-dark-400 rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-500">
            <h2 className="font-display font-semibold text-white text-base">Recent Leads</h2>
            <button
              onClick={() => onNavigate('leads')}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-dark-500">
            {recentLeads.map(lead => (
              <div key={lead.id} className="table-row-hover flex items-center justify-between px-5 py-3.5 transition-colors">
                <div>
                  <p className="text-sm font-medium text-white">{lead.clientName}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lead.service}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 hidden sm:block">{lead.date}</span>
                  <StatusBadge status={lead.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini leaderboard */}
        <div className="bg-dark-700 border border-dark-400 rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-dark-500">
            <h2 className="font-display font-semibold text-white text-base">Top Performers</h2>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300"
            >
              Full board <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 space-y-2">
            {leaderboard.slice(0, 5).map((user, i) => {
              // Get initials from name for avatar
              const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'NA';
              const badges = ['🥇', '🥈', '🥉'];
              
              return (
                <div key={user.id} className={`
                  flex items-center gap-3 p-2.5 rounded-xl transition-colors
                  ${i < 3 ? 'bg-amber-500/5 border border-amber-500/10' : 'hover:bg-dark-600'}
                `}>
                  <span className="text-lg w-6 text-center leading-none">{i < 3 ? badges[i] : `${i+1}`}</span>
                  <div className="w-7 h-7 rounded-full bg-dark-500 border border-dark-400 flex items-center justify-center text-xs font-display text-amber-400 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.convertedLeads} converts</p>
                  </div>
                  <p className="text-xs font-mono text-amber-400 flex-shrink-0">
                    ₹{Math.round(user.convertedLeads * 5000 / 1000).toFixed(0)}k
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
