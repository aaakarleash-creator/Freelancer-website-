import React, { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabaseClient';

const medalColors = {
  0: { bg: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: '🥇' },
  1: { bg: 'from-slate-400/15 to-slate-600/5', border: 'border-slate-400/25', text: 'text-slate-300', badge: '🥈' },
  2: { bg: 'from-amber-700/15 to-amber-900/5', border: 'border-amber-700/25', text: 'text-amber-600', badge: '🥉' },
};

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      // Get all users with their converted lead counts and total earnings
      const usersPromise = supabase
        .from('users')
        .select('id, name, designation, role')
        .eq('status', 'active');
      
      const usersResult = await Promise.race([usersPromise, timeoutPromise]);
      
      // Handle timeout case
      if (usersResult instanceof Error) {
        console.error('Leaderboard fetch timed out, using empty state');
        setLeaderboard([]);
        setLoading(false);
        return;
      }
      
      const { data: users, error: usersError } = usersResult;

      if (usersError) { 
        console.error('Failed to fetch users for leaderboard:', usersError);
        setLeaderboard([]);
        setLoading(false); 
        return; 
      }

      // For each user get their stats with timeout
      const withStats = await Promise.all(users.map(async (user) => {
        // Add timeout for each user's stats fetch
        const statsTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Stats fetch timeout')), 5000)
        );
        
        const statsPromise = (async () => {
          const { count: convertedCount } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'Converted');

          const { data: earningsData } = await supabase
            .from('earnings')
            .select('commission')
            .eq('user_id', user.id);

          const totalEarnings = (earningsData || []).reduce(
            (sum, e) => sum + parseFloat(e.commission || 0), 0
          );

          return {
            ...user,
            convertedClients: convertedCount || 0,
            earnings: totalEarnings,
            avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          };
        })();
        
        try {
          return await Promise.race([statsPromise, statsTimeout]);
        } catch (err) {
          console.warn(`Stats fetch timeout for user ${user.id}, using defaults`);
          return {
            ...user,
            convertedClients: 0,
            earnings: 0,
            avatar: user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
          };
        }
      }));

      // Sort by convertedClients descending, then by earnings
      const sorted = withStats
        .sort((a, b) => b.convertedClients - a.convertedClients || b.earnings - a.earnings)
        .map((u, i) => ({
          ...u,
          rank: i + 1,
          badge: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null,
        }));

      setLeaderboard(sorted);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const top3 = leaderboard.slice(0, 3);
  const maxConversions = leaderboard[0]?.convertedClients || 1;

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

      {/* Podium — top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 items-end px-2">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((user, visualIdx) => {
            const realIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2;
            const m = medalColors[realIdx];
            const isFirst = realIdx === 0;
            return (
              <div
                key={user.id}
                className={`
                  card-shine relative rounded-2xl border bg-gradient-to-br ${m.bg} ${m.border}
                  ${isFirst
                    ? 'p-6 shadow-gold ring-2 ring-yellow-500/40 pt-12'
                    : 'p-5'
                  }
                  text-center transition-all duration-300
                `}
              >
                {isFirst && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-10">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 text-dark-900 text-xs font-bold px-3 py-1 rounded-full shadow-gold">
                      #1 Champion
                    </div>
                  </div>
                )}
               {isFirst && (
  <div className="flex justify-center mb-3">
    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 bg-clip-text text-transparent font-display font-extrabold text-lg tracking-widest uppercase drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
      <span className="text-yellow-400">👑</span>
      Champion
      <span className="text-yellow-400">👑</span>
    </span>
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
                <p className="font-display font-semibold text-white text-sm line-clamp-2">{user.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{user.convertedClients} conversions</p>
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
                    No data yet — start converting leads!
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
                              style={{ width: `${(user.convertedClients / maxConversions) * 100}%` }}
                            />
                          </div>
                          <span className="text-slate-300 text-sm w-6 text-right">{user.convertedClients}</span>
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
