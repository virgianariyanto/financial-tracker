'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { currencies } from '@/lib/currencies';
import { useCurrency } from '@/components/currency-context';

const formSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmount: z.number().positive('Target amount must be positive'),
  currency: z.string().min(3).max(3),
  deadline: z.string().optional().nullable(),
  icon: z.string().min(1, 'Icon is required'),
  color: z.string().min(3, 'Color is required'),
});

type FormValues = z.infer<typeof formSchema>;

const iconOptions = [
  'PiggyBank', 'TrendingUp', 'Briefcase', 'Home', 'Car', 'Plane',
  'GraduationCap', 'HeartPulse', 'Gift', 'ShoppingBag', 'Gamepad2',
  'Laptop', 'Gem', 'Shield', 'Sparkles', 'Anchor', 'Coffee', 'Utensils',
];

const colorOptions = [
  '#10b981', '#22c55e', '#06b6d4', '#0ea5e9', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#78716c',
];

interface SavingsGoalFormProps {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function SavingsGoalForm({ initialValues, onSubmit, onCancel }: SavingsGoalFormProps) {
  const { defaultCurrency } = useCurrency();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      targetAmount: Number(initialValues?.targetAmount) || 0,
      currency: initialValues?.currency || defaultCurrency || 'IDR',
      deadline: initialValues?.deadline ? new Date(initialValues.deadline).toISOString().split('T')[0] : '',
      icon: initialValues?.icon || 'PiggyBank',
      color: initialValues?.color || '#10b981',
    },
  });

  const [displayAmount, setDisplayAmount] = useState(() => {
    const amt = Number(initialValues?.targetAmount);
    return amt ? amt.toLocaleString('id-ID') : '';
  });

  useEffect(() => {
    if (!initialValues?.currency) {
      setValue('currency', defaultCurrency);
    }
  }, [initialValues, setValue, defaultCurrency]);


  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setApiError('');
    try {
      await onSubmit({
        ...values,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : null,
      });
    } catch (err: any) {
      setApiError(err.message || 'Failed to save savings goal');
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

      {/* Goal Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 font-medium">Goal Name</label>
        <input
          type="text"
          {...register('name')}
          className="w-full glass-input"
          placeholder="e.g. New Laptop, Emergency Fund"
        />
        {errors.name && <span className="text-[10px] text-red-400">{errors.name.message}</span>}
      </div>

      {/* Target Amount & Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-semibold text-slate-400 font-medium">Target Amount</label>
          <input
            type="hidden"
            {...register('targetAmount', { valueAsNumber: true })}
          />
          <input
            type="text"
            className="w-full glass-input"
            placeholder="0"
            value={displayAmount}
            onChange={(e) => {
              const clean = e.target.value.replace(/[^0-9]/g, '');
              const numVal = Number(clean) || 0;
              setValue('targetAmount', numVal, { shouldValidate: true });
              setDisplayAmount(clean ? Number(clean).toLocaleString('id-ID') : '');
            }}
          />
          {errors.targetAmount && <span className="text-[10px] text-red-400">{errors.targetAmount.message}</span>}
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 font-medium">Currency</label>
          <input type="hidden" {...register('currency')} />
          <select
            value={watch('currency') || defaultCurrency}
            disabled
            className="w-full glass-input cursor-not-allowed opacity-70"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code}>{c.code}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Deadline */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400 font-medium">Target Date / Deadline (Optional)</label>
        <input
          type="date"
          {...register('deadline')}
          className="w-full glass-input"
        />
      </div>

      {/* Icon Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 font-medium">Icon</label>
        <div className="grid grid-cols-6 gap-1.5">
          {iconOptions.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={`p-2 rounded-lg flex items-center justify-center transition-all border ${selectedIcon === icon
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-slate-900/40 text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-200'
                }`}
              title={icon}
            >
              {(() => {
                const IconComponent = (Icons as any)[icon] || Icons.HelpCircle;
                return <IconComponent className="h-5 w-5" />;
              })()}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('icon')} />
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 font-medium">Color</label>
        <div className="flex flex-wrap gap-2">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`h-7 w-7 rounded-lg transition-all border-2 ${selectedColor === color
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:scale-105'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <input type="hidden" {...register('color')} />
      </div>

      {/* Preview */}
      <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold border"
          style={{
            backgroundColor: `${selectedColor}15`,
            color: selectedColor,
            borderColor: `${selectedColor}30`
          }}
        >
          {(() => {
            const IconComponent = (Icons as any)[selectedIcon] || Icons.HelpCircle;
            return <IconComponent className="h-5 w-5" />;
          })()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {watch('name') || 'Goal Name'}
          </p>
          <p className="text-[10px] text-slate-500">
            Savings goal ({watch('currency')})
          </p>
        </div>
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
          className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialValues ? 'Save Changes' : 'Create Goal'}
        </button>
      </div>
    </form>
  );
}
