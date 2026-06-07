'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  Info,
  CheckCircle2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import SavingsGoalForm from '@/components/forms/savings-goal-form';
import SavingsContributionForm from '@/components/forms/savings-contribution-form';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  deadline: string | null;
  icon: string;
  color: string;
  _count?: {
    contributions: number;
  };
}

interface Contribution {
  id: string;
  amount: number;
  date: string;
  note: string | null;
}

interface FullSavingsGoal extends SavingsGoal {
  contributions: Contribution[];
}

export default function SavingsClient() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<FullSavingsGoal | null>(null);
  const [activeGoalForContribution, setActiveGoalForContribution] = useState<SavingsGoal | null>(null);
  
  const [error, setError] = useState('');
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/savings');
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load savings goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddOrEditGoal = async (payload: any) => {
    try {
      if (editingGoal) {
        const res = await fetch(`/api/savings/${editingGoal.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update savings goal');
        }
      } else {
        const res = await fetch('/api/savings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create savings goal');
        }
      }
      setIsGoalModalOpen(false);
      setEditingGoal(null);
      fetchGoals();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this savings goal? This will also delete all contribution logs.')) return;
    try {
      const res = await fetch(`/api/savings/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Failed to delete goal');
        return;
      }
      setIsDetailModalOpen(false);
      setSelectedGoal(null);
      fetchGoals();
    } catch (err) {
      console.error('Failed to delete goal', err);
      setError('Network error while deleting goal');
    }
  };

  const handleOpenDetail = async (goal: SavingsGoal) => {
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/savings/${goal.id}`);
      const data = await res.json();
      setSelectedGoal(data);
    } catch (err) {
      console.error('Failed to load goal detail', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddContribution = async (payload: any) => {
    if (!activeGoalForContribution) return;
    try {
      const res = await fetch(`/api/savings/${activeGoalForContribution.id}/contributions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add contribution');
      }
      setIsContributionModalOpen(false);
      setActiveGoalForContribution(null);
      fetchGoals();
      // If detail modal is currently open, reload it too
      if (selectedGoal && selectedGoal.id === activeGoalForContribution.id) {
        handleOpenDetail(selectedGoal);
      }
    } catch (err: any) {
      throw err;
    }
  };

  const handleDeleteContribution = async (contributionId: string) => {
    if (!confirm('Are you sure you want to delete this contribution?')) return;
    try {
      const res = await fetch(`/api/savings/contributions/${contributionId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to delete contribution');
        return;
      }
      if (selectedGoal) {
        handleOpenDetail(selectedGoal);
      }
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Savings Goals</h1>
          <p className="text-slate-400 text-sm">
            Set aside money and track your progress toward your dreams.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all cursor-pointer font-medium"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Savings Goal
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400/50 hover:text-red-400 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4 border border-white/5">
            <TrendingUp className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No savings goals found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Create your first savings goal now to start tracing contributions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const progressPercent = Math.min(
              100,
              Math.max(0, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0)
            );
            const daysLeft = goal.deadline
              ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={goal.id}
                className="glass-panel rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all group relative overflow-hidden"
              >
                {/* Visual Glow */}
                <div
                  className="absolute top-0 right-0 h-32 w-32 rounded-full filter blur-[50px] opacity-[0.03] pointer-events-none"
                  style={{ backgroundColor: goal.color }}
                />

                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-base border flex-shrink-0 font-bold"
                        style={{
                          backgroundColor: `${goal.color}15`,
                          color: goal.color,
                          borderColor: `${goal.color}30`,
                        }}
                      >
                        {goal.icon.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-200 line-clamp-1">{goal.name}</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {goal.currency} goal
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                        title="Edit Goal"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors"
                        title="Delete Goal"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-400">Progress</span>
                      <span className="text-xs font-semibold text-slate-200">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    {/* Progress Bar Container */}
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Amount Breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Saved</p>
                      <p className="text-xs font-bold text-slate-200">
                        {formatCurrency(goal.currentAmount, goal.currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Target</p>
                      <p className="text-xs font-bold text-slate-300">
                        {formatCurrency(goal.targetAmount, goal.currency)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Actions / Deadline */}
                <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {daysLeft !== null ? (
                      daysLeft > 0 ? (
                        <span>{daysLeft} days left</span>
                      ) : daysLeft === 0 ? (
                        <span className="text-amber-400 font-semibold">Ends today!</span>
                      ) : (
                        <span className="text-red-400/80">Ended</span>
                      )
                    ) : (
                      <span>No deadline</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDetail(goal)}
                      className="px-2.5 py-1.5 rounded-lg border border-white/5 text-slate-300 hover:bg-white/5 transition-all flex items-center gap-1 font-medium cursor-pointer"
                    >
                      Details
                      <ChevronRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setActiveGoalForContribution(goal);
                        setIsContributionModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-emerald-400 font-semibold transition-all cursor-pointer"
                    >
                      + Save
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Form Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
      >
        <SavingsGoalForm
          initialValues={editingGoal}
          onSubmit={handleAddOrEditGoal}
          onCancel={() => {
            setIsGoalModalOpen(false);
            setEditingGoal(null);
          }}
        />
      </Modal>

      {/* Contribution Form Modal */}
      <Modal
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setActiveGoalForContribution(null);
        }}
        title={`Add Contribution to ${activeGoalForContribution?.name || ''}`}
      >
        <SavingsContributionForm
          goalCurrency={activeGoalForContribution?.currency || 'IDR'}
          onSubmit={handleAddContribution}
          onCancel={() => {
            setIsContributionModalOpen(false);
            setActiveGoalForContribution(null);
          }}
        />
      </Modal>

      {/* Goal Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedGoal(null);
        }}
        title={selectedGoal ? selectedGoal.name : 'Loading goal details...'}
      >
        {loadingDetail ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <RefreshCw className="h-6 w-6 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading contributions...</p>
          </div>
        ) : selectedGoal ? (
          <div className="space-y-5">
            {/* Quick Status Block */}
            <div className="rounded-2xl p-4 bg-slate-900/60 border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Progress</p>
                <p className="text-lg font-bold text-slate-200">
                  {formatCurrency(selectedGoal.currentAmount, selectedGoal.currency)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    of {formatCurrency(selectedGoal.targetAmount, selectedGoal.currency)}
                  </span>
                </p>
              </div>
              {selectedGoal.currentAmount >= selectedGoal.targetAmount ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </div>
              )}
            </div>

            {/* Contributions Log */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Contribution History
              </h4>

              {selectedGoal.contributions.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500 border border-dashed border-white/5 rounded-xl">
                  No contributions made yet. Press "+ Add" to add money to this goal.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedGoal.contributions.map((c) => (
                    <div
                      key={c.id}
                      className="glass-panel p-3 rounded-xl flex items-center justify-between hover:border-white/5"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-200">
                          +{formatCurrency(c.amount, selectedGoal.currency)}
                        </p>
                        <p className="text-[9px] text-slate-500 mt-0.5">
                          {new Date(c.date).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                          {c.note && <span className="text-slate-400"> — {c.note}</span>}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteContribution(c.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handleDeleteGoal(selectedGoal.id)}
                className="px-3 py-2 rounded-xl border border-red-500/10 text-red-400 hover:bg-red-500/5 text-xs font-semibold transition-all cursor-pointer"
              >
                Delete Goal
              </button>
              <button
                onClick={() => {
                  setActiveGoalForContribution(selectedGoal);
                  setIsContributionModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                + Add Contribution
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
