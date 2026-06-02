// File: src/utils/leadService.js
// Purpose: Handle all lead database operations
// Functions for creating, reading, updating, and deleting leads

import { supabase } from '../supabaseClient';

/**
 * Add a new lead for the current user
 * 
 * @param {object} leadData - { client_name, phone, service, status, note }
 * @param {string} userId - Current logged-in user ID
 * @returns {object} { lead, error }
 */
export const addLead = async (leadData, userId) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([
        {
          user_id: userId,
          client_name: leadData.client_name,
          phone: leadData.phone,
          service: leadData.service,
          status: leadData.status || 'pending',
          note: leadData.note || '',
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      return { lead: null, error: error.message };
    }

    return { lead: data[0], error: null };
  } catch (err) {
    return { lead: null, error: err.message };
  }
};

/**
 * Get all leads for the current user
 * 
 * @param {string} userId - Current logged-in user ID
 * @returns {object} { leads, error }
 */
export const getUserLeads = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { leads: [], error: error.message };
    }

    return { leads: data || [], error: null };
  } catch (err) {
    return { leads: [], error: err.message };
  }
};

/**
 * Update a lead's status (pending, converted, rejected, etc.)
 * 
 * @param {string} leadId - ID of the lead to update
 * @param {string} newStatus - New status value
 * @returns {object} { success, error }
 */
export const updateLeadStatus = async (leadId, newStatus) => {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ status: newStatus })
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Delete a lead
 * 
 * @param {string} leadId - ID of the lead to delete
 * @returns {object} { success, error }
 */
export const deleteLead = async (leadId) => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

/**
 * Get lead count for a specific user
 * Useful for dashboard stats
 * 
 * @param {string} userId - User ID
 * @returns {object} { count, error }
 */
export const getUserLeadCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
};

/**
 * Get converted leads count for a user
 * Converted leads are used for leaderboard rankings
 * 
 * @param {string} userId - User ID
 * @returns {object} { count, error }
 */
export const getConvertedLeadsCount = async (userId) => {
  try {
    const { count, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'converted');

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: err.message };
  }
};
