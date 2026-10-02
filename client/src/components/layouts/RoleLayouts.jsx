import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const BaseRoleLayout = ({ children, roleName, navItems, colorTheme }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const themeClasses = {
    superAdmin: {
      text: 'text-indigo-400',
      badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold',
    },
    admin: {
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      activeBg: 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-semibold',
    },
    faculty: {
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeBg: 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 font-semibold',
    },
    student: {
      text: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      activeBg: 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold',
    },
  }[colorTheme] || {
    text: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    activeBg: 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold',
  };

  return (
    <div className="min-h-screen flex bg-[#0B1120] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* ── Left Sidebar (#111827 surface) ───────────────────────────── */}
      <aside className="w-[270px] bg-[#111827] border-r border-white/[0.08] flex flex-col justify-between shadow-2xl z-30 transition-all flex-shrink-0">
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Header */}
          <div className="h-[68px] px-6 border-b border-white/[0.08] flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center font-heading font-black text-white text-sm shadow-md group-hover:scale-105 transition-transform">
                ⚡
              </div>
              <span className="font-heading font-bold text-white tracking-tight text-base">
                Campus<span className="gradient-text">AI</span>
              </span>
            </Link>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1E293B] text-slate-400 border border-white/[0.06]">
              v2.0
            </span>
          </div>

          {/* User Profile Summary Card */}
          <div className="p-4 border-b border-white/[0.08] bg-[#1E293B]/40">
            <div className="p-3 rounded-xl bg-[#111827] border border-white/[0.08] flex items-center space-x-3 shadow-inner">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 border border-indigo-400/30 flex items-center justify-center font-bold text-sm text-white flex-shrink-0 shadow-sm">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Authorized User'}</p>
                <div className="flex items-center mt-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded-full border ${themeClasses.badge} font-semibold font-mono tracking-wider uppercase`}>
                    {roleName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
            <div className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest px-3 mb-2">
              Navigation Portal
            </div>
            {navItems.map((item, idx) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && item.path !== '#');
              return (
                <Link
                  key={idx}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                    isActive
                      ? themeClasses.activeBg
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with Sign Out */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0B1120]/40">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition-all duration-200 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">🚪</span>
            <span>Sign Out of Portal</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area (#0B1120 background) ───────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar (#111827/80 glass) */}
        <header className="h-[68px] border-b border-white/[0.08] bg-[#111827]/80 flex items-center justify-between px-6 sm:px-8 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
          <div className="flex items-center space-x-3">
            <h1 className="text-base sm:text-lg font-bold font-heading text-white tracking-tight">
              {roleName} Portal
            </h1>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <span className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>pgvector & Gemini 2.0 Connected</span>
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono bg-[#1E293B]/70 px-3 py-1.5 rounded-lg border border-white/[0.06] shadow-inner">
            <span className="text-slate-500 hidden md:inline">Account:</span>
            <span className="text-slate-200 truncate max-w-[180px]">{user?.email}</span>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto bg-[#0B1120] custom-scrollbar">
          <div className="max-w-[1400px] mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const SuperAdminLayout = ({ children }) => {
  const navItems = [
    { label: 'Dashboard Overview', path: '/super-admin/dashboard', icon: '📊' },
    { label: 'College Chatbot', path: '/super-admin/chat', icon: '🤖' },
    { label: 'Document Knowledge Base', path: '/super-admin/documents', icon: '📄' },
    { label: 'Manage Colleges', path: '#colleges', icon: '🏢' },
    { label: 'System Admins', path: '#admins', icon: '👥' },
    { label: 'System Logs & Audit', path: '#logs', icon: '📋' },
  ];
  return <BaseRoleLayout children={children} roleName="SUPER ADMIN" navItems={navItems} colorTheme="superAdmin" />;
};

export const AdminLayout = ({ children }) => {
  const navItems = [
    { label: 'Dashboard Overview', path: '/admin/dashboard', icon: '📊' },
    { label: 'College Chatbot', path: '/admin/chat', icon: '🤖' },
    { label: 'Document Knowledge Base', path: '/admin/documents', icon: '📄' },
    { label: 'Departments', path: '#departments', icon: '🏫' },
    { label: 'Faculty Directory', path: '#faculty', icon: '👨‍🏫' },
    { label: 'Student Directory', path: '#students', icon: '🧑‍🎓' },
    { label: 'Course Catalog', path: '#courses', icon: '📚' },
  ];
  return <BaseRoleLayout children={children} roleName="ADMIN" navItems={navItems} colorTheme="admin" />;
};

export const FacultyLayout = ({ children }) => {
  const navItems = [
    { label: 'Faculty Dashboard', path: '/faculty/dashboard', icon: '📊' },
    { label: 'College Chatbot', path: '/faculty/chat', icon: '🤖' },
    { label: 'Policy Documents', path: '/faculty/documents', icon: '📄' },
    { label: 'My Classes & Syllabi', path: '#classes', icon: '🎓' },
    { label: 'Attendance Management', path: '#attendance', icon: '📝' },
    { label: 'Examination Grading', path: '#grading', icon: '💯' },
  ];
  return <BaseRoleLayout children={children} roleName="FACULTY" navItems={navItems} colorTheme="faculty" />;
};

export const StudentLayout = ({ children }) => {
  const navItems = [
    { label: 'Student Dashboard', path: '/student/dashboard', icon: '📊' },
    { label: 'College Chatbot', path: '/student/chat', icon: '🤖' },
    { label: 'Enrolled Courses', path: '#courses', icon: '📖' },
    { label: 'Academic Timetable', path: '#timetable', icon: '🗓️' },
    { label: 'Fee Invoices & Receipts', path: '#fees', icon: '💳' },
  ];
  return <BaseRoleLayout children={children} roleName="STUDENT" navItems={navItems} colorTheme="student" />;
};
