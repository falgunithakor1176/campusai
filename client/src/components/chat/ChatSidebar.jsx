import React, { useState } from 'react';
import useChatStore from '../../store/chatStore';

export default function ChatSidebar({ isOpen, onClose }) {
  const {
    sessions,
    activeSessionId,
    selectSession,
    createSession,
    deleteSession,
    isLoadingSessions,
  } = useChatStore();

  const [searchTerm, setSearchTerm] = useState('');

  const handleNewChat = async () => {
    await createSession('New Chat');
    if (onClose) onClose();
  };

  const handleSelect = (id) => {
    selectSession(id);
    if (onClose) onClose();
  };

  const filteredSessions = searchTerm.trim()
    ? sessions.filter((s) =>
        (s.title || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : sessions;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diff = now - d;
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-72 bg-[#111827] border-r border-white/[0.08] flex flex-col justify-between h-full overflow-hidden shadow-xl z-10 flex-shrink-0">
      {/* Top Header & New Chat Button */}
      <div className="p-4 border-b border-white/[0.08] space-y-4 bg-[#1E293B]/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-base font-bold font-heading text-white tracking-wide">
              Chat History
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
            RAG v2.0
          </span>
        </div>

        <button
          onClick={handleNewChat}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 transition-all duration-300 group"
        >
          <span className="text-lg group-hover:rotate-90 transition-transform duration-200">+</span>
          <span>New Conversation</span>
        </button>

        {/* Search Filter */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B1120]/80 border border-white/[0.1] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 py-1.5 font-mono">
          Recent Inquiries ({filteredSessions.length})
        </div>

        {isLoadingSessions && sessions.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm animate-pulse">
            Loading conversations...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-white/[0.08] rounded-xl my-4 mx-2 bg-[#1E293B]/30">
            <p className="text-sm text-slate-300 font-medium">
              {searchTerm ? 'No matching conversations' : 'No history found'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {searchTerm
                ? 'Try a different search term.'
                : 'Start a new chat to inquire about college rules and policies.'}
            </p>
          </div>
        ) : (
          filteredSessions.map((s) => {
            const isActive = s.id === activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() => handleSelect(s.id)}
                className={`group flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-500 font-medium'
                    : 'text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <span className="text-base flex-shrink-0">💬</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.title || 'Untitled Chat'}</p>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {s.messageCount || 0} msgs
                      </span>
                      {s.updatedAt && (
                        <>
                          <span className={`text-[8px] ${isActive ? 'text-indigo-300' : 'text-slate-600'}`}>•</span>
                          <span className={`text-[10px] font-mono ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {formatDate(s.updatedAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Delete this conversation?')) {
                      deleteSession(s.id);
                    }
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all duration-150 ml-2 ${
                    isActive ? 'text-indigo-200 hover:text-white hover:bg-indigo-500' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/15'
                  }`}
                  title="Delete Session"
                >
                  🗑️
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Knowledge Engine Card */}
      <div className="p-4 border-t border-white/[0.08] bg-[#0B1120]/60">
        <div className="p-3.5 rounded-xl bg-[#111827] border border-white/[0.08] space-y-2.5 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
            <span className="text-xs font-bold text-white tracking-wide">System Status</span>
          </div>
          <ul className="text-[11px] text-slate-400 space-y-1.5 font-medium">
            <li className="flex items-center space-x-2">
              <span className="text-emerald-400">🟢</span>
              <span>Knowledge Base Connected</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-blue-400">📄</span>
              <span>Indexed Documents</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-purple-400">🔍</span>
              <span>Semantic Search Ready</span>
            </li>
            <li className="flex items-center space-x-2">
              <span className="text-indigo-400">🤖</span>
              <span>AI Available</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
