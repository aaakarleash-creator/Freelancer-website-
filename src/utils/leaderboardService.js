// File: src/utils/leaderboardService.js
// Purpose: Handle leaderboard queries - fetch and rank users by performance
// Used to display top performers in the app

import { supabase } from '../supabaseClient';

/**
 * Get all users with their converted lead counts
 * Ranked by number of converted leads (descending)
 * 
 * @returns {object} { leaderboard, error }
 */
export const getLeaderboard = async () => {
  try {
    // Step 1: Fetch all users from users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, role, designation, status')
      .eq('status', 'active')
      .order('name', { ascending: true });

    if (usersError) {
      return { leaderboard: [], error: usersError.message };
    }

    // Step 2: For each user, count their converted leads
    const leaderboardData = await Promise.all(
      users.map(async (user) => {
        const { count, error } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'converted');

        const convertedCount = count || 0;

        return {
          ...user,
          convertedLeads: convertedCount,
        };
      })
    );

    // Step 3: Sort by converted leads (descending) and add rank
    const ranked = leaderboardData
      .sort((a, b) => b.convertedLeads - a.convertedLeads)
      .map((user, index) => ({
        ...user,
        rank: index + 1,
      }));

    return { leaderboard: ranked, error: null };
  } catch (err) {
    return { leaderboard: [], error: err.message };
  }
};

/**
 * Get user's rank and position on leaderboard
 * 
 * @param {string} userId - User ID to find rank for
 * @returns {object} { rank, totalUsers, convertedLeads, error }
 */
export const getUserRank = async (userId) => {
  try {
    // Get converted leads count for this user
    const { count, error: countError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'converted');

    if (countError) {
      return { rank: null, totalUsers: 0, convertedLeads: 0, error: countError.message };
    }

    const userConvertedLeads = count || 0;

    // Get all users to calculate rank
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, status')
      .eq('status', 'active');

    if (usersError) {
      return { rank: null, totalUsers: 0, convertedLeads: userConvertedLeads, error: usersError.message };
    }

    // Count how many users have more converted leads
    let betterRank = 1;
    for (const user of users) {
      const { count: c } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'converted');

      if ((c || 0) > userConvertedLeads) {
        betterRank++;
      }
    }

    return {
      rank: betterRank,
      totalUsers: users.length,
      convertedLeads: userConvertedLeads,
      error: null,
    };
  } catch (err) {
    return { rank: null, totalUsers: 0, convertedLeads: 0, error: err.message };
  }
};

/**
 * Get top N performers
 * 
 * @param {number} limit - Number of top performers to return (default: 10)
 * @returns {object} { topPerformers, error }
 */
export const getTopPerformers = async (limit = 10) => {
  try {
    const { leaderboard, error } = await getLeaderboard();

    if (error) {
      return { topPerformers: [], error };
    }

    return { topPerformers: leaderboard.slice(0, limit), error: null };
  } catch (err) {
    return { topPerformers: [], error: err.message };
  }
};
