import React, { useEffect, useRef } from 'react';
import useChatStore from '../../store/chatStore';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatMessageBubble from '../../components/chat/ChatMessageBubble';
import ChatInput from '../../components/chat/ChatInput';

export default function ChatPage() {
  const {
    sessions,
    activeSessionId,
    messages,
    isLoadingSessions,
    isLoadingMessages,
    isGenerating,
    error,
    fetchSessions,
    sendMessage,
    clearError,
  } = useChatStore();

  const messagesEndRef = useRef(null);

  // Load chat sessions on initial mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-scroll to bottom on new messages or generation progress
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const quickStartQuestions = [
    {
      icon: '📋',
      title: 'Attendance Criteria',
      query: 'What is the minimum attendance requirement and what happens if my attendance falls below 75%?',
      color: 'from-indigo-500/20 to-indigo-500/5 border-indigo-500/30',
    },
    {
      icon: '💰',
      title: 'Fee Structure & Fines',
      query: 'Can you show me the tuition fees for Computer Engineering and the late payment penalty guidelines?',
      color: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30',
    },
    {
      icon: '📚',
      title: 'Examination Rules',
      query: 'What is the 10-point CGPA grading rubric and what are the rules for re-examinations or KTs?',
      color: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    },
    {
      icon: '🏠',
      title: 'Hostel Guidelines',
      query: 'What are the hostel room allocation rules, mess timings, and visitor policies at CADCE?',
      color: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    },
    {
      icon: '🎓',
      title: 'Scholarship Info',
      query: 'What government and merit-based scholarships are available for engineering students?',
      color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30',
    },
    {
      icon: '🚌',
      title: 'Transportation',
      query: 'What are the bus routes, timings, and fee structure for student transportation?',
      color: 'from-rose-500/20 to-rose-500/5 border-rose-500/30',
    },
  ];

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex h-[calc(100vh-6rem)] max-w-full mx-auto bg-[#111827] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl animate-fade-in">
      {/* Left Sidebar: Session History */}
      <ChatSidebar />

      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120]">
        {/* Top Chat Header */}
        <div className="h-16 px-6 border-b border-white/[0.08] bg-[#111827]/90 backdrop-blur-xl flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-lg shadow-md shadow-indigo-600/30 flex-shrink-0">
              🤖
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-heading text-white truncate">
                College Chatbot
              </h2>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                <span>Your AI-powered assistant for official college information and documents.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="hidden md:inline-flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Gemini 2.0 Flash</span>
            </span>
            <span className="hidden lg:inline-flex items-center space-x-1.5 text-[10px] font-mono px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>pgvector</span>
            </span>
          </div>
        </div>

        {/* Error Notification Alert */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-rose-300 text-sm animate-fade-in shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-rose-400 hover:text-white font-bold px-2 py-0.5 rounded"
            >
              ✕
            </button>
          </div>
        )}

        {/* Messages Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {isLoadingMessages ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-medium">Loading message history...</p>
            </div>
          ) : messages.length === 0 ? (
            /* Welcome Hero & Quick Start Cards */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-3xl mx-auto py-8 px-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-400 text-white flex items-center justify-center text-3xl shadow-lg shadow-indigo-600/30 mb-6">
                🤖
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-white">
                Welcome to College Chatbot
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-2 max-w-xl leading-relaxed">
                Ask me anything about:
              </p>

              {/* Quick Start Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8 w-full">
                {quickStartQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    onClick={() => sendMessage(q.query)}
                    className={`card-hover p-4 rounded-2xl bg-[#111827] border border-white/[0.08] hover:border-white/[0.2] cursor-pointer text-left group flex flex-col justify-between`}
                  >
                    <div>
                      <span className="text-2xl block mb-2">{q.icon}</span>
                      <h3 className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                        {q.query}
                      </p>
                    </div>
                    <div className="mt-3 text-[11px] font-semibold text-indigo-400 flex items-center space-x-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <span>Ask Now</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Message Bubbles List */
            <>
              {messages.map((msg) => (
                <ChatMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing Indicator */}
              {isGenerating && (
                <div className="flex justify-start animate-fade-in my-3">
                  <div className="bg-[#111827] border border-white/[0.08] rounded-2xl rounded-tl-sm px-6 py-4 shadow-md flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 font-medium">
                      Synthesizing answer from CADCE knowledge base...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area with Suggested Questions */}
        <ChatInput />
      </div>
    </div>
  );
}
