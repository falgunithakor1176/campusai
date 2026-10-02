/**
 * api.js — CampusAI Axios HTTP Client
 * Configured instance with auth interceptors, token refresh, and error handling
 */

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const DEFAULT_TIMEOUT = 30_000; // 30 seconds for regular requests
const CHAT_TIMEOUT    = 90_000; // 90 seconds for AI chat (Gemini + ERP + RAG pipeline)

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
    'X-App-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
  },
  withCredentials: true, // Send cookies (for refresh token in httpOnly cookie)
});

// ─── Token Refresh State ──────────────────────────────────────────────────────
let isRefreshing      = false;
let refreshSubscribers = []; // Queue of pending requests during token refresh

/**
 * Subscribe a request to wait for token refresh completion.
 * @param {function} callback - Called with new access token when ready
 */
function subscribeTokenRefresh(callback) {
  refreshSubscribers.push(callback);
}

/**
 * Notify all queued subscribers that token refresh completed.
 * @param {string|null} newToken - New access token, or null on failure
 */
function notifySubscribers(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // authStore must be imported here to get latest token from memory
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Use longer timeout for AI chat endpoint (Gemini + ERP + RAG can take 30-60s)
    if (config.url?.includes('/chat/') || config.url?.includes('/chat')) {
      config.timeout = CHAT_TIMEOUT;
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('[API] Request Error:', error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // ── Success: pass through ──────────────────────────────────────────────────
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ✓ ${response.status} ${response.config.url}`);
    }
    return response;
  },

  // ── Error handling ─────────────────────────────────────────────────────────
  async (error) => {
    const originalRequest = error.config;

    // Network error (no response)
    if (!error.response) {
      const msg = error.message?.includes('timeout')
        ? 'Request timed out. Please check your connection.'
        : 'Network error. Please check your internet connection.';
      return Promise.reject(createApiError(msg, 0, error));
    }

    const { status, data } = error.response;

    // ── 401 Unauthorized: attempt token refresh ──────────────────────────────
    if (status === 401 && !originalRequest._retried) {
      originalRequest._retried = true;

      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(createApiError('Session expired. Please log in again.', 401, error));
            }
          });
        });
      }

      // Start token refresh
      isRefreshing = true;

      try {
        const refreshRes = await axios.post(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true } // Sends httpOnly refresh token cookie
        );

        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;

        if (!newAccessToken) throw new Error('No access token in refresh response');

        // Update authStore with new token
        useAuthStore.getState().setAuth({
          user:        useAuthStore.getState().user,
          accessToken: newAccessToken,
        });

        // Notify waiting requests
        notifySubscribers(newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);

      } catch (refreshError) {
        // Refresh failed — log user out
        console.warn('[API] Token refresh failed, logging out:', refreshError.message);
        notifySubscribers(null);

        useAuthStore.getState().logout();

        return Promise.reject(createApiError('Session expired. Please log in again.', 401, refreshError));

      } finally {
        isRefreshing = false;
      }
    }

    // ── 403 Forbidden ────────────────────────────────────────────────────────
    if (status === 403) {
      return Promise.reject(createApiError(
        data?.message || 'You do not have permission to perform this action.',
        403, error
      ));
    }

    // ── 404 Not Found ────────────────────────────────────────────────────────
    if (status === 404) {
      return Promise.reject(createApiError(
        data?.message || 'The requested resource was not found.',
        404, error
      ));
    }

    // ── 422 Validation Error ─────────────────────────────────────────────────
    if (status === 422) {
      const validationMessage = data?.errors
        ? Object.values(data.errors).flat().join('. ')
        : data?.message || 'Validation failed.';
      return Promise.reject(createApiError(validationMessage, 422, error));
    }

    // ── 429 Rate Limited ─────────────────────────────────────────────────────
    if (status === 429) {
      return Promise.reject(createApiError(
        data?.message || 'Too many requests. Please wait a moment.',
        429, error
      ));
    }

    // ── 500+ Server Errors ───────────────────────────────────────────────────
    if (status >= 500) {
      return Promise.reject(createApiError(
        data?.message || 'Server error. Please try again later.',
        status, error
      ));
    }

    // ── Generic error ────────────────────────────────────────────────────────
    const msg = data?.message || error.message || 'An unexpected error occurred.';
    return Promise.reject(createApiError(msg, status, error));
  }
);

// ─── Error Factory ────────────────────────────────────────────────────────────
/**
 * Create a standardized API error object.
 * @param {string} message - Human-readable error message
 * @param {number} status  - HTTP status code
 * @param {Error}  cause   - Original error
 */
function createApiError(message, status, cause) {
  const err = new Error(message);
  err.status        = status;
  err.isApiError    = true;
  err.originalError = cause;
  return err;
}

// ─── SSE Stream Helper ────────────────────────────────────────────────────────
/**
 * Open a Server-Sent Events (SSE) connection for streaming AI responses.
 *
 * @param {string}   endpoint - API endpoint (e.g. '/chat/stream')
 * @param {object}   body     - Request body to POST
 * @param {function} onChunk  - Called with each text chunk: (chunk: string) => void
 * @param {function} onDone   - Called when stream completes: () => void
 * @param {function} onError  - Called on stream error: (error: Error) => void
 * @returns {function}  abort - Call to cancel the stream
 */
export function streamApi(endpoint, body, { onChunk, onDone, onError } = {}) {
  const controller = new AbortController();

  // Get auth token
  const token = useAuthStore.getState().accessToken;

  const headers = {
    'Content-Type':  'application/json',
    'Accept':        'text/event-stream',
    'Cache-Control': 'no-cache',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  fetch(`${BASE_URL}${endpoint}`, {
    method:  'POST',
    headers,
    body:    JSON.stringify(body),
    signal:  controller.signal,
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
      }
      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser.');
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              onDone?.();
              return;
            }
            try {
              const parsed = JSON.parse(data);
              const chunk = parsed.text || parsed.chunk || parsed.content || data;
              onChunk?.(chunk);
            } catch {
              // Raw text chunk
              onChunk?.(data);
            }
          }
        }
      }

      onDone?.();
    })
    .catch((err) => {
      if (err.name === 'AbortError') return; // Intentionally cancelled
      console.error('[Stream] Error:', err);
      onError?.(err);
    });

  // Return abort function
  return () => controller.abort();
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default api;
