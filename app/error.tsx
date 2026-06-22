'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full glass-panel p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-500/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="h-16 w-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mb-2">
            Terjadi Kesalahan Sistem
          </h1>
          
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Maaf, kami mengalami kendala teknis saat memuat halaman ini. Silakan coba muat ulang atau kembali ke beranda.
          </p>

          {/* Optional: Show error message in dev mode only if needed, but for safety keep it simple */}
          <div className="bg-black/20 border border-white/5 rounded-xl p-3 mb-8 text-left w-full overflow-hidden">
            <p className="text-xs text-red-400/80 font-mono break-words">
              {error.message || 'Unknown Error'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => reset()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/10 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              Coba Lagi
            </button>
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-sm font-semibold transition-all duration-200"
            >
              <Home className="h-4 w-4" />
              Ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
