/**
 * Button Component
 *
 * Visually stunning reusable button supporting various sizes, shapes,
 * state changes, and hover styles.
 *
 * @module components/ui/Button
 */

import React from 'react';
import Spinner from './Spinner';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {boolean} [props.fullWidth=false]
 * @param {function} [props.onClick]
 * @param {string} [props.type='button']
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onClick,
  type = 'button',
  ...rest
}) {
  const baseStyle =
    'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 overflow-hidden';

  const variants = {
    primary:
      'bg-gradient-to-r from-primary to-primary-600 hover:from-primary-600 hover:to-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 focus:ring-primary',
    secondary:
      'bg-gradient-to-r from-secondary to-secondary-600 hover:from-secondary-600 hover:to-secondary text-neutral-900 shadow-lg shadow-secondary/10 hover:shadow-secondary/30 focus:ring-secondary',
    ghost: 'bg-transparent hover:bg-white/5 text-neutral-300 hover:text-white focus:ring-white/20',
    danger: 'bg-error hover:bg-error-600 text-white shadow-lg shadow-error/10 focus:ring-error',
    outline:
      'bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 text-neutral-300 hover:text-white focus:ring-white/20',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs gap-1.5',
    md: 'px-6 py-3 text-sm gap-2',
    lg: 'px-8 py-4 text-base gap-2.5',
  };

  const isBtnDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isBtnDisabled}
      onClick={onClick}
      className={`
        ${baseStyle}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isBtnDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'active:scale-95'}
      `}
      {...rest}
    >
      {/* Loading state indicator */}
      {loading && <Spinner size="sm" />}

      {/* Normal state icons and content */}
      {!loading && leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span className="relative z-10">{children}</span>
      {!loading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
export { Button };
