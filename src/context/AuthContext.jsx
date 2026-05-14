import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  signupUser,
  logoutUser,
  onAuthStateChange,
} from '../utils/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Clear any stored session data to require manual login
    const storageClear = () => {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('supabase') || key.includes('auth')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    };
    
    storageClear();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const signup = async (
    name,
    email,
    password,
    role = 'freelancer',
    designation = ''
  ) => {
    setLoading(true);
    setAuthError('');

    // Validate input
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

    const { user, error } = await signupUser(
      email,
      password,
      {
        name,
        role,
        designation,
      }
    );

    if (error) {
      // Better error messages for common issues
      if (error.includes('429')) {
        setAuthError('Too many requests. Please wait 15 minutes before trying again.');
      } else if (error.includes('already registered')) {
        setAuthError('This email is already registered. Try login instead.');
      } else if (error.includes('invalid email')) {
        setAuthError('Please enter a valid email address.');
      } else {
        setAuthError(error);
      }
      setLoading(false);
      return false;
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoading(false);

    return true;
  };

  const login = async (email, password) => {
    setLoading(true);
    setAuthError('');

    // Validate input
    if (!email || !password) {
      setAuthError('Please enter email and password');
      setLoading(false);
      return false;
    }

    const { user, error, isSuspended } =
      await loginUser(email, password);

    if (error) {
      if (error.includes('429')) {
        setAuthError('Too many login attempts. Please wait 15 minutes.');
      } else if (error.includes('Invalid login credentials')) {
        setAuthError('Invalid email or password');
      } else {
        setAuthError(error);
      }
      setLoading(false);
      return false;
    }

    if (isSuspended) {
      setAuthError(
        'Your account has been suspended. Contact support for details.'
      );
      setLoading(false);
      return false;
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    setLoading(false);

    return true;
  };

  const logout = async () => {
    setLoading(true);

    const { error } = await logoutUser();

    if (error) {
      setAuthError(error);
    }

    setCurrentUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  };

  const isAdmin =
    currentUser?.role === 'admin';

  const isManager =
    currentUser?.role === 'manager' || isAdmin;

  const isFreelancer =
    currentUser?.role === 'freelancer';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAuthenticated,
        authError,
        loading,
        login,
        signup,
        logout,
        isAdmin,
        isManager,
        isFreelancer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
};