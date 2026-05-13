import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldOff, Users, Trash2, AlertCircle } from 'lucide-react';
import { 
  getAllUsers, 
  suspendUser, 
  activateUser, 
  deleteUser,
  getUserStats 
} from '../utils/userManagementService';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';

// ============================================================
// AdminPage — Supabase-powered user management panel
// ============================================================

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch users and stats on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch all users
      const { users: usersData, error: usersError } = await getAllUsers();
      if (usersError) throw usersError;

      setUsers(usersData);

      // Fetch stats
      const { stats: statsData, error: statsError } = await getUserStats();
      if (!statsError) {
        setStats(statsData);
      }
    } catch (err) {
      setError(`Failed to load users: ${err.message || err}`);
      setUsers([]);
    }

    setLoading(false);
  };

  // Handle suspending a user
  const handleSuspend = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to suspend ${userName}? They won't be able to login.`)) {
      return;
    }

    setActionLoading(userId);
    const { success, error: err } = await suspendUser(userId);

    if (err) {
      setError(`Failed to suspend user: ${err}`);
    } else {
      // Update local state
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
    const { success, error: err } = await activateUser(userId);

    if (err) {
      setError(`Failed to activate user: ${err}`);
    } else {
      // Update local state
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
    const { success, error: err } = await deleteUser(userId);

    if (err) {
      setError(`Failed to delete user: ${err}`);
    } else {
      // Update local state
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

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading users...</p>
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
        <p className="text-slate-500 text-sm mt-0.5">Manage users, roles, and access</p>
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
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-600 text-sm">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map(user => (
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
                        ${user.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }
                      `}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
