'use client';

import { useEffect, useState } from 'react';
import { Shield, Users, UserCheck, UserX, Search, Crown } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        if (res.ok) {
          const data = await res.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
  const totalUsers = users.filter((u) => u.role === 'USER').length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
          <Shield className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Admin Panel</h1>
          <p className="text-sm text-slate-400">Kelola pengguna dan akses sistem Finora</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/8 bg-card-bg p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pengguna</p>
            <p className="text-2xl font-bold text-slate-100">{users.length}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-card-bg p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Admin</p>
            <p className="text-2xl font-bold text-slate-100">{totalAdmins}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-card-bg p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">User Biasa</p>
            <p className="text-2xl font-bold text-slate-100">{totalUsers}</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-white/8 bg-card-bg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-slate-100">Daftar Pengguna</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-sm">Memuat data pengguna...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
            <UserX className="h-10 w-10 opacity-40" />
            <p className="text-sm">Tidak ada pengguna ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-xs text-slate-500 font-medium uppercase tracking-wider">
                  <th className="text-left px-6 py-3">Pengguna</th>
                  <th className="text-left px-6 py-3">Email</th>
                  <th className="text-left px-6 py-3">Role</th>
                  <th className="text-left px-6 py-3">Bergabung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      {user.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          <Crown className="h-3 w-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
                          <UserCheck className="h-3 w-3" />
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
        <Shield className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <strong>Catatan:</strong> Untuk mengubah role pengguna menjadi Admin, silakan edit kolom{' '}
          <code className="bg-amber-500/15 px-1 py-0.5 rounded font-mono">role</code> di database
          secara langsung dan ubah nilainya menjadi <code className="bg-amber-500/15 px-1 py-0.5 rounded font-mono">ADMIN</code>.
        </p>
      </div>
    </div>
  );
}
