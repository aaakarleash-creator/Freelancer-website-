// File: src/utils/userManagementService.js
// Purpose: Admin functions for managing users
// Suspend, activate, and manage user accounts

import { supabase } from '../supabaseClient';

/**
 * Get all users (admin only)
 * 
 * NOTE: This function requires RLS policies to be configured correctly in Supabase.
 * Admin users should be able to query all users.
 * 
 * For this to work, you must:
 * 1. Go to Supabase Dashboard → Authentication → Policies (in users table)
 * 2. Remove any restrictive policies
 * 3. Add policy: "SELECT - Allow if user is admin"
 *    WITH (auth.jwt() ->> 'role' = 'admin' OR auth.jwt() ->> 'app_metadata'->>'role' = 'admin')
 * 
 * OR disable RLS on the users table if it's meant for admin-only access via UI.
 * 
 * @returns {object} { users, error }
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Check if it's a permissions error (likely RLS related)
      if (error.message.includes('permission') || error.message.includes('violate')) {
        return { 
          users: [], 
          error: `Permission denied: Admin access required. Check Supabase RLS policies. Error: ${error.message}` 
        };
      }
      return { users: [], error: error.message };
    }

    return { users: data || [], error: null };
  } catch (err) {
    return { users: [], error: err.message };
  }
};

/**
 * Suspend a user (set status to 'suspended')
 * Suspended users cannot login
 * 
 * @param {string} userId - User ID to suspend
 * @returns {object} { success, error }
 */
export const suspendUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'suspended' })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Activate a user (set status to 'active')
 * Reactivates a suspended user
 * 
 * @param {string} userId - User ID to activate
 * @returns {object} { success, error }
 */
export const activateUser = async (userId) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Get user statistics for dashboard
 * Total users, active users, suspended users
 * 
 * @returns {object} { stats, error }
 */
export const getUserStats = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('status', { count: 'exact' });

    if (error) {
      return { stats: {}, error: error.message };
    }

    const total = data.length;
    const active = data.filter(u => u.status === 'active').length;
    const suspended = data.filter(u => u.status === 'suspended').length;

    return {
      stats: {
        total,
        active,
        suspended,
        percentActive: total > 0 ? Math.round((active / total) * 100) : 0,
      },
      error: null,
    };
  } catch (err) {
    return { stats: {}, error: err.message };
  }
};

/**
 * Update user role (admin only)
 * Change a user's role: freelancer, manager, admin
 * 
 * @param {string} userId - User ID
 * @param {string} newRole - New role: 'freelancer', 'manager', 'admin'
 * @returns {object} { success, error }
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role: newRole })
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Delete a user (admin only)
 * Cascades to delete all their leads and earnings
 * 
 * @param {string} userId - User ID to delete
 * @returns {object} { success, error }
 */
export const deleteUser = async (userId) => {
  try {
    // First delete all leads for this user (cascade)
    await supabase.from('leads').delete().eq('user_id', userId);

    // Then delete all earnings for this user (cascade)
    await supabase.from('earnings').delete().eq('user_id', userId);

    // Finally delete the user
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Upload profile picture to Supabase storage
 * DEPRECATED: This function is no longer used
 * Profile pictures have been removed from the application
 */
export const uploadProfilePicture = async (userId, file) => {
  return { 
    imageUrl: null, 
    error: 'Profile picture uploads have been disabled' 
  };
};

/**
 * Update user profile (name, designation)
 * NOTE: Email is NOT updated here as it's managed by Supabase Auth
 * NOTE: Profile pictures have been removed - no profileImageUrl field
 * 
 * @param {string} userId - User ID
 * @param {object} profileData - Object with: name, designation
 * @returns {object} { success, error }
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    // Build update object - only include fields we want to update
    const updateData = {
      name: profileData.name,
      designation: profileData.designation,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      // Check if it's a column not found error
      if (error.message.includes("Could not find") || error.message.includes("column")) {
        return { 
          success: false, 
          error: 'Database error: ' + error.message
        };
      }
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
