import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================================
// Toast — fixed-position notification
// ============================================================

const toastIcons = {
  success: { icon: CheckCircle2, bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30', textColor: 'text-emerald-400' },
  error: { icon: AlertCircle, bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30', textColor: 'text-red-400' },
  warning: { icon: AlertTriangle, bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30', textColor: 'text-amber-400' },
  info: { icon: Info, bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', textColor: 'text-blue-400' },
};

export default function Toast({ id, message, type = 'info', duration = 3000, onClose }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300); // Allow animation to finish
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, id, onClose]);

  const { icon: Icon, bgColor, borderColor, textColor } = toastIcons[type] || toastIcons.info;

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-xl border
        ${bgColor} ${borderColor} ${textColor}
        transition-all duration-300
        ${isExiting ? 'translate-x-96 opacity-0' : 'translate-x-0 opacity-100'}
        animate-slide-in-right
      `}
    >
      <Icon size={18} className="flex-shrink-0 mt-0.5" />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onClose(id), 300);
        }}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/20 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
