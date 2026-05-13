// File: src/utils/authService.js
// Purpose: Handle all authentication operations (signup, login, logout)
// This file contains reusable functions called from LoginPage and SignupPage

import { supabase } from '../supabaseClient';

/**
 * Signs up a new user
 * Creates auth user in Supabase and adds profile in users table
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {object} userData - Additional user data { name, role, designation }
 * @returns {object} { user, error }
 */
export const signupUser = async (email, password, userData) => {
  try {
    // Step 1: Create auth account in Supabase Auth
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      return { user: null, error: signupError.message };
    }

    const user = authData.user;

    // Step 2: Create user profile in users table
    // This stores additional info like name, role, designation
    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: user.id, // Link to auth user ID
          name: userData.name,
          email: email,
          role: userData.role || 'freelancer',
          designation: userData.designation || '',
          status: 'active',
        },
      ]);

    if (profileError) {
      return { user: null, error: `Profile creation failed: ${profileError.message}` };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Logs in an existing user
 * Returns user session if credentials are correct
 * 
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} { session, error }
 */
export const loginUser = async (email, password) => {
  try {
    // Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { session: null, error: error.message };
    }

    // Fetch user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      return { session: null, error: `Failed to load user profile: ${profileError.message}` };
    }

    // Check if user is suspended
    if (userProfile.status === 'suspended') {
      // Log them out immediately
      await supabase.auth.signOut();
      return { 
        session: null, 
        error: 'Your account has been suspended. Contact support for details.',
        isSuspended: true 
      };
    }

    return { session: data.session, user: userProfile, error: null };
  } catch (error) {
    return { session: null, error: error.message };
  }
};

/**
 * Logs out the current user
 * Clears session from Supabase
 * 
 * @returns {object} { success, error }
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Gets the current logged-in user
 * Returns user data from both auth and users table
 * 
 * @returns {object} { user, error }
 */
export const getCurrentUser = async () => {
  try {
    // Get auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return { user: null, error: sessionError?.message };
    }

    // Get user profile from users table
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return { user: null, error: profileError.message };
    }

    return { user: { ...session.user, ...userProfile }, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

/**
 * Listens to auth state changes
 * Useful for keeping user logged in across page refreshes
 * 
 * @param {function} callback - Function to call when auth state changes
 * @returns {function} Unsubscribe function to stop listening
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      // User is logged in, fetch their profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      callback({ user: { ...session.user, ...userProfile }, session });
    } else {
      // User is logged out
      callback({ user: null, session: null });
    }
  });
};
