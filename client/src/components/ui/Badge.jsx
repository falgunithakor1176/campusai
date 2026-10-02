/**
 * Badge Component
 *
 * Provides status pill indicators for various UI elements.
 *
 * @module components/ui/Badge
 */

import React from 'react';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost'} [props.variant='primary']
 * @param {'sm' | 'md'} [props.size='md']
 * @param {boolean} [props.dot=false] - Show a small circular indicator dot
 */
export default function Badge({ children, variant = 'primary', size = 'md', dot = false }) {
  const baseStyle = 'inline-flex items-center gap-1.5 font-semibold rounded-full select-none';

  const variants = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border border-secondary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-info/10 text-info border border-info/20',
    ghost: 'bg-white/5 text-neutral-300 border border-white/10',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
  };

  const dotColors = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
    ghost: 'bg-neutral-400',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${sizes[size]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
export { Badge };
