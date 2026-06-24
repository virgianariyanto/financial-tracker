'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useCurrency } from '@/components/currency-context';

const formSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().min(3).max(3),
  type: z.enum(['INCOME', 'EXPENSE']),
  description: z.string().min(1, 'Description is required').max(100),
  interval: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  categoryId: z.string().uuid('Please select a category'),
});

type FormValues = z.infer<typeof formSchema>;

interface Category {
  id: string;
  name: string;
  type: string;
}

interface RecurringFormProps {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function RecurringForm({ initialValues, onSubmit, onCancel }: RecurringFormProps) {
  const { defaultCurrency } = useCurrency();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [displayAmount, setDisplayAmount] = useState('');
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: Number(initialValues?.amount) || 0,
      currency: initialValues?.currency || defaultCurrency || 'IDR',
      type: initialValues?.type || 'EXPENSE',
      description: initialValues?.description || '',
      interval: initialValues?.interval || 'MONTHLY',
      startDate: initialValues?.startDate ? new Date(initialValues.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: initialValues?.endDate ? new Date(initialValues.endDate).toISOString().split('T')[0] : '',
      categoryId: initialValues?.categoryId || '',
    },
  });

  const selectedType = watch('type');

  // Format initial amount using English formatting (commas)
  useEffect(() => {
    if (initialValues?.amount) {
      setDisplayAmount(Number(initialValues.amount).toLocaleString('en-US'));
    }
  }, [initialValues]);

  // Load categories
  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
        }
      } catch (err) {
        console.error('Failed to load categories', err);
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, []);

  const onFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setApiError('');
    try {
      // Clean up empty endDate to null
      const payload = {
        ...values,
        endDate: values.endDate ? values.endDate : null,
      };
      await onSubmit(payload);
    } catch (err: any) {
      setApiError(err.message || 'An error occurred while saving the schedule.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter categories based on type (INCOME or EXPENSE)
  const filteredCategories = categories.filter(c => c.type === selectedType);

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-slate-100">
      {apiError && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {apiError}
        </div>
      )}

      {/* Type Toggle Switch */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Transaction Type</label>
        <div className="flex rounded-xl bg-slate-900/60 p-1 border border-white/5">
          <button
            type="button"
            onClick={() => {
              setValue('type', 'EXPENSE');
              setValue('categoryId', ''); // reset category on type change
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              selectedType === 'EXPENSE'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setValue('type', 'INCOME');
              setValue('categoryId', ''); // reset category on type change
            }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
              selectedType === 'INCOME'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
        </div>
      </div>

      {/* Amount and Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-400">Amount</label>
          <input
            type="text"
            value={displayAmount}
            placeholder="e.g. 150,000"
            className="w-full glass-input text-sm"
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, '');
              const numVal = Number(clean) || 0;
              setValue('amount', numVal, { shouldValidate: true });
              setDisplayAmount(clean ? Number(clean).toLocaleString('en-US') : '');
            }}
          />
          {errors.amount && <span className="text-[10px] text-red-400">{errors.amount.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Currency</label>
          <input
            type="text"
            {...register('currency')}
            readOnly
            className="w-full glass-input text-sm bg-slate-900/40 text-slate-400 cursor-not-allowed border-white/5"
            title="Change default currency in Settings"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Description / Bill Name</label>
        <input
          type="text"
          {...register('description')}
          className="w-full glass-input text-sm"
          placeholder="e.g. Monthly Netflix Subscription"
        />
        {errors.description && <span className="text-[10px] text-red-400">{errors.description.message}</span>}
      </div>

      {/* Category */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 flex justify-between items-center">
          <span>Category</span>
          {loadingCategories && <Loader2 className="h-3 w-3 animate-spin text-slate-500" />}
        </label>
        <select
          {...register('categoryId')}
          className="w-full glass-input text-sm cursor-pointer"
          disabled={loadingCategories}
        >
          <option value="">Select Category</option>
          {filteredCategories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.categoryId && <span className="text-[10px] text-red-400">{errors.categoryId.message}</span>}
      </div>

      {/* Interval Selector */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Recurrence Interval</label>
        <select {...register('interval')} className="w-full glass-input text-sm cursor-pointer">
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
          <option value="YEARLY">Yearly</option>
        </select>
        {errors.interval && <span className="text-[10px] text-red-400">{errors.interval.message}</span>}
      </div>

      {/* Start and End Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Start Date</label>
          <input
            type="date"
            {...register('startDate')}
            className="w-full glass-input text-xs py-2 cursor-pointer"
          />
          {errors.startDate && <span className="text-[10px] text-red-400">{errors.startDate.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">End Date (Optional)</label>
          <input
            type="date"
            {...register('endDate')}
            className="w-full glass-input text-xs py-2 cursor-pointer"
            placeholder="Never"
          />
          {errors.endDate && <span className="text-[10px] text-red-400">{errors.endDate.message}</span>}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-white/5 text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#064e3b] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialValues ? 'Save Changes' : 'Schedule Transaction'}
        </button>
      </div>
    </form>
  );
}
