/**
 * Card Component
 *
 * Visually consistent cards styled with standard glassmorphism tokens.
 *
 * @module components/ui/Card
 */

import React from 'react';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {'default' | 'elevated' | 'flat'} [props.variant='default'] - Card shadow/bg heavy styling
 * @param {boolean} [props.hover=false] - Apply scale/glow animation on hover
 * @param {string} [props.className] - Extensible classes
 * @param {function} [props.onClick]
 */
export default function Card({
  children,
  variant = 'default',
  hover = false,
  className = '',
  onClick,
  ...rest
}) {
  const baseStyle = 'rounded-2xl border transition-all duration-300 overflow-hidden';

  const variants = {
    default: 'glass backdrop-blur-xl bg-white/5 border-white/10 shadow-lg',
    elevated: 'backdrop-blur-2xl bg-white/10 border-white/20 shadow-xl shadow-black/20',
    flat: 'bg-neutral-800 border-neutral-700/50',
  };

  const hoverStyle = hover ? 'cursor-pointer hover:scale-[1.02] hover:border-primary/40' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
