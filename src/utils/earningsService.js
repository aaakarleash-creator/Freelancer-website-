import { supabase } from './supabaseClient';

// SUPABASE SQL — run this before using earnings features:
// ALTER TABLE earnings ADD COLUMN IF NOT EXISTS lead_id uuid REFERENCES leads(id);

export const processLeadConversion = async (leadId, userId, dealAmount, conversionDetails = {}) => {
  try {
    // Update lead status to Converted AND save deal amount and conversion details
    const usdAmount = (dealAmount / 83).toFixed(2); // Convert to USD
    
    const updateData = { 
      status: 'Converted',
      deal_amount: dealAmount,
      deal_amount_usd: usdAmount
    };

    // Add optional conversion details if provided
    if (conversionDetails.client_email) updateData.client_email = conversionDetails.client_email;
    if (conversionDetails.company_email) updateData.company_email = conversionDetails.company_email;
    if (conversionDetails.company_reg_no) updateData.company_reg_no = conversionDetails.company_reg_no;
    if (conversionDetails.gst_no) updateData.gst_no = conversionDetails.gst_no;
    if (conversionDetails.company_name) updateData.company_name = conversionDetails.company_name;
    
    const { error: leadError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    if (leadError) throw leadError;

    // Create lead verification record (status: pending)
    const reportData = {
      dealAmount,
      usdAmount,
      timestamp: new Date().toISOString(),
      ...conversionDetails
    };

    console.log('Creating verification record for lead:', leadId, 'user:', userId);
    
    const { data: verificationData, error: verificationError } = await supabase
      .from('lead_verifications')
      .insert({
        lead_id:     leadId,
        user_id:     userId,
        status:      'pending',
        report_data: reportData,
        created_at:  new Date().toISOString(),
      })
      .select()
      .single();

    if (verificationError) {
      console.error('❌ Failed to create verification record:', verificationError);
      // Don't throw - allow lead conversion to proceed even if verification fails
      // But log it clearly for debugging
    } else {
      console.log('✅ Verification record created successfully:', verificationData);
    }

    // DO NOT CREATE EARNINGS YET — wait for admin verification
    return { success: true, message: 'Lead marked as converted. Awaiting admin verification for earnings.', error: null };
  } catch (err) {
    console.error('processLeadConversion error:', err);
    return { success: false, message: null, error: err.message };
  }
};

export const reflectEarningsAfterVerification = async (leadId, userId, dealAmount) => {
  try {
    // Count converted leads EXCLUDING the current one to determine correct rate
    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'Converted')
      .neq('id', leadId); // Exclude current lead from count

    // 10th conversion (count = 9 existing) gets 15% rate
    const rate = (count >= 9) ? 15 : 10;
    const commission = parseFloat((dealAmount * (rate / 100)).toFixed(2));

    console.log(`Commission calculation: ${count} existing conversions, rate: ${rate}%, commission: ${commission}`);

    // NOW create earnings after verification
    const { error: earningsError } = await supabase
      .from('earnings')
      .insert({
        user_id:       userId,
        lead_id:       leadId,
        amount:        dealAmount,
        commission:    commission,
        payout_status: 'pending',
        created_at:    new Date().toISOString(),
      });

    if (earningsError) throw earningsError;

    return { success: true, commission, rate, error: null };
  } catch (err) {
    return { success: false, commission: 0, rate: 10, error: err.message };
  }
};

// Fetch earnings with client names joined from leads table
export const getUserEarnings = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select(`
        id,
        amount,
        commission,
        payout_status,
        created_at,
        lead_id,
        leads (
          client_name,
          service
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
};

// Fetch ALL earnings for admin view (all users)
export const getAllEarnings = async () => {
  try {
    const { data, error } = await supabase
      .from('earnings')
      .select(`
        id,
        amount,
        commission,
        payout_status,
        created_at,
        lead_id,
        user_id,
        leads ( client_name, service ),
        users ( name, email )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    return { data: [], error: err.message };
  }
};

// Request payout — moves all pending earnings to 'requested'
export const requestPayout = async (userId) => {
  try {
    console.log('🔄 Requesting payout for user:', userId);

    // First, let's see what earnings exist for this user
    const { data: allEarnings, error: fetchError } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('Error fetching user earnings:', fetchError);
      throw fetchError;
    }

    console.log('📊 All earnings for user:', allEarnings);
    console.log('📊 Total earnings count:', allEarnings?.length || 0);

    if (!allEarnings || allEarnings.length === 0) {
      console.log('⚠️ No earnings found at all for this user');
      return { success: false, error: 'No earnings found' };
    }

    // Count pending earnings specifically
    const pendingEarnings = allEarnings.filter(e => e.payout_status === 'pending');
    console.log('📊 Pending earnings count:', pendingEarnings.length);

    if (pendingEarnings.length === 0) {
      console.warn('⚠️ No pending earnings found to update');
      return { success: false, error: 'No pending earnings found' };
    }

    // Now perform the update
    const { data, error } = await supabase
      .from('earnings')
      .update({ payout_status: 'requested' })
      .eq('user_id', userId)
      .eq('payout_status', 'pending')
      .select();

    console.log('📊 Update result:', { data, error, updatedCount: data?.length || 0 });

    if (error) {
      console.error('❌ Supabase error in requestPayout:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Update returned no data');
      return { success: false, error: 'Update failed' };
    }

    console.log('✅ Payout requested successfully, updated', data.length, 'rows');
    return { success: true, error: null, updatedRows: data.length };
  } catch (err) {
    console.error('❌ Error in requestPayout:', err);
    return { success: false, error: err.message };
  }
};

// Admin: mark earnings as paid and update user's last_payout_date
export const markEarningsPaid = async (userId) => {
  try {
    console.log('🔄 Marking earnings as paid for user:', userId);

    // First, check if there are any requested earnings
    const { data: requestedEarnings, error: fetchError } = await supabase
      .from('earnings')
      .select('*')
      .eq('user_id', userId)
      .eq('payout_status', 'requested');

    if (fetchError) {
      console.error('Error fetching requested earnings:', fetchError);
      throw fetchError;
    }

    console.log('📊 Requested earnings count:', requestedEarnings?.length || 0);

    if (!requestedEarnings || requestedEarnings.length === 0) {
      console.warn('⚠️ No requested earnings found to update');
      return { success: false, error: 'No requested earnings found' };
    }

    // Update earnings to paid status
    const { data, error: earningsError } = await supabase
      .from('earnings')
      .update({ payout_status: 'paid' })
      .eq('user_id', userId)
      .eq('payout_status', 'requested')
      .select();

    console.log('📊 Update result:', { data, error: earningsError, updatedCount: data?.length || 0 });

    if (earningsError) {
      console.error('❌ Error updating earnings status:', earningsError);
      throw earningsError;
    }

    if (!data || data.length === 0) {
      console.warn('⚠️ Update returned no data');
      return { success: false, error: 'Update failed' };
    }

    console.log('✅ Updated', data.length, 'earnings to paid status');

    // Then, try to update user's last_payout_date (if column exists)
    const now = new Date().toISOString();
    const { error: userError } = await supabase
      .from('users')
      .update({ last_payout_date: now })
      .eq('id', userId);

    if (userError) {
      console.warn('⚠️ Could not update last_payout_date (column may not exist):', userError);
      // Don't throw here - the main functionality (marking earnings as paid) worked
      // This is a nice-to-have feature, not critical
    } else {
      console.log('✅ Updated last_payout_date for user');
    }

    return { success: true, error: null, updatedRows: data.length };
  } catch (err) {
    console.error('❌ Error in markEarningsPaid:', err);
    return { success: false, error: err.message };
  }
};
