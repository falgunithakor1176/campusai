/**
 * LandingPage Component
 *
 * Premium Enterprise SaaS landing page for CampusAI.
 * Features Copilot/Linear-inspired dark aesthetic (#0B1120), interactive hero
 * chatbot preview, 8 gradient feature cards, and realistic system metrics.
 *
 * @module pages/LandingPage
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [demoOpen, setDemoOpen] = useState(false);

  const features = [
    {
      icon: '🛠️',
      title: 'Engineering Branches',
      description: 'Academic programs in Computer, Mechanical, Civil, Electrical, Electronics, and Applied Sciences.',
      gradient: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30 text-indigo-400',
    },
    {
      icon: '👨‍🎓',
      title: 'Student Strength',
      description: 'A thriving student community with active participation in academics, innovation, and campus activities.',
      gradient: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-400',
    },
    {
      icon: '🪑',
      title: 'Vacancy Seats',
      description: 'Approved intake and open vacancy seats are regularly updated for each discipline and academic year.',
      gradient: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-400',
    },
    {
      icon: '👩‍🏫',
      title: 'Faculty Support',
      description: 'Experienced faculty members guide students through technical learning, mentoring, and project-based excellence.',
      gradient: 'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-400',
    },
  ];

  const metrics = [
    { value: '6+', label: 'Engineering Branches', sub: 'Across core and emerging disciplines' },
    { value: '2400+', label: 'Students Enrolled', sub: 'Across diploma and degree programs' },
    { value: '120', label: 'Vacancy Seats', sub: 'Available in approved intake' },
    { value: '165+', label: 'Faculty Members', sub: 'Qualified academic and support staff' },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 h-[68px] bg-[#0B1120]/80 backdrop-blur-xl border-b border-white/[0.08] z-50 transition-all">
        <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center font-heading font-black text-white text-lg shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
              ⚡
            </div>
            <div>
              <span className="font-heading text-lg font-bold tracking-tight text-white flex items-center space-x-1.5">
                <span>CADCE</span>
                <span className="gradient-text">Engineering</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block -mt-1 uppercase tracking-widest">
                College Overview
              </span>
            </div>
          </Link>

          <nav className="flex items-center space-x-5">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-300 hidden md:inline font-medium">
                  Welcome, <strong className="text-white">{user?.name}</strong>
                </span>
                <Link to={user?.role === 'SUPER_ADMIN' ? '/super-admin/dashboard' : user?.role === 'ADMIN' ? '/admin/dashboard' : user?.role === 'FACULTY' ? '/faculty/dashboard' : '/student/dashboard'}>
                  <button className="btn-primary py-2 px-5 text-xs">
                    <span>Enter Portal</span>
                    <span>→</span>
                  </button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/login">
                  <button className="btn-primary py-2 px-5 text-xs shadow-md shadow-indigo-600/20">
                    Get Started
                  </button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <main className="flex-1 pt-[68px]">
        <section className="relative pt-20 pb-28 max-w-[1280px] mx-auto px-6 flex flex-col items-center text-center">
          {/* Ambient Radial Glows behind Hero */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />
          <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

          {/* Hero Pill Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-[#111827] border border-white/[0.08] shadow-inner mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase font-mono">
              Engineering College Information Hub
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold">
              Admissions • Branches • Faculty
            </span>
          </div>

          <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.12] text-white animate-fade-in">
            Engineering Education for <br className="hidden sm:inline" />
            <span className="gradient-text">Future-ready Careers</span>
          </h1>

          <p className="text-slate-400 text-base sm:text-xl max-w-3xl mt-6 leading-relaxed animate-fade-in [animation-delay:150ms]">
            Discover the engineering college’s academic branches, growing student community, vacancy seat details, and experienced faculty members in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md animate-fade-in [animation-delay:250ms]">
            <Link to="/login" className="w-full sm:w-auto">
              <button className="btn-primary w-full sm:w-auto py-3.5 px-8 text-sm">
                <span>Explore College Details</span>
                <span>🎓</span>
              </button>
            </Link>
            <button
              onClick={() => setDemoOpen(true)}
              className="btn-secondary w-full sm:w-auto py-3.5 px-7 text-sm flex items-center justify-center space-x-2"
            >
              <span>▶ View Programs</span>
            </button>
          </div>

          {/* ── Hero Illustration: Interactive AI Chatbot Preview Card ── */}
          <div className="mt-16 w-full max-w-5xl relative animate-slide-up [animation-delay:350ms]">
            {/* Decorative Floating Cards */}
            <div className="hidden lg:flex absolute -top-8 -left-10 z-20 glass p-4 rounded-2xl border border-white/[0.12] shadow-2xl items-center space-x-3 max-w-[240px] animate-pulse-slow">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 text-lg">
                ⚡
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">830ms Response</div>
                <div className="text-[10px] text-slate-400 font-mono">pgvector HNSW Lookup</div>
              </div>
            </div>

            <div className="hidden lg:flex absolute -bottom-6 -right-10 z-20 glass p-4 rounded-2xl border border-white/[0.12] shadow-2xl items-center space-x-3 max-w-[260px] animate-pulse-slow [animation-delay:1.5s]">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-lg">
                📚
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white">20 Handbooks Indexed</div>
                <div className="text-[10px] text-slate-400 font-mono">100% Grounded Citations</div>
              </div>
            </div>

            {/* Main Mockup Container */}
            <div className="rounded-2xl bg-[#111827] border border-white/[0.12] shadow-2xl overflow-hidden relative">
              {/* Mockup Title Bar */}
              <div className="h-12 px-6 bg-[#1E293B]/60 border-b border-white/[0.08] flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  <span className="ml-3 text-xs font-mono text-slate-400 hidden sm:inline">
                    Engineering College Overview Dashboard
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-semibold">
                    🟢 Branches
                  </span>
                  <span className="text-[10px] px-2.5 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                    🟢 Faculty
                  </span>
                </div>
              </div>

              {/* Mockup Chat Body */}
              <div className="p-6 sm:p-8 space-y-6 text-left bg-gradient-to-b from-[#111827] to-[#0B1120]">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="max-w-lg bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 shadow-md border border-indigo-500 text-sm font-medium">
                    Which engineering branches are available, and how many students are currently enrolled?
                  </div>
                </div>

                {/* Assistant Response */}
                <div className="flex justify-start items-start space-x-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md">
                    🤖
                  </div>
                  <div className="flex-1 max-w-2xl bg-[#1E293B]/80 border border-white/[0.08] rounded-2xl rounded-tl-sm p-5 space-y-3.5 shadow-lg">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-white/[0.06] pb-2">
                      <span className="text-indigo-400 font-bold tracking-wider uppercase">College Overview</span>
                      <span>📘 6 Branches · 👥 2400+ Students</span>
                    </div>

                    <div className="text-sm text-slate-200 leading-relaxed space-y-2">
                      <p>
                        CADCE Engineering offers <strong className="text-cyan-300">multiple branches</strong> including Computer, Mechanical, Civil, Electrical, Electronics, and Applied Sciences, with strong academic support across all programs.
                      </p>
                      <p className="font-semibold text-white">Highlights:</p>
                      <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1 text-xs sm:text-sm">
                        <li><strong className="text-slate-100">Student Community:</strong> A large and active student base with participation in academics and campus activities.</li>
                        <li><strong className="text-slate-100">Vacancy Seats:</strong> Approved intake and current vacancy seats are maintained for each discipline.</li>
                        <li><strong className="text-slate-100">Faculty:</strong> Experienced faculty members support teaching, mentoring, and practical learning.</li>
                      </ul>
                    </div>

                    {/* Interactive Citation Chip Preview */}
                    <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">📚 College Snapshot:</span>
                      <div className="px-3 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium flex items-center space-x-1.5">
                        <span>📄 Branches • Students • Faculty • Vacancies</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Realistic Statistics Section ────────────────────────────── */}
        <section className="py-16 border-y border-white/[0.08] bg-[#111827]/60 backdrop-blur-md">
          <div className="max-w-[1280px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {metrics.map((m, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-[#1E293B]/40 border border-white/[0.06] text-center space-y-2 hover:border-indigo-500/30 transition-colors">
                <div className="font-heading text-4xl sm:text-5xl font-extrabold gradient-text">
                  {m.value}
                </div>
                <div className="text-base font-bold text-white">{m.label}</div>
                <div className="text-xs text-slate-400 font-mono">{m.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature Section ─────────────────────────────────────────── */}
        <section className="py-28 max-w-[1280px] mx-auto px-6 space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
              College Highlights
            </span>
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              Engineering Programs and Campus Strength
            </h2>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              The institution is built around strong engineering education, student growth, planned admissions, and dedicated faculty support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div
                key={idx}
                className="card-hover p-6 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-white/[0.2] flex flex-col justify-between space-y-4 group relative overflow-hidden"
              >
                {/* Subtle top gradient bar */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl border ${feat.gradient} transition-transform group-hover:scale-110`}>
                    {feat.icon}
                  </div>
                  <h3 className="font-heading text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <div className="pt-2 flex items-center text-xs font-semibold text-slate-500 group-hover:text-cyan-400 transition-colors">
                  <span>Learn More</span>
                  <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Call to Action Banner ───────────────────────────────────── */}
        <section className="py-20 max-w-[1280px] mx-auto px-6">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-900/40 via-[#111827] to-cyan-900/30 border border-white/[0.12] p-10 sm:p-16 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <h2 className="font-heading text-3xl sm:text-5xl font-extrabold text-white">
              Explore the engineering college in detail
            </h2>
            <p className="text-slate-300 text-base max-w-2xl mx-auto">
              Learn about our branches, student community, vacancies, and faculty support to make informed academic decisions.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <button className="btn-primary py-4 px-10 text-base shadow-xl">
                  <span>View College Information</span>
                  <span>↗</span>
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Video Demo Modal ────────────────────────────────────────── */}
      {demoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#111827] border border-white/[0.15] rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="font-heading font-bold text-lg text-white flex items-center space-x-2">
                <span>▶ Engineering College Overview</span>
              </h3>
              <button
                onClick={() => setDemoOpen(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-[#0B1120] rounded-xl border border-white/[0.08] text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center text-2xl mx-auto animate-bounce">
                🚀
              </div>
              <h4 className="font-bold text-white text-base">College Details at a Glance</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Review the engineering college’s branches, student strength, vacancy seats, and faculty information through the portal.
              </p>
              <div className="pt-2">
                <Link to="/login" onClick={() => setDemoOpen(false)}>
                  <button className="btn-primary py-2.5 px-6 text-xs">
                    View College Info →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.08] bg-[#0B1120] py-12">
        <div className="max-w-[1280px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-heading font-black text-white text-xs">
              ⚡
            </div>
            <span className="font-heading font-bold text-slate-300 text-sm">SpecTalk</span>
            <span className="text-slate-600">|</span>
            <span>Engineering College Hub</span>
          </div>

          <p>
            © {new Date().getFullYear()} SpecTalk Engineering College. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
export { LandingPage };
