import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import LegalAcceptanceFlow from './pages/LegalAcceptanceFlow';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import EarningsPage from './pages/EarningsPage';
import ProfilePage from './pages/ProfilePage';
import ServicesPage from './pages/ServicesPage';
import AdminPage from './pages/AdminPage';
import TermsConditionsPage from './pages/TermsConditionsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';

function AppRouter() {
  const { isAuthenticated, isAdmin, requiresLegal, refetchUser, isLoading } = useAuth();
  const [authView, setAuthView]     = useState('login');
  const [activePage, setActivePage] = useState('dashboard');

  console.log('🎯 AppRouter render: isLoading=', isLoading, 'isAuth=', isAuthenticated, 'requiresLegal=', requiresLegal);

  // 1. While session is being checked — show spinner (only on initial load, not during navigation)
  if (isLoading && !isAuthenticated) {
    console.log('📡 Showing spinner...');
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#070709', gap: '16px',
      }}>
        <div style={{
          width: 48, height: 48,
          border: '3px solid #2a2a35',
          borderTop: '3px solid #f59e0b',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <p style={{ color: '#64748b', fontSize: 14, fontFamily: 'sans-serif' }}>
          Loading Expert Arena…
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // 2. Logged in but needs legal — show legal flow
  if (isAuthenticated && requiresLegal) {
    console.log('📋 Showing legal flow...');
    return <LegalAcceptanceFlow onComplete={refetchUser} />;
  }

  // 3. Not logged in — show auth pages
  if (!isAuthenticated) {
    console.log('🔓 Showing auth pages...');
    return authView === 'signup'
      ? <SignupPage  onSwitchToLogin={() => setAuthView('login')} />
      : <LoginPage   onSwitchToSignup={() => setAuthView('signup')} />;
  }

  // 4. Logged in + legal done — show dashboard
  const adminPages = ['admin', 'admin_freelancers', 'admin_payouts', 'admin_leads', 'admin_announcements', 'admin_audit'];
  const safePage = adminPages.includes(activePage) && !isAdmin ? 'dashboard' : activePage;
  console.log('🏠 Showing dashboard...');

  const renderPage = () => {
    switch (safePage) {
      case 'dashboard':            return <DashboardPage       onNavigate={setActivePage} />;
      case 'services':             return <ServicesPage        onNavigate={setActivePage} />;
      case 'leads':                return <LeadsPage           onNavigate={setActivePage} />;
      case 'leaderboard':          return <LeaderboardPage     onNavigate={setActivePage} />;
      case 'earnings':             return <EarningsPage        onNavigate={setActivePage} />;
      case 'profile':              return <ProfilePage         onNavigate={setActivePage} />;
      case 'terms':                return <TermsConditionsPage onNavigate={setActivePage} />;
      case 'privacy':              return <PrivacyPolicyPage   onNavigate={setActivePage} />;
      case 'admin':                return <AdminPage           initialTab="overview"       onNavigate={setActivePage} />;
      case 'admin_freelancers':    return <AdminPage           initialTab="freelancers"    onNavigate={setActivePage} />;
      case 'admin_payouts':        return <AdminPage           initialTab="payouts"        onNavigate={setActivePage} />;
      case 'admin_leads':          return <AdminPage           initialTab="leads"          onNavigate={setActivePage} />;
      case 'admin_announcements':  return <AdminPage           initialTab="announcements"  onNavigate={setActivePage} />;
      case 'admin_audit':          return <AdminPage           initialTab="audit"          onNavigate={setActivePage} />;
      default:                     return <DashboardPage       onNavigate={setActivePage} />;
    }
  };

  return (
    <DashboardLayout activePage={safePage} onNavigate={setActivePage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ToastProvider>
  );
}
