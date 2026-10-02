import React, { useState } from 'react';
import useChatStore from '../../store/chatStore';

export default function ChatInput() {
  const [input, setInput] = useState('');
  const { sendMessage, isGenerating, suggestedQuestions } = useChatStore();

  const handleSend = async (textToSend) => {
    const query = typeof textToSend === 'string' ? textToSend : input;
    if (!query?.trim() || isGenerating) return;

    setInput('');
    await sendMessage(query.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-white/[0.08] bg-[#111827]/90 backdrop-blur-xl p-4 space-y-3 z-10">
      {/* Suggested Questions Bar */}
      {suggestedQuestions && suggestedQuestions.length > 0 && !isGenerating && (
        <div className="space-y-1.5 animate-fade-in">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-indigo-400 flex items-center space-x-1 font-mono">
              <span>💡</span>
              <span>Suggested Follow-ups:</span>
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-3.5 py-1.5 rounded-xl bg-[#1E293B] border border-white/[0.08] hover:border-indigo-500/50 text-xs text-slate-300 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all duration-200 text-left font-medium shadow-sm flex items-center space-x-1.5 group"
              >
                <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform">↗</span>
                <span>{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box Row */}
      <div className="relative flex items-end space-x-3 bg-[#0B1120]/80 border border-white/[0.12] focus-within:border-indigo-500 focus-within:bg-[#0B1120] focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-2 shadow-inner transition-all">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isGenerating
              ? 'College Chatbot is synthesizing an answer from policy handbooks...'
              : 'Ask anything about attendance, fees, grading norms, or hostel guidelines...'
          }
          disabled={isGenerating}
          rows={1}
          className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm sm:text-base px-3 py-2.5 resize-none focus:outline-none max-h-36 overflow-y-auto font-sans"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isGenerating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-cyan-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 flex items-center space-x-2 flex-shrink-0"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>Thinking...</span>
            </>
          ) : (
            <>
              <span>Send</span>
              <span>🚀</span>
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2 font-sans">
        <span>Press <strong className="text-slate-300">Enter</strong> to send · <strong className="text-slate-300">Shift + Enter</strong> for new line</span>
        <span className="hidden sm:inline font-mono">⚡ Hybrid AI: Live ERP + pgvector RAG + Gemini</span>
      </div>
    </div>
  );
}
