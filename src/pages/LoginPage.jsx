import React, { useState } from 'react';
import { Mail, Lock, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import Button from '../components/Button';

// ============================================================
// LoginPage — auth entry point, swap login() for Supabase later
// ============================================================

export default function LoginPage({ onSwitchToSignup }) {
  const { login, authError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handle form submission - now async for Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Call the async login function from AuthContext
    const success = await login(email, password);
    
    setLoading(false);
    // AuthContext handles state updates and navigation
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-screen bg-gradient-to-b from-transparent via-amber-500/10 to-transparent" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-gold-lg mb-4">
            <Zap size={26} className="text-dark-900" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient mb-1">Expert Arena</h1>
          <p className="text-slate-500 text-sm">by Aakar Co.</p>
        </div>

        {/* Card */}
        <div className="bg-dark-700 border border-dark-400 rounded-2xl p-7 shadow-card">
          <h2 className="font-display text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-slate-500 text-sm mb-6">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white placeholder-slate-600 pl-9 pr-10 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ❌ {authError}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full justify-center mt-2"
              disabled={loading || authLoading}
            >
              {loading || authLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Don't have an account?{' '}
            <button onClick={onSwitchToSignup} className="text-amber-400 hover:text-amber-300 transition-colors">
              Create one
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
