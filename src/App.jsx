import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

// ============================================================
// AppRouter — handles page state & role-based access
// ============================================================

function AppRouter() {
  const { isAuthenticated, isAdmin } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup'
  const [activePage, setActivePage] = useState('dashboard');

  // Show auth pages if not logged in
  if (!isAuthenticated) {
    if (authView === 'signup') {
      return <SignupPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // Role-based guard: redirect non-admins away from admin page
  const safePage = activePage === 'admin' && !isAdmin ? 'dashboard' : activePage;

  const renderPage = () => {
    switch (safePage) {
      case 'dashboard':   return <DashboardPage onNavigate={setActivePage} />;
      case 'leads':       return <LeadsPage />;
      case 'leaderboard': return <LeaderboardPage />;
      case 'earnings':    return <EarningsPage />;
      case 'profile':     return <ProfilePage />;
      case 'admin':       return <AdminPage />;
      default:            return <DashboardPage onNavigate={setActivePage} />;
    }
  };

  return (
    <DashboardLayout activePage={safePage} onNavigate={setActivePage}>
      {renderPage()}
    </DashboardLayout>
  );
}

// ============================================================
// App — wraps everything in AuthProvider
// ============================================================

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
