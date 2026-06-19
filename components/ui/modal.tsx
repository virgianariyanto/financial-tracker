'use client';

import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      {/* Backdrop click close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg bg-modal-bg border border-modal-border shadow-2xl shadow-modal-shadow rounded-2xl p-6 overflow-hidden animate-scale-in z-10"
      >
        {/* Top Accent Gradient Border */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#10b981] to-transparent opacity-80" />

        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <h2 className="text-lg font-bold text-foreground tracking-wide">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all active:scale-90 duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mt-5 max-h-[80vh] overflow-y-auto pr-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

