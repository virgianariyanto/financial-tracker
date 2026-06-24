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
  AlertTriangle,
  FolderTree,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/components/confirm-dialog';
import Modal from '@/components/ui/modal';
import CategoryForm from '@/components/forms/category-form';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

interface PresetCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE';
  isDefault: boolean;
}

export default function AdminPage() {
  const showConfirm = useConfirm();
  const [activeTab, setActiveTab] = useState<'users' | 'categories'>('users');
  
  // Users state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Category Presets state
  const [presets, setPresets] = useState<PresetCategory[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);
  const [presetTypeFilter, setPresetTypeFilter] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<PresetCategory | null>(null);

  // Modals state (Users)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Form states (Users)
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
    setLoading(true);
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

  // Fetch global category presets
  async function fetchPresets() {
    setLoadingPresets(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  }

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else {
      fetchPresets();
    }
  }, [activeTab]);

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
        showNotification('error', data.error || 'Failed to add user');
      } else {
        showNotification('success', 'User added successfully!');
        setIsCreateOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'A system error occurred.');
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
        showNotification('error', data.error || 'Failed to update user');
      } else {
        showNotification('success', 'User updated successfully!');
        setIsEditOpen(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'A system error occurred.');
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
        showNotification('error', data.error || 'Failed to delete user');
      } else {
        showNotification('success', 'User deleted successfully!');
        setIsDeleteOpen(false);
        setSelectedUser(null);
        fetchUsers();
      }
    } catch (error) {
      showNotification('error', 'A system error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  // Add or Edit Preset Category Handler
  const handleAddOrEditPreset = async (payload: any) => {
    try {
      if (editingPreset) {
        const res = await fetch(`/api/admin/categories/${editingPreset.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to update preset');
        }
        showNotification('success', 'Preset category updated successfully!');
      } else {
        const res = await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to create preset');
        }
        showNotification('success', 'Preset category created successfully!');
      }
      setIsPresetModalOpen(false);
      setEditingPreset(null);
      fetchPresets();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save preset.');
      throw err;
    }
  };

  // Delete Preset Category Handler
  const handleDeletePreset = async (id: string) => {
    const ok = await showConfirm({
      title: 'Delete Preset Category',
      message: 'Are you sure you want to delete this global preset category? Future new users will not receive this category, but existing users will not be affected.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('success', 'Preset category deleted successfully!');
        fetchPresets();
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Failed to delete preset category.');
      }
    } catch (err) {
      console.error('Failed to delete preset', err);
      showNotification('error', 'A network error occurred.');
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

  const expensePresets = presets.filter((p) => p.type === 'EXPENSE');
  const incomePresets = presets.filter((p) => p.type === 'INCOME');

  const renderPresetGrid = (cats: PresetCategory[], label: string, typeColor: string) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {label === 'Expense' ? (
          <ArrowDownLeft className={`h-4 w-4 ${typeColor}`} />
        ) : (
          <ArrowUpRight className={`h-4 w-4 ${typeColor}`} />
        )}
        <h3 className="text-sm font-semibold text-slate-200">
          {label} Presets
        </h3>
        <span className="text-[10px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-full text-slate-400 font-medium">
          {cats.length}
        </span>
      </div>

      {cats.length === 0 ? (
        <div className="glass-panel rounded-xl p-8 text-center text-sm text-slate-500">
          No {label.toLowerCase()} preset categories found. Create one above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {cats.map((cat) => (
            <div
              key={cat.id}
              className="glass-panel rounded-xl p-4 flex items-start justify-between group hover:border-white/10 transition-all"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold border flex-shrink-0"
                  style={{
                    backgroundColor: `${cat.color}15`,
                    color: cat.color,
                    borderColor: `${cat.color}30`,
                  }}
                >
                  {(() => {
                    const IconComponent = (Icons as any)[cat.icon] || Icons.HelpCircle;
                    return <IconComponent className="h-5 w-5" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{cat.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                    {cat.type.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingPreset(cat);
                    setIsPresetModalOpen(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Edit Preset"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDeletePreset(cat.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete Preset"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

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
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
              {activeTab === 'users' ? 'User Management' : 'Category Presets'}
            </h1>
            <p className="text-sm text-slate-400">
              {activeTab === 'users' 
                ? 'Manage data and access rights for Finora users' 
                : 'Manage system-wide default category presets for new users'}
            </p>
          </div>
        </div>
        
        {activeTab === 'users' ? (
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md shadow-emerald-500/10 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add User
          </button>
        ) : (
          <button
            onClick={() => { setEditingPreset(null); setIsPresetModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md shadow-emerald-500/10 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Preset
          </button>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-white/5 gap-6 pt-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          User Management
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Category Presets
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards (Users) */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Users</p>
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
                  <p className="text-xs text-slate-400 font-medium">Regular User</p>
                  <p className="text-2xl font-bold text-slate-100">{totalUsers}</p>
                </div>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/8">
              <h2 className="text-base font-semibold text-slate-100">User List</h2>
              <div className="relative w-full sm:w-72">
                <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 glass-input text-sm"
                />
              </div>
            </div>

            {loading ? (
              <div className="overflow-x-auto animate-fade-in">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 bg-slate-950/20">
                      <th className="px-6 py-4"><Skeleton className="h-4 w-24" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-32" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-16" /></th>
                      <th className="px-6 py-4"><Skeleton className="h-4 w-20" /></th>
                      <th className="px-6 py-4 flex justify-end"><Skeleton className="h-4 w-16" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[1, 2, 3, 4].map((i) => (
                      <tr key={i}>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </td>
                        <td className="px-6 py-4.5"><Skeleton className="h-4 w-48" /></td>
                        <td className="px-6 py-4.5"><Skeleton className="h-6 w-20 rounded-full" /></td>
                        <td className="px-6 py-4.5"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center justify-end gap-2.5">
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <UserX className="h-10 w-10 opacity-40" />
                <p className="text-sm">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Action</th>
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
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
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
                              title={user.id === currentAdminId ? "You cannot delete your own account" : "Delete User"}
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
        </>
      ) : (
        <>
          {/* Stats Cards (Category Presets) */}
          {loadingPresets ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-3 w-20 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                  <FolderTree className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Presets</p>
                  <p className="text-2xl font-bold text-slate-100">{presets.length}</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
                  <ArrowDownLeft className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Expense Presets</p>
                  <p className="text-2xl font-bold text-slate-100">{expensePresets.length}</p>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Income Presets</p>
                  <p className="text-2xl font-bold text-slate-100">{incomePresets.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Preset Type Filter Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPresetTypeFilter('')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${presetTypeFilter === ''
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'text-slate-400 border-white/5 hover:bg-white/5'
                }`}
            >
              All Presets
            </button>
            <button
              onClick={() => setPresetTypeFilter('EXPENSE')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${presetTypeFilter === 'EXPENSE'
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'text-slate-400 border-white/5 hover:bg-white/5'
                }`}
            >
              Expense Presets
            </button>
            <button
              onClick={() => setPresetTypeFilter('INCOME')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${presetTypeFilter === 'INCOME'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'text-slate-400 border-white/5 hover:bg-white/5'
                }`}
            >
              Income Presets
            </button>
          </div>

          {/* Presets List */}
          {loadingPresets ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-panel rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1.5" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : presets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500 glass-panel rounded-2xl">
              <FolderTree className="h-10 w-10 opacity-40" />
              <h3 className="text-sm font-semibold text-slate-300">No preset categories found</h3>
              <p className="text-xs text-slate-500 max-w-xs text-center">Create your first global category preset or register a new user to automatically populate the default presets.</p>
              <button
                onClick={() => { setEditingPreset(null); setIsPresetModalOpen(true); }}
                className="mt-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#064e3b] transition-colors cursor-pointer"
              >
                Create First Preset
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {(presetTypeFilter === '' || presetTypeFilter === 'EXPENSE') && expensePresets.length > 0 &&
                renderPresetGrid(expensePresets, 'Expense', 'text-red-400')
              }
              {(presetTypeFilter === '' || presetTypeFilter === 'INCOME') && incomePresets.length > 0 &&
                renderPresetGrid(incomePresets, 'Income', 'text-emerald-400')
              }
            </div>
          )}
        </>
      )}

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <h3 className="text-lg font-bold text-slate-100">Add New User</h3>
              <button onClick={() => { setIsCreateOpen(false); resetForm(); }} className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name</label>
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
                  placeholder="Minimum 6 characters"
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
                  <option value="USER" className="bg-sidebar-bg text-slate-200">USER (Regular)</option>
                  <option value="ADMIN" className="bg-sidebar-bg text-slate-200">ADMIN (Manager)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
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
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Full Name</label>
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
                  <label className="block text-xs font-semibold text-slate-400 uppercase">New Password</label>
                  <span className="text-[10px] text-slate-500 italic">Leave blank if unchanged</span>
                </div>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
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
                  <option value="USER" className="bg-sidebar-bg text-slate-200">USER (Regular)</option>
                  <option value="ADMIN" className="bg-sidebar-bg text-slate-200">ADMIN (Manager)</option>
                </select>
                {formData.id === currentAdminId && (
                  <span className="text-[10px] text-amber-500/80 mt-1 block">You cannot demote your own role.</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsEditOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRM MODAL */}
      {isDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-red-500/20 bg-sidebar-bg p-6 shadow-2xl animate-scale-in">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Confirm Deletion</h3>
                <p className="text-sm text-slate-400 mt-2">
                  Are you sure you want to delete the user <strong>{selectedUser.name}</strong> ({selectedUser.email})? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 w-full mt-4 pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsDeleteOpen(false); setSelectedUser(null); }}
                  className="flex-1 py-2 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSubmit}
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD/EDIT PRESET CATEGORY MODAL */}
      <Modal
        isOpen={isPresetModalOpen}
        onClose={() => {
          setIsPresetModalOpen(false);
          setEditingPreset(null);
        }}
        title={editingPreset ? 'Edit Preset Category' : 'Create Preset Category'}
      >
        <CategoryForm
          initialValues={editingPreset}
          onSubmit={handleAddOrEditPreset}
          onCancel={() => {
            setIsPresetModalOpen(false);
            setEditingPreset(null);
          }}
        />
      </Modal>
    </div>
  );
}
