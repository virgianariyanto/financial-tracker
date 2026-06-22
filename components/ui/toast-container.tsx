'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useToast, Toast, ToastType } from '@/components/toast-context';

const DURATION = 3500;

/* Simple elegant config */
const CONFIG: Record<ToastType, {
  icon: React.ElementType;
  iconColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconColor: 'text-emerald-500',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
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
        glass-panel relative flex items-center gap-3.5 pl-4 pr-3.5 py-3 rounded-xl
        w-auto max-w-[calc(100vw-2rem)] pointer-events-auto overflow-hidden
        transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${visible && !leaving
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-8 scale-95'
        }
      `}
    >
      {/* Icon */}
      <div className={`shrink-0 ${cfg.iconColor}`}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[13px] font-medium leading-snug text-slate-700 dark:text-slate-200" style={{ color: 'var(--foreground)' }}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100/50 dark:hover:text-slate-100 dark:hover:bg-white/10 transition-all"
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
