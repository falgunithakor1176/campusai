/**
 * Spinner Component
 *
 * Render loading spinners with custom sizes, color configurations,
 * and full-page layout modes.
 *
 * @module components/ui/Spinner
 */

import React from 'react';

/**
 * @param {object} props
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md'] - Spinner dimensions
 * @param {string} [props.label] - Optional text displayed below or next to the spinner
 * @param {boolean} [props.fullPage=false] - Whether to render centered in full-viewport block
 * @param {boolean} [props.center=false] - Whether to center the container
 */
export default function Spinner({ size = 'md', label, fullPage = false, center = false }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${center ? 'mx-auto' : ''}`}>
      {/* Animated ring */}
      <div
        className={`animate-spin rounded-full border-t-primary border-r-transparent border-b-primary/30 border-l-transparent ${sizeClasses[size]}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>

      {/* Optional loading text */}
      {label && (
        <span className="mt-3 text-sm text-neutral-400 font-medium tracking-wide">
          {label}
        </span>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 min-h-screen flex items-center justify-center bg-neutral-900/90 backdrop-blur-md z-50 animate-fade-in">
        {spinner}
      </div>
    );
  }

  return spinner;
}
