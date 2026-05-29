import React, { useState, useEffect } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import EarningsPage from './pages/EarningsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import LeadsPage from './pages/LeadsPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
// Temporary: Test Supabase connection on app start
import { testSupabaseConnection } from './utils/supabaseTest';

function AppContent() {
  const { isAuthenticated, currentUser } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authPage, setAuthPage] = useState('login'); // 'login' or 'signup'

  // Test Supabase connection on app startup
  useEffect(() => {
    console.log('🚀 App started. Testing Supabase...');
    testSupabaseConnection();
  }, []);

  // If not authenticated, show login/signup
  if (!isAuthenticated) {
    return authPage === 'login' ? (
      <LoginPage onSwitchToSignup={() => setAuthPage('signup')} />
    ) : (
      <SignupPage onSwitchToLogin={() => setAuthPage('login')} />
    );
  }

  // Render the appropriate page with role-based protection
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={setCurrentPage} />;
      case 'services':
        return <ServicesPage onNavigate={setCurrentPage} />;
      case 'admin':
        return (
          <ProtectedRoute requiredRole="admin">
            <AdminPage onNavigate={setCurrentPage} />
          </ProtectedRoute>
        );
      case 'earnings':
        return <EarningsPage onNavigate={setCurrentPage} />;
      case 'leaderboard':
        return <LeaderboardPage onNavigate={setCurrentPage} />;
      case 'leads':
        return <LeadsPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage onNavigate={setCurrentPage} />;
      default:
        return <DashboardPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <DashboardLayout activePage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
