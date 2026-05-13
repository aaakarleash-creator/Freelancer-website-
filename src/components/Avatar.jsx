import React from 'react';

// ============================================================
// Avatar — initials-based avatar with size variants
// ============================================================

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export default function Avatar({ initials, size = 'md', className = '' }) {
  return (
    <div className={`
      ${sizes[size]} rounded-full
      bg-gradient-to-br from-amber-500/30 to-yellow-600/20
      border border-amber-500/30
      flex items-center justify-center
      font-display font-semibold text-amber-400
      flex-shrink-0
      ${className}
    `}>
      {initials}
    </div>
  );
}
