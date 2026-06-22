'use client';

import { useEffect, useState, startTransition } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Filter,
  RefreshCw,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Modal from '@/components/ui/modal';
import TransactionForm from '@/components/forms/transaction-form';
import { formatCurrency } from '@/lib/currencies';
import { format } from 'date-fns';
import { useCurrency } from '@/components/currency-context';
import { useToast } from '@/components/toast-context';
import { useConfirm } from '@/components/confirm-dialog';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  tags: string[];
  categoryId: string;
  category: Category;
}

export default function TransactionsClient() {
  const { convert, defaultCurrency } = useCurrency();
  const { showToast } = useToast();
  const showConfirm = useConfirm();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 8;

  const fetchTransactions = async (currentPage = page) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.set('search', search);
      if (typeFilter) queryParams.set('type', typeFilter);
      if (catFilter) queryParams.set('categoryId', catFilter);
      if (startDate) queryParams.set('startDate', startDate);
      if (endDate) queryParams.set('endDate', endDate);
      queryParams.set('page', String(currentPage));
      queryParams.set('limit', String(LIMIT));

      const res = await fetch(`/api/transactions?${queryParams.toString()}`);
      const data = await res.json();
      setTransactions(Array.isArray(data.data) ? data.data : []);
      setTotal(data.total ?? 0);
      setTotalPages(data.totalPages ?? 1);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchTransactions(1);
  }, [typeFilter, catFilter, startDate, endDate]);

  useEffect(() => {
    fetchTransactions(page);
  }, [page]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions(1);
  };

  const handleAddOrEdit = async (payload: any) => {
    try {
      if (editingTransaction) {
        const res = await fetch(`/api/transactions/${editingTransaction.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsModalOpen(false);
          setEditingTransaction(null);
          fetchTransactions();
          showToast('Transaction updated successfully!', 'success');
        } else {
          showToast('Failed to update transaction.', 'error');
        }
      } else {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setIsModalOpen(false);
          fetchTransactions();
          showToast('Transaction added successfully!', 'success');
        } else {
          showToast('Failed to add transaction.', 'error');
        }
      }
    } catch (err) {
      console.error('Failed to save transaction', err);
      showToast('A network error occurred.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({
      title: 'Delete Transaction',
      message: 'Are you sure you want to delete this transaction? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchTransactions();
        showToast('Transaction deleted.', 'info');
      } else {
        showToast('Failed to delete transaction.', 'error');
      }
    } catch (err) {
      console.error('Failed to delete transaction', err);
      showToast('A network error occurred.', 'error');
    }
  };

  const resetFilters = () => {
    startTransition(() => {
      setSearch('');
      setTypeFilter('');
      setCatFilter('');
      setStartDate('');
      setEndDate('');
      setPage(1);
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Transactions</h1>
          <p className="text-slate-400 text-sm">Manage, filter, and track all your family expenses and income.</p>
        </div>
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Transaction
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 glass-input text-sm"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="glass-input text-sm"
            >
              <option value="">All Types</option>
              <option value="EXPENSE">Expense</option>
              <option value="INCOME">Income</option>
            </select>

            {/* Category Filter */}
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="glass-input text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-white/5 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <Calendar className="h-4 w-4" />
            Date Range:
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input text-xs py-1.5"
            />
            <span className="text-slate-500 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input text-xs py-1.5"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-sm text-slate-400">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4 border border-white/5">
              <Filter className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No transactions found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">Try modifying your filters or add a new transaction to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Tags</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {transactions.map((tx) => {
                  const isExpense = tx.type === 'EXPENSE';
                  return (
                    <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                      {/* Description & Type Icon */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${isExpense
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {isExpense ? <ArrowDownLeft className="h-4.5 w-4.5" /> : <ArrowUpRight className="h-4.5 w-4.5" />}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-200">{tx.description || 'No description'}</p>
                            <p className="text-xs text-slate-500 capitalize">{tx.type.toLowerCase()}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${tx.category.color}15`,
                            color: tx.category.color,
                            borderColor: `${tx.category.color}30`
                          }}
                        >
                          {tx.category.name}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4.5 text-slate-300">
                        {format(new Date(tx.date), 'dd MMM yyyy')}
                      </td>

                      {/* Tags */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {tx.tags.length > 0 ? (
                            tx.tags.map((tag) => (
                              <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] text-slate-400 font-medium">
                                <Tag className="h-2.5 w-2.5" />
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-xs">-</span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className={`px-6 py-4.5 text-right font-bold text-base ${isExpense ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isExpense ? '-' : '+'}{formatCurrency(convert(tx.amount, tx.currency), defaultCurrency)}
                      </td>

                      {/* Action buttons */}
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingTransaction(tx);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between glass-panel rounded-2xl px-5 py-3">
          <p className="text-xs text-slate-500">
            Showing{' '}
            <span className="font-semibold text-slate-300">
              {Math.min((page - 1) * LIMIT + 1, total)}–{Math.min(page * LIMIT, total)}
            </span>{' '}
            of <span className="font-semibold text-slate-300">{total}</span> transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <span className="text-xs text-slate-500 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTransaction(null);
        }}
        title={editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
      >
        <TransactionForm
          initialValues={editingTransaction}
          onSubmit={handleAddOrEdit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
}
