'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  FolderTree,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Percent,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import Modal from '@/components/ui/modal';
import BudgetForm from '@/components/forms/budget-form';

interface CategoryBudget {
  id: string | null;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  currency: string;
  actual: number;
}

export default function BudgetsClient() {
  const [budgets, setBudgets] = useState<CategoryBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);

  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [error, setError] = useState('');

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      const data = await res.json();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const handleAddOrEditBudget = async (payload: any) => {
    try {
      if (editingBudget?.id) {
        // PATCH
        const res = await fetch(`/api/budgets/${editingBudget.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: payload.amount,
            currency: payload.currency,
          }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update budget');
        }
      } else {
        // POST / Upsert
        const res = await fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to set budget');
        }
      }
      setIsModalOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to remove the budget limit for this category?')) return;
    try {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to delete budget limit');
        return;
      }
      fetchBudgets();
    } catch (err) {
      console.error(err);
      setError('Network error while deleting budget limit');
    }
  };

  const getMonthName = (m: number) => {
    const d = new Date();
    d.setMonth(m - 1);
    return d.toLocaleString('en-US', { month: 'long' });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Aggregated Summary values
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalActual = budgets.reduce((sum, b) => sum + b.actual, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">Spending Plans (Budgets)</h1>
          <p className="text-slate-400 text-sm">
            Control your expenses by setting limits on your category outflows.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-[#064e3b] shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Set Category Budget
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Month Navigator */}
      <div className="flex items-center justify-between glass-panel p-3.5 rounded-2xl">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 rounded-lg border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
          {getMonthName(selectedMonth)} {selectedYear}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-1.5 rounded-lg border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Top Level Summary Card */}
      {budgets.length > 0 && totalBudgeted > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Budgeted</p>
            <p className="text-base font-bold text-slate-300 mt-1">{formatCurrency(totalBudgeted, 'IDR')}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Outflow</p>
            <p className="text-base font-bold text-slate-200 mt-1">{formatCurrency(totalActual, 'IDR')}</p>
          </div>
          <div className="glass-panel p-4 rounded-xl">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Status</p>
            <p className={`text-base font-bold mt-1 ${totalActual > totalBudgeted ? 'text-red-400' : 'text-emerald-400'}`}>
              {totalActual > totalBudgeted
                ? `Over limit by ${formatCurrency(totalActual - totalBudgeted, 'IDR')}`
                : `${formatCurrency(totalBudgeted - totalActual, 'IDR')} remaining`
              }
            </p>
          </div>
        </div>
      )}

      {/* Grid of Category Budgets */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading budgets...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4 border border-white/5">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No expense categories found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Please create expense categories first in the Category Management tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const hasLimit = b.amount > 0;
            const percentage = hasLimit ? Math.min(100, (b.actual / b.amount) * 100) : 0;
            const isOverBudget = hasLimit && b.actual > b.amount;

            // Progress Bar Color mapping
            let progressColor = b.categoryColor;
            if (hasLimit) {
              if (percentage > 100) progressColor = '#f43f5e'; // Red
              else if (percentage >= 80) progressColor = '#f59e0b'; // Amber
            }

            return (
              <div
                key={b.categoryId}
                className="glass-panel p-5 rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all group"
              >
                <div className="space-y-4">
                  {/* Category Details & Actions */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0"
                        style={{
                          backgroundColor: `${b.categoryColor}15`,
                          color: b.categoryColor,
                          borderColor: `${b.categoryColor}30`,
                        }}
                      >
                        {(() => {
                          const IconComponent = (Icons as any)[b.categoryIcon] || Icons.HelpCircle;
                          return <IconComponent className="h-5 w-5" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200">{b.categoryName}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                          {hasLimit ? `Limit: ${formatCurrency(b.amount, b.currency)}` : 'No Limit Set'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasLimit ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingBudget(b);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors opacity-0 group-hover:opacity-100"
                            title="Edit Limit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          {b.id && (
                            <button
                              onClick={() => handleDeleteBudget(b.id!)}
                              className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete Limit"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingBudget(b);
                            setIsModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                        >
                          + Set Budget
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spending Progress Meters */}
                  {hasLimit && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">
                          Spent: <span className="font-bold text-slate-300">{formatCurrency(b.actual, b.currency)}</span>
                        </span>
                        <span className={`font-semibold ${isOverBudget ? 'text-red-400' : 'text-slate-400'}`}>
                          {percentage.toFixed(0)}%
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="h-1.5 w-full bg-slate-950 border border-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: progressColor,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Text alert when exceeding */}
                  {isOverBudget && (
                    <div className="flex items-center gap-2 text-[10px] text-red-400 font-medium bg-red-500/5 px-2.5 py-1 rounded-lg border border-red-500/10 w-fit">
                      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                      <span>Overspent by {formatCurrency(b.actual - b.amount, b.currency)}!</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget Limit Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingBudget(null);
        }}
        title={editingBudget?.id ? 'Edit Category Budget' : 'Set Category Budget'}
      >
        <BudgetForm
          initialValues={editingBudget?.id ? editingBudget : null}
          defaultMonth={selectedMonth}
          defaultYear={selectedYear}
          onSubmit={handleAddOrEditBudget}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingBudget(null);
          }}
        />
      </Modal>
    </div>
  );
}
