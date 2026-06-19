'use client';

import { useEffect, useState } from 'react';
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  TrendingUp,
  Plus,
  RefreshCw,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';

interface StatSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  totalSavings: number;
}

interface TrendData {
  name: string;
  income: number;
  expenses: number;
}

interface BreakdownData {
  name: string;
  value: number;
  color: string;
}

interface DashboardStats {
  summary: StatSummary;
  categoryBreakdown: BreakdownData[];
  monthlyTrends: TrendData[];
  recentTransactions: any[];
  savingsGoals: any[];
}

export default function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data && data.summary) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load user info', err);
      }
    }
    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Loading your dashboard...</p>
      </div>
    );
  }

  const summary = stats?.summary || { totalIncome: 0, totalExpense: 0, netSavings: 0, totalSavings: 0 };
  const monthlyTrends = stats?.monthlyTrends || [];
  const categoryBreakdown = stats?.categoryBreakdown || [];
  const recentTransactions = stats?.recentTransactions || [];
  const savingsGoals = stats?.savingsGoals || [];

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-500">
            Halo {user ? user.name.split(' ')[0] : ''} 😊
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time overview of your family budget and cash flow.</p>
        </div>
        <div className="md:flex gap-3 hidden">
          <Link
            href="/transactions"
            className="flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Net Savings */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Balance</p>
          <h3 className={`text-2xl font-bold mt-2 ${summary.netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(summary.netSavings)}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Cumulative cash balance</p>
        </div>

        {/* Total Income */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Income</p>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {formatCurrency(summary.totalIncome)}
          </h3>
          <p className="text-[10px] text-blue-400 font-medium mt-2">All-time earnings registered</p>
        </div>

        {/* Total Expense */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ArrowDownLeft className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</p>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {formatCurrency(summary.totalExpense)}
          </h3>
          <p className="text-[10px] text-red-400 font-medium mt-2">All-time cash outlays registered</p>
        </div>

        {/* Total Savings Goals */}
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PiggyBank className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Savings Balance</p>
          <h3 className="text-2xl font-bold text-slate-200 mt-2">
            {formatCurrency(summary.totalSavings)}
          </h3>
          <p className="text-[10px] text-amber-400 font-medium mt-2">Secured in target goals</p>
        </div>
      </div>

      {/* Visualizations and breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">Monthly Cash Flow Trends</h2>
          </div>
          <div className="flex-1 min-h-[300px]">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} name="Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2.5} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Inflow/Outflow trends appear after adding transactions
              </div>
            )}
          </div>
        </div>

        {/* Expenses Category Pie Chart */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col">
          <h2 className="text-base font-semibold text-slate-100 mb-6">Expense Breakdown</h2>
          <div className="flex-1 flex flex-col items-center justify-center">
            {categoryBreakdown.length > 0 ? (
              <>
                <div className="relative w-full h-[200px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest">Outlays</span>
                    <p className="text-base font-extrabold text-slate-200 mt-0.5">{formatCurrency(summary.totalExpense)}</p>
                  </div>
                </div>

                {/* Labels List */}
                <div className="w-full space-y-2 mt-4 max-h-[140px] overflow-y-auto pr-1">
                  {categoryBreakdown.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-400 font-medium">{entry.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">
                          {summary.totalExpense > 0 ? ((entry.value / summary.totalExpense) * 100).toFixed(1) : 0}%
                        </span>
                        <span className="font-semibold text-slate-200">{formatCurrency(entry.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-sm text-center py-12">
                Expenses categories appear after adding expense records
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second sections - Recent Transactions & savings progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-slate-100">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs text-blue-400 hover:text-blue-500 font-semibold">
              View All
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const isExpense = tx.type === 'EXPENSE';
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isExpense
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                        {isExpense ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-200 text-sm">{tx.description || 'No description'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-medium">
                            {tx.category.name}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {format(new Date(tx.date), 'dd MMM yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
                      {isExpense ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500 text-sm text-center py-10">
                No recent transactions registered.
              </div>
            )}
          </div>
        </div>

        {/* Savings progress tracker overview */}
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-slate-100">Savings Goals</h2>
            <Link href="/savings" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold">
              Manage Goals
            </Link>
          </div>
          <div className="space-y-5">
            {savingsGoals.length > 0 ? (
              savingsGoals.map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-200">{goal.name}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Target: {formatCurrency(goal.targetAmount, goal.currency)}</p>
                      </div>
                      <span className="font-bold text-slate-300">{percent}%</span>
                    </div>
                    {/* Progress slider bar */}
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color || '#10b981'
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Saved: {formatCurrency(goal.currentAmount, goal.currency)}</span>
                      {goal.deadline && (
                        <span>Due: {format(new Date(goal.deadline), 'dd MMM yy')}</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500 text-sm text-center py-10">
                No savings goals created yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
