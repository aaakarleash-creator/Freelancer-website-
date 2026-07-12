// Temporary debugging script to check verification data
// Run this in browser console when logged in as admin

import { supabase } from './src/utils/supabaseClient';

async function debugVerifications() {
  console.log('=== DEBUGGING VERIFICATION SYSTEM ===');
  
  // 1. Check if lead_verifications table exists
  try {
    const { data: tables, error: tableError } = await supabase
      .from('lead_verifications')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ lead_verifications table does not exist or has permission issues:', tableError);
    } else {
      console.log('✅ lead_verifications table exists and is accessible');
    }
  } catch (e) {
    console.error('❌ Error accessing lead_verifications table:', e);
  }
  
  // 2. Check all converted leads
  const { data: convertedLeads, error: leadsError } = await supabase
    .from('leads')
    .select('*, users(name, email)')
    .eq('status', 'Converted');
  
  if (leadsError) {
    console.error('❌ Error fetching converted leads:', leadsError);
  } else {
    console.log('📊 Converted leads found:', convertedLeads?.length || 0);
    console.log('Converted leads data:', convertedLeads);
  }
  
  // 3. Check all verifications
  const { data: allVerifications, error: verError } = await supabase
    .from('lead_verifications')
    .select('*');
  
  if (verError) {
    console.error('❌ Error fetching verifications:', verError);
  } else {
    console.log('📊 Verifications found:', allVerifications?.length || 0);
    console.log('All verifications data:', allVerifications);
  }
  
  // 4. Check pending verifications specifically
  const { data: pendingVerifications, error: pendingError } = await supabase
    .from('lead_verifications')
    .select('*')
    .eq('status', 'pending');
  
  if (pendingError) {
    console.error('❌ Error fetching pending verifications:', pendingError);
  } else {
    console.log('📊 Pending verifications found:', pendingVerifications?.length || 0);
    console.log('Pending verifications data:', pendingVerifications);
  }
  
  console.log('=== END DEBUG ===');
}

// Run the debug function
debugVerifications();