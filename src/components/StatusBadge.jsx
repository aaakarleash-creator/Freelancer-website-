import React from 'react';

// ============================================================
// StatusBadge — colored pill for lead/user status
// ============================================================

const variants = {
  New:        'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  'Follow-up':'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  Converted:  'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  Paid:       'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  Pending:    'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  active:     'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  suspended:  'bg-red-500/15 text-red-400 border border-red-500/20',
  admin:      'bg-purple-500/15 text-purple-300 border border-purple-500/20',
  manager:    'bg-blue-500/15 text-blue-300 border border-blue-500/20',
  freelancer: 'bg-slate-500/15 text-slate-300 border border-slate-500/20',
};

export default function StatusBadge({ status }) {
  const cls = variants[status] || 'bg-slate-600/20 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
      {status}
    </span>
  );
}
