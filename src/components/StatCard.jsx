import React from 'react';

// ============================================================
// StatCard — Summary metric card used on Dashboard & Earnings
// ============================================================

export default function StatCard({ icon: Icon, label, value, sub, accent = false, trend }) {
  return (
    <div className={`
      card-shine relative rounded-2xl p-6 border transition-all duration-300
      ${accent
        ? 'bg-gradient-to-br from-amber-500/10 to-yellow-600/5 border-amber-500/30 shadow-gold hover:shadow-gold-lg'
        : 'bg-dark-700 border-dark-400 hover:border-dark-300'
      }
      hover:-translate-y-0.5 cursor-default
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-body tracking-wide uppercase">{label}</p>
          <p className={`text-3xl font-semibold mt-1 font-body ${accent ? 'text-gradient' : 'text-white'}`}>
            {value}
          </p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
        <div className={`
          p-3 rounded-xl
          ${accent ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-500 text-slate-400'}
        `}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
