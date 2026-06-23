'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/ui/sidebar';
import { Menu, Bell, Settings, LogOut, Sun, Moon, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useCurrency } from '@/components/currency-context';
import { formatCurrency } from '@/lib/currencies';

export default function AppShell({ children }: { children: React.ReactNode }) {
  // ✅ ALL hooks must be declared at the top before any early return
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [currentDate, setCurrentDate] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [budgetWarnings, setBudgetWarnings] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const pathname = usePathname();
  const router = useRouter();
  
  const { defaultCurrency } = useCurrency();

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light');
    setTheme(isLight ? 'light' : 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

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

  useEffect(() => {
    if (isAuthPage || !defaultCurrency) return;
    async function fetchBudgets() {
      try {
        const res = await fetch(`/api/budgets?currency=${defaultCurrency}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const warnings = data.filter(b => b.id && b.amount > 0 && (b.actual / b.amount) >= 0.8);
          setBudgetWarnings(warnings);
        }
      } catch (err) {
        console.error('Failed to load budget warnings', err);
      }
    }
    fetchBudgets();
  }, [pathname, isAuthPage, defaultCurrency]);

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
    return <div className="min-h-screen w-full bg-background text-slate-200 flex flex-col">{children}</div>;
  }

  return (
    <div className="min-h-full flex text-slate-200 w-full bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 pl-0 lg:pl-[260px] print:pl-0 min-h-screen flex flex-col w-full">
        {/* Global Premium Header */}
        <header className="print:hidden flex h-16 items-center justify-between px-6 bg-header-bg backdrop-blur-md sticky top-0 z-20 w-full">
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
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2.5 rounded-xl border border-white/5 hover:bg-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                <Bell className="h-4.5 w-4.5" />
                {budgetWarnings.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
              </button>
              
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-sidebar-bg backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 z-50 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/10 bg-slate-900/40">
                    <h4 className="text-sm font-bold text-slate-200">Notifications</h4>
                  </div>
                  <div className="max-h-80 overflow-y-auto p-2">
                    {budgetWarnings.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">
                        No new notifications
                      </div>
                    ) : (
                      budgetWarnings.map((w, i) => {
                        const pct = Math.round((w.actual / w.amount) * 100);
                        const isExceeded = pct >= 100;
                        return (
                          <Link href="/budgets" key={i} onClick={() => setBellOpen(false)} className="flex gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors items-start">
                            <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isExceeded ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                              <p className={`text-xs font-semibold ${isExceeded ? 'text-red-500' : 'text-amber-500'}`}>
                                {isExceeded ? 'Budget Exceeded!' : 'Budget Warning'}
                              </p>
                              <p className="text-xs text-slate-300 mt-1">
                                <strong className="text-slate-200">{w.categoryName}</strong> is at {pct}% ({formatCurrency(w.actual, defaultCurrency)} / {formatCurrency(w.amount, defaultCurrency)})
                              </p>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-3 pl-2 border-l border-white/8">
              {user && (
                <div className="relative">
                  <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2.5 focus:outline-none cursor-pointer">
                    <div className="hidden sm:block text-right">
                       <div className="flex items-center justify-end gap-1.5">
                         <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                         {user.role === 'ADMIN' && (
                           <span className="inline-flex items-center rounded-full bg-amber-500/15 border border-amber-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
                             Admin
                           </span>
                         )}
                       </div>
                       <p className="text-[10px] text-slate-500">{user.email}</p>
                     </div>
                    <div className="h-9 w-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400 text-xs shadow-md shadow-emerald-500/5">
                      {getInitials(user.name)}
                    </div>
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-sidebar-bg backdrop-blur-xl rounded-xl shadow-lg border border-white/10 z-20">
                      <ul className="py-1">
                        <li className="cursor-pointer">
                          <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                            <Settings className="h-4 w-4 mr-2" /> Settings
                          </Link>
                        </li>
                        <li className="cursor-pointer">
                          <button onClick={handleLogout} className="flex w-full items-center px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 cursor-pointer">
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

        <main className="flex-1 p-6 md:p-8 print:p-0 overflow-y-auto max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
