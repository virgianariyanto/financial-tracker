'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  amount: z.number().positive('Contribution amount must be positive'),
  date: z.string(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SavingsContributionFormProps {
  goalCurrency: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function SavingsContributionForm({ goalCurrency, onSubmit, onCancel }: SavingsContributionFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: '',
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setApiError('');
    try {
      await onSubmit(values);
    } catch (err: any) {
      setApiError(err.message || 'Failed to add contribution');
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

      {/* Amount */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 font-medium">Contribution Amount ({goalCurrency})</label>
        <input
          type="number"
          step="any"
          {...register('amount', { valueAsNumber: true })}
          className="w-full glass-input"
          placeholder="0.00"
        />
        {errors.amount && <span className="text-[10px] text-red-400">{errors.amount.message}</span>}
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 font-medium">Date</label>
        <input
          type="date"
          {...register('date')}
          className="w-full glass-input"
        />
        {errors.date && <span className="text-[10px] text-red-400">{errors.date.message}</span>}
      </div>

      {/* Note */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 font-medium">Note / Source (Optional)</label>
        <input
          type="text"
          {...register('note')}
          className="w-full glass-input"
          placeholder="e.g. From May bonus, Leftover monthly cash"
        />
      </div>

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
          Add Contribution
        </button>
      </div>
    </form>
  );
}
