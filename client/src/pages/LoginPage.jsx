/**
 * LoginPage Component
 *
 * Premium glassmorphic login screen for CampusAI (#0B1120 bg, #111827 card).
 * Features input icons, gradient action button, and role-based redirect.
 *
 * @module pages/LoginPage
 */

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../store/uiStore';
import api from '../services/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in both email and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        setAuth({
          user: res.data.data.user,
          accessToken: res.data.data.accessToken,
        });
        toast.success(`Welcome back, ${res.data.data.user.name}!`);
        
        const role = res.data.data.user.role?.toUpperCase();
        if (role === 'SUPER_ADMIN') {
          navigate('/super-admin/dashboard', { replace: true });
        } else if (role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
        } else if (role === 'FACULTY') {
          navigate('/faculty/dashboard', { replace: true });
        } else {
          if (from.startsWith('/student/')) {
            navigate(from, { replace: true });
          } else {
            navigate('/student/dashboard', { replace: true });
          }
        }
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredential = (demoEmail, demoPassword = 'password123') => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 select-none relative overflow-hidden font-sans">
      {/* Ambient Background Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header Link back to Home */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
        <Link to="/" className="flex items-center space-x-2.5 group text-slate-400 hover:text-white transition-colors">
          <span className="text-base group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-xs font-semibold uppercase tracking-wider font-mono">Back to Platform</span>
        </Link>
      </div>

      <div className="max-w-md w-full z-10 animate-slide-up">
        {/* Main Glass Card */}
        <div className="rounded-2xl bg-[#111827]/90 backdrop-blur-2xl border border-white/[0.12] p-8 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
          {/* Subtle Top Gradient Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400" />

          {/* Card Header */}
          <div className="text-center space-y-3">
            <Link to="/" className="inline-flex items-center space-x-2.5 justify-center mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-heading font-black text-white text-lg shadow-lg shadow-indigo-600/30">
                ⚡
              </div>
              <span className="font-heading font-bold text-white text-xl tracking-tight">
                Spec<span className="gradient-text">Talk</span>
              </span>
            </Link>
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Sign in to access your engineering college portal and academic information hub.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block" htmlFor="email">
                Email Address
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 text-sm pointer-events-none">
                  📧
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@student.spectalk.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 pr-4 py-3 bg-[#0B1120]/80 border-white/[0.12] text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block" htmlFor="password">
                  Password
                </label>
                <span className="text-[11px] text-indigo-400 hover:text-cyan-300 cursor-pointer font-medium transition-colors">
                  Forgot password?
                </span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-slate-500 text-sm pointer-events-none">
                  🔒
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-4 py-3 bg-[#0B1120]/80 border-white/[0.12] text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <span>↗</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Switcher for Evaluation */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2.5">
            <div className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider text-center">
              ⚡ Quick-Test Demo Accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredential('yash.verma6715@student.spectalk.edu.in', 'Student@123')}
                className="px-2.5 py-1.5 rounded-lg bg-[#1E293B]/60 border border-white/[0.08] hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all font-mono truncate text-left flex items-center justify-between group"
              >
                <span>🎓 Student</span>
                <span className="opacity-0 group-hover:opacity-100 text-indigo-400">→</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredential('superadmin@spectalk.edu.in', 'password123')}
                className="px-2.5 py-1.5 rounded-lg bg-[#1E293B]/60 border border-white/[0.08] hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all font-mono truncate text-left flex items-center justify-between group"
              >
                <span>👑 Super Admin</span>
                <span className="opacity-0 group-hover:opacity-100 text-indigo-400">→</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredential('admin@cadce.edu.in', 'password123')}
                className="px-2.5 py-1.5 rounded-lg bg-[#1E293B]/60 border border-white/[0.08] hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all font-mono truncate text-left flex items-center justify-between group"
              >
                <span>🏢 Admin</span>
                <span className="opacity-0 group-hover:opacity-100 text-indigo-400">→</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredential('sharma.cs@cadce.edu.in', 'password123')}
                className="px-2.5 py-1.5 rounded-lg bg-[#1E293B]/60 border border-white/[0.08] hover:border-indigo-500/50 text-[11px] text-slate-300 hover:text-white transition-all font-mono truncate text-left flex items-center justify-between group"
              >
                <span>👨‍🏫 Faculty</span>
                <span className="opacity-0 group-hover:opacity-100 text-indigo-400">→</span>
              </button>
            </div>
          </div>

          {/* Footer link */}
          <div className="text-center text-xs text-slate-500 pt-2 font-sans">
            Need an official institutional account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-cyan-300 font-semibold transition-colors">
              Request access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
export { LoginPage };
