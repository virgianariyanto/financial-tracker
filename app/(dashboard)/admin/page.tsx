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
  Activity,
  Eye,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Tag,
  Globe,
  Clock,
  RotateCcw,
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  CheckCircle2,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useConfirm } from '@/components/confirm-dialog';
import Modal from '@/components/ui/modal';
import CategoryForm from '@/components/forms/category-form';
import { currencies, formatCurrency } from '@/lib/currencies';
import { useToast } from '@/components/toast-context';

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

interface AdminTransaction {
  id: string;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'INCOME' | 'EXPENSE';
    isDefault: boolean;
  };
}

interface SupportTicketRecord {
  id: string;
  subject: string;
  message: string;
  category: 'ISSUE' | 'SUGGESTION' | 'FEEDBACK' | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminPage() {
  const showConfirm = useConfirm();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'transactions' | 'support'>('users');
  
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

  // Transaction Ledger state
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txLimit] = useState(10);
  const [txTotal, setTxTotal] = useState(0);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txSearch, setTxSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'' | 'INCOME' | 'EXPENSE'>('');
  const [txCatFilter, setTxCatFilter] = useState('');
  const [txStartDate, setTxStartDate] = useState('');
  const [txEndDate, setTxEndDate] = useState('');
  const [txCurrency, setTxCurrency] = useState('IDR');
  const [txStats, setTxStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    totalVolume: 0,
  });
  const [selectedTx, setSelectedTx] = useState<AdminTransaction | null>(null);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Support Tickets state
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketLimit] = useState(10);
  const [ticketTotal, setTicketTotal] = useState(0);
  const [ticketTotalPages, setTicketTotalPages] = useState(1);
  const [ticketSearch, setTicketSearch] = useState('');
  const [ticketSearchInput, setTicketSearchInput] = useState('');
  const [ticketStatusFilter, setTicketStatusFilter] = useState('');
  const [ticketCatFilter, setTicketCatFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketStats, setTicketStats] = useState({
    totalTickets: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

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

  // Fetch global transaction ledger
  async function fetchTransactions() {
    setLoadingTx(true);
    try {
      const queryParams = new URLSearchParams({
        page: txPage.toString(),
        limit: txLimit.toString(),
        search: txSearch,
        type: txTypeFilter,
        categoryId: txCatFilter,
        startDate: txStartDate,
        endDate: txEndDate,
        currency: txCurrency,
      });

      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setTxTotal(data.total || 0);
        setTxTotalPages(data.totalPages || 1);
        setTxStats(data.stats || { totalIncome: 0, totalExpense: 0, totalVolume: 0 });
      }
    } catch (error) {
      console.error('Error fetching admin transactions:', error);
    } finally {
      setLoadingTx(false);
    }
  }

  // Debounce search input for transactions ledger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setTxSearch(searchInput);
      setTxPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Fetch admin support tickets
  async function fetchAdminTickets() {
    setLoadingTickets(true);
    try {
      const queryParams = new URLSearchParams({
        page: ticketPage.toString(),
        limit: ticketLimit.toString(),
        search: ticketSearch,
        status: ticketStatusFilter,
        category: ticketCatFilter,
      });

      const res = await fetch(`/api/admin/support?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setTicketTotal(data.total || 0);
        setTicketTotalPages(data.totalPages || 1);
        setTicketStats(data.stats || { totalTickets: 0, pending: 0, inProgress: 0, resolved: 0 });
      }
    } catch (error) {
      console.error('Error fetching admin support tickets:', error);
    } finally {
      setLoadingTickets(false);
    }
  }

  // Debounce search input for support tickets
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setTicketSearch(ticketSearchInput);
      setTicketPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketSearchInput]);

  useEffect(() => {
    fetchMe();
    fetchPresets(); // load presets on mount so they are ready for filter dropdown
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'categories') {
      fetchPresets();
    } else if (activeTab === 'transactions') {
      fetchTransactions();
    } else if (activeTab === 'support') {
      fetchAdminTickets();
    }
  }, [activeTab, txPage, txSearch, txTypeFilter, txCatFilter, txStartDate, txEndDate, txCurrency, ticketPage, ticketSearch, ticketStatusFilter, ticketCatFilter]);

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification('success', 'Ticket status updated successfully.');
        setIsTicketModalOpen(false);
        setSelectedTicket(null);
        fetchAdminTickets();
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Failed to update ticket.');
      }
    } catch (error) {
      showNotification('error', 'A system error occurred.');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    const ok = await showConfirm({
      title: 'Delete Support Ticket',
      message: 'Are you sure you want to delete this ticket record? This action cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showNotification('success', 'Ticket deleted successfully.');
        setIsTicketModalOpen(false);
        setSelectedTicket(null);
        fetchAdminTickets();
      } else {
        const errData = await res.json();
        showNotification('error', errData.error || 'Failed to delete ticket.');
      }
    } catch (error) {
      showNotification('error', 'A network error occurred.');
    }
  };

  const handleTypeFilterChange = (val: '' | 'INCOME' | 'EXPENSE') => {
    setTxTypeFilter(val);
    setTxPage(1);
  };

  const handleCatFilterChange = (val: string) => {
    setTxCatFilter(val);
    setTxPage(1);
  };

  const handleStartDateChange = (val: string) => {
    setTxStartDate(val);
    setTxPage(1);
  };

  const handleEndDateChange = (val: string) => {
    setTxEndDate(val);
    setTxPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setTxSearch('');
    setTxTypeFilter('');
    setTxCatFilter('');
    setTxStartDate('');
    setTxEndDate('');
    setTxCurrency('IDR');
    setTxPage(1);
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    showToast(message, type);
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
            <Shield className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
              {activeTab === 'users' 
                ? 'User Management' 
                : activeTab === 'categories' 
                  ? 'Category Presets' 
                  : activeTab === 'transactions'
                    ? 'Transaction Ledger & Audit Trail'
                    : 'Support & Feedback Hub'}
            </h1>
            <p className="text-sm text-slate-400">
              {activeTab === 'users' 
                ? 'Manage data and access rights for Finora users' 
                : activeTab === 'categories'
                  ? 'Manage system-wide default category presets for new users'
                  : activeTab === 'transactions'
                    ? 'Audit and monitor platform-wide transactions and records'
                    : 'Track and resolve user technical issues, bug reports, and suggestions'}
            </p>
          </div>
        </div>
        
        {activeTab === 'users' && (
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md shadow-emerald-500/10 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            Add User
          </button>
        )}
        {activeTab === 'categories' && (
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
      <div className="flex border-b border-white/5 gap-4 sm:gap-6 pt-2 overflow-x-auto no-scrollbar whitespace-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
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
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="h-4 w-4" />
          Category Presets
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'transactions'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="h-4 w-4" />
          Transaction Ledger
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'support'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          Support Tickets
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
              <>
                {/* Desktop Skeleton Table */}
                <div className="hidden md:block overflow-x-auto animate-fade-in">
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
                {/* Mobile Skeleton Cards */}
                <div className="block md:hidden p-4 space-y-4 animate-fade-in">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-3 w-24 mb-1" />
                            <Skeleton className="h-2.5 w-36" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-3.5 w-24" />
                        <div className="flex gap-2">
                          <Skeleton className="h-7 w-7 rounded-lg" />
                          <Skeleton className="h-7 w-7 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <UserX className="h-10 w-10 opacity-40" />
                <p className="text-sm">No users found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Users Table */}
                <div className="hidden md:block overflow-x-auto">
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

                {/* Mobile Users Cards List */}
                <div className="block md:hidden divide-y divide-white/5">
                  {filtered.map((user) => (
                    <div key={user.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {user.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-200 text-sm truncate max-w-[150px]">{user.name}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </div>
                        <div>
                          {user.role === 'ADMIN' ? (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              <Crown className="h-2.5 w-2.5" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-slate-500/15 text-slate-400 border border-slate-500/20">
                              <UserCheck className="h-2.5 w-2.5" />
                              User
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                        <span>
                          Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          
                          <button
                            onClick={() => openDeleteModal(user)}
                            disabled={user.id === currentAdminId}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-red-400 transition-colors"
                            title={user.id === currentAdminId ? "You cannot delete your own account" : "Delete User"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      ) : activeTab === 'categories' ? (
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
      ) : activeTab === 'transactions' ? (
        <>
          {/* Global Aggregated Statistics */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-400" />
                Global Aggregated Statistics
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Convert to:</span>
                <select
                  value={txCurrency}
                  onChange={(e) => setTxCurrency(e.target.value)}
                  className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-200 outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  {currencies.map((curr) => (
                    <option key={curr.code} value={curr.code} className="bg-sidebar-bg">
                      {curr.code} ({curr.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Activity className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Total Financial Volume</p>
                  <p className="text-2xl font-bold text-slate-100">
                    {formatCurrency(txStats.totalVolume, txCurrency)}
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 animate-pulse">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Global Income</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(txStats.totalIncome, txCurrency)}
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 animate-pulse">
                  <ArrowDownLeft className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Global Expenses</p>
                  <p className="text-2xl font-bold text-rose-400">
                    {formatCurrency(txStats.totalExpense, txCurrency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Trail Filters */}
          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Filter className="h-4 w-4 text-emerald-400" />
                Audit Trail Filters
              </div>
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search description, user, category..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 glass-input text-xs"
                />
              </div>

              {/* Type Filter */}
              <select
                value={txTypeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value as any)}
                className="w-full glass-input text-xs cursor-pointer"
              >
                <option value="" className="bg-sidebar-bg text-slate-200">All Types</option>
                <option value="INCOME" className="bg-sidebar-bg text-slate-200">Income Only</option>
                <option value="EXPENSE" className="bg-sidebar-bg text-slate-200">Expense Only</option>
              </select>

              {/* Category Filter */}
              <select
                value={txCatFilter}
                onChange={(e) => handleCatFilterChange(e.target.value)}
                className="w-full glass-input text-xs cursor-pointer"
              >
                <option value="" className="bg-sidebar-bg text-slate-200">All Categories</option>
                {presets.map((preset) => (
                  <option key={preset.id} value={preset.id} className="bg-sidebar-bg text-slate-200">
                    {preset.name} ({preset.type})
                  </option>
                ))}
              </select>

              {/* Date Range */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="date"
                    placeholder="Start Date"
                    value={txStartDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-2 py-2 glass-input text-xs [color-scheme:dark]"
                  />
                </div>
                <span className="text-slate-500 text-xs">-</span>
                <div className="relative flex-1">
                  <input
                    type="date"
                    placeholder="End Date"
                    value={txEndDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full px-2 py-2 glass-input text-xs [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            {loadingTx ? (
              <>
                {/* Desktop Skeleton Table */}
                <div className="hidden md:block overflow-x-auto animate-fade-in">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4 text-left">User</th>
                        <th className="px-6 py-4 text-left">Transaction</th>
                        <th className="px-6 py-4 text-left">Type</th>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Amount</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <tr key={i}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div>
                                <Skeleton className="h-3 w-24 mb-1" />
                                <Skeleton className="h-2 w-32" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Skeleton className="h-3.5 w-36 mb-1.5" />
                            <Skeleton className="h-2.5 w-20" />
                          </td>
                          <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-3.5 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-3.5 w-20" /></td>
                          <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Skeleton Cards */}
                <div className="block md:hidden p-4 space-y-4 animate-fade-in">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-3 w-20 mb-1" />
                            <Skeleton className="h-2.5 w-32" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <div className="space-y-1">
                          <Skeleton className="h-3 w-28" />
                          <Skeleton className="h-2.5 w-16" />
                        </div>
                        <Skeleton className="h-7 w-7 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <Clock className="h-10 w-10 opacity-40 animate-pulse" />
                <p className="text-sm">No transaction ledger records found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Transactions Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4 text-left">User</th>
                        <th className="px-6 py-4 text-left">Transaction</th>
                        <th className="px-6 py-4 text-left">Type</th>
                        <th className="px-6 py-4 text-left">Date</th>
                        <th className="px-6 py-4 text-left">Amount</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/2 transition-colors">
                          {/* User Info */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                                {tx.user?.name ? tx.user.name.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{tx.user?.name || 'Unknown User'}</span>
                                <span className="text-xs text-slate-500 truncate max-w-[150px]">{tx.user?.email || 'No Email'}</span>
                              </div>
                            </div>
                          </td>
                          {/* Transaction Info */}
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-200 max-w-[220px] truncate">{tx.description || 'No description'}</span>
                              <div className="flex items-center gap-1.5 mt-1">
                                <div 
                                  className="h-2 w-2 rounded-full" 
                                  style={{ backgroundColor: tx.category?.color || '#94a3b8' }}
                                />
                                <span className="text-xs text-slate-400">{tx.category?.name || 'Uncategorized'}</span>
                              </div>
                            </div>
                          </td>
                          {/* Type */}
                          <td className="px-6 py-4">
                            {tx.type === 'INCOME' ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <ArrowUpRight className="h-3 w-3" />
                                Income
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                                <ArrowDownLeft className="h-3 w-3" />
                                Expense
                              </span>
                            )}
                          </td>
                          {/* Date */}
                          <td className="px-6 py-4 text-slate-300">
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          {/* Amount */}
                          <td className="px-6 py-4 font-bold">
                            <span className={tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}>
                              {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                            </span>
                          </td>
                          {/* Action */}
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedTx(tx);
                                setIsTxModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Transactions Cards List */}
                <div className="block md:hidden divide-y divide-white/5">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {tx.user?.name ? tx.user.name.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-200 text-sm truncate max-w-[150px]">{tx.user?.name || 'Unknown User'}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{tx.user?.email || 'No Email'}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold block ${tx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {tx.type === 'INCOME' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            {new Date(tx.date).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{tx.description || 'No description'}</span>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div 
                              className="h-1.5 w-1.5 rounded-full" 
                              style={{ backgroundColor: tx.category?.color || '#94a3b8' }}
                            />
                            <span className="text-[10px] text-slate-500">{tx.category?.name || 'Uncategorized'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {tx.type === 'INCOME' ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              Income
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/20">
                              Expense
                            </span>
                          )}
                          <button
                            onClick={() => {
                              setSelectedTx(tx);
                              setIsTxModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {!loadingTx && txTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-950/10 text-xs text-slate-400">
                <div>
                  Showing <span className="font-semibold text-slate-200">{Math.min(txTotal, (txPage - 1) * txLimit + 1)}</span> to{' '}
                  <span className="font-semibold text-slate-200">{Math.min(txTotal, txPage * txLimit)}</span> of{' '}
                  <span className="font-semibold text-slate-200">{txTotal}</span> transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTxPage(prev => Math.max(1, prev - 1))}
                    disabled={txPage === 1}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-slate-300">
                    Page {txPage} of {txTotalPages}
                  </span>
                  <button
                    onClick={() => setTxPage(prev => Math.min(txTotalPages, prev + 1))}
                    disabled={txPage === txTotalPages}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Support Tickets Panel */}
          
          {/* Ticket Aggregated Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
                <MessageSquare className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Tickets</p>
                <p className="text-2xl font-bold text-slate-100">{ticketStats.totalTickets}</p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Pending</p>
                <p className="text-2xl font-bold text-amber-400">{ticketStats.pending}</p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 animate-pulse">
                <LifeBuoy className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-400">{ticketStats.inProgress}</p>
              </div>
            </div>

            <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 animate-pulse">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Resolved</p>
                <p className="text-2xl font-bold text-emerald-400">{ticketStats.resolved}</p>
              </div>
            </div>
          </div>

          {/* Ticket Filters */}
          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                <Filter className="h-4 w-4 text-emerald-400" />
                Support Ticket Filters
              </div>
              <button
                onClick={() => {
                  setTicketSearchInput('');
                  setTicketSearch('');
                  setTicketStatusFilter('');
                  setTicketCatFilter('');
                  setTicketPage(1);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                Reset Filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search subject, user, email..."
                  value={ticketSearchInput}
                  onChange={(e) => setTicketSearchInput(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 glass-input text-xs"
                />
              </div>

              {/* Status Filter */}
              <select
                value={ticketStatusFilter}
                onChange={(e) => { setTicketStatusFilter(e.target.value); setTicketPage(1); }}
                className="w-full glass-input text-xs cursor-pointer"
              >
                <option value="" className="bg-sidebar-bg text-slate-200">All Statuses</option>
                <option value="PENDING" className="bg-sidebar-bg text-slate-200">Pending Only</option>
                <option value="IN_PROGRESS" className="bg-sidebar-bg text-slate-200">In Progress Only</option>
                <option value="RESOLVED" className="bg-sidebar-bg text-slate-200">Resolved Only</option>
              </select>

              {/* Category Filter */}
              <select
                value={ticketCatFilter}
                onChange={(e) => { setTicketCatFilter(e.target.value); setTicketPage(1); }}
                className="w-full glass-input text-xs cursor-pointer"
              >
                <option value="" className="bg-sidebar-bg text-slate-200">All Categories</option>
                <option value="ISSUE" className="bg-sidebar-bg text-slate-200">Technical Issue</option>
                <option value="SUGGESTION" className="bg-sidebar-bg text-slate-200">Feature Suggestion</option>
                <option value="FEEDBACK" className="bg-sidebar-bg text-slate-200">General Feedback</option>
                <option value="OTHER" className="bg-sidebar-bg text-slate-200">Other Inquiries</option>
              </select>
            </div>
          </div>

          {/* Tickets Table & Card Grid */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            {loadingTickets ? (
              <>
                {/* Desktop Skeleton Table */}
                <div className="hidden md:block overflow-x-auto animate-fade-in">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4 text-left">User</th>
                        <th className="px-6 py-4 text-left">Category</th>
                        <th className="px-6 py-4 text-left">Subject</th>
                        <th className="px-6 py-4 text-left">Submitted</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[1, 2, 3].map((i) => (
                        <tr key={i}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <div>
                                <Skeleton className="h-3 w-20 mb-1" />
                                <Skeleton className="h-2 w-28" />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4"><Skeleton className="h-4.5 w-20 rounded-full" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-3.5 w-24" /></td>
                          <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                          <td className="px-6 py-4 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Mobile Skeleton Cards */}
                <div className="block md:hidden p-4 space-y-4 animate-fade-in">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3 pb-4 border-b border-white/5 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-3 w-16 mb-1" />
                            <Skeleton className="h-2.5 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Skeleton className="h-3.5 w-40" />
                        <Skeleton className="h-7 w-7 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                <HelpCircle className="h-10 w-10 opacity-40 animate-pulse" />
                <p className="text-sm">No support tickets found.</p>
              </div>
            ) : (
              <>
                {/* Desktop Support Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/8 bg-slate-950/20 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        <th className="px-6 py-4 text-left">User</th>
                        <th className="px-6 py-4 text-left">Category</th>
                        <th className="px-6 py-4 text-left">Subject</th>
                        <th className="px-6 py-4 text-left">Submitted</th>
                        <th className="px-6 py-4 text-left">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {tickets.map((ticket) => (
                        <tr key={ticket.id} className="hover:bg-white/2 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                                {ticket.user?.name ? ticket.user.name.substring(0, 2).toUpperCase() : 'US'}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-200 truncate max-w-[150px]">{ticket.user?.name || 'Unknown'}</span>
                                <span className="text-xs text-slate-500 truncate max-w-[150px]">{ticket.user?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/5 rounded-full uppercase tracking-wider text-slate-400">
                              {ticket.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-200 font-medium max-w-[200px] truncate">
                            {ticket.subject}
                          </td>
                          <td className="px-6 py-4 text-slate-400">
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            {ticket.status === 'RESOLVED' ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                Resolved
                              </span>
                            ) : ticket.status === 'IN_PROGRESS' ? (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                                In Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setIsTicketModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                              title="View and Manage"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Support Tickets Cards List */}
                <div className="block md:hidden divide-y divide-white/5">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0">
                            {ticket.user?.name ? ticket.user.name.substring(0, 2).toUpperCase() : 'US'}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-200 text-sm truncate max-w-[150px]">{ticket.user?.name || 'Unknown'}</span>
                            <span className="text-xs text-slate-500 truncate max-w-[150px]">{ticket.user?.email}</span>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {ticket.status === 'RESOLVED' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              Resolved
                            </span>
                          ) : ticket.status === 'IN_PROGRESS' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-slate-200 font-semibold truncate max-w-[200px]">{ticket.subject}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{ticket.category}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsTicketModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Pagination Controls */}
            {!loadingTickets && ticketTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-slate-950/10 text-xs text-slate-400">
                <div>
                  Showing <span className="font-semibold text-slate-200">{Math.min(ticketTotal, (ticketPage - 1) * ticketLimit + 1)}</span> to{' '}
                  <span className="font-semibold text-slate-200">{Math.min(ticketTotal, ticketPage * ticketLimit)}</span> of{' '}
                  <span className="font-semibold text-slate-200">{ticketTotal}</span> tickets
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTicketPage(prev => Math.max(1, prev - 1))}
                    disabled={ticketPage === 1}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-medium text-slate-300">
                    Page {ticketPage} of {ticketTotalPages}
                  </span>
                  <button
                    onClick={() => setTicketPage(prev => Math.min(ticketTotalPages, prev + 1))}
                    disabled={ticketPage === ticketTotalPages}
                    className="p-1.5 rounded-lg border border-white/5 bg-white/2 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
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

      {/* READ-ONLY TRANSACTION DETAIL MODAL (AUDIT TRAIL) */}
      {isTxModalOpen && selectedTx && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">Audit Ledger Details</h3>
              </div>
              <button 
                onClick={() => { setIsTxModalOpen(false); setSelectedTx(null); }} 
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 pt-5">
              {/* Transaction ID and Compliance Notice */}
              <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Transaction ID</span>
                  <span className="text-[10px] font-mono text-slate-400 select-all">{selectedTx.id}</span>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-amber-500 bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg text-left">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    This is a read-only financial audit trail record. Transaction details cannot be edited or deleted by administrators to ensure platform-wide compliance and data integrity.
                  </span>
                </div>
              </div>

              {/* Core financial data */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                  <span className="text-xs text-slate-400 font-medium block mb-1">Audit Type</span>
                  {selectedTx.type === 'INCOME' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <ArrowUpRight className="h-4 w-4" />
                      Income
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      <ArrowDownLeft className="h-4 w-4" />
                      Expense
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/2 border border-white/5 text-center">
                  <span className="text-xs text-slate-400 font-medium block mb-1">Audited Amount</span>
                  <span className={`text-lg font-bold block ${selectedTx.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTx.type === 'INCOME' ? '+' : '-'} {formatCurrency(selectedTx.amount, selectedTx.currency)}
                  </span>
                </div>
              </div>

              {/* Detailed Metadata Grid */}
              <div className="glass-panel rounded-xl p-4 space-y-4.5 text-sm text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" />
                  Transaction Metadata
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Description</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTx.description || 'No description provided'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Category</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="h-6 w-6 rounded-lg flex items-center justify-center text-xs border"
                        style={{
                          backgroundColor: `${selectedTx.category?.color || '#94a3b8'}15`,
                          color: selectedTx.category?.color || '#94a3b8',
                          borderColor: `${selectedTx.category?.color || '#94a3b8'}30`,
                        }}
                      >
                        {(() => {
                          const IconComponent = (Icons as any)[selectedTx.category?.icon] || Icons.HelpCircle;
                          return <IconComponent className="h-3.5 w-3.5" />;
                        })()}
                      </div>
                      <span className="font-medium text-slate-200">{selectedTx.category?.name || 'Uncategorized'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Transaction Date</span>
                    <span className="font-medium text-slate-200 block mt-0.5">
                      {new Date(selectedTx.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Original Currency</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTx.currency}</span>
                  </div>
                </div>
              </div>

              {/* User Account Details */}
              <div className="glass-panel rounded-xl p-4 space-y-3.5 text-sm text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Associated Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 block">Account Owner</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTx.user?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Email Address</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTx.user?.email || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block">User Account ID</span>
                    <span className="font-mono text-xs text-slate-400 block mt-0.5 select-all">{selectedTx.user?.id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* System Logs */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-white/1 p-3 rounded-xl border border-white/5 text-left">
                <div>
                  <span>Recorded In System:</span>
                  <span className="block font-medium text-slate-400 mt-0.5">
                    {new Date(selectedTx.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span>Last System Update:</span>
                  <span className="block font-medium text-slate-400 mt-0.5">
                    {new Date(selectedTx.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsTxModalOpen(false); setSelectedTx(null); }}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer text-center"
                >
                  Close Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPORT TICKET DETAIL & MANAGEMENT MODAL */}
      {isTicketModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-sidebar-bg p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/8">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-100">Support Ticket Details</h3>
              </div>
              <button 
                onClick={() => { setIsTicketModalOpen(false); setSelectedTicket(null); }} 
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 pt-5">
              {/* Ticket ID & Metadata */}
              <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Ticket ID</span>
                  <span className="text-[10px] font-mono text-slate-400 select-all">{selectedTicket.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Category</span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/5 rounded-full uppercase tracking-wider text-slate-400">
                    {selectedTicket.category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Current Status</span>
                  {selectedTicket.status === 'RESOLVED' ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      Resolved
                    </span>
                  ) : selectedTicket.status === 'IN_PROGRESS' ? (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                      In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* User Account Info */}
              <div className="glass-panel rounded-xl p-4 space-y-3 text-sm text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-emerald-400" />
                  Requester Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <span className="text-xs text-slate-500 block">User Name</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTicket.user?.name || 'Unknown User'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Email Address</span>
                    <span className="font-medium text-slate-200 block mt-0.5">{selectedTicket.user?.email || 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block">User ID</span>
                    <span className="font-mono text-xs text-slate-400 block mt-0.5 select-all">{selectedTicket.userId}</span>
                  </div>
                </div>
              </div>

              {/* Ticket Subject and Description */}
              <div className="glass-panel rounded-xl p-4 space-y-3.5 text-sm text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  Subject & Message
                </h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block">Subject</span>
                    <span className="font-semibold text-slate-200 block mt-1 text-base">{selectedTicket.subject}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Description / Message</span>
                    <div className="mt-1.5 p-3.5 rounded-xl bg-white/2 border border-white/5 text-slate-300 whitespace-pre-wrap leading-relaxed text-sm max-h-[200px] overflow-y-auto custom-scrollbar">
                      {selectedTicket.message}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update & Deletion Panel */}
              <div className="glass-panel rounded-xl p-4 space-y-4 text-left">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-white/5 pb-1.5 flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-400" />
                  Management Actions
                </h4>
                
                <div className="space-y-3">
                  <span className="text-xs text-slate-400 font-medium block">Update Ticket Status:</span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'PENDING')}
                      disabled={selectedTicket.status === 'PENDING'}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedTicket.status === 'PENDING'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 cursor-not-allowed opacity-60'
                          : 'bg-white/2 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border-white/5 hover:border-amber-500/20'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                    </button>
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'IN_PROGRESS')}
                      disabled={selectedTicket.status === 'IN_PROGRESS'}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedTicket.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-not-allowed opacity-60'
                          : 'bg-white/2 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 border-white/5 hover:border-blue-500/20'
                      }`}
                    >
                      <LifeBuoy className="h-3.5 w-3.5" />
                      In Progress
                    </button>
                    <button
                      onClick={() => handleUpdateTicketStatus(selectedTicket.id, 'RESOLVED')}
                      disabled={selectedTicket.status === 'RESOLVED'}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        selectedTicket.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 cursor-not-allowed opacity-60'
                          : 'bg-white/2 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 border-white/5 hover:border-emerald-500/20'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Resolved
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Danger Zone:</span>
                  <button
                    onClick={() => handleDeleteTicket(selectedTicket.id)}
                    className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-bold text-red-400 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Ticket
                  </button>
                </div>
              </div>

              {/* Logs */}
              <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 bg-white/1 p-3 rounded-xl border border-white/5 text-left">
                <div>
                  <span>Submitted:</span>
                  <span className="block font-medium text-slate-400 mt-0.5">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span>Last Update:</span>
                  <span className="block font-medium text-slate-400 mt-0.5">
                    {new Date(selectedTicket.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-white/8">
                <button
                  type="button"
                  onClick={() => { setIsTicketModalOpen(false); setSelectedTicket(null); }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-center"
                >
                  Close Ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
