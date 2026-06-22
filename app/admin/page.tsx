'use client';

import { useEffect, useState } from 'react';
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX, 
  Search, 
  Crown, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  AlertTriangle 
} from 'lucide-react';

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
  
  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    password: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });
  
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // Fetch users and current user (to identify self)
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

  async function fetchMe() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentAdminId(data.user?.id || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }

  useEffect(() => {
    fetchUsers();
    fetchMe();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMsg(message);
      setErrorMsg('');
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      setErrorMsg(message);
      setSuccessMsg('');
      setTimeout(() => setErrorMsg(''), 5000);
    }
  };

  // Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Gagal menambahkan user');
      } else {
        showNotification('success', 'User berhasil ditambahkan!');
        setIsCreateOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Edit User Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${formData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined, // password is optional
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Gagal memperbarui user');
      } else {
        showNotification('success', 'User berhasil diperbarui!');
        setIsEditOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User Handler
  const handleDeleteSubmit = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        showNotification('error', data.error || 'Gagal menghapus user');
      } else {
        showNotification('success', 'User berhasil dihapus!');
        setIsDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user: UserRecord) => {
    setFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const openDeleteModal = (user: UserRecord) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      email: '',
      password: '',
      role: 'USER',
    });
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalAdmins = users.filter((u) => u.role === 'ADMIN').length;
  const totalUsers = users.filter((u) => u.role === 'USER').length;

  return (
    <div className="space-y-8">
      {/* Alerts */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400 backdrop-blur-md shadow-lg animate-fade-in">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="fixed top-6 right-6 z-50 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 backdrop-blur-md shadow-lg animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Management User</h1>
            <p className="text-sm text-slate-400">Kelola data dan hak akses pengguna sistem Finora</p>
          </div>
        </div>
        
        <button
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md shadow-emerald-500/10 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          Tambah User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Pengguna</p>
            <p className="text-2xl font-bold text-slate-100">{users.length}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Crown className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Admin</p>
            <p className="text-2xl font-bold text-slate-100">{totalAdmins}</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
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
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/8">
          <h2 className="text-base font-semibold text-slate-100">Daftar Pengguna</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 glass-input text-sm"
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
                <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Pengguna</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Bergabung</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-200">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4.5 text-slate-400">{user.email}</td>
                    <td className="px-6 py-4.5">
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
                    <td className="px-6 py-4.5 text-slate-300">
                      {new Date(user.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Edit User"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => openDeleteModal(user)}
                          disabled={user.id === currentAdminId}
                          className="p-1.5 rounded-lg border border-white/5 hover:bg-red-500/10 text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed hover:text-red-400 transition-colors cursor-pointer"
                          title={user.id === currentAdminId ? "Anda tidak dapat menghapus akun Anda sendiri" : "Hapus User"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <h3 className="text-lg font-bold text-slate-100">Tambah User Baru</h3>
              <button onClick={() => { setIsCreateOpen(false); resetForm(); }} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Password</label>
                <input
                  type="password"
                  required
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                  className="w-full glass-input text-sm cursor-pointer"
                >
                  <option value="USER" className="bg-sidebar-bg text-slate-200">USER (Biasa)</option>
                  <option value="ADMIN" className="bg-sidebar-bg text-slate-200">ADMIN (Pengelola)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Tambah User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <h3 className="text-lg font-bold text-slate-100">Edit User</h3>
              <button onClick={() => { setIsEditOpen(false); resetForm(); }} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Email</label>
                <input
                  type="email"
                  required
                  placeholder="johndoe@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-400 uppercase">Password Baru</label>
                  <span className="text-[10px] text-slate-500 italic">Kosongkan jika tidak diubah</span>
                </div>
                <input
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Role</label>
                <select
                  value={formData.role}
                  disabled={formData.id === currentAdminId}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'USER' | 'ADMIN' })}
                  className="w-full glass-input text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="USER" className="bg-sidebar-bg text-slate-200">USER (Biasa)</option>
                  <option value="ADMIN" className="bg-sidebar-bg text-slate-200">ADMIN (Pengelola)</option>
                </select>
                {formData.id === currentAdminId && (
                  <span className="text-[10px] text-amber-500/80 mt-1 block">Anda tidak dapat menurunkan role Anda sendiri.</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-sidebar-bg p-6 shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Konfirmasi Hapus</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Apakah Anda yakin ingin menghapus user <strong>{selectedUser.name}</strong> ({selectedUser.email})? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 w-full mt-4 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsDeleteOpen(false); setSelectedUser(null); }}
                  className="flex-1 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Menghapus...' : 'Hapus'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
