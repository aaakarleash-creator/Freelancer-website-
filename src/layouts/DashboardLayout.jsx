import React from 'react';
import Sidebar from './Sidebar';

// ============================================================
// DashboardLayout — main shell wrapping sidebar + page content
// ============================================================

export default function DashboardLayout({ activePage, onNavigate, children }) {
  return (
    <div className="min-h-screen bg-dark-900 flex">
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Main content */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
