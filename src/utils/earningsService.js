// File: src/utils/earningsService.js
// Purpose: Handle all earnings and commission operations
// Track payouts, commissions, and financial data

import { supabase } from '../supabaseClient';

/**
 * Get all earnings for a user
 * 
 * @param {string} userId - User ID
 * @returns {object} { earnings, error }
 */
export const getUserEarnings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { earnings: [], error: error.message };
    }

    return { earnings: data || [], error: null };
  } catch (err) {
    return { earnings: [], error: err.message };
  }
};

/**
 * Calculate total earnings for a user (sum of commissions)
 * 
 * @param {string} userId - User ID
 * @returns {object} { total, error }
 */
export const calculateTotalEarnings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('commission')
      .eq('user_id', userId);

    if (error) {
      return { total: 0, error: error.message };
    }

    const total = data.reduce((sum, row) => sum + (parseFloat(row.commission) || 0), 0);
    return { total, error: null };
  } catch (err) {
    return { total: 0, error: err.message };
  }
};

/**
 * Calculate total commission earned
 * Sums all commissions in earnings table
 * Commission = 10% or 15% of amount
 * 
 * @param {string} userId - User ID
 * @returns {object} { totalCommission, error }
 */
export const calculateTotalCommission = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('commission')
      .eq('user_id', userId);

    if (error) {
      return { totalCommission: 0, error: error.message };
    }

    const totalCommission = data.reduce((sum, row) => sum + (parseFloat(row.commission) || 0), 0);
    return { totalCommission, error: null };
  } catch (err) {
    return { totalCommission: 0, error: err.message };
  }
};

/**
 * Get pending payouts (not yet paid)
 * 
 * @param {string} userId - User ID
 * @returns {object} { pendingAmount, count, error }
 */
export const getPendingPayouts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('commission')
      .eq('user_id', userId)
      .eq('payout_status', 'pending');

    if (error) {
      return { pendingAmount: 0, count: 0, error: error.message };
    }

    const pendingAmount = data.reduce((sum, row) => sum + (parseFloat(row.commission) || 0), 0);
    return { pendingAmount, count: data.length, error: null };
  } catch (err) {
    return { pendingAmount: 0, count: 0, error: err.message };
  }
};

/**
 * Get paid payouts (already paid)
 * 
 * @param {string} userId - User ID
 * @returns {object} { paidAmount, count, error }
 */
export const getPaidPayouts = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select('commission')
      .eq('user_id', userId)
      .eq('payout_status', 'paid');

    if (error) {
      return { paidAmount: 0, count: 0, error: error.message };
    }

    const paidAmount = data.reduce((sum, row) => sum + (parseFloat(row.commission) || 0), 0);
    return { paidAmount, count: data.length, error: null };
  } catch (err) {
    return { paidAmount: 0, count: 0, error: err.message };
  }
};

/**
 * Add new earnings entry (admin function)
 * Called when a lead is converted
 * 
 * @param {object} earningsData - { user_id, amount, commission, payout_status }
 * @returns {object} { earning, error }
 */
export const addEarnings = async (earningsData) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .insert([
        {
          user_id: earningsData.user_id,
          amount: earningsData.amount || 0,
          commission: earningsData.commission || 0,
          payout_status: earningsData.payout_status || 'pending',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return { earning: null, error: error.message };
    }

    return { earning: data[0], error: null };
  } catch (err) {
    return { earning: null, error: err.message };
  }
};

/**
 * Update payout status (admin function)
 * Mark earnings as paid or rejected
 * 
 * @param {string} earningId - Earning ID to update
 * @param {string} newStatus - 'pending', 'paid', or 'rejected'
 * @returns {object} { success, error }
 */
export const updatePayoutStatus = async (earningId, newStatus) => {
  try {
    const { error } = await supabase
      .from('earnings')
      .update({ payout_status: newStatus })
      .eq('id', earningId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Calculate commission based on converted leads
 * 10% base commission, 15% for top performers (10+ conversions)
 * 
 * @param {number} amount - Base amount
 * @param {number} convertedLeads - User's total converted leads
 * @returns {number} Commission amount
 */
export const calculateCommissionRate = (amount, convertedLeads = 0) => {
  const rate = convertedLeads >= 10 ? 0.15 : 0.10;
  return amount * rate;
};

/**
 * Process lead conversion: update lead status, calculate commission, insert earnings
 * 
 * @param {string} leadId - ID of the lead being converted
 * @param {string} userId - Current user ID
 * @param {number} dealAmount - Deal value in rupees
 * @returns {object} { success, commission, rate, error }
 */
export const processLeadConversion = async (leadId, userId, dealAmount) => {
  try {
    // 1. Update lead status to "Converted"
    const { error: updateError } = await supabase
      .from('leads')
      .update({ status: 'Converted' })
      .eq('id', leadId);

    if (updateError) {
      return { success: false, commission: 0, rate: 0, error: updateError.message };
    }

    // 2. Fetch user's total converted leads count
    const { count, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'Converted');

    if (countError) {
      return { success: false, commission: 0, rate: 0, error: countError.message };
    }

    // 3. Determine commission rate based on converted leads count
    const rate = count >= 10 ? 15 : 10;
    const commission = dealAmount * (rate / 100);

    // 4. Insert earnings record
    const { error: insertError } = await supabase
      .from('earnings')
      .insert([
        {
          user_id: userId,
          amount: dealAmount,
          commission: commission,
          payout_status: 'pending',
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      return { success: false, commission: 0, rate: 0, error: insertError.message };
    }

    return { success: true, commission, rate, error: null };
  } catch (err) {
    return { success: false, commission: 0, rate: 0, error: err.message };
  }
};

/**
 * Request payout: update all pending earnings to 'requested' status
 * Minimum payout amount is ₹500
 * 
 * @param {string} userId - User ID
 * @returns {object} { success, error }
 */
export const requestPayout = async (userId) => {
  try {
    // Get pending amount first to check if >= 500
    const { pendingAmount, error: getError } = await getPendingPayouts(userId);
    
    if (getError) {
      return { success: false, error: getError };
    }

    if (pendingAmount < 500) {
      return { success: false, error: 'Minimum payout amount is ₹500' };
    }

    // Update all pending earnings to 'requested'
    const { error: updateError } = await supabase
      .from('earnings')
      .update({ payout_status: 'requested' })
      .eq('user_id', userId)
      .eq('payout_status', 'pending');

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
