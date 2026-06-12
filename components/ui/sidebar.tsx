'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  Settings,
  FolderTree,
  Wallet
} from 'lucide-react';
import { clsx } from 'clsx';

const menuItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { name: 'Savings Goals', href: '/savings', icon: PiggyBank },
  { name: 'Budgets', href: '/budgets', icon: TrendingUp },
  { name: 'Categories', href: '/categories', icon: FolderTree },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        onClick={onClose}
        className={clsx(
          "fixed inset-0 z-30 bg-black/60 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/8 bg-[#26282A] transition-transform duration-300 lg:translate-x-0 lg:bg-[#26282A] lg:backdrop-blur-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-white/8 gap-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#CCFF00] text-[#556D00]">
              <Wallet className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white font-sans">Fintrack</h1>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">Financial Hub</p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50',
                  isActive
                    ? 'bg-[#CCFF00] text-[#556D00] border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200'
                )}
              >
                <Icon className={clsx(
                  'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-[#556D00]' : 'text-slate-400 group-hover:text-slate-200'
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/8 bg-[#26282A]">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="h-9 w-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-sm">
              FH
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">Personal & Family</p>
              <p className="text-[10px] text-slate-500">Shared workspace</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
