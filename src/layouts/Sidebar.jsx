import React, { useState } from 'react';
import {
  LayoutDashboard, Users, Trophy, DollarSign,
  UserCircle, ShieldCheck, LogOut, Menu, X, Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

// ============================================================
// Sidebar — main navigation with role-based menu items
// ============================================================

const navItems = [
  { id: 'dashboard',    label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'leads',        label: 'Leads',        icon: Users },
  { id: 'leaderboard',  label: 'Leaderboard',  icon: Trophy },
  { id: 'earnings',     label: 'Earnings',     icon: DollarSign },
  { id: 'profile',      label: 'Profile',      icon: UserCircle },
];

const adminItem = { id: 'admin', label: 'Admin Panel', icon: ShieldCheck };

export default function Sidebar({ activePage, onNavigate }) {
  const { currentUser, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const items = isAdmin ? [...navItems, adminItem] : navItems;

  // Handle logout - now async
  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
  };

  const NavLink = ({ item }) => {
    const isActive = activePage === item.id;
    const Icon = item.icon;
    return (
      <button
        onClick={() => { onNavigate(item.id); setMobileOpen(false); }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
          transition-all duration-200 group relative
          ${isActive
            ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-400 border border-amber-500/20'
            : 'text-slate-400 hover:text-slate-200 hover:bg-dark-600'
          }
        `}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-amber-400 rounded-r-full" />
        )}
        <Icon size={17} className={isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'} />
        <span>{item.label}</span>
        {item.id === 'admin' && (
          <span className="ml-auto text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/20">
            Admin
          </span>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-dark-500">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-400 flex items-center justify-center shadow-gold">
            <Zap size={16} className="text-dark-900" fill="currentColor" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-amber-400 leading-tight tracking-wide">
              Expert Arena
            </p>
            <p className="text-xs text-slate-600">by Aakar Co.</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map(item => <NavLink key={item.id} item={item} />)}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 border-t border-dark-500 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-600/50 mb-2">
          <Avatar initials={currentUser?.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{currentUser?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{currentUser?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-50"
        >
          <LogOut size={15} />
          {loggingOut ? 'Signing out…' : 'Sign Out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-dark-700 border border-dark-400 text-slate-300"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 bg-dark-800 border-r border-dark-500 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <aside className={`
        lg:hidden fixed left-0 top-0 h-screen w-64 bg-dark-800 border-r border-dark-500
        z-40 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>
    </>
  );
}
