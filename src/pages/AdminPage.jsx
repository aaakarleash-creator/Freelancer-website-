import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldOff, Users, Trash2, AlertCircle, DollarSign } from 'lucide-react';
import {
  getAllUsers,
  suspendUser,
  activateUser,
  deleteUser,
  getUserStats
} from '../utils/userManagementService';
import { getAllEarnings, markEarningsPaid } from '../utils/earningsService';
import { supabase } from '../utils/supabaseClient';
import Button from '../components/Button';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Users');
  const [users, setUsers] = useState([]);
  const [bankDetails, setBankDetails] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch users
      const { users: usersData, error: usersError } = await getAllUsers();
      if (usersError) throw usersError;
      setUsers(usersData);

      // Fetch bank details
      const { data: bankData, error: bankError } = await supabase
        .from('bank_details')
        .select('*');
      if (!bankError) {
        setBankDetails(bankData || []);
      }

      // Fetch stats
      const { stats: statsData, error: statsError } = await getUserStats();
      if (!statsError) {
        setStats(statsData);
      }

      // Fetch payout requests
      const { data: earningsData, error: earningsError } = await getAllEarnings();
      if (!earningsError) {
        const requested = earningsData.filter(e => e.payout_status === 'requested');
        setPayoutRequests(requested);
      }
    } catch (err) {
      setError(`Failed to load data: ${err.message || err}`);
    }

    setLoading(false);
  };

  const verifyBank = async (bankDetailId, userId) => {
    setActionLoading(bankDetailId);
    try {
      const { error } = await supabase
        .from('bank_details')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verification_method: 'admin_manual',
        })
        .eq('id', bankDetailId);

      if (error) throw error;

      // Also update user_payout_schedule
      await supabase
        .from('user_payout_schedule')
        .upsert({
          user_id: userId,
          is_verified: true,
        }, { onConflict: 'user_id' });

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(`Failed to verify bank: ${err.message}`);
    }
    setActionLoading(null);
  };

  // Handle suspending a user
  const handleSuspend = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to suspend ${userName}? They won't be able to login.`)) {
      return;
    }

    setActionLoading(userId);
    const { error: err } = await suspendUser(userId);

    if (err) {
      setError(`Failed to suspend user: ${err}`);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'suspended' } : u));
      setStats(prev => ({ 
        ...prev, 
        active: prev.active - 1, 
        suspended: prev.suspended + 1 
      }));
    }

    setActionLoading(null);
  };

  // Handle activating a user
  const handleActivate = async (userId, userName) => {
    setActionLoading(userId);
    const { error: err } = await activateUser(userId);

    if (err) {
      setError(`Failed to activate user: ${err}`);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      setStats(prev => ({ 
        ...prev, 
        active: prev.active + 1, 
        suspended: prev.suspended - 1 
      }));
    }

    setActionLoading(null);
  };

  // Handle deleting a user
  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to DELETE ${userName}? This action cannot be undone and will delete all their data.`)) {
      return;
    }

    setActionLoading(userId);
    const { error: err } = await deleteUser(userId);

    if (err) {
      setError(`Failed to delete user: ${err}`);
    } else {
      const deletedUser = users.find(u => u.id === userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setStats(prev => ({
        ...prev,
        total: prev.total - 1,
        active: deletedUser?.status === 'active' ? prev.active - 1 : prev.active,
        suspended: deletedUser?.status === 'suspended' ? prev.suspended - 1 : prev.suspended,
      }));
    }

    setActionLoading(null);
  };

  // Handle marking earnings as paid
  const handleMarkPaid = async (userId) => {
    if (!window.confirm('Mark all requested earnings for this user as paid?')) {
      return;
    }

    setActionLoading(userId);
    setError('');

    try {
      console.log('🔄 Marking earnings as paid for user:', userId);
      const { error: err, success } = await markEarningsPaid(userId);

      if (err) {
        throw new Error(`Failed to mark as paid: ${err}`);
      }

      if (!success) {
        throw new Error('Mark as paid operation failed');
      }

      console.log('✅ Successfully marked earnings as paid, refreshing data...');
      // Refresh data to show updated status
      await fetchData();
    } catch (error) {
      console.error('❌ Error marking earnings as paid:', error);
      setError(error.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(null);
    }
  };

  // Get bank verification status for a user
  const getBankStatus = (userId) => {
    const bank = bankDetails.find(b => b.user_id === userId);
    if (!bank) return { status: 'None', verified: false };
    if (bank.is_verified) return { status: 'Verified', verified: true };
    return { status: 'Pending', verified: false };
  };

  // Group payout requests by user
  const groupedPayouts = payoutRequests.reduce((acc, earning) => {
    if (!acc[earning.user_id]) {
      acc[earning.user_id] = {
        userId: earning.user_id,
        userName: earning.users?.name || 'Unknown',
        userEmail: earning.users?.email || 'Unknown',
        totalAmount: 0,
        transactionCount: 0,
        earnings: []
      };
    }
    acc[earning.user_id].totalAmount += parseFloat(earning.commission || 0);
    acc[earning.user_id].transactionCount += 1;
    acc[earning.user_id].earnings.push(earning);
    return acc;
  }, {});

  const totalPendingAmount = Object.values(groupedPayouts).reduce(
    (sum, group) => sum + group.totalAmount, 0
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
            Admin Only
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">Manage users, bank verification, and payouts</p>
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-300 ml-auto text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('Users')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'Users'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setActiveTab('Payouts')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'Payouts'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
              : 'bg-dark-700 text-slate-400 border border-dark-500 hover:border-dark-400'
          }`}
        >
          Payouts
        </button>
      </div>

      {activeTab === 'Users' && (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Users', value: stats.total, color: 'text-white' },
              { label: 'Active', value: stats.active, color: 'text-emerald-400' },
              { label: 'Suspended', value: stats.suspended, color: 'text-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-dark-700 border border-dark-400 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold font-display ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-dark-500">
              <Users size={16} className="text-purple-400" />
              <h2 className="font-display font-semibold text-white text-base">User Management ({users.length})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Role</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Bank</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-600">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-600 text-sm">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(user => {
                      const bankStatus = getBankStatus(user.id);
                      const bank = bankDetails.find(b => b.user_id === user.id);
                      return (
                        <tr key={user.id} className="hover:bg-dark-600/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-dark-600 border border-dark-400 flex items-center justify-center font-display font-bold text-xs text-slate-400">
                                {(user.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-white text-sm">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 hidden sm:table-cell">
                            <span className="text-xs px-2 py-1 rounded-full border capitalize bg-dark-600 text-slate-300 border-dark-500">
                              {user.role || 'freelancer'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`
                              text-xs px-2 py-1 rounded-full border capitalize
                              ${bankStatus.status === 'Verified' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : bankStatus.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }
                            `}>
                              {bankStatus.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className={`
                              text-xs px-2 py-1 rounded-full border capitalize
                              ${user.status === 'active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                              }
                            `}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end gap-2 flex-wrap">
                              {bank && !bank.is_verified && (
                                <Button
                                  size="sm"
                                  onClick={() => verifyBank(bank.id, user.id)}
                                  disabled={actionLoading === bank.id}
                                  className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                                >
                                  Verify Bank
                                </Button>
                              )}
                              {user.role !== 'admin' && user.status === 'active' && (
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={ShieldOff}
                                  onClick={() => handleSuspend(user.id, user.name)}
                                  disabled={actionLoading === user.id}
                                  className="text-xs"
                                >
                                  Suspend
                                </Button>
                              )}
                              {user.status === 'suspended' && (
                                <Button
                                  size="sm"
                                  variant="success"
                                  icon={ShieldCheck}
                                  onClick={() => handleActivate(user.id, user.name)}
                                  disabled={actionLoading === user.id}
                                  className="text-xs"
                                >
                                  Activate
                                </Button>
                              )}
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDelete(user.id, user.name)}
                                  disabled={actionLoading === user.id}
                                  className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                              {user.role === 'admin' && (
                                <span className="text-xs text-slate-600 px-3">Protected</span>
                              )}
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
        </>
      )}

      {activeTab === 'Payouts' && (
        <>
          {/* Summary */}
          <div className="bg-dark-700 border border-dark-400 rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Pending Payouts</p>
                  <p className="text-2xl font-bold font-display text-white mt-1">
                    ₹{totalPendingAmount.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Pending Requests</p>
                <p className="text-xl font-bold font-display text-amber-400 mt-1">
                  {Object.keys(groupedPayouts).length}
                </p>
              </div>
            </div>
          </div>

          {/* Payout requests */}
          <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-500">
              <h2 className="font-display font-semibold text-white text-base">Payout Requests</h2>
            </div>

            {Object.keys(groupedPayouts).length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-sm">
                No payout requests at this time.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Email</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Amount</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Transactions</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-600">
                    {Object.values(groupedPayouts).map(group => (
                      <tr key={group.userId} className="hover:bg-dark-600/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-dark-600 border border-dark-400 flex items-center justify-center font-display font-bold text-xs text-slate-400">
                              {(group.userName || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <p className="font-medium text-white text-sm">{group.userName}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell text-slate-400">
                          {group.userEmail}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-amber-400">
                          ₹{group.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 text-center text-slate-300">
                          {group.transactionCount}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleMarkPaid(group.userId)}
                            disabled={actionLoading === group.userId}
                            className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          >
                            Mark as Paid
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
