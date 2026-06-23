'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  TrendingUp,
  Settings,
  FolderTree,
  Wallet,
  Shield,
  Users,
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
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    fetchUser();
  }, [pathname]);

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
          "fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-sidebar-bg transition-transform duration-300 lg:translate-x-0 lg:bg-sidebar-bg lg:backdrop-blur-xl",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 gap-2 justify-between">
          <div className="flex items-center md:mx-auto gap-2">
            <Link href="/" className="flex items-center">
              <img src="/image/FINORA.png" alt="Finora Logo" className="h-12 object-contain hidden [.light_&]:block" />
              <img src="/image/FINORA_white.png" alt="Finora Logo" className="h-12 object-contain block [.light_&]:hidden" />
            </Link>
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
                    ? 'bg-emerald-500 text-white border border-emerald-500/20 shadow-md shadow-emerald-500/5'
                    : 'text-slate-400 border border-transparent hover:bg-white/5 hover:text-slate-200'
                )}
              >
                <Icon className={clsx(
                  'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                )} />
                {item.name}
              </Link>
            );
          })}

          {/* Admin menu — hanya muncul jika role ADMIN */}
          {user?.role === 'ADMIN' && (
            <div className="pt-3 mt-2 border-t border-white/8">
              <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                Administration
              </p>
              <Link
                href="/admin"
                onClick={onClose}
                className={clsx(
                  'group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50',
                  pathname.startsWith('/admin')
                    ? 'bg-amber-500 text-white border border-amber-500/20 shadow-md shadow-amber-500/5'
                    : 'text-amber-400 border border-amber-500/10 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-300'
                )}
              >
                <Users className={clsx(
                  'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                  pathname.startsWith('/admin') ? 'text-white' : 'text-amber-400'
                )} />
                User Management
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 bg-sidebar-bg/70 backdrop-blur-xl rounded-xl flex flex-col gap-4 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-center font-semibold text-slate-600">Copyright © 2026 Finora</p>
          </div>
        </div>
      </aside>
    </>
  );
}
