'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle, User, DollarSign, RotateCcw, AlertCircle } from 'lucide-react';
import { currencies } from '@/lib/currencies';
import { useCurrency } from '@/components/currency-context';

export default function SettingsClient() {
  const { defaultCurrency: globalCurrency, updateDefaultCurrency } = useCurrency();
  const [userName, setUserName] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState(globalCurrency);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Load preferensi dari database saat komponen mount
  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          const user = data.user;
          setUserName(user.userName || user.name || '');
          const currency = user.preferredCurrency || 'IDR';
          setDefaultCurrency(currency);
          updateDefaultCurrency(currency);
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName.trim(),
          preferredCurrency: defaultCurrency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menyimpan pengaturan.');
        return;
      }

      // Sync currency context global
      updateDefaultCurrency(defaultCurrency);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Terjadi kesalahan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Yakin ingin mereset preferensi ke default?')) return;
    setSaving(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: '', preferredCurrency: 'IDR' }),
      });
      if (res.ok) {
        setUserName('');
        setDefaultCurrency('IDR');
        updateDefaultCurrency('IDR');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError('Gagal mereset preferensi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin" />
        <p className="text-sm text-slate-400">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-500 font-sans">Settings</h1>
        <p className="text-slate-400 text-sm">
          Preferensi tersimpan ke database dan berlaku di semua perangkat.
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs text-emerald-400 font-medium">Pengaturan berhasil disimpan!</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl space-y-6">
        {/* Workspace Name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <User className="h-4 w-4 text-slate-500" />
            Nama Workspace / Tampilan
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full glass-input"
            placeholder="e.g. Keuangan Pribadi, Anggaran Keluarga"
          />
          <p className="text-[10px] text-slate-500">
            Nama ini ditampilkan di dashboard. Tersimpan ke database, berlaku di semua perangkat.
          </p>
        </div>

        {/* Default Currency */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-400 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-slate-500" />
            Mata Uang Default
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
            Menentukan mata uang default untuk transaksi, budget, dan savings goals baru.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button
            type="button"
            onClick={handleReset}
            disabled={saving}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Default
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/10 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>
      </form>
    </div>
  );
}
