import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../utils/leaderboardService';

// ============================================================
// LeaderboardPage — Supabase-powered leaderboard
// ============================================================

const medalColors = {
  0: { bg: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: '🥇' },
  1: { bg: 'from-slate-400/15 to-slate-600/5', border: 'border-slate-400/25', text: 'text-slate-300', badge: '🥈' },
  2: { bg: 'from-amber-700/15 to-amber-900/5', border: 'border-amber-700/25', text: 'text-amber-600', badge: '🥉' },
};

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch leaderboard data on mount
  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    const { leaderboard: data, error: err } = await getLeaderboard();

    if (err) {
      setError(`Failed to load leaderboard: ${err}`);
      setLeaderboard([]);
    } else {
      setLeaderboard(data);
    }
    setLoading(false);
  };

  // Get user initials for avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const maxConversions = leaderboard[0]?.convertedLeads || 1;

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3"></div>
          <p className="text-slate-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Ranked by converted leads</p>
      </div>

      {error && (
        <div className="flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="text-red-400 hover:text-red-300 ml-auto text-sm font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Reorder: 2nd, 1st, 3rd for podium effect */}
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((user, visualIdx) => {
            const realIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2;
            const m = medalColors[realIdx];
            const isFirst = realIdx === 0;
            return (
              <div
                key={user.id}
                className={`
                  card-shine relative rounded-2xl p-6 border bg-gradient-to-br ${m.bg} ${m.border}
                  ${isFirst ? 'sm:scale-105 shadow-gold' : ''}
                  text-center transition-all duration-300
                `}
              >
                {isFirst && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-dark-900 text-xs font-bold px-3 py-1 rounded-full shadow-gold">
                      #1 Champion
                    </div>
                  </div>
                )}
                <div className="text-3xl mb-3 mt-2">{m.badge}</div>
                <div className={`
                  w-14 h-14 rounded-full bg-dark-600 border-2 ${m.border}
                  flex items-center justify-center font-display font-bold text-lg ${m.text}
                  mx-auto mb-3
                `}>
                  {getInitials(user.name)}
                </div>
                <p className="font-display font-semibold text-white text-sm">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.convertedLeads} conversions</p>
                <p className={`text-xl font-bold font-mono mt-2 ${m.text}`}>
                  Rank: {user.rank}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">{user.role}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-dark-700 border border-dark-400 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-dark-500">
          <h2 className="font-display font-semibold text-white text-base flex items-center gap-2">
            <Trophy size={16} className="text-amber-400" /> Full Rankings ({leaderboard.length} users)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rank</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Converted Leads</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-600">
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-600 text-sm">
                    No users on leaderboard yet
                  </td>
                </tr>
              ) : (
                leaderboard.map((user, i) => {
                  const isCurrentUser = user.id === currentUser?.id;
                  const isTop3 = i < 3;
                  return (
                    <tr
                      key={user.id}
                      className={`
                        hover:bg-dark-600/50 transition-colors
                        ${isCurrentUser ? 'bg-amber-500/5 border-l-2 border-l-amber-400' : ''}
                      `}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{medalColors[i]?.badge || ''}</span>
                          <span className={`font-mono text-sm ${isTop3 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                            #{user.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-xs font-display
                            ${isTop3
                              ? 'bg-amber-500/15 border border-amber-500/25 text-amber-400'
                              : 'bg-dark-500 border border-dark-400 text-slate-400'
                            }
                          `}>
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <span className={`font-medium ${isTop3 ? 'text-white' : 'text-slate-300'}`}>
                              {user.name}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/20">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-center hidden sm:table-cell">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="h-1.5 rounded-full bg-amber-500/20 overflow-hidden"
                            style={{ width: `80px` }}
                          >
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                              style={{ width: `${(user.convertedLeads / maxConversions) * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-sm w-6 text-right">{user.convertedLeads}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`
                          text-xs px-2 py-1 rounded-full border capitalize
                          ${user.status === 'active' 
                            ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }
                        `}>
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
