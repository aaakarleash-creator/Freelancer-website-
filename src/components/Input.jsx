import React from 'react';

// ============================================================
// Input / Select — reusable form fields
// ============================================================

export function Input({ label, icon: Icon, error, className = '', ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            <Icon size={15} />
          </div>
        )}
        <input
          className={`
            w-full bg-dark-600 border rounded-xl text-sm text-white placeholder-slate-600
            focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20
            transition-all duration-200
            disabled:opacity-60 disabled:cursor-not-allowed
            ${Icon ? 'pl-9 pr-4 py-2.5' : 'px-4 py-2.5'}
            ${error ? 'border-red-500/50' : 'border-dark-400'}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function Select({ label, children, className = '', ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label && <label className="block text-xs text-slate-400 font-medium tracking-wide uppercase">{label}</label>}
      <select
        className="
          w-full bg-dark-600 border border-dark-400 rounded-xl text-sm text-white
          px-4 py-2.5 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20
          transition-all duration-200 cursor-pointer
        "
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
