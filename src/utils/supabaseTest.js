// File: src/utils/supabaseTest.js
// Purpose: Test that Supabase is connected and working
// This helps debug connection issues

import { supabase } from '../supabaseClient';

/**
 * Tests the connection to Supabase
 * Logs results in browser console
 * Returns true if successful, false if failed
 */
export const testSupabaseConnection = async () => {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    // Try to fetch from the users table (even if it's empty)
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error connecting to Supabase:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Data from users table:', data);
    return true;
  } catch (err) {
    console.error('❌ Connection failed:', err);
    return false;
  }
};

/**
 * Gets basic information about Supabase connection
 * Useful for debugging
 */
export const getSupabaseInfo = async () => {
  console.log('📋 Supabase Debug Info:');
  console.log('URL:', process.env.REACT_APP_SUPABASE_URL);
  console.log('Anon Key exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
};
