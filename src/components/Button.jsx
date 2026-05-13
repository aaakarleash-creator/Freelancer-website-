import React from 'react';

// ============================================================
// Button — reusable button with variants
// ============================================================

const variants = {
  primary: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-dark-900 font-semibold hover:from-amber-400 hover:to-yellow-300 shadow-gold hover:shadow-gold-lg',
  secondary: 'bg-dark-500 text-slate-200 border border-dark-400 hover:border-amber-500/40 hover:text-amber-400',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
  ghost: 'text-slate-400 hover:text-amber-400 hover:bg-dark-500',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({ children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props }) {
  return (
    <button
      className={`
        inline-flex items-center gap-2 transition-all duration-200
        font-body font-medium cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 13 : 15} />}
      {children}
    </button>
  );
}
