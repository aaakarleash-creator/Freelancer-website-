import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { loginUser, signupUser, logoutUser } from '../utils/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser]         = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError]             = useState('');
  const [loading, setLoading]                 = useState(false);   // button spinner
  const [isLoading, setIsLoading]             = useState(true);    // page-level session restore
  const [requiresLegal, setRequiresLegal]     = useState(false);

  useEffect(() => {
    console.log('🔐 AuthContext: Starting session check...');
    
    // Safety timeout: if Supabase never responds in 5 seconds, show login page
    const timeout = setTimeout(() => {
      console.warn('⚠️ Session check timed out after 5s. Showing login page.');
      setIsLoading(false);
      setIsAuthenticated(false);
      setCurrentUser(null);
      setRequiresLegal(false);
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, 'Session exists:', !!session?.user);
        clearTimeout(timeout);

        if (session?.user) {
          try {
            console.log('⏳ Fetching profile for user:', session.user.id);
            const { data: profile, error: profileError } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (profileError) {
              console.warn('⚠️ Profile fetch error (likely race condition):', profileError.message);
              // Don't return early - fall through to the "profile not found" logic
              // This handles the race condition where profile isn't available yet after signup
            }

            if (profile) {
              console.log('✅ Profile loaded:', profile.id);
              console.log('📋 Profile data:', { requires_legal_acceptance: profile.requires_legal_acceptance, accepted_terms_at: profile.accepted_terms_at });
              if (profile.status === 'suspended') {
                console.warn('🚫 Account suspended');
                await supabase.auth.signOut();
                setCurrentUser(null);
                setIsAuthenticated(false);
                setRequiresLegal(false);
                setAuthError('Your account has been suspended. Contact support.');
              } else {
                const merged = { ...session.user, ...profile };
                setCurrentUser(merged);
                setIsAuthenticated(true);
                const needsLegal =
                  merged.requires_legal_acceptance === true ||
                  !merged.accepted_terms_at;
                console.log('🔐 Legal required:', needsLegal, '(requires_legal_acceptance:', merged.requires_legal_acceptance, ', accepted_terms_at:', merged.accepted_terms_at + ')');
                setRequiresLegal(needsLegal);
              }
            } else {
              // Profile not found yet (race condition on fresh signup)
              console.log('⚠️ Profile not found yet (fresh signup?), using auth user');
              setCurrentUser(session.user);
              setIsAuthenticated(true);
              setRequiresLegal(true);
            }
          } catch (err) {
            console.error('❌ Profile fetch error:', err);
            setIsLoading(false);
            setIsAuthenticated(false);
            setCurrentUser(null);
            setRequiresLegal(false);
            return;
          }
        } else {
          console.log('📝 No session — user is logged out');
          setCurrentUser(null);
          setIsAuthenticated(false);
          setRequiresLegal(false);
        }

        console.log('🔻 About to set isLoading to FALSE');
        setIsLoading(false);
        console.log('✨ Session check complete, spinner hidden');
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);


  const signup = async (name, email, password, role = 'freelancer', designation = '') => {
    setLoading(true);
    setAuthError('');

    if (!name || !email || !password) {
      setAuthError('Please fill in all fields');
      setLoading(false);
      return false;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setLoading(false);
      return false;
    }

    const { user, error } = await signupUser(email, password, { name, role, designation });

    if (error) {
      const msg = error.toLowerCase();
      if (msg.includes('429') || msg.includes('rate'))
        setAuthError('Too many requests. Please wait a few minutes.');
      else if (msg.includes('already registered') || msg.includes('already exists'))
        setAuthError('This email is already registered. Try signing in.');
      else if (msg.includes('invalid email'))
        setAuthError('Please enter a valid email address.');
      else
        setAuthError(error);
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  };

  const login = async (email, password) => {
    setLoading(true);
    setAuthError('');

    if (!email || !password) {
      setAuthError('Please enter email and password');
      setLoading(false);
      return false;
    }

    const { user, error, isSuspended } = await loginUser(email, password);

    if (isSuspended) {
      setAuthError('Your account has been suspended. Contact support.');
      setLoading(false);
      return false;
    }

    if (error) {
      const msg = error.toLowerCase();
      if (msg.includes('429') || msg.includes('rate'))
        setAuthError('Too many attempts. Please wait 15 minutes.');
      else if (msg.includes('invalid login') || msg.includes('invalid credentials'))
        setAuthError('Invalid email or password.');
      else
        setAuthError(error);
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  };

  const logout = async () => {
    setLoading(true);
    await logoutUser();
    setLoading(false);
  };

  const refetchUser = async () => {
    try {
      console.log('🔄 refetchUser: Fetching current session...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('⚠️ refetchUser: No session found');
        return;
      }

      console.log('🔄 refetchUser: Fetching profile for user:', session.user.id);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.warn('⚠️ Profile fetch error in refetchUser:', profileError.message);
        // Use session user as fallback
        setCurrentUser(session.user);
        setRequiresLegal(true);
        return;
      }

      if (profile) {
        console.log('✅ refetchUser: Profile fetched successfully');
        const merged = { ...session.user, ...profile };
        setCurrentUser(merged);
        const needsLegal =
          merged.requires_legal_acceptance === true ||
          !merged.accepted_terms_at;
        console.log('🔄 refetchUser: requiresLegal set to:', needsLegal);
        setRequiresLegal(needsLegal);

        // Force a small delay to ensure state updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log('🔄 refetchUser: State updates should be complete');
      }
    } catch (err) {
      console.error('❌ refetchUser error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin      = currentUser?.role === 'admin';
  const isManager    = currentUser?.role === 'manager' || isAdmin;
  const isFreelancer = currentUser?.role === 'freelancer';

  return (
    <AuthContext.Provider value={{
      currentUser, setCurrentUser,
      isAuthenticated, isLoading,
      authError, setAuthError,
      loading,
      requiresLegal, setRequiresLegal,
      login, signup, logout, refetchUser,
      isAdmin, isManager, isFreelancer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
