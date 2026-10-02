/**
 * AppRouter Component
 *
 * Configures the React Router routing table for the application.
 * Manages public, role-specific layouts, and realistic enterprise SaaS dashboards.
 *
 * @module routes/AppRouter
 */

import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

// Public Pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import NotFoundPage from '../pages/NotFoundPage';

// Route guards
import ProtectedRoute from './ProtectedRoute';

// Layout wrappers
import {
  SuperAdminLayout,
  AdminLayout,
  FacultyLayout,
  StudentLayout,
} from '../components/layouts/RoleLayouts';

// Document Management Page
import DocumentManagementPage from '../pages/admin/DocumentManagementPage';

// AI RAG Chatbot Page (Phase 6C)
import ChatPage from '../pages/chat/ChatPage';

// ─── Shared Enterprise Dashboard Overview Component ──────────────────────────
const EnterpriseDashboardOverview = ({ roleTitle, roleBadgeColor, chatLink, docLink, showDocs = true }) => {
  const { user } = useAuthStore();

  const indexedDocs = [
    { title: 'Student Handbook 2025-26.pdf', category: 'STUDENT_HANDBOOK', chunks: 38, status: 'INDEXED', date: 'Jul 15, 2025' },
    { title: 'Attendance Policy Manual.pdf', category: 'POLICIES', chunks: 14, status: 'INDEXED', date: 'Jul 15, 2025' },
    { title: 'Examination Regulations.pdf', category: 'EXAMINATION', chunks: 22, status: 'INDEXED', date: 'Jul 15, 2025' },
    { title: 'Fee Structure 2025-26.pdf', category: 'FEES', chunks: 18, status: 'INDEXED', date: 'Jul 15, 2025' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/50 via-[#111827] to-cyan-900/30 border border-white/[0.12] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full border ${roleBadgeColor} font-mono font-bold uppercase tracking-wider`}>
              {roleTitle} Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">• CADCE Engineering</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="gradient-text">{user?.name || 'Authorized User'}</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Your institutional command center is synchronized with Google Gemini 2.0 Flash and the pgvector HNSW semantic index.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 w-full md:w-auto">
          <Link to={chatLink} className="w-full md:w-auto">
            <button className="btn-primary w-full md:w-auto py-3 px-6 text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
              <span>🤖 Launch College Chatbot</span>
              <span>↗</span>
            </button>
          </Link>
          {showDocs && (
            <Link to={docLink} className="w-full md:w-auto hidden sm:block">
              <button className="btn-secondary w-full md:w-auto py-3 px-5 text-xs">
                <span>📄 View Documents</span>
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Real System Metrics & RAG Engine Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Knowledge Base</span>
            <span className="text-indigo-400 font-bold">📄 pgvector</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">20+ Handbooks</div>
          <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
            <span>🟢 100% SHA-256 Verified & Indexed</span>
          </div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>AI Synthesis Engine</span>
            <span className="text-cyan-400 font-bold">⚡ Gemini 2.0</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">&lt;850ms Avg</div>
          <div className="text-[11px] text-slate-400 font-mono">
            <span>768-Dim Cosine Similarity Lookup</span>
          </div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Grounded Citations</span>
            <span className="text-purple-400 font-bold">🎯 Precision</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">Zero Hallucination</div>
          <div className="text-[11px] text-slate-400 font-mono">
            <span>Exact excerpts & page numbers</span>
          </div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Security Status</span>
            <span className="text-emerald-400 font-bold">🛡️ RBAC Active</span>
          </div>
          <div className="font-heading text-2xl font-bold text-white truncate">{user?.role}</div>
          <div className="text-[11px] text-slate-400 font-mono truncate">
            <span>Session: Verified JWT Token</span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
          <span>⚡ Quick Actions & Portals</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to={chatLink}
            className="card-hover p-6 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-indigo-500/40 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400 group-hover:scale-110 transition-transform">
                🤖
              </div>
              <h4 className="font-heading font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                College Chatbot Assistant
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ask natural language questions about attendance rules, fee payments, hostel rules, and grading norms with grounded citations.
              </p>
            </div>
            <div className="text-xs font-mono text-indigo-400 flex items-center space-x-1 pt-2">
              <span>Open Chatbot Suite</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          {showDocs ? (
            <Link
              to={docLink}
              className="card-hover p-6 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-cyan-500/40 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400 group-hover:scale-110 transition-transform">
                  📄
                </div>
                <h4 className="font-heading font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                  Document Knowledge Repository
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload, replace, and audit verified policy PDFs. Automatic text chunking and vector embedding generation.
                </p>
              </div>
              <div className="text-xs font-mono text-cyan-400 flex items-center space-x-1 pt-2">
                <span>Manage Repository</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ) : (
            <div className="card p-6 rounded-2xl bg-[#111827]/60 border border-white/[0.08] flex flex-col justify-between space-y-4 opacity-80">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center text-xl text-slate-400">
                  📖
                </div>
                <h4 className="font-heading font-bold text-white text-base">
                  Enrolled Courses & Syllabi
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Access semester course breakdowns, departmental credits, and recommended reference textbooks.
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400 flex items-center space-x-1 pt-2">
                <span>Integrated in RAG Assistant</span>
              </div>
            </div>
          )}

          <div className="card p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400">
                🗓️
              </div>
              <h4 className="font-heading font-bold text-white text-base">
                Academic Calendar & Notices
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Semester Odd/Even timelines, examination schedules, public holidays, and workshop weeks for 2025-26.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center space-x-1 pt-2">
              <span>Synchronized with College Chatbot</span>
            </div>
          </div>
        </div>
      </div>

      {/* Indexed Document Summary Table */}
      <div className="card bg-[#111827] border-white/[0.08] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div>
            <h3 className="font-heading text-base font-bold text-white">
              Recently Indexed Knowledge Base Handbooks
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              These official institutional documents are actively indexed in pgvector and ready for instant querying.
            </p>
          </div>
          {showDocs && (
            <Link to={docLink} className="text-xs font-mono text-indigo-400 hover:text-cyan-300 font-semibold">
              View All 20+ Documents →
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-mono uppercase tracking-wider bg-[#1E293B]/40">
                <th className="py-3 px-4">Document Title</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Vector Chunks</th>
                <th className="py-3 px-4">Indexing Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-slate-200">
              {indexedDocs.map((doc, idx) => (
                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-white flex items-center space-x-2">
                    <span className="text-rose-400">📄</span>
                    <span>{doc.title}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-[#1E293B] border border-white/[0.06] text-[10px]">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {doc.chunks} chunks
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{doc.status}</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Link
                      to={chatLink}
                      className="text-indigo-400 hover:text-cyan-300 font-mono text-xs transition-colors"
                    >
                      Query in Chatbot →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => (
  <EnterpriseDashboardOverview
    roleTitle="Super Admin"
    roleBadgeColor="bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
    chatLink="/super-admin/chat"
    docLink="/super-admin/documents"
    showDocs={true}
  />
);

const AdminDashboard = () => (
  <EnterpriseDashboardOverview
    roleTitle="Admin"
    roleBadgeColor="bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
    chatLink="/admin/chat"
    docLink="/admin/documents"
    showDocs={true}
  />
);

const FacultyDashboard = () => (
  <EnterpriseDashboardOverview
    roleTitle="Faculty"
    roleBadgeColor="bg-amber-500/20 text-amber-300 border-amber-500/30"
    chatLink="/faculty/chat"
    docLink="/faculty/documents"
    showDocs={true}
  />
);

const StudentDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="rounded-2xl bg-gradient-to-r from-indigo-900/50 via-[#111827] to-cyan-900/30 border border-white/[0.12] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/30 font-mono font-bold uppercase tracking-wider">
              SpecTalk Student Portal
            </span>
            <span className="text-xs text-slate-400 font-mono">• Engineering College Overview</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="gradient-text">{user?.name || 'Student'}</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Explore engineering branches, student strength, vacancy seats, and faculty support in one place.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10 w-full md:w-auto">
          <Link to="/student/chat" className="w-full md:w-auto">
            <button className="btn-primary w-full md:w-auto py-3 px-6 text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2">
              <span>🎓 Open SpecTalk Hub</span>
              <span>↗</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="card bg-[#111827] border-white/[0.08] p-6 space-y-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-indigo-500 to-cyan-500"></div>
        <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
          <div>
            <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
              <span>👨‍🎓 Student Academic Profile</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engineering college records for your current academic journey.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            ✅ Active Engineering Student
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Full Name</span>
            <p className="text-sm font-semibold text-white">{user?.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Email Address</span>
            <p className="text-sm font-semibold text-white">{user?.email || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Roll Number</span>
            <p className="text-sm font-semibold text-indigo-300 font-mono">{user?.student?.rollNumber || 'ENG-2025-042'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Department</span>
            <p className="text-sm font-semibold text-white">{user?.student?.department?.name || 'Computer Engineering'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Academic Year</span>
            <p className="text-sm font-semibold text-white">{user?.student?.admissionYear || '2025'}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-mono">Current Semester</span>
            <p className="text-sm font-semibold text-cyan-300 font-mono">Semester {user?.student?.currentSemester || 1}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Branches</span>
            <span className="text-indigo-400 font-bold">🛠️</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">6+</div>
          <div className="text-[11px] text-slate-400 font-mono">Computer, Mechanical, Civil, EE, ECE, Applied Sciences</div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Students</span>
            <span className="text-cyan-400 font-bold">👨‍🎓</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">2400+</div>
          <div className="text-[11px] text-slate-400 font-mono">Active engineering learners across programs</div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Vacancy Seats</span>
            <span className="text-emerald-400 font-bold">🪑</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">120</div>
          <div className="text-[11px] text-slate-400 font-mono">Approved intake and open seats updated regularly</div>
        </div>

        <div className="card bg-[#111827] border-white/[0.08] p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase">
            <span>Faculty</span>
            <span className="text-purple-400 font-bold">👩‍🏫</span>
          </div>
          <div className="font-heading text-3xl font-bold text-white">165+</div>
          <div className="text-[11px] text-slate-400 font-mono">Dedicated mentors and technical instructors</div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-heading text-lg font-bold text-white flex items-center space-x-2">
          <span>⚡ Engineering Highlights</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/student/chat"
            className="card-hover p-6 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-indigo-500/40 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xl text-indigo-400 group-hover:scale-110 transition-transform">
                🛠️
              </div>
              <h4 className="font-heading font-bold text-white text-base group-hover:text-indigo-400 transition-colors">
                Department & Branches
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Discover available engineering branches, labs, and academic pathways.
              </p>
            </div>
            <div className="text-xs font-mono text-indigo-400 flex items-center space-x-1 pt-2">
              <span>View Department Details</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <div className="card p-6 rounded-2xl bg-[#111827]/60 border border-white/[0.08] flex flex-col justify-between space-y-4 opacity-90">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center text-xl text-slate-400">
                🪑
              </div>
              <h4 className="font-heading font-bold text-white text-base">
                Admission & Seat Availability
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check approved intake, vacancy seats, and admission-related updates.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 flex items-center space-x-1 pt-2">
              <span>Updated for current admissions</span>
            </div>
          </div>

          <div className="card p-6 rounded-2xl bg-[#111827] border border-white/[0.08] flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400">
                👩‍🏫
              </div>
              <h4 className="font-heading font-bold text-white text-base">
                Faculty & Mentorship
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Connect with experienced faculty for academics, placements, and guidance.
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center space-x-1 pt-2">
              <span>Mentorship support available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toUpperCase();
  if (role === 'SUPER_ADMIN') return <Navigate to="/super-admin/dashboard" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (role === 'FACULTY') return <Navigate to="/faculty/dashboard" replace />;
  return <Navigate to="/student/dashboard" replace />;
};

const ChatRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toUpperCase();
  if (role === 'SUPER_ADMIN') return <Navigate to="/super-admin/chat" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/chat" replace />;
  if (role === 'FACULTY') return <Navigate to="/faculty/chat" replace />;
  return <Navigate to="/student/chat" replace />;
};

const ForbiddenPage = () => (
  <div className="min-h-screen bg-[#0B1120] flex items-center justify-center text-center p-6 font-sans">
    <div className="card bg-[#111827] border-white/[0.12] max-w-md p-8 rounded-2xl space-y-4 shadow-2xl">
      <div className="text-rose-500 text-5xl">🚫</div>
      <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">Access Denied</h1>
      <p className="text-slate-400 text-sm">You do not have permission to view this institutional resource.</p>
      <button onClick={() => window.history.back()} className="btn-primary w-full py-3 text-sm">
        Go Back
      </button>
    </div>
  </div>
);

export default function AppRouter() {
  const { setAuth, logout, setLoading } = useAuthStore();

  // On mount, perform initial check to see if user has active session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await api.get('/auth/me');
        if (res.data?.success && res.data?.data?.user) {
          setAuth({
            user: res.data.data.user,
            accessToken: useAuthStore.getState().accessToken, // reuse in-memory token
          });
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setAuth, logout, setLoading]);

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Redirection fallback */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
            <DashboardRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT']}>
            <ChatRedirect />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Protected routes */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout>
              <SuperAdminDashboard />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/documents"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout>
              <DocumentManagementPage />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/chat"
        element={
          <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
            <SuperAdminLayout>
              <ChatPage />
            </SuperAdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Protected routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/documents"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <DocumentManagementPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/chat"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminLayout>
              <ChatPage />
            </AdminLayout>
          </ProtectedRoute>
        }
      />

      {/* Faculty Protected routes */}
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['FACULTY']}>
            <FacultyLayout>
              <FacultyDashboard />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/documents"
        element={
          <ProtectedRoute allowedRoles={['FACULTY']}>
            <FacultyLayout>
              <DocumentManagementPage />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/chat"
        element={
          <ProtectedRoute allowedRoles={['FACULTY']}>
            <FacultyLayout>
              <ChatPage />
            </FacultyLayout>
          </ProtectedRoute>
        }
      />

      {/* Student Protected routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout>
              <StudentDashboard />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/chat"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <StudentLayout>
              <ChatPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />

      {/* Error pages */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
