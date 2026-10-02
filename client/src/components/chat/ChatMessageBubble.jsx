import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import useChatStore from '../../store/chatStore';

export default function ChatMessageBubble({ message }) {
  const { id, role, content, sources, tokensUsed, responseTimeMs, feedback, createdAt } = message;
  const isUser = role === 'USER';
  const { submitFeedback } = useChatStore();

  const [expandedCitation, setExpandedCitation] = useState(null);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in my-4">
        <div className="max-w-[85%] sm:max-w-[75%] bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl rounded-tr-sm px-5 py-4 shadow-lg shadow-indigo-600/20 border border-indigo-500">
          <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {content}
          </p>
          <div className="text-right mt-2">
            <span className="text-[10px] text-indigo-200 font-mono">
              {formatTime(createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-fade-in my-6 w-full">
      <div className="w-full bg-[#111827] border border-white/[0.08] text-slate-200 rounded-2xl rounded-tl-sm px-6 sm:px-8 py-6 shadow-xl space-y-5">
        {/* Header: Assistant Identity */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center text-base shadow-md">
              🤖
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold font-heading tracking-wide text-white">
                  College Chatbot
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Verified Response</span>
                </span>
              </div>
            </div>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {formatTime(createdAt)}
          </span>
        </div>

        {/* Markdown Content */}
        <div className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-xl sm:text-2xl font-bold text-white mt-6 mb-4 font-heading leading-tight">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg sm:text-xl font-bold text-white mt-6 mb-3 border-l-4 border-indigo-500 pl-3 font-heading leading-snug">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-cyan-400 mt-5 mb-2 font-heading">{children}</h3>,
              p: ({ children }) => <p className="mb-5 last:mb-0 text-slate-300 leading-loose">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-outside mb-5 space-y-2 text-slate-300 pl-5 leading-loose">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-outside mb-5 space-y-2 text-slate-300 pl-5 leading-loose">{children}</ol>,
              li: ({ children }) => <li className="pl-1">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-indigo-500 bg-indigo-500/10 px-5 py-3 rounded-r-xl text-slate-300 italic my-5 leading-loose">
                  {children}
                </blockquote>
              ),
              code: ({ inline, children }) =>
                inline ? (
                  <code className="bg-[#1E293B] text-cyan-400 font-mono text-sm px-1.5 py-0.5 rounded border border-white/[0.08] font-semibold">
                    {children}
                  </code>
                ) : (
                  <pre className="bg-[#0B1120] p-5 rounded-xl border border-white/[0.08] overflow-x-auto my-5 text-sm font-mono text-slate-200 leading-relaxed shadow-inner">
                    <code>{children}</code>
                  </pre>
                ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Citations Drawer / Cards */}
        {sources && sources.length > 0 && (
          <div className="pt-4 border-t border-white/[0.06] space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">
                Grounded Citations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sources.map((src, idx) => (
                <div key={src.chunkId || idx} className="bg-[#0B1120] border border-white/[0.08] rounded-xl p-3 flex flex-col justify-between space-y-3 hover:border-indigo-500/30 transition-colors shadow-sm">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate flex items-center space-x-2">
                      <span className="text-slate-500">📄</span> 
                      <span>{src.documentTitle || 'Policy Manual'}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1.5"><span className="text-indigo-400">📑</span> Page {src.pageNumber || 1}</span>
                      {src.category && <span className="flex items-center gap-1.5"><span className="text-emerald-400">📂</span> {src.category.replace(/_/g, ' ')}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedCitation(expandedCitation === idx ? null : idx)}
                    className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 border ${
                      expandedCitation === idx
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20'
                    }`}
                  >
                    <span>{expandedCitation === idx ? 'Hide Source' : 'View Source'}</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Expandable Citation Preview Box */}
            {expandedCitation !== null && sources[expandedCitation] && (
              <div className="mt-4 p-5 rounded-xl bg-[#0B1120] border border-indigo-500/30 animate-slide-up space-y-3 text-sm shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div>
                    <span className="font-bold text-white">
                      {sources[expandedCitation].documentTitle}
                    </span>
                    <span className="text-slate-500 ml-2">
                      — {sources[expandedCitation].sectionTitle || 'General Section'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 font-mono font-semibold border border-indigo-500/20 text-xs">
                      Page {sources[expandedCitation].pageNumber || 1}
                    </span>
                    {sources[expandedCitation].similarityScore && (
                      <span className="hidden sm:inline-block px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono font-semibold border border-cyan-500/20 text-xs">
                        Score: {sources[expandedCitation].similarityScore.toFixed(3)}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-slate-300 leading-loose font-mono whitespace-pre-wrap bg-[#111827] p-4 rounded-xl border border-white/[0.06] text-xs sm:text-sm">
                  "{sources[expandedCitation].content}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer: Metrics & Thumbs Feedback */}
        <div className="pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            {responseTimeMs && (
              <span className="flex items-center space-x-1.5">
                <span className="text-amber-400">⚡</span>
                <span>{responseTimeMs}ms</span>
              </span>
            )}
            {tokensUsed && (
              <span className="flex items-center space-x-1.5">
                <span className="text-purple-400">🔢</span>
                <span>{tokensUsed} tokens</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-[11px] mr-1 text-slate-500 font-medium">Was this helpful?</span>
            <button
              onClick={() => submitFeedback(id, feedback === 'POSITIVE' ? 'NONE' : 'POSITIVE')}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-150 flex items-center space-x-1.5 font-medium ${
                feedback === 'POSITIVE'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm'
                  : 'bg-[#0B1120] border-white/[0.08] text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
              title="Helpful response"
            >
              <span>👍</span>
              <span>Yes</span>
            </button>
            <button
              onClick={() => submitFeedback(id, feedback === 'NEGATIVE' ? 'NONE' : 'NEGATIVE')}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-all duration-150 flex items-center space-x-1.5 font-medium ${
                feedback === 'NEGATIVE'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-sm'
                  : 'bg-[#0B1120] border-white/[0.08] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10'
              }`}
              title="Not helpful"
            >
              <span>👎</span>
              <span>No</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
