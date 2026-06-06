import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserEarnings, requestPayout } from '../utils/earningsService';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function EarningsPage() {
  const { currentUser } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);

  // Calculate totals
  const totalEarnings = earnings.reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
  const pendingPayout = earnings
    .filter(e => e.payout_status === 'pending')
    .reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
  const requestedAmount = earnings
    .filter(e => e.payout_status === 'requested')
    .reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);
  const paidAmount = earnings
    .filter(e => e.payout_status === 'paid')
    .reduce((sum, e) => sum + (parseFloat(e.commission) || 0), 0);

  const fetchEarnings = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Fetching earnings for user:', currentUser.id);
      const { data, error: err } = await getUserEarnings(currentUser.id);
      if (err) throw err;
      console.log('Fetched earnings:', data);
      console.log('Earnings breakdown:', data.map(e => ({
        id: e.id,
        commission: e.commission,
        payout_status: e.payout_status,
        status_type: typeof e.payout_status
      })));
      setEarnings(data);
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError(`Failed to load earnings: ${err.message}`);
    }
    setLoading(false);
  };

  // Fetch earnings on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchEarnings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleRequestPayout = async () => {
    if (pendingPayout < 500) {
      console.log('❌ Pending payout amount is less than ₹500:', pendingPayout);
      return; // Button should be disabled, but double-check
    }

    if (requestingPayout) {
      console.log('⚠️ Payout request already in progress, ignoring duplicate click');
      return;
    }

    if (!window.confirm(`Request payout of ₹${pendingPayout.toLocaleString('en-IN')}? This will notify the admin.`)) {
      console.log('❌ User cancelled payout request');
      return;
    }

    setRequestingPayout(true);
    setError('');
    setSuccessMessage('');

    try {
      console.log('🔄 Calling requestPayout service...');
      const { error: err, success, updatedRows } = await requestPayout(currentUser.id);

      if (err) {
        throw new Error(`Failed to request payout: ${err}`);
      }

      if (!success) {
        throw new Error('Payout request failed');
      }

      console.log('✅ Payout request successful, refreshing earnings...');
      setSuccessMessage(`✅ Payout request sent! ${updatedRows} transaction(s) submitted for approval. Admin will process within 3-5 business days.`);

      // Refresh earnings to show updated status
      await fetchEarnings();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('❌ Error requesting payout:', error);
      setError(error.message || 'Failed to request payout');
    } finally {
      setRequestingPayout(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Math.round(amount).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Earnings</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track your income and payouts</p>
        </div>
        <div className="relative">
          <button
            onClick={handleRequestPayout}
            disabled={pendingPayout < 500 || requestingPayout}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${pendingPayout >= 500 && !requestingPayout
                ? 'bg-amber-500 hover:bg-amber-600 text-dark-900'
                : 'bg-dark-600 text-slate-400 cursor-not-allowed'
              }
            `}
            style={{
              pointerEvents: requestingPayout ? 'none' : 'auto'
            }}
          >
            {requestingPayout ? 'Requesting...' : 'Request Payout'}
          </button>
          {pendingPayout < 500 && (
            <div className="absolute top-full right-0 mt-2 w-48 px-3 py-2 bg-dark-600 border border-dark-400 rounded-lg text-xs text-slate-400 z-10">
              Min ₹500 required
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm font-medium">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {successMessage && (
        <div className="flex gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm font-medium">
          {successMessage}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Earned"
          value={formatCurrency(totalEarnings)}
          sub="All transactions"
          accent
        />
        <StatCard
          icon={Clock}
          label="Pending Payout"
          value={formatCurrency(pendingPayout)}
          sub="Awaiting release"
        />
        <StatCard
          icon={AlertCircle}
          label="Requested"
          value={formatCurrency(requestedAmount)}
          sub="Pending admin approval"
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid Out"
          value={formatCurrency(paidAmount)}
          sub="Successfully received"
        />
      </div>

      {/* Commission info banner */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl p-4 text-sm text-slate-400">
        You earn 10% commission per conversion. Reach 10+ conversions to unlock 15% premium rate.
      </div>

      {/* Transactions table */}
      <div className="bg-dark-800 border border-dark-500 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h2 className="font-display font-semibold text-white text-base">Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Client Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Service</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deal Value</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commission</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 max-w-md mx-auto">
                      <p className="text-slate-400 text-sm">No earnings yet. Convert your first lead to start earning! 🎉</p>
                    </div>
                  </td>
                </tr>
              ) : (
                earnings.map(earning => (
                  <tr key={earning.id} className="hover:bg-dark-700/50 transition-colors">
                    <td className="px-5 py-3.5 text-slate-200">
                      {earning.leads?.client_name || 'Unknown Client'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 hidden sm:table-cell">
                      {earning.leads?.service || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-300">
                      {formatCurrency(earning.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-amber-400">
                      {formatCurrency(earning.commission)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={earning.payout_status} />
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-500 font-mono text-xs hidden md:table-cell">
                      {formatDate(earning.created_at)}
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
