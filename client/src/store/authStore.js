/**
 * authStore.js — CampusAI Authentication State Store
 * Zustand store for user authentication state management.
 * Access tokens are stored in memory only (NOT localStorage) for security.
 * Refresh tokens are handled via httpOnly cookies by the server.
 */

import { create } from 'zustand';

// ─── Auth Store ───────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({

  // ─── State ─────────────────────────────────────────────────────────────────
  /** @type {object|null} Authenticated user object */
  user: null,

  /** @type {string|null} JWT access token (in-memory only, never persisted) */
  accessToken: null,

  /** @type {boolean} Whether a user is currently authenticated */
  isAuthenticated: false,

  /** @type {boolean} True while checking auth status on app mount */
  isLoading: true,

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Set authentication state after successful login/refresh.
   * @param {{ user: object, accessToken: string }} payload
   */
  setAuth: ({ user, accessToken }) => {
    set({
      user,
      accessToken,
      isAuthenticated: true,
      isLoading: false,
    });
    if (import.meta.env.DEV) {
      console.log('[AuthStore] Authenticated as:', user?.email, '| Role:', user?.role);
    }
  },

  /**
   * Clear all authentication state (logout).
   * Access token is removed from memory; server handles cookie clearing.
   */
  logout: () => {
    set({
      user:            null,
      accessToken:     null,
      isAuthenticated: false,
      isLoading:       false,
    });
    if (import.meta.env.DEV) {
      console.log('[AuthStore] Logged out');
    }
  },

  /**
   * Set the loading state during initial auth check.
   * @param {boolean} loading
   */
  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Update user profile fields without re-authenticating.
   * Useful for profile edits, avatar changes, etc.
   * @param {Partial<object>} userData - Partial user fields to merge
   */
  updateUser: (userData) => {
    const currentUser = get().user;
    if (!currentUser) {
      console.warn('[AuthStore] updateUser called with no user logged in');
      return;
    }
    set({
      user: { ...currentUser, ...userData },
    });
  },

  /**
   * Update just the access token (after silent refresh).
   * @param {string} newToken
   */
  setAccessToken: (newToken) => set({ accessToken: newToken }),

  // ─── Computed Getters ───────────────────────────────────────────────────────

  /**
   * Check if current user has a specific role (case-insensitive).
   * @param {string} role
   * @returns {boolean}
   */
  hasRole: (role) => {
    const { user } = get();
    return user?.role?.toUpperCase() === role?.toUpperCase();
  },

  /**
   * Check if current user has any of the specified roles (case-insensitive).
   * @param {string[]} roles
   * @returns {boolean}
   */
  hasAnyRole: (roles) => {
    const { user } = get();
    if (!user?.role) return false;
    const userRoleUpper = user.role.toUpperCase();
    return roles.map(r => r.toUpperCase()).includes(userRoleUpper);
  },

  /**
   * Check if the current user is an admin (ADMIN or SUPER_ADMIN).
   * @returns {boolean}
   */
  isAdmin: () => {
    const role = get().user?.role?.toUpperCase();
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  },

  /**
   * Check if the current user is a super admin.
   * @returns {boolean}
   */
  isSuperAdmin: () => get().user?.role?.toUpperCase() === 'SUPER_ADMIN',

  /**
   * Check if current user is faculty.
   * @returns {boolean}
   */
  isFaculty: () => get().user?.role?.toUpperCase() === 'FACULTY',

  /**
   * Check if current user is student.
   * @returns {boolean}
   */
  isStudent: () => get().user?.role?.toUpperCase() === 'STUDENT',
}));
