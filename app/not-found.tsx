'use client';

import Link from 'next/link';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[80vh]  px-6 text-center animate-fade-in">
      {/* Visual Element */}
      <div className="relative mb-8">
        {/* Glow behind the icon */}
        <div className="absolute inset-0 bg-emerald-500/20 blur-[50px] rounded-full" />

        {/* Floating icon box */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] bg-slate-900/60 border border-white/10 shadow-[0_0_40px_rgba(16,185,129,0.15)] backdrop-blur-xl">
          <FileQuestion className="h-10 w-10 text-emerald-400" />
        </div>
      </div>

      {/* Text Content */}
      <h1 className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 tracking-tighter mb-4">
        404
      </h1>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mb-3 tracking-tight">
        Page Not Found
      </h2>
      <p className="text-slate-400 max-w-sm mx-auto mb-10 text-sm leading-relaxed">
        The page you are looking for doesn't exist or has been moved. Let's get you back on track.
      </p>

      {/* Actions */}
      <div className="flex justify-center w-full">
        <button
          onClick={() => window.history.back()}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-sm font-semibold text-slate-200 shadow-lg shadow-black/20 transition-all active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          Go Back
        </button>
      </div>
    </div>
  );
}
