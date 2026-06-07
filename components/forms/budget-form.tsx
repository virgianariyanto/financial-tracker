'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { currencies } from '@/lib/currencies';

const formSchema = z.object({
  categoryId: z.string().uuid('Please select a category'),
  amount: z.number().positive('Budget limit must be positive'),
  currency: z.string().min(3).max(3),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
}

interface BudgetFormProps {
  initialValues?: any;
  defaultMonth: number;
  defaultYear: number;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function BudgetForm({ initialValues, defaultMonth, defaultYear, onSubmit, onCancel }: BudgetFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialValues?.categoryId || '',
      amount: Number(initialValues?.amount) || 0,
      currency: initialValues?.currency || 'IDR',
      month: initialValues?.month || defaultMonth,
      year: initialValues?.year || defaultYear,
    },
  });

  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/categories?type=EXPENSE');
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, []);

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setApiError('');
    try {
      await onSubmit(values);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
          {apiError}
        </div>
      )}

      {/* Categories */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Expense Category</label>
        {loadingCategories ? (
          <div className="flex items-center gap-2 text-slate-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading categories...</span>
          </div>
        ) : (
          <select 
            {...register('categoryId')} 
            className="w-full glass-input"
            disabled={!!initialValues} // Cannot change category when editing an existing budget
          >
            <option value="" className="bg-slate-900 text-slate-200">Select Category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                {cat.name}
              </option>
            ))}
          </select>
        )}
        {errors.categoryId && <span className="text-[10px] text-red-400">{errors.categoryId.message}</span>}
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-400">Monthly Limit</label>
          <input
            type="number"
            step="any"
            {...register('amount', { valueAsNumber: true })}
            className="w-full glass-input"
            placeholder="e.g. 1500000"
          />
          {errors.amount && <span className="text-[10px] text-red-400">{errors.amount.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Currency</label>
          <select {...register('currency')} className="w-full glass-input">
            {currencies.map(c => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-200">{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Hidden inputs for month/year to submit along with forms */}
      <input type="hidden" {...register('month')} />
      <input type="hidden" {...register('year')} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/5 text-slate-300 hover:bg-white/5 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialValues ? 'Update Budget' : 'Set Budget'}
        </button>
      </div>
    </form>
  );
}
