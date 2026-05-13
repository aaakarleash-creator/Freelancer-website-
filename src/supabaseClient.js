// File: src/supabaseClient.js
// Purpose: Initialize and export the Supabase client
// This file connects your React app to Supabase

import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Replace these with your actual values from Supabase dashboard
// How to get these values:
// 1. Go to https://app.supabase.com/
// 2. Select your project
// 3. Click "Settings" (bottom left)
// 4. Click "API" tab
// 5. You'll see:
//    - Project URL (copy this as SUPABASE_URL)
//    - anon public (copy this as SUPABASE_ANON_KEY)

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate that environment variables are set
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase environment variables. ' +
    'Please create a .env file in the root of your project with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  );
}

// Create and export the Supabase client
// This client is used to connect to your Supabase backend
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
