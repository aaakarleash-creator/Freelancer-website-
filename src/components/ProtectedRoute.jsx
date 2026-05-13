// File: src/components/ProtectedRoute.jsx
// Purpose: Prevent unauthorized access to pages based on user role
// Freelancers cannot access Admin pages, for example

import React from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component
 * 
 * Props:
 * - requiredRole: 'admin', 'manager', or 'freelancer'
 * - children: Component to render if authorized
 * - fallback: Component to show if not authorized (optional)
 * 
 * Example usage:
 * <ProtectedRoute requiredRole="admin">
 *   <AdminPage />
 * </ProtectedRoute>
 */
export default function ProtectedRoute({ requiredRole, children, fallback }) {
  const { currentUser, isAdmin, isManager, isFreelancer, loading } = useAuth();

  // Show nothing while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authorization based on required role
  const isAuthorized = 
    (requiredRole === 'admin' && isAdmin) ||
    (requiredRole === 'manager' && isManager) ||
    (requiredRole === 'freelancer' && isFreelancer) ||
    !requiredRole; // If no role specified, allow all authenticated users

  // If authorized, render the component
  if (isAuthorized) {
    return children;
  }

  // If fallback provided, show it
  if (fallback) {
    return fallback;
  }

  // Default: show access denied message
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 mb-4">
          <span className="text-3xl">🔒</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 mb-6">
          You don't have permission to access this page. Only {requiredRole}s can view this content.
        </p>
        <a 
          href="/" 
          className="inline-block px-6 py-2 bg-amber-500 hover:bg-amber-600 text-dark-900 font-medium rounded-lg transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
