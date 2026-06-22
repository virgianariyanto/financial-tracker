'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, User, DollarSign, RotateCcw } from 'lucide-react';
import { currencies } from '@/lib/currencies';
import { useCurrency } from '@/components/currency-context';

export default function SettingsClient() {
  const { defaultCurrency: globalCurrency, updateDefaultCurrency } = useCurrency();
  const [userName, setUserName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState(globalCurrency);
  const [saved, setSaved] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('fintrack_user_name');
      setUserName(storedName || 'Personal Workspace');
    }
  }, []);

  useEffect(() => {
    setDefaultCurrency(globalCurrency);
  }, [globalCurrency]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('fintrack_user_name', userName.trim());
    }
    updateDefaultCurrency(defaultCurrency);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset preferences to defaults?')) {
      setUserName('Personal Workspace');
      setDefaultCurrency('IDR');
      if (typeof window !== 'undefined') {
        localStorage.setItem('fintrack_user_name', 'Personal Workspace');
      }
      updateDefaultCurrency('IDR');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-500 font-sans">Settings</h1>
        <p className="text-slate-400 text-sm">
          Customize your preferences and workspace options.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">Settings saved successfully!</p>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        {/* Workspace Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            Workspace / Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full glass-input"
            placeholder="e.g. Personal, Family Space"
            required
          />
          <p className="text-[10px] text-slate-500">
            This name identifies your workspace dashboard.
          </p>
        </div>

        {/* Default Currency */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            Default Currency
          </label>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
            className="w-full glass-input"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-500">
            Sets the default currency for new transactions, budgets, and savings goals.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-[#064e3b] shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
          >
            <Save className="h-4 w-4" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
