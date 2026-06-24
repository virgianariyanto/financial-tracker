'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, Toast, ToastType } from '@/components/toast-context';

const DURATION = 3500;

/* Simple elegant config */
const CONFIG: Record<ToastType, {
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    textColor: 'text-emerald-400',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    textColor: 'text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    textColor: 'text-amber-400',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    textColor: 'text-blue-400',
  },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = CONFIG[toast.type];
  const Icon = cfg.icon;

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 16);

    timerRef.current = setTimeout(() => {
      handleClose();
    }, DURATION);

    return () => {
      clearTimeout(enterTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLeaving(true);
    setTimeout(() => removeToast(toast.id), 350);
  };

  return (
    <div
      className={`
        relative flex items-center gap-3.5 pl-4 pr-3.5 py-3 rounded-xl border
        w-auto max-w-[calc(100vw-2rem)] pointer-events-auto overflow-hidden
        backdrop-blur-md shadow-lg transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${cfg.bgColor} ${cfg.borderColor}
        ${visible && !leaving
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
        }
      `}
    >
      {/* Icon */}
      <div className={`shrink-0 ${cfg.iconColor}`}>
        <Icon className="h-4.5 w-4.5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className={`text-xs font-semibold leading-snug ${cfg.textColor}`}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className={`shrink-0 p-1 rounded-lg transition-all hover:bg-white/10 ${cfg.textColor}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 items-end pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
