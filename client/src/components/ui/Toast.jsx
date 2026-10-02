/**
 * Toast Component & Toaster Container
 *
 * Renders individual toast notifications and manages the fixed screen-corner layout
 * mapping the Zustand uiStore.
 *
 * @module components/ui/Toast
 */

import React from 'react';
import { useUiStore } from '../../store/uiStore';

/**
 * Single Toast Notification
 * @param {object} props
 * @param {string} props.id
 * @param {'success' | 'error' | 'warning' | 'info'} props.type
 * @param {string} props.message
 */
function Toast({ id, type, message }) {
  const removeToast = useUiStore((state) => state.removeToast);

  const icons = {
    success: (
      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borders = {
    success: 'border-success/30 bg-success/5',
    error: 'border-error/30 bg-error/5',
    warning: 'border-warning/30 bg-warning/5',
    info: 'border-info/30 bg-info/5',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 glass rounded-xl border ${borders[type]} shadow-2xl max-w-sm w-full animate-slide-in`}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <div className="flex-1 text-sm text-neutral-200 leading-normal">{message}</div>
      <button
        onClick={() => removeToast(id)}
        className="text-neutral-400 hover:text-white rounded-lg p-0.5 hover:bg-white/5 transition-colors shrink-0"
        aria-label="Close notification"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toaster Container
 * Renders all active toasts at the top-right corner of the window.
 */
export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
export { Toast };
