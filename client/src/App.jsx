/**
 * App.jsx — CampusAI Root Application Component
 * Sets up routing, global error boundary, and toast notifications
 */

import React, { Component } from 'react';
import AppRouter from '@/routes/AppRouter';
import { Toaster } from '@/components/ui/Toast';

/* ─── Global Error Boundary ───────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[CampusAI] Uncaught Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
          <div className="glass max-w-md w-full p-8 text-center space-y-4 animate-fade-in">
            {/* Error icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-error/10 border border-error/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-xl font-bold text-neutral-100">
                Something went wrong
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed">
                An unexpected error occurred. Please refresh the page or contact support if the problem persists.
              </p>
            </div>

            {/* Error details (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mt-4">
                <summary className="text-xs text-neutral-400 cursor-pointer hover:text-neutral-200 mb-2">
                  Error Details (dev)
                </summary>
                <pre className="text-xs text-error bg-error/10 border border-error/20 rounded-lg p-3 overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full mt-2"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* ─── App Component ───────────────────────────────────────────── */
export default function App() {
  return (
    <ErrorBoundary>
      {/* Main application router */}
      <AppRouter />

      {/* Global toast notification system */}
      <Toaster />
    </ErrorBoundary>
  );
}
