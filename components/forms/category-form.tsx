'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import * as Icons from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  icon: z.string().min(1, 'Icon name is required').max(50),
  color: z.string().min(3, 'Color is required'),
  type: z.enum(['INCOME', 'EXPENSE']),
});

type FormValues = z.infer<typeof formSchema>;

// Common icon names from Lucide for quick selection
const iconOptions = [
  'Utensils', 'ShoppingBag', 'Car', 'Zap', 'Gamepad2', 'HeartPulse',
  'GraduationCap', 'Home', 'Shirt', 'Fuel', 'Plane', 'Gift',
  'Briefcase', 'Wallet', 'TrendingUp', 'Landmark', 'BadgeDollarSign',
  'HandCoins', 'PiggyBank', 'CreditCard', 'Baby', 'Dog',
  'Dumbbell', 'Music', 'Film', 'Coffee', 'Wifi', 'Phone', 'Settings',
];

const colorOptions = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#78716c',
];

interface CategoryFormProps {
  initialValues?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function CategoryForm({ initialValues, onSubmit, onCancel }: CategoryFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues?.name || '',
      icon: initialValues?.icon || 'Utensils',
      color: initialValues?.color || '#10b981',
      type: initialValues?.type || 'EXPENSE',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedType = watch('type');

  const handleFormSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setApiError('');
    try {
      await onSubmit(values);
    } catch (err: any) {
      setApiError(err.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {apiError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
          {apiError}
        </div>
      )}

      {/* Type Toggle */}
      <div className="flex rounded-xl bg-slate-900/60 p-1 border border-white/5">
        <button
          type="button"
          onClick={() => setValue('type', 'EXPENSE')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${selectedType === 'EXPENSE'
            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setValue('type', 'INCOME')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${selectedType === 'INCOME'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          Income
        </button>
      </div>

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-400">Category Name</label>
        <input
          type="text"
          {...register('name')}
          className="w-full glass-input"
          placeholder="e.g. Food & Dining"
        />
        {errors.name && <span className="text-[10px] text-red-400">{errors.name.message}</span>}
      </div>

      {/* Icon Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">Icon</label>
        <div className="grid grid-cols-7 gap-1.5">
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
        <p className="text-[10px] text-slate-500">
          Selected: <span className="text-slate-300 font-medium">{selectedIcon}</span>
        </p>
        {errors.icon && <span className="text-[10px] text-red-400">{errors.icon.message}</span>}
      </div>

      {/* Color Picker */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400">Color</label>
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
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-md"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-[10px] text-slate-400 font-mono">{selectedColor}</span>
        </div>
        {errors.color && <span className="text-[10px] text-red-400">{errors.color.message}</span>}
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
            {watch('name') || 'Category Name'}
          </p>
          <p className="text-[10px] text-slate-500 capitalize">
            {selectedType.toLowerCase()} category
          </p>
        </div>
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
          className="flex-1 py-2.5 text-sm rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {initialValues ? 'Save Changes' : 'Create Category'}
        </button>
      </div>
    </form>
  );
}
