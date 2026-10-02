import { create } from 'zustand';
import api from '../services/api';

const useChatStore = create((set, get) => ({
  sessions: [],
  activeSessionId: null,
  messages: [],
  suggestedQuestions: [
    'What is the attendance condonation policy?',
    'Where can I find the Academic Calendar 2025-26?',
    'What are the library borrowing limits and fines?',
  ],
  isLoadingSessions: false,
  isLoadingMessages: false,
  isGenerating: false,
  error: null,

  // ─── Actions ────────────────────────────────────────────────────────────────

  fetchSessions: async () => {
    set({ isLoadingSessions: true, error: null });
    try {
      const res = await api.get('/chat/sessions');
      const sessions = res.data?.data || [];
      set({ sessions, isLoadingSessions: false });

      // Auto-select first session if none selected and sessions exist
      const currentActive = get().activeSessionId;
      if (!currentActive && sessions.length > 0) {
        get().selectSession(sessions[0].id);
      }
    } catch (err) {
      console.error('[ChatStore] fetchSessions error:', err);
      set({
        isLoadingSessions: false,
        error: err.response?.data?.message || 'Failed to load chat sessions',
      });
    }
  },

  createSession: async (title = 'New Chat') => {
    set({ error: null });
    try {
      const res = await api.post('/chat/sessions', { title });
      const newSession = res.data?.data;
      if (newSession) {
        set((state) => ({
          sessions: [newSession, ...state.sessions],
          activeSessionId: newSession.id,
          messages: [],
          suggestedQuestions: [
            'What is the attendance condonation policy?',
            'Where can I find the Academic Calendar 2025-26?',
            'What are the library borrowing limits and fines?',
          ],
        }));
      }
      return newSession;
    } catch (err) {
      console.error('[ChatStore] createSession error:', err);
      set({ error: err.response?.data?.message || 'Failed to create chat session' });
      return null;
    }
  },

  selectSession: async (sessionId) => {
    set({ activeSessionId: sessionId, isLoadingMessages: true, error: null });
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      const sessionData = res.data?.data;
      const messages = sessionData?.messages || [];

      // Extract default or previous suggested questions
      const defaultQuestions = [
        'What is the attendance condonation policy?',
        'Where can I find the Academic Calendar 2025-26?',
        'What are the library borrowing limits and fines?',
      ];

      set({
        messages,
        isLoadingMessages: false,
        suggestedQuestions: defaultQuestions,
      });
    } catch (err) {
      console.error('[ChatStore] selectSession error:', err);
      set({
        isLoadingMessages: false,
        error: err.response?.data?.message || 'Failed to load session messages',
      });
    }
  },

  deleteSession: async (sessionId) => {
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      set((state) => {
        const remaining = state.sessions.filter((s) => s.id !== sessionId);
        let nextActiveId = state.activeSessionId;
        let nextMessages = state.messages;

        if (state.activeSessionId === sessionId) {
          nextActiveId = remaining[0]?.id || null;
          nextMessages = [];
        }

        return {
          sessions: remaining,
          activeSessionId: nextActiveId,
          messages: nextMessages,
        };
      });

      const current = get().activeSessionId;
      if (current) {
        get().selectSession(current);
      }
    } catch (err) {
      console.error('[ChatStore] deleteSession error:', err);
      set({ error: err.response?.data?.message || 'Failed to delete chat session' });
    }
  },

  sendMessage: async (messageText) => {
    if (!messageText?.trim()) return;

    // Ensure we have an active session ID
    let currentSessionId = get().activeSessionId;
    if (!currentSessionId) {
      const newSession = await get().createSession(
        messageText.slice(0, 45) + (messageText.length > 45 ? '...' : '')
      );
      if (!newSession) return;
      currentSessionId = newSession.id;
    }

    const tempUserId = `temp-user-${Date.now()}`;
    const optimisticUserMessage = {
      id: tempUserId,
      role: 'USER',
      content: messageText.trim(),
      createdAt: new Date().toISOString(),
    };

    // Optimistically add user turn
    set((state) => ({
      messages: [...state.messages, optimisticUserMessage],
      isGenerating: true,
      error: null,
      suggestedQuestions: [],
    }));

    try {
      const res = await api.post('/chat/message', {
        sessionId: currentSessionId,
        message: messageText.trim(),
        topK: 5,
      });

      const { userMessage, assistantMessage, suggestedQuestions, sessionTitle } = res.data?.data || {};

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === tempUserId ? userMessage : msg
        ).concat(assistantMessage ? [assistantMessage] : []),
        suggestedQuestions: suggestedQuestions || [],
        isGenerating: false,
        sessions: state.sessions
          .map((s) =>
            s.id === currentSessionId
              ? {
                  ...s,
                  title: sessionTitle || s.title,
                  messageCount: (s.messageCount || 0) + 2,
                  updatedAt: new Date().toISOString(),
                }
              : s
          )
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
      }));
    } catch (err) {
      console.error('[ChatStore] sendMessage error:', err);
      const isTimeout = err.message?.toLowerCase().includes('timeout') || err.code === 'ECONNABORTED';
      const userMessage = isTimeout
        ? 'The AI is taking longer than expected. This can happen when the knowledge base is large. Please try again.'
        : err.response?.data?.message || 'Could not connect to the AI service. Please check your network or try again shortly.';
      set((state) => ({
        isGenerating: false,
        error: userMessage,
        messages: [
          ...state.messages,
          {
            id: `error-${Date.now()}`,
            role: 'ASSISTANT',
            content: `⚠️ **${isTimeout ? 'Response Timed Out' : 'Error'}:** ${userMessage}`,
            createdAt: new Date().toISOString(),
            sources: [],
          },
        ],
      }));
    }
  },

  submitFeedback: async (messageId, feedback) => {
    try {
      // Optimistic update
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === messageId ? { ...msg, feedback } : msg
        ),
      }));

      await api.post('/chat/feedback', { messageId, feedback });
    } catch (err) {
      console.error('[ChatStore] submitFeedback error:', err);
    }
  },

  clearError: () => set({ error: null }),
}));

export default useChatStore;
