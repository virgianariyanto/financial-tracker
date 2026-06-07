'use client';

import { useState } from 'react';
import Sidebar from '@/components/ui/sidebar';
import { Menu } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-full flex text-slate-200 w-full">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 pl-0 lg:pl-[260px] min-h-screen flex flex-col w-full">
        {/* Mobile Header */}
        <header className="flex h-16 items-center px-6 border-b border-white/8 justify-between lg:hidden bg-slate-950/60 backdrop-blur-xl sticky top-0 z-20 w-full">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
              F
            </div>
            <span className="text-sm font-semibold tracking-tight text-white font-sans">Fintrack</span>
          </div>
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
