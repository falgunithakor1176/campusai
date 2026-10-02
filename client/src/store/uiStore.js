/**
 * UI State Store
 *
 * Manages UI-related state like toast notifications, sidebar visibility,
 * and application theme.
 *
 * @module store/uiStore
 */

import { create } from 'zustand';

export const useUiStore = create((set, get) => ({
  // ── Toasts state ───────────────────────────────────────────────────────────
  toasts: [],

  /**
   * Adds a new toast notification.
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   * @param {string} message - Notification text
   * @param {number} [duration=4000] - Duration in ms before auto-removal
   */
  addToast: (type, message, duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }));

    // Auto-remove toast after duration
    setTimeout(() => {
      get().removeToast(id);
    }, duration);
  },

  /**
   * Removes a toast notification by ID.
   * @param {string} id
   */
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  // ── Layout state ───────────────────────────────────────────────────────────
  sidebarOpen: true,

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (isOpen) => {
    set({ sidebarOpen: isOpen });
  },

  // ── Theme state ────────────────────────────────────────────────────────────
  theme: 'dark', // 'dark' | 'light'

  toggleTheme: () => {
    set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
  },
}));

/**
 * Convenient custom hook wrapper for managing toast alerts.
 * Returns helper functions: success(), error(), info(), warning()
 */
export const useToast = () => {
  const addToast = useUiStore((state) => state.addToast);

  return {
    success: (message, duration) => addToast('success', message, duration),
    error: (message, duration) => addToast('error', message, duration),
    info: (message, duration) => addToast('info', message, duration),
    warning: (message, duration) => addToast('warning', message, duration),
  };
};
