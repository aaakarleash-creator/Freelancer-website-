import { supabase } from './supabaseClient';

export const createLeadVerification = async (leadId, userId, reportData) => {
  try {
    const { data, error } = await supabase
      .from('lead_verifications')
      .insert({
        lead_id:      leadId,
        user_id:      userId,
        status:       'pending',
        report_data:  reportData,
        created_at:   new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, verification: data, error: null };
  } catch (err) {
    return { success: false, verification: null, error: err.message };
  }
};

export const getLeadVerification = async (leadId) => {
  try {
    const { data, error } = await supabase
      .from('lead_verifications')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return { data: data || null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

export const verifyLeadByAdmin = async (verificationId, adminId, notes) => {
  try {
    const { error } = await supabase
      .from('lead_verifications')
      .update({
        status:                    'awaiting_admin_final',
        verification_date:         new Date().toISOString(),
        notes:                     notes,
      })
      .eq('id', verificationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const finalizeLeadVerification = async (verificationId, adminId) => {
  try {
    const { data: verification, error: fetchError } = await supabase
      .from('lead_verifications')
      .select('lead_id')
      .eq('id', verificationId)
      .single();

    if (fetchError) throw fetchError;

    // Update verification
    const { error: updateError } = await supabase
      .from('lead_verifications')
      .update({
        status:                     'verified',
        admin_final_verification_date: new Date().toISOString(),
        verified_by_admin_id:       adminId,
      })
      .eq('id', verificationId);

    if (updateError) throw updateError;

    // Update lead
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        is_verified_by_admin: true,
        verified_at:          new Date().toISOString(),
        verified_by_admin_id: adminId,
      })
      .eq('id', verification.lead_id);

    if (leadError) throw leadError;

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const rejectLeadVerification = async (verificationId) => {
  try {
    const { error } = await supabase
      .from('lead_verifications')
      .update({
        status: 'rejected',
      })
      .eq('id', verificationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};