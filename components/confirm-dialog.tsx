'use client';

import { createContext, useCallback, useContext, useRef, useState, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface ConfirmContextValue {
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

interface DialogState extends ConfirmOptions {
  open: boolean;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({ open: false, message: '' });
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ ...options, open: true });
    });
  }, []);

  const handleConfirm = () => {
    resolverRef.current?.(true);
    setDialog((d) => ({ ...d, open: false }));
  };

  const handleCancel = () => {
    resolverRef.current?.(false);
    setDialog((d) => ({ ...d, open: false }));
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {dialog.open && (
        <ConfirmDialog
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.cancelLabel}
          variant={dialog.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx.showConfirm;
}

/* ─── UI Component ───────────────────────────────────────────── */

interface ConfirmDialogProps {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      iconBg: 'bg-red-500/10 border-red-500/20',
      glow: 'shadow-red-500/8',
      confirmBtn: 'bg-red-500 hover:bg-red-600 shadow-red-500/20',
      accentBar: 'from-red-500/30',
      emoji: '🗑️',
    },
    warning: {
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      glow: 'shadow-amber-500/8',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
      accentBar: 'from-amber-500/30',
      emoji: '⚠️',
    },
    info: {
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      glow: 'shadow-blue-500/8',
      confirmBtn: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20',
      accentBar: 'from-blue-500/30',
      emoji: 'ℹ️',
    },
  };

  const cfg = variantConfig[variant];

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Card */}
      <div
        className={`
          relative w-full max-w-sm rounded-3xl overflow-hidden
          border shadow-2xl ${cfg.glow}
          animate-scale-in
        `}
        style={{
          backgroundColor: 'var(--confirm-bg)',
          borderColor: 'var(--confirm-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent gradient bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${cfg.accentBar} to-transparent`} />

        {/* Subtle inner glow */}
        <div
          className="absolute inset-0 bg-gradient-to-b to-transparent pointer-events-none rounded-3xl"
          style={{ '--tw-gradient-from': 'var(--confirm-inner-glow)' } as React.CSSProperties}
        />

        <div className="relative p-6 space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${cfg.iconBg}`}>
              <span className="text-2xl leading-none select-none">{cfg.emoji}</span>
            </div>
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            {title && (
              <h3
                className="text-base font-bold tracking-tight"
                style={{ color: 'var(--confirm-title)' }}
              >
                {title}
              </h3>
            )}
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--confirm-message)' }}
            >
              {message}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px" style={{ backgroundColor: 'var(--confirm-divider)' }} />

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all"
              style={{
                borderColor: 'var(--confirm-cancel-border)',
                color: 'var(--confirm-cancel-text)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.color = 'var(--confirm-cancel-hover-text)';
                el.style.backgroundColor = 'var(--confirm-cancel-hover-bg)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.color = 'var(--confirm-cancel-text)';
                el.style.backgroundColor = 'transparent';
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-lg ${cfg.confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
