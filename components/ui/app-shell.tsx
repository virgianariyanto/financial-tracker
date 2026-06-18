'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/sidebar';
import { Menu, Bell, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // ✅ ALL hooks must be declared at the top before any early return
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    };
    setCurrentDate(new Date().toLocaleDateString('en-US', options));
  }, []);

  useEffect(() => {
    if (isAuthPage) return;
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
  }, [pathname, isAuthPage]);

  // Helper: get user initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Early return AFTER all hooks
  if (isAuthPage) {
    return <div className="min-h-screen w-full bg-[#111318] text-slate-200 flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-full flex text-slate-200 w-full bg-[#111318]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 pl-0 lg:pl-[260px] min-h-screen flex flex-col w-full">
        {/* Global Premium Header */}
        <header className="flex h-16 items-center justify-between px-6 bg-[#111318]/90 backdrop-blur-md sticky top-0 z-20 w-full">
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Date Display */}
            {currentDate && (
              <span className="hidden md:inline-block text-md font-semibold text-slate-400 tracking-wide pl-2 font-sans">
                {currentDate}
              </span>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button className="relative p-2.5 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer">
              <Bell className="h-4.5 w-4.5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#111318]" />
            </button>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-2 border-l border-white/8">
              {user && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 focus:outline-none cursor-pointer">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                      <p className="text-[10px] text-slate-500">{user.email}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shadow-md shadow-emerald-500/5">
                      {getInitials(user.name)}
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#24272C] backdrop-blur-xl rounded-xl shadow-lg border border-white/10 z-20">
                      <ul className="py-1">
                        <li className="cursor-pointer">
                          <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-white/5">
                            <Settings className="h-4 w-4 mr-2" /> Settings
                          </Link>
                        </li>
                        <li className="cursor-pointer">
                          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 cursor-pointer">
                            <LogOut className="h-4 w-4 mr-2" /> Sign Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
