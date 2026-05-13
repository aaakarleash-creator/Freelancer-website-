import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getUserEarnings, 
  calculateTotalEarnings,
  getPendingPayouts,
  getPaidPayouts 
} from '../utils/earningsService';
import StatCard from '../components/StatCard';

// ============================================================
// EarningsPage — Supabase-powered earnings tracking
// ============================================================

export default function EarningsPage() {
  const { currentUser } = useAuth();
  const [earnings, setEarnings] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [paidPayouts, setPaidPayouts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch earnings data on mount
  useEffect(() => {
    if (currentUser?.id) {
      fetchEarningsData();
    }
  }, [currentUser]);

  const fetchEarningsData = async () => {
    setLoading(true);
    setError('');

    try {
      // Fetch all earnings for user
      const { earnings: earningsData, error: earningsError } = await getUserEarnings(currentUser.id);
      if (earningsError) throw earningsError;

      // Calculate totals
      const { total, error: totalError } = await calculateTotalEarnings(currentUser.id);
      if (totalError) throw totalError;

      // Get pending payouts
      const { pendingAmount, error: pendingError } = await getPendingPayouts(currentUser.id);
      if (pendingError) throw pendingError;

      // Get paid payouts
      const { paidAmount, error: paidError } = await getPaidPayouts(currentUser.id);
      if (paidError) throw paidError;

      setEarnings(earningsData);
      setTotalEarnings(total);
      setPendingPayouts(pendingAmount);
      setPaidPayouts(paidAmount);
    } catch (err) {
      setError(`Failed to load earnings: ${err.message || err}`);
    }

    setLoading(false);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  const payoutPercentage = totalEarnings > 0 ? (paidPayouts / totalEarnings) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Earnings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Track your income and payouts</p>
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchEarningsData}
            className="text-red-400 hover:text-red-300 ml-auto text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={DollarSign}
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          sub="All transactions"
          accent
        />
        <StatCard
          icon={Clock}
          label="Pending Payout"
          value={formatCurrency(pendingPayouts)}
          sub="Awaiting release"
        />
        <StatCard
          icon={CheckCircle2}
          label="Paid Amount"
          value={formatCurrency(paidPayouts)}
          sub="Successfully received"
        />
      </div>

      {/* Progress bar */}
      {totalEarnings > 0 && (
        <div className="bg-dark-700 border border-dark-400 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Payout Progress</span>
            <span className="text-sm font-mono text-amber-400">{Math.round(payoutPercentage)}% released</span>
          </div>
          <div className="w-full h-3 bg-dark-500 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
              style={{ width: `${payoutPercentage}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-600">
            <span>{formatCurrency(paidPayouts)} paid</span>
            <span>{formatCurrency(pendingPayouts)} pending</span>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h2 className="font-display font-semibold text-white text-base">Transaction History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-600 text-sm">
                    No earnings yet. Convert leads to start earning!
                  </td>
                </tr>
              ) : (
                earnings.map(earning => (
                  <tr key={earning.id} className="hover:bg-dark-600/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                          ${earning.payout_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}
                        `}>
                          {earning.payout_status === 'paid' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        </div>
                        <div>
                          <span className="text-slate-200 text-sm block">Sale Commission</span>
                          <span className="text-xs text-slate-500">Commission: {formatCurrency(earning.commission)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden sm:table-cell text-slate-500 font-mono text-xs">
                      {formatDate(earning.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`
                        text-xs px-2 py-1 rounded-full border capitalize
                        ${earning.payout_status === 'paid' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : earning.payout_status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }
                      `}>
                        {earning.payout_status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-amber-400">
                      +{formatCurrency(earning.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer total */}
        {earnings.length > 0 && (
          <div className="px-5 py-4 border-t border-dark-500 flex justify-between items-center bg-dark-600/50">
            <span className="text-sm text-slate-500">Total</span>
            <span className="font-display font-bold text-amber-400 text-lg">
              {formatCurrency(totalEarnings)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
