'use client';

import { useEffect, useState } from 'react';
import {
  Plus,
  Edit3,
  Trash2,
  RefreshCw,
  FolderTree,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import Modal from '@/components/ui/modal';
import CategoryForm from '@/components/forms/category-form';
import { useToast } from '@/components/toast-context';
import { useConfirm } from '@/components/confirm-dialog';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
  isDefault: boolean;
  _count?: {
    transactions: number;
    budgets: number;
  };
}

export default function CategoriesClient() {
  const { showToast } = useToast();
  const showConfirm = useConfirm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [typeFilter, setTypeFilter] = useState<'' | 'INCOME' | 'EXPENSE'>('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (typeFilter) queryParams.set('type', typeFilter);
      const res = await fetch(`/api/categories?${queryParams.toString()}`);
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  const handleAddOrEdit = async (payload: any) => {
    try {
      if (editingCategory) {
        const res = await fetch(`/api/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update category');
        }
        showToast('Category updated successfully!', 'success');
      } else {
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create category');
        }
        showToast('Category created successfully!', 'success');
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category.', 'error');
      throw err; // Re-throw so the form can display it
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteError('');
    const ok = await showConfirm({
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? Transactions linked to it may be affected.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const errData = await res.json();
        setDeleteError(errData.error || 'Failed to delete category');
        showToast(errData.error || 'Failed to delete category.', 'error');
        return;
      }
      fetchCategories();
      showToast('Category deleted.', 'info');
    } catch (err) {
      console.error('Failed to delete category', err);
      setDeleteError('Network error while deleting');
      showToast('A network error occurred.', 'error');
    }
  };

  const expenseCategories = categories.filter(c => c.type === 'EXPENSE');
  const incomeCategories = categories.filter(c => c.type === 'INCOME');

  const renderCategoryGrid = (cats: Category[], label: string, typeColor: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {label === 'Expense' ? (
          <ArrowDownLeft className={`h-4 w-4 ${typeColor}`} />
        ) : (
          <ArrowUpRight className={`h-4 w-4 ${typeColor}`} />
        )}
        <h3 className="text-sm font-semibold text-slate-200">
          {label} Categories
        </h3>
        <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-slate-400 font-medium">
          {cats.length}
        </span>
      </div>

      {cats.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-sm text-slate-500">
          No {label.toLowerCase()} categories found. Create one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="glass-panel rounded-xl p-4 flex items-start justify-between group hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                    borderColor: `${cat.color}30`,
                  }}
                >
                  {(() => {
                    const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                    return <IconComponent className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{cat.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                    {cat.type.toLowerCase()}
                    {cat.isDefault && (
                      <span className="ml-1.5 text-emerald-400/60">• default</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setIsModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
                  title="Edit"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-500">Categories</h1>
          <p className="text-slate-400 text-sm">
            Organize your income and expense types with custom categories.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Category
        </button>
      </div>

      {/* Delete Error Alert */}
      {deleteError && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{deleteError}</p>
          <button
            onClick={() => setDeleteError('')}
            className="ml-auto text-red-400/50 hover:text-red-400 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Type Filter */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTypeFilter('')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${typeFilter === ''
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'text-slate-400 border-white/5 hover:bg-white/5'
            }`}
        >
          All
        </button>
        <button
          onClick={() => setTypeFilter('EXPENSE')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${typeFilter === 'EXPENSE'
            ? 'bg-red-500/10 text-red-400 border-red-500/20'
            : 'text-slate-400 border-white/5 hover:bg-white/5'
            }`}
        >
          Expense
        </button>
        <button
          onClick={() => setTypeFilter('INCOME')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${typeFilter === 'INCOME'
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'text-slate-400 border-white/5 hover:bg-white/5'
            }`}
        >
          Income
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-sm text-slate-400">Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-slate-400 mb-4 border border-white/5">
            <FolderTree className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No categories found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            Get started by creating your first category, or run the seed script to generate defaults.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {(typeFilter === '' || typeFilter === 'EXPENSE') && expenseCategories.length > 0 &&
            renderCategoryGrid(expenseCategories, 'Expense', 'text-red-400')
          }
          {(typeFilter === '' || typeFilter === 'INCOME') && incomeCategories.length > 0 &&
            renderCategoryGrid(incomeCategories, 'Income', 'text-emerald-400')
          }
        </div>
      )}

      {/* Add/Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <CategoryForm
          initialValues={editingCategory}
          onSubmit={handleAddOrEdit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
        />
      </Modal>
    </div>
  );
}
