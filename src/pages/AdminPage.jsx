import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, X, Check, X as X2, Calendar, FileText, CreditCard, User, DollarSign, TrendingUp, Users as UsersIcon, AlertCircle, MessageSquare, Download, Target, Megaphone, ClipboardList } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { markEarningsPaid } from '../utils/earningsService';

export default function AdminPage({ onNavigate, initialTab = 'overview' }) {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTab, setDrawerTab] = useState('overview');
  const [drawerData, setDrawerData] = useState({
    leads: [],
    earnings: [],
    bankDetail: null,
    agreement: null,
  });

  // Redirect non-admin
  useEffect(() => {
    if (!isAdmin) {
      onNavigate?.('dashboard');
    }
  }, [isAdmin, onNavigate]);

  // Update activeTab when initialTab prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'freelancers', label: 'Freelancers' },
    { id: 'payouts', label: 'Payouts' },
    { id: 'leads', label: 'Leads' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'audit', label: 'Audit Log' },
  ];

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
          <p className="text-slate-400">Access Denied. Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage freelancers, payouts, and platform operations</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
            Admin Access
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-dark-500 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                ? 'border-b-2 border-amber-400 text-amber-400'
                : 'text-slate-500 hover:text-slate-300'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'freelancers' && (
        <FreelancersTab
          openDrawer={(user) => {
            setSelectedUser(user);
            setDrawerOpen(true);
            setDrawerLoading(true);
            setDrawerTab('overview');
          }}
          selectedUser={selectedUser}
          drawerOpen={drawerOpen}
          drawerLoading={drawerLoading}
          setDrawerLoading={setDrawerLoading}
          drawerTab={drawerTab}
          setDrawerOpen={setDrawerOpen}
          setDrawerTab={setDrawerTab}
          drawerData={drawerData}
          setDrawerData={setDrawerData}
        />
      )}
      {activeTab === 'payouts' && <PayoutsTab />}
      {activeTab === 'leads' && <LeadsTab />}
      {activeTab === 'announcements' && <AnnouncementsTab />}
      {activeTab === 'audit' && <AuditLogTab />}
    </div>
  );
}

// ============================================================================
// OVERVIEW TAB
// ============================================================================
function OverviewTab() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalFreelancers: 0,
    activeFreelancers: 0,
    totalLeads: 0,
    convertedLeads: 0,
    totalRevenue: 0,
    totalCommissions: 0,
    pendingPayouts: 0,
    requestedPayouts: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentConversions, setRecentConversions] = useState([]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const dataPromise = Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'freelancer'),
        supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'freelancer').eq('status', 'active'),
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'Converted'),
        supabase.from('earnings').select('amount, commission, payout_status'),
        supabase.from('users').select('id, name, email, designation, role, created_at').order('created_at', { ascending: false }).limit(5),
        supabase.from('leads').select('id, client_name, service, created_at, user_id, users(name)').eq('status', 'Converted').order('created_at', { ascending: false }).limit(5),
      ]);
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Admin overview fetch timed out');
        throw result;
      }
      
      const [
        { count: totalFreelancers },
        { count: activeFreelancers },
        { count: totalLeads },
        { count: convertedLeads },
        { data: earningsData },
        { data: recentUsers },
        { data: recentConversions },
      ] = result;

      const totalRevenue = (earningsData || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
      const totalCommissions = (earningsData || []).reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
      const pendingPayouts = (earningsData || []).filter(e => e.payout_status === 'pending').reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
      const requestedPayouts = (earningsData || []).filter(e => e.payout_status === 'requested').reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);

      setStats({
        totalFreelancers: totalFreelancers || 0,
        activeFreelancers: activeFreelancers || 0,
        totalLeads: totalLeads || 0,
        convertedLeads: convertedLeads || 0,
        totalRevenue,
        totalCommissions,
        pendingPayouts,
        requestedPayouts,
      });
      setRecentUsers(recentUsers || []);
      setRecentConversions(recentConversions || []);
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      if (error.message === 'Request timeout') {
        console.warn('Admin overview fetch timed out, keeping existing data');
      }
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initialLoad = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    initialLoad();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-dark-800 border border-dark-500 rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-dark-600 rounded w-1/2 mb-3"></div>
              <div className="h-8 bg-dark-600 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-dark-600 rounded animate-pulse"></div>
            ))}
          </div>
          <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-dark-600 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="secondary"
          icon={RotateCcw}
          onClick={fetchData}
          disabled={refreshing}
          className="text-xs"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Row 1: User Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UsersIcon} label="Total Freelancers" value={stats.totalFreelancers} />
        <StatCard icon={User} label="Active Freelancers" value={stats.activeFreelancers} />
        <StatCard icon={TrendingUp} label="Total Leads" value={stats.totalLeads} />
        <StatCard icon={Check} label="Converted Leads" value={stats.convertedLeads} />
      </div>

      {/* Row 2: Financial Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`} />
        <StatCard icon={DollarSign} label="Total Commissions" value={`₹${stats.totalCommissions.toLocaleString('en-IN')}`} />
        <StatCard icon={AlertCircle} label="Pending Payouts" value={`₹${stats.pendingPayouts.toLocaleString('en-IN')}`} accent />
        <StatCard icon={AlertCircle} label="Requested Payouts" value={`₹${stats.requestedPayouts.toLocaleString('en-IN')}`} accent />
      </div>

      {/* Row 3: Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Recent Signups</h3>
          {recentUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No recent signups</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-500">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Designation</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {recentUsers.map(user => (
                    <tr key={user.id} className="hover:bg-dark-700/50">
                      <td className="px-3 py-2.5 text-white font-medium">{user.name}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{user.email}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{user.designation || '-'}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Conversions */}
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5">
          <h3 className="font-display font-semibold text-white mb-4">Recent Conversions</h3>
          {recentConversions.length === 0 ? (
            <div className="text-center py-8">
              <Check size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No recent conversions</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-500">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Service</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Freelancer</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {recentConversions.map(conversion => (
                    <tr key={conversion.id} className="hover:bg-dark-700/50">
                      <td className="px-3 py-2.5 text-white font-medium">{conversion.client_name}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{conversion.service}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">{conversion.users?.name || 'Unknown'}</td>
                      <td className="px-3 py-2.5 text-slate-400 text-xs">
                        {new Date(conversion.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FREELANCERS TAB
// ============================================================================
function FreelancersTab({
  openDrawer,
  selectedUser,
  drawerOpen,
  drawerLoading,
  setDrawerLoading,
  drawerTab,
  setDrawerOpen,
  setDrawerTab,
  drawerData,
  setDrawerData,
}) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [bankDetails, setBankDetails] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);

  const loadDrawerData = useCallback(async (user) => {
    setDrawerLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = Promise.all([
        supabase.from('leads').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('earnings').select('*, leads(client_name, service)').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bank_details').select('*').eq('user_id', user.id),
        supabase.from('agreements').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Drawer data fetch timed out, using empty state');
        setDrawerData({
          leads: [],
          earnings: [],
          bankDetail: null,
          agreement: null,
        });
        setDrawerLoading(false);
        return;
      }
      
      const [
        { data: leads },
        { data: earnings },
        { data: bankRows },
        { data: agreements },
      ] = result;

      setDrawerData({
        leads: leads || [],
        earnings: earnings || [],
        bankDetail: bankRows?.[0] || null,
        agreement: agreements?.[0] || null,
      });
    } catch (error) {
      console.error('Error loading drawer data:', error);
      setDrawerData({
        leads: [],
        earnings: [],
        bankDetail: null,
        agreement: null,
      });
    } finally {
      setDrawerLoading(false);
    }
  }, [setDrawerLoading, setDrawerData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const dataPromise = Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('bank_details').select('*'),
      ]);
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Freelancers data fetch timed out, using empty state');
        setUsers([]);
        setBankDetails([]);
        setLoading(false);
        return;
      }
      
      const [{ data: usersData }, { data: bankData }] = result;
      setUsers(usersData || []);
      setBankDetails(bankData || []);
    } catch (error) {
      console.error('Error fetching freelancers:', error);
      setUsers([]);
      setBankDetails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Load drawer data when drawer opens
  useEffect(() => {
    if (drawerOpen && selectedUser) {
      loadDrawerData(selectedUser);
    }
  }, [drawerOpen, selectedUser, loadDrawerData]);

  const handleSuspendActivate = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setActionLoading(userId);
    try {
      const { error } = await supabase.from('users').update({ status: newStatus }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleVerifyBank = async (bankDetailId, userId) => {
    try {
      const { error } = await supabase
        .from('bank_details')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'admin_manual',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bankDetailId);

      if (!error) {
        await supabase.from('user_payout_schedule').upsert({
          user_id: userId,
          is_verified: true,
          email: selectedUser.email,
          name: selectedUser.name,
        }, { onConflict: 'user_id' });

        setDrawerData(prev => ({
          ...prev,
          bankDetail: { ...prev.bankDetail, is_verified: true, verified_at: new Date().toISOString(), verification_method: 'admin_manual' }
        }));
        setBankDetails(prev => prev.map(b => b.id === bankDetailId ? { ...b, is_verified: true } : b));
      }
    } catch (error) {
      console.error('Error verifying bank:', error);
    }
  };

  const handleMarkAllPaid = async () => {
    if (!selectedUser) return;
    try {
      await markEarningsPaid(selectedUser.id);
      const { data: updatedEarnings } = await supabase
        .from('earnings')
        .select('*, leads(client_name, service)')
        .eq('user_id', selectedUser.id)
        .order('created_at', { ascending: false });
      setDrawerData(prev => ({ ...prev, earnings: updatedEarnings || [] }));
      await supabase.from('users').update({ last_payout_date: new Date().toISOString() }).eq('id', selectedUser.id);
    } catch (error) {
      console.error('Error marking earnings as paid:', error);
    }
  };

  const getBankStatus = (userId) => {
    const bank = bankDetails.find(b => b.user_id === userId);
    if (!bank) return { status: 'No Bank', verified: false, color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    if (bank.is_verified) return { status: 'Verified ✓', verified: true, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    return { status: 'Pending', verified: false, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  };

  const getInitials = (name) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8 animate-pulse">
        <div className="h-6 bg-dark-600 rounded w-1/4 mb-6"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-dark-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h2 className="font-display font-semibold text-white">Freelancers ({users.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Designation</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <UsersIcon size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map(user => {
                  const bankStatus = getBankStatus(user.id);
                  return (
                    <tr key={user.id} className="hover:bg-dark-700/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-display font-bold text-xs text-dark-900">
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={user.role || 'freelancer'} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-sm">{user.designation || '-'}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={user.status || 'active'} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bankStatus.color}`}>
                          {bankStatus.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openDrawer(user)}
                            className="text-xs"
                          >
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant={user.status === 'active' ? 'danger' : 'success'}
                            onClick={() => handleSuspendActivate(user.id, user.status)}
                            disabled={actionLoading === user.id}
                            className="text-xs"
                          >
                            {user.status === 'active' ? 'Suspend' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div className={`
        fixed right-0 top-0 bottom-0 w-full max-w-[600px]
        bg-dark-800 border-l border-dark-500 z-50
        overflow-y-auto transition-transform duration-300 ease-in-out
        ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {selectedUser && (
          <FreelancerDrawer
            user={selectedUser}
            loading={drawerLoading}
            activeTab={drawerTab}
            setActiveTab={setDrawerTab}
            onClose={() => setDrawerOpen(false)}
            data={drawerData}
            onRoleChange={handleRoleChange}
            onSuspendActivate={handleSuspendActivate}
            onVerifyBank={handleVerifyBank}
            onMarkAllPaid={handleMarkAllPaid}
            actionLoading={actionLoading}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FREELANCER 360° DRAWER
// ============================================================================
function FreelancerDrawer({
  user,
  loading,
  activeTab,
  setActiveTab,
  onClose,
  data,
  onRoleChange,
  onSuspendActivate,
  onVerifyBank,
  onMarkAllPaid,
  actionLoading,
}) {
  const [leadsFilter, setLeadsFilter] = useState('All');

  const getInitials = (name) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredLeads = leadsFilter === 'All' 
    ? data.leads 
    : data.leads.filter(l => l.status === leadsFilter);

  const totalEarned = (data.earnings || []).reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
  const pendingPayout = (data.earnings || []).filter(e => e.payout_status === 'pending').reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
  const requestedCount = (data.earnings || []).filter(e => e.payout_status === 'requested').length;
  const paidCount = (data.earnings || []).filter(e => e.payout_status === 'paid').length;
  const convertedCount = (data.leads || []).filter(l => l.status === 'Converted').length;

  const hasRequestedEarnings = (data.earnings || []).some(e => e.payout_status === 'requested');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-dark-800 border-b border-dark-500 px-6 py-4 z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-display font-bold text-lg text-dark-900">
              {getInitials(user.name)}
            </div>
            <div>
              <h3 className="font-display font-semibold text-white text-lg">{user.name}</h3>
              <p className="text-sm text-slate-400">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={user.role || 'freelancer'} />
                <StatusBadge status={user.status || 'active'} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-700 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex gap-1 mt-4 border-b border-dark-500 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'leads', label: `Leads (${data.leads?.length || 0})` },
            { id: 'earnings', label: `Earnings (${data.earnings?.length || 0})` },
            { id: 'bank', label: 'Bank & Legal' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-b-2 border-amber-400 text-amber-400'
                  : 'text-slate-500 hover:text-slate-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-600 rounded"></div>
            ))}
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Total Leads</p>
                    <p className="text-2xl font-bold text-white mt-1">{data.leads?.length || 0}</p>
                  </div>
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Converted</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">{convertedCount}</p>
                  </div>
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Total Earned</p>
                    <p className="text-2xl font-bold text-white mt-1">₹{totalEarned.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-dark-700 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Pending Payout</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">₹{pendingPayout.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                {/* Personal Info */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-white mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="text-slate-300">{user.phone || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="text-slate-300">{user.address || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Designation</p>
                      <p className="text-slate-300">{user.designation || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Role</p>
                      <p className="text-slate-300 capitalize">{user.role || 'freelancer'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="text-slate-300 capitalize">{user.status || 'active'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Joined</p>
                      <p className="text-slate-300">{new Date(user.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Last Updated</p>
                      <p className="text-slate-300">{new Date(user.updated_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>

                {/* Legal Acceptance */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-white mb-3">Legal Acceptance Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Terms & Conditions</span>
                      {user.accepted_terms_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_terms_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not accepted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Privacy Policy</span>
                      {user.accepted_privacy_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_privacy_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not accepted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Freelancer Agreement</span>
                      {user.accepted_agreement_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_agreement_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not accepted
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-400">Role:</label>
                    <select
                      value={user.role || 'freelancer'}
                      onChange={(e) => onRoleChange(user.id, e.target.value)}
                      className="bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="freelancer">Freelancer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant={user.status === 'active' ? 'danger' : 'success'}
                      onClick={() => onSuspendActivate(user.id, user.status)}
                      disabled={actionLoading === user.id}
                      className="flex-1"
                    >
                      {user.status === 'active' ? 'Suspend User' : 'Activate User'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={onClose}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  {['All', 'New', 'Follow-up', 'Converted', 'Rejected'].map(filter => (
                    <button
                      key={filter}
                      onClick={() => setLeadsFilter(filter)}
                      className={`
                        px-3 py-1.5 text-xs rounded-lg transition-colors
                        ${leadsFilter === filter
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
                        }
                      `}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Leads Table */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl overflow-hidden">
                  {filteredLeads.length === 0 ? (
                    <div className="text-center py-8">
                      <Target size={32} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No leads found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-500">
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Service</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Note</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-600">
                          {filteredLeads.map(lead => (
                            <tr key={lead.id} className="hover:bg-dark-600/50">
                              <td className="px-4 py-2.5 text-white font-medium">{lead.client_name}</td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">{lead.service}</td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={lead.status} />
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">
                                {lead.note ? lead.note.substring(0, 40) + (lead.note.length > 40 ? '...' : '') : '-'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">
                                {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'earnings' && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Total Earned</p>
                    <p className="text-xl font-bold text-white mt-1">₹{totalEarned.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Pending</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">₹{pendingPayout.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Requested</p>
                    <p className="text-xl font-bold text-blue-400 mt-1">{requestedCount}</p>
                  </div>
                  <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                    <p className="text-xs text-slate-500 uppercase">Paid</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{paidCount}</p>
                  </div>
                </div>

                {/* Mark All Paid Button */}
                {hasRequestedEarnings && (
                  <Button
                    variant="success"
                    onClick={onMarkAllPaid}
                    className="w-full"
                  >
                    Mark All Requested as Paid
                  </Button>
                )}

                {/* Earnings Table */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl overflow-hidden">
                  {(data.earnings || []).length === 0 ? (
                    <div className="text-center py-8">
                      <DollarSign size={32} className="text-slate-600 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No earnings found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-dark-500">
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Service</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deal</th>
                            <th className="text-right px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commission</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-600">
                          {(data.earnings || []).map(earning => (
                            <tr key={earning.id} className="hover:bg-dark-600/50">
                              <td className="px-4 py-2.5 text-white font-medium">
                                {earning.leads?.client_name || 'Unknown'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">
                                {earning.leads?.service || '-'}
                              </td>
                              <td className="px-4 py-2.5 text-right text-slate-300">
                                ₹{parseFloat(earning.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-2.5 text-right text-amber-400 font-medium">
                                ₹{parseFloat(earning.commission || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-4 py-2.5">
                                <StatusBadge status={earning.payout_status} />
                              </td>
                              <td className="px-4 py-2.5 text-slate-400 text-xs">
                                {new Date(earning.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'bank' && (
              <div className="space-y-4">
                {/* Bank Details */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                    <CreditCard size={18} />
                    Bank Details
                  </h4>
                  {!data.bankDetail ? (
                    <div className="text-center py-6 text-slate-500 text-sm">No bank details added yet</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-500">Account Holder</p>
                          <p className="text-slate-300">{data.bankDetail.account_holder_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Account Number</p>
                          <p className="text-slate-300 font-mono">
                            ****{data.bankDetail.account_number?.slice(-4) || '****'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Bank Name</p>
                          <p className="text-slate-300">{data.bankDetail.bank_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">IFSC Code</p>
                          <p className="text-slate-300 font-mono">{data.bankDetail.bank_code}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Branch</p>
                          <p className="text-slate-300">{data.bankDetail.branch}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Account Type</p>
                          <p className="text-slate-300 capitalize">{data.bankDetail.account_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Country</p>
                          <p className="text-slate-300">{data.bankDetail.country}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Currency</p>
                          <p className="text-slate-300">{data.bankDetail.currency}</p>
                        </div>
                      </div>

                      {/* Verification Status */}
                      <div className="pt-3 border-t border-dark-500">
                        {data.bankDetail.is_verified ? (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-emerald-400 text-sm">
                              <Check size={16} /> Verified
                            </span>
                            <span className="text-xs text-slate-500">
                              {data.bankDetail.verified_at ? new Date(data.bankDetail.verified_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-amber-400 text-sm">
                              <AlertCircle size={16} /> Pending Verification
                            </span>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => onVerifyBank(data.bankDetail.id, user.id)}
                              className="text-xs"
                            >
                              Verify Bank Account
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Legal Documents */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                    <FileText size={18} />
                    Legal Documents
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Terms & Conditions</span>
                      {user.accepted_terms_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_terms_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not signed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Privacy Policy</span>
                      {user.accepted_privacy_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_privacy_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not signed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Freelancer Agreement</span>
                      {user.accepted_agreement_at ? (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs">
                          <Check size={14} /> {new Date(user.accepted_agreement_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <X2 size={14} /> Not signed
                        </span>
                      )}
                    </div>
                  </div>

                  {data.agreement && (
                    <div className="mt-4 pt-4 border-t border-dark-500 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Signed By</span>
                        <span className="text-slate-300">{data.agreement.full_name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Signature Method</span>
                        <span className="text-slate-300 capitalize">{data.agreement.signature_method}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Version</span>
                        <span className="text-slate-300">{data.agreement.agreement_version}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Signed At</span>
                        <span className="text-slate-300 text-xs">
                          {new Date(data.agreement.signed_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {user.requires_legal_acceptance && (
                    <div className="mt-4 pt-4 border-t border-dark-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Requires Legal Acceptance
                      </span>
                    </div>
                  )}
                </div>

                {/* Payout Schedule */}
                <div className="bg-dark-700 border border-dark-500 rounded-xl p-4">
                  <h4 className="font-display font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar size={18} />
                    Payout Schedule
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Last Payout</p>
                      <p className="text-slate-300">
                        {user.last_payout_date ? new Date(user.last_payout_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Next Payout</p>
                      <p className="text-slate-300">
                        {user.next_payout_date ? new Date(user.next_payout_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Scheduled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Autopay Enabled</p>
                      <p className="text-slate-300">{user.autopay_enabled ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// PAYOUTS TAB
// ============================================================================
function PayoutsTab() {
  const [loading, setLoading] = useState(true);
  const [earningsData, setEarningsData] = useState([]);
  const [bankData, setBankData] = useState([]);
  const [actionLoading, setActionLoading] = useState(null);
  const [paidUserIds, setPaidUserIds] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const dataPromise = Promise.all([
        supabase.from('earnings').select('*, users(id, name, email), leads(client_name)').eq('payout_status', 'requested').order('created_at', { ascending: false }),
        supabase.from('bank_details').select('*'),
      ]);
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Payouts data fetch timed out, using empty state');
        setEarningsData([]);
        setBankData([]);
        setLoading(false);
        return;
      }
      
      const [
        { data: earnings },
        { data: bank },
      ] = result;
      setEarningsData(earnings || []);
      setBankData(bank || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      setEarningsData([]);
      setBankData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Group earnings by user_id
  const grouped = earningsData.reduce((acc, earning) => {
    const uid = earning.user_id;
    if (!acc[uid]) {
      acc[uid] = {
        userId: uid,
        userName: earning.users?.name || 'Unknown',
        userEmail: earning.users?.email || '',
        earnings: [],
        totalAmount: 0,
      };
    }
    acc[uid].earnings.push(earning);
    acc[uid].totalAmount += parseFloat(earning.commission || 0);
    return acc;
  }, {});

  const payoutRequests = Object.values(grouped).filter(req => !paidUserIds.includes(req.userId));
  const totalRequested = payoutRequests.reduce((sum, req) => sum + req.totalAmount, 0);

  const exportCSV = () => {
    const headers = ['Freelancer Name', 'Email', 'Amount Requested (INR)', 'Bank Name', 'Account Number', 'IFSC', 'Transactions'];
    const rows = payoutRequests.map(req => {
      const bank = bankData.find(b => b.user_id === req.userId);
      return [
        req.userName,
        req.userEmail,
        req.totalAmount.toFixed(2),
        bank?.bank_name || 'N/A',
        bank ? `****${bank.account_number.slice(-4)}` : 'N/A',
        bank?.bank_code || 'N/A',
        req.earnings.length,
      ];
    });
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payout_requests_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await markEarningsPaid(userId);
      setPaidUserIds(prev => [...prev, userId]);
    } catch (error) {
      console.error('Error approving payout:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    setActionLoading(userId);
    try {
      await supabase.from('earnings').update({ payout_status: 'pending' }).eq('user_id', userId).eq('payout_status', 'requested');
      setPaidUserIds(prev => [...prev, userId]);
    } catch (error) {
      console.error('Error rejecting payout:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const getBankStatus = (userId) => {
    const bank = bankData.find(b => b.user_id === userId);
    return bank?.is_verified || false;
  };

  const getInitials = (name) => {
    return (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 h-24"></div>
          <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 h-24"></div>
          <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 h-24"></div>
        </div>
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-dark-600 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5">
          <p className="text-sm text-slate-400 uppercase">Total Requested</p>
          <p className="text-2xl font-bold text-white mt-1">₹{totalRequested.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5">
          <p className="text-sm text-slate-400 uppercase">Number of Freelancers</p>
          <p className="text-2xl font-bold text-white mt-1">{payoutRequests.length}</p>
        </div>
        <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5 flex items-center justify-end">
          <Button
            variant="secondary"
            icon={Download}
            onClick={exportCSV}
            disabled={payoutRequests.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Payout Requests Table */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h2 className="font-display font-semibold text-white">Payout Requests ({payoutRequests.length})</h2>
        </div>
        {payoutRequests.length === 0 ? (
          <div className="text-center py-12">
            <Check size={48} className="text-emerald-400 mx-auto mb-3" />
            <p className="text-slate-500">No payout requests at this time. All freelancers are up to date.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Freelancer</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank Details</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Transactions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested Since</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-600">
                {payoutRequests.map(req => {
                  const bank = bankData.find(b => b.user_id === req.userId);
                  const bankVerified = getBankStatus(req.userId);
                  const oldestDate = req.earnings[0]?.created_at;
                  
                  return (
                    <tr key={req.userId} className="hover:bg-dark-700/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center font-display font-bold text-xs text-dark-900">
                            {getInitials(req.userName)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{req.userName}</p>
                            <p className="text-xs text-slate-500">{req.userEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {bank ? (
                          <div className="space-y-1">
                            <p className="text-white text-sm">{bank.bank_name}</p>
                            <p className="text-slate-400 text-xs font-mono">****{bank.account_number.slice(-4)}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-slate-400 text-xs">{bank.bank_code}</p>
                              {bankVerified ? (
                                <span className="text-emerald-400 text-xs">✓</span>
                              ) : (
                                <span className="text-amber-400 text-xs">Pending</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No bank details</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-300">{req.earnings.length}</td>
                      <td className="px-5 py-3.5 text-right">
                        <p className="text-amber-400 font-bold">₹{req.totalAmount.toLocaleString('en-IN')}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">
                        {oldestDate ? new Date(oldestDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(req.userId)}
                            disabled={actionLoading === req.userId || !bankVerified}
                            title={!bankVerified ? "Verify bank account first" : ""}
                            className="text-xs"
                          >
                            Approve & Pay
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(req.userId)}
                            disabled={actionLoading === req.userId}
                            className="text-xs"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// LEADS TAB
// ============================================================================
function LeadsTab() {
  const [loading, setLoading] = useState(true);
  const [allLeads, setAllLeads] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [freelancerFilter, setFreelancerFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const dataPromise = supabase
        .from('leads')
        .select('*, users(id, name, email)')
        .order('created_at', { ascending: false });
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Leads data fetch timed out, using empty state');
        setAllLeads([]);
        setLoading(false);
        return;
      }
      
      const { data } = result;
      setAllLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setAllLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get unique freelancers from leads
  const uniqueFreelancers = [...new Map(allLeads.map(lead => [lead.user_id, lead.users])).values()];

  // Filter leads
  const filtered = allLeads.filter(lead => {
    const matchSearch = !search || lead.client_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || lead.status === statusFilter;
    const matchFreelancer = freelancerFilter === 'All' || lead.user_id === freelancerFilter;
    let matchDate = true;
    
    if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = new Date(lead.created_at) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchDate = new Date(lead.created_at) >= monthAgo;
    }
    
    return matchSearch && matchStatus && matchFreelancer && matchDate;
  });

  const convertedCount = filtered.filter(l => l.status === 'Converted').length;
  const conversionRate = filtered.length > 0 ? ((convertedCount / filtered.length) * 100).toFixed(1) : 0;

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-12 bg-dark-700 rounded"></div>
          <div className="h-12 bg-dark-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-dark-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Status</option>
          <option value="New">New</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Converted">Converted</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={freelancerFilter}
          onChange={(e) => setFreelancerFilter(e.target.value)}
          className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Freelancers</option>
          {uniqueFreelancers.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'week'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'month'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'all'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl px-5 py-3 flex items-center gap-4">
        <p className="text-slate-400 text-sm">
          Showing <span className="text-white font-medium">{filtered.length}</span> leads · 
          <span className="text-emerald-400 font-medium"> {convertedCount}</span> converted 
          (<span className="text-white font-medium">{conversionRate}%</span> rate)
        </p>
      </div>

      {/* Leads Table */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Service</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Note</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Freelancer</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Target size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No leads found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-5 py-3.5 text-white font-medium">{lead.client_name}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{lead.phone || '-'}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{lead.service}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {lead.note ? (
                        <div className="flex items-center gap-1">
                          <MessageSquare size={14} className="text-slate-400" title={lead.note} />
                          <span className="text-slate-400 text-xs truncate max-w-[150px]">{lead.note}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{lead.users?.name || 'Unknown'}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ANNOUNCEMENTS TAB
// ============================================================================
function AnnouncementsTab() {
  const { currentUser } = useAuth();
  const [tableExists, setTableExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    expiresAt: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const dataPromise = supabase.from('announcements').select('*').order('created_at', { ascending: false });
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Announcements fetch timed out, using empty state');
        setAnnouncements([]);
        return;
      }
      
      const { data } = result;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncements([]);
    }
  }, []);

  const checkTableExists = useCallback(async () => {
    try {
      const { error } = await supabase.from('announcements').select('id').limit(1);
      if (error && error.code === '42P01') {
        setTableExists(false);
      } else {
        setTableExists(true);
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error checking announcements table:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAnnouncements]);

  useEffect(() => {
    checkTableExists();
  }, [checkTableExists]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from('announcements').insert({
        title: formData.title,
        message: formData.message,
        type: formData.type,
        created_by: currentUser.id,
        expires_at: formData.expiresAt || null,
        is_active: true,
      });
      if (error) throw error;
      setFormData({ title: '', message: '', type: 'info', expiresAt: '' });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await supabase.from('announcements').update({ is_active: !currentStatus }).eq('id', id);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await supabase.from('announcements').delete().eq('id', id);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const getTypeStyles = (type) => {
    const styles = {
      info: 'border-blue-500 border-l-4 bg-blue-500/5',
      warning: 'border-amber-500 border-l-4 bg-amber-500/5',
      success: 'border-emerald-500 border-l-4 bg-emerald-500/5',
      urgent: 'border-red-500 border-l-4 bg-red-500/5',
    };
    return styles[type] || styles.info;
  };

  const getTypeBadgeStyles = (type) => {
    const styles = {
      info: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
      warning: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
      success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
      urgent: 'bg-red-500/15 text-red-300 border-red-500/20',
    };
    return styles[type] || styles.info;
  };

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-32 bg-dark-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
        <h3 className="text-amber-400 font-bold mb-2">Setup Required</h3>
        <p className="text-slate-400 text-sm mb-4">
          Run this SQL in your Supabase SQL Editor to enable announcements:
        </p>
        <pre className="bg-dark-900 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
          {`CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage announcements" ON public.announcements FOR ALL
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users read active announcements" ON public.announcements FOR SELECT
  USING (is_active = true);`}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Announcement Form */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-5">
        <h3 className="font-display font-semibold text-white mb-4">Create Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
              className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Announcement title..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
              rows={4}
              className="w-full bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Announcement message..."
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Type</label>
            <div className="flex gap-2">
              {[
                { id: 'info', label: 'Info', color: 'bg-blue-500' },
                { id: 'warning', label: 'Warning', color: 'bg-amber-500' },
                { id: 'success', label: 'Success', color: 'bg-emerald-500' },
                { id: 'urgent', label: 'Urgent', color: 'bg-red-500' },
              ].map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type: type.id }))}
                  className={`
                    px-4 py-2 text-sm rounded-lg transition-colors
                    ${formData.type === type.id
                      ? `${type.color} text-white`
                      : 'bg-dark-700 text-slate-400 hover:bg-dark-600'
                    }
                  `}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Expires (optional)</label>
            <input
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
              className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting || !formData.title || !formData.message}
            className="w-full"
          >
            {submitting ? 'Posting...' : 'Post Announcement'}
          </Button>
        </form>
      </div>

      {/* Existing Announcements */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h3 className="font-display font-semibold text-white">Announcements ({announcements.length})</h3>
        </div>
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone size={32} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No announcements yet</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-600">
            {announcements.map(announcement => (
              <div key={announcement.id} className={`p-5 ${getTypeStyles(announcement.type)}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-display font-semibold text-white">{announcement.title}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getTypeBadgeStyles(announcement.type)}`}>
                        {announcement.type}
                      </span>
                      {!announcement.is_active && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mb-2">
                      {announcement.message.length > 100 ? announcement.message.substring(0, 100) + '...' : announcement.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>Created: {new Date(announcement.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span>Expires: {announcement.expires_at ? new Date(announcement.expires_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(announcement.id, announcement.is_active)}
                      className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                        announcement.is_active
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                    >
                      {announcement.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// AUDIT LOG TAB
// ============================================================================
function AuditLogTab() {
  const [tableExists, setTableExists] = useState(true);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [hasMore, setHasMore] = useState(false);

  const ACTION_LABELS = {
    lead_converted:   { label: 'Lead Converted',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    payout_requested: { label: 'Payout Requested',  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
    payout_approved:  { label: 'Payout Approved',   color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
    bank_verified:    { label: 'Bank Verified',      color: 'text-purple-400',  bg: 'bg-purple-500/10'  },
    legal_accepted:   { label: 'Legal Accepted',     color: 'text-cyan-400',    bg: 'bg-cyan-500/10'    },
    user_suspended:   { label: 'User Suspended',     color: 'text-red-400',     bg: 'bg-red-500/10'     },
    user_activated:   { label: 'User Activated',     color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  };

  const fetchLogs = useCallback(async () => {
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );
      
      const dataPromise = supabase
        .from('audit_logs')
        .select('*, users(name, email)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * 50, (page + 1) * 50 - 1);
      
      const result = await Promise.race([dataPromise, timeoutPromise]);
      
      // Handle timeout case
      if (result instanceof Error) {
        console.error('Audit logs fetch timed out, using empty state');
        setLogs([]);
        setHasMore(false);
        return;
      }
      
      const { data, error, count } = result;
      
      if (error) throw error;
      setLogs(data || []);
      setHasMore((count || 0) > (page + 1) * 50);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setLogs([]);
      setHasMore(false);
    }
  }, [page]);

  const checkTableExists = useCallback(async () => {
    try {
      const { error } = await supabase.from('audit_logs').select('id').limit(1);
      if (error && error.code === '42P01') {
        setTableExists(false);
      } else {
        setTableExists(true);
        await fetchLogs();
      }
    } catch (error) {
      console.error('Error checking audit_logs table:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchLogs]);

  useEffect(() => {
    checkTableExists();
  }, [checkTableExists]);

  useEffect(() => {
    if (tableExists) {
      fetchLogs();
    }
  }, [tableExists, fetchLogs]);

  // Get unique actions from logs
  const uniqueActions = [...new Set(logs.map(log => log.action))];

  // Filter logs
  const filtered = logs.filter(log => {
    const matchAction = actionFilter === 'All' || log.action === actionFilter;
    let matchDate = true;
    
    if (dateFilter === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      matchDate = new Date(log.created_at) >= today;
    } else if (dateFilter === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      matchDate = new Date(log.created_at) >= weekAgo;
    } else if (dateFilter === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      matchDate = new Date(log.created_at) >= monthAgo;
    }
    
    return matchAction && matchDate;
  });

  const getActionBadge = (action) => {
    const config = ACTION_LABELS[action] || { label: action, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color} capitalize`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-8 animate-pulse">
        <div className="space-y-4">
          <div className="h-12 bg-dark-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-dark-600 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tableExists) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
        <h3 className="text-amber-400 font-bold mb-2">Setup Required</h3>
        <p className="text-slate-400 text-sm mb-4">
          Run this SQL in your Supabase SQL Editor to enable audit logs:
        </p>
        <pre className="bg-dark-900 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
          {`CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit logs" ON public.audit_logs FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Auth users insert audit logs" ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);`}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-dark-700 border border-dark-500 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
        >
          <option value="All">All Actions</option>
          {uniqueActions.map(action => (
            <option key={action} value={action} className="capitalize">
              {ACTION_LABELS[action]?.label || action}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'today'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'week'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setDateFilter('month')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'month'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`px-4 py-2.5 text-sm rounded-xl transition-colors ${
              dateFilter === 'all'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <ClipboardList size={32} className="text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No audit logs found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 text-xs">
                      {new Date(log.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-white text-sm font-medium">{log.users?.name || 'Unknown'}</p>
                        <p className="text-slate-500 text-xs">{log.users?.email || ''}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs capitalize">
                      {log.entity_type || '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(log.metadata).map(([key, value]) => (
                            <span key={key} className="px-2 py-0.5 bg-slate-500/10 text-slate-400 rounded text-xs">
                              {key}: {String(value).substring(0, 20)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="secondary"
            onClick={() => setPage(p => p + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}