import React, { useState } from 'react';
import { Mail, Lock, User, Zap, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import Button from '../components/Button';

// ============================================================
// SignupPage — new user registration
// ============================================================

export default function SignupPage({ onSwitchToLogin }) {
  const { signup, authError, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Handle form submission - now async for Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate password length
    if (form.password.length < 6) {
      return;
    }

    setLoading(true);
    
    // Call the async signup function from AuthContext
    const success = await signup(form.name, form.email, form.password, 'freelancer', '');
    
    setLoading(false);
    // AuthContext handles state updates and navigation
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-400 shadow-gold-lg mb-4">
            <Zap size={26} className="text-dark-900" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient mb-1">Expert Arena</h1>
          <p className="text-slate-500 text-sm">Join the top performers</p>
        </div>

        <div className="bg-dark-700 border border-dark-400 rounded-2xl p-7 shadow-card">
          <h2 className="font-display text-xl font-semibold text-white mb-1">Create account</h2>
          <p className="text-slate-500 text-sm mb-6">Start your freelancer journey</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              icon={User}
              type="text"
              placeholder="Arghya Bose"
              value={form.name}
              onChange={update('name')}
              required
            />
            <Input
              label="Email"
              icon={Mail}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update('email')}
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
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={update('password')}
                  minLength={6}
                  required
                  className="w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white placeholder-slate-600 pl-9 pr-10 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {authError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                ❌ {authError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full justify-center mt-2" disabled={loading || authLoading}>
              {loading || authLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-5">
            Already have an account?{' '}
            <button onClick={onSwitchToLogin} className="text-amber-400 hover:text-amber-300 transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
