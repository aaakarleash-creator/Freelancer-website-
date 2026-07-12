import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, DollarSign, ArrowRight, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { getAnnouncements } from '../utils/supabaseQueryHelper';
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
  const [announcements, setAnnouncements] = useState([]);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      // Fetch user's leads
      const leadsPromise = getUserLeads(currentUser.id);
      const leadsResult = await Promise.race([leadsPromise, timeoutPromise]);
      
      if (leadsResult instanceof Error) {
        console.error('Leads fetch timed out');
        throw leadsResult;
      }
      
      const { leads: leadsData, error: leadsError } = leadsResult;
      if (leadsError) throw leadsError;
      setLeads(leadsData || []);

      // Fetch leaderboard
      const leaderboardPromise = getLeaderboard();
      const leaderboardResult = await Promise.race([leaderboardPromise, timeoutPromise]);
      
      if (leaderboardResult instanceof Error) {
        console.error('Leaderboard fetch timed out');
        throw leaderboardResult;
      }
      
      const { leaderboard: leaderboardData, error: leaderboardError } = leaderboardResult;
      if (leaderboardError) throw leaderboardError;
      setLeaderboard(leaderboardData || []);

      // Fetch total earnings for current user
      const earningsPromise = getUserEarnings(currentUser.id);
      const earningsResult = await Promise.race([earningsPromise, timeoutPromise]);
      
      if (earningsResult instanceof Error) {
        console.error('Earnings fetch timed out');
        throw earningsResult;
      }
      
      const { data: earningsData, error: earningsError } = earningsResult;
      if (earningsError) throw earningsError;
      const total = (earningsData || []).reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
      setTotalEarnings(total || 0);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      if (err.message === 'Request timeout') {
        console.warn('Dashboard data fetch timed out, using empty state');
      }
      // Set empty state on error to prevent UI issues
      setLeads([]);
      setLeaderboard([]);
      setTotalEarnings(0);
    }
    setLoading(false);
  }, [currentUser.id]);

  // Fetch real data on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchDashboardData();
    }
  }, [currentUser?.id, fetchDashboardData]);

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await getAnnouncements();
        if (error) {
          console.error('Announcements fetch error:', error);
          setAnnouncements([]);
          return;
        }
        setAnnouncements(data || []);
      } catch (e) {
        // Table may not exist yet or timeout — fail silently
        console.error('Announcements fetch error:', e);
        setAnnouncements([]);
      }
    };
    fetchAnnouncements();
  }, []);

  // Fetch pending verifications for admin
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      const fetchPendingVerifications = async () => {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          );
          
          const dataPromise = supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'Converted')
            .is('is_verified_by_admin', false);
          
          const result = await Promise.race([dataPromise, timeoutPromise]);
          
          if (result instanceof Error) {
            console.error('Pending verifications fetch timed out');
            return;
          }
          
          const { count, error } = result;
          if (!error) setPendingVerifications(count || 0);
        } catch (e) {
          console.error('Pending verifications fetch error:', e);
        }
      };
      fetchPendingVerifications();
    }
  }, [currentUser?.role]);

  const totalLeads = leads.length;
  const converted = leads.filter(l => l.status === 'converted').length;
  const recentLeads = leads.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Handle dismiss
  const dismissAnnouncement = (id) => {
    const dismissed = JSON.parse(sessionStorage.getItem('dismissedAnnouncements') || '[]');
    dismissed.push(id);
    sessionStorage.setItem('dismissedAnnouncements', JSON.stringify(dismissed));
    setAnnouncements(prev => Array.isArray(prev) ? prev.filter(a => a.id !== id) : []);
  };

  // Filter out dismissed announcements
  const dismissed = JSON.parse(sessionStorage.getItem('dismissedAnnouncements') || '[]');
  const visibleAnnouncements = Array.isArray(announcements)
    ? announcements.filter(a => !dismissed.includes(a.id))
    : [];

  const typeStyles = {
    info: 'border-blue-500/30 bg-blue-500/8 text-blue-300',
    warning: 'border-amber-500/30 bg-amber-500/8 text-amber-300',
    success: 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300',
    urgent: 'border-red-500/30 bg-red-500/8 text-red-300',
  };

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

      {/* Announcements Banner */}
      {visibleAnnouncements.length > 0 && (
        <div className="space-y-3">
          {visibleAnnouncements.map(announcement => (
            <div
              key={announcement.id}
              className={`border rounded-xl p-4 flex items-start gap-3 ${typeStyles[announcement.type] || typeStyles.info}`}
            >
              <p className="flex-1 text-sm">
                <span className="font-semibold">{announcement.title}</span>
                {announcement.message && `: ${announcement.message}`}
              </p>
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Admin Verification Banner */}
      {currentUser?.role === 'admin' && pendingVerifications > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="flex-1 text-sm text-amber-300">
            Conversions Awaiting Verification: {pendingVerifications}
          </p>
          <button
            onClick={() => onNavigate('admin_lead_verifications')}
            className="text-xs bg-amber-500 hover:bg-amber-600 text-dark-900 px-3 py-1.5 rounded-lg font-medium transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

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
