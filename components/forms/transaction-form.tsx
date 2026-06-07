'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { currencies } from '@/lib/currencies';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().optional(),
  date: z.string(),
  categoryId: z.string().uuid('Please select a category'),
  tagsString: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  type: string;
}

interface TransactionFormProps {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({ initialValues, onSubmit, onCancel }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: Number(initialValues?.amount) || 0,
      currency: initialValues?.currency || 'IDR',
      type: initialValues?.type || 'EXPENSE',
      description: initialValues?.description || '',
      date: initialValues?.date ? new Date(initialValues.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      categoryId: initialValues?.categoryId || '',
      tagsString: initialValues?.tags ? initialValues.tags.join(', ') : '',
    }
  });

  const transactionType = watch('type');

  useEffect(() => {
    if (!initialValues?.currency) {
      const storedCurrency = localStorage.getItem('fintrack_default_currency');
      if (storedCurrency) {
        setValue('currency', storedCurrency);
      }
    }
  }, [initialValues, setValue]);

  useEffect(() => {
    async function fetchCategories() {
      setLoadingCategories(true);
      try {
        const res = await fetch(`/api/categories?type=${transactionType}`);
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : []);
        // Reset category if type changed and current category is no longer valid
        if (initialValues?.type !== transactionType) {
          setValue('categoryId', '');
        }
      } catch (err) {
        console.error('Failed to fetch categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    fetchCategories();
  }, [transactionType, setValue, initialValues]);

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const tags = values.tagsString 
        ? values.tagsString.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      
      const payload = {
        ...values,
        tags,
      };
      
      await onSubmit(payload);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type Toggle */}
      <div className="flex rounded-xl bg-slate-900/60 p-1 border border-white/5">
        <button
          type="button"
          onClick={() => setValue('type', 'EXPENSE')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            transactionType === 'EXPENSE'
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setValue('type', 'INCOME')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            transactionType === 'INCOME'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Income
        </button>
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-400">Amount</label>
          <input
            type="number"
            step="any"
            {...register('amount', { valueAsNumber: true })}
            className="w-full glass-input"
            placeholder="0.00"
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

      {/* Categories */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Category</label>
        {loadingCategories ? (
          <div className="flex items-center gap-2 text-slate-400 py-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading categories...</span>
          </div>
        ) : (
          <select {...register('categoryId')} className="w-full glass-input">
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

      {/* Date */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Date</label>
        <input
          type="date"
          {...register('date')}
          className="w-full glass-input"
        />
        {errors.date && <span className="text-[10px] text-red-400">{errors.date.message}</span>}
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Description</label>
        <input
          type="text"
          {...register('description')}
          className="w-full glass-input"
          placeholder="e.g. Weekly grocery shopping"
        />
      </div>

      {/* Tags */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Tags (comma-separated)</label>
        <input
          type="text"
          {...register('tagsString')}
          className="w-full glass-input"
          placeholder="e.g. food, monthly, budget"
        />
      </div>

      {/* Action Buttons */}
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
          {initialValues ? 'Save Changes' : 'Add Transaction'}
        </button>
      </div>
    </form>
  );
}
