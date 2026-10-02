/**
 * Modal Component
 *
 * Provides a highly polished glassmorphism modal with animated entry,
 * portal rendering, and keyboard/backdrop closing hooks.
 *
 * @module components/ui/Modal
 */

import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string} [props.title]
 * @param {React.ReactNode} props.children
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md']
 * @param {boolean} [props.hideClose=false] - Hide close button
 * @param {React.ReactNode} [props.footer] - Optional footer actions block
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  hideClose = false,
  footer,
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle Escape key closure
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/75 backdrop-blur-sm transition-opacity duration-300"
      />

      {/* Modal Dialog Box */}
      <div
        className={`relative w-full ${sizes[size]} glass bg-neutral-900/90 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] transform transition-all duration-300 animate-fade-in`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          {title ? (
            <h3 className="font-heading text-lg font-bold text-neutral-100">{title}</h3>
          ) : (
            <div />
          )}

          {!hideClose && (
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white rounded-lg p-1.5 hover:bg-white/5 transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-4 text-neutral-300 text-sm leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
export { Modal };
