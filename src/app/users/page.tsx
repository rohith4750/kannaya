'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Trash2,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Key,
  Users,
  Edit3,
} from 'lucide-react';
import MaterialSelect from '@/components/MaterialSelect';
import AdminSecurityGuard from '@/components/AdminSecurityGuard';

interface InternalUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  pinCode?: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<InternalUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Create)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('0000');
  const [role, setRole] = useState<'ADMIN' | 'STAFF'>('STAFF');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State (Edit)
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editPinCode, setEditPinCode] = useState('');
  const [editRole, setEditRole] = useState<'ADMIN' | 'STAFF'>('STAFF');

  // Delete State
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, pinCode, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to create user');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`User ${data.name} created successfully! PIN: ${data.pinCode || pinCode}`);
      setName('');
      setEmail('');
      setPassword('');
      setPinCode('0000');
      setRole('STAFF');
      setShowCreateModal(false);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Network error while creating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setFormError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editUser.id,
          name: editName,
          email: editEmail,
          password: editPassword || undefined,
          pinCode: editPinCode,
          role: editRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error || 'Failed to update user');
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(`User ${data.name} updated successfully! PIN: ${data.pinCode}`);
      setEditUser(null);
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Error updating user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteUserId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditModal = (u: InternalUser) => {
    setEditUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditPassword('');
    setEditPinCode(u.pinCode || '');
    setEditRole(u.role);
    setFormError('');
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;

  return (
    <AdminSecurityGuard
      moduleName="User Management System"
      moduleDescription="Manages store staff accounts, system roles, PIN codes, and access permissions."
    >
      <div className="space-y-4">
        {/* Top Header Card */}
        <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#cbcbcb] bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[5px] bg-[#6d8196]/10 border border-[#6d8196]/30 flex items-center justify-center text-[#6d8196]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-base font-bold text-[#4a4a4a]">Internal User Management & Access Control</h1>
                <p className="text-xs text-slate-500 font-medium">
                  Create and manage internal store accounts and 4-Digit Security PINs for Cashiers and Shop Admins.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFormError('');
                  setPinCode('0000');
                  setShowCreateModal(true);
                }}
                className="bg-[#6d8196] hover:bg-[#5b6f84] text-white font-semibold px-3.5 py-2 rounded-[5px] flex items-center gap-2 text-xs transition-all shadow-sm border border-[#cbcbcb]/40"
              >
                <UserPlus className="w-4 h-4" /> Create Internal User
              </button>
            </div>
          </div>

          {/* Metrics Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#cbcbcb] bg-white border-b border-[#cbcbcb] text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6d8196]" /> Total Accounts
              </span>
              <span className="font-bold text-[#4a4a4a] text-sm">{users.length}</span>
            </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-600" /> Admin Users
            </span>
            <span className="font-bold text-purple-700 text-sm">{adminCount}</span>
          </div>
          <div className="p-3 flex items-center justify-between">
            <span className="text-slate-500 font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Staff Cashiers
            </span>
            <span className="font-bold text-blue-700 text-sm">{staffCount}</span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3 bg-slate-50 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user name or email address..."
              className="w-full bg-white border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-1.5 text-xs text-[#4a4a4a] focus:outline-none focus:border-[#6d8196]"
            />
          </div>
          <div className="w-full sm:w-48">
            <MaterialSelect
              label="Filter by Role"
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              options={[
                { value: 'ALL', label: 'All Roles' },
                { value: 'ADMIN', label: 'Admin Only' },
                { value: 'STAFF', label: 'Staff Only' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-3 rounded-[5px] text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-[#cbcbcb] rounded-[5px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading internal user accounts...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-medium">
            No internal user accounts found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#4a4a4a] text-white font-semibold text-[11px] border-b border-[#cbcbcb]">
                  <th className="py-2.5 px-3.5">User Details</th>
                  <th className="py-2.5 px-3.5">Email Address</th>
                  <th className="py-2.5 px-3.5">Security PIN</th>
                  <th className="py-2.5 px-3.5">Role</th>
                  <th className="py-2.5 px-3.5">Created Date</th>
                  <th className="py-2.5 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-[5px] flex items-center justify-center font-bold text-xs ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 border border-purple-300'
                              : 'bg-blue-100 text-blue-700 border border-blue-300'
                          }`}
                        >
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#4a4a4a] text-xs">{u.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{u.email}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300">
                        <Key className="w-3 h-3 text-amber-600" /> {u.pinCode || (u.role === 'ADMIN' ? '1234' : '0000')}
                      </span>
                    </td>

                    <td className="py-3 px-3.5">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                          <Shield className="w-3 h-3" /> Store Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <User className="w-3 h-3" /> Cashier Staff
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-slate-500 font-medium">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-[5px] border border-transparent hover:border-blue-200 transition-all"
                          title="Edit User Details & PIN"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteUserId(u.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-[5px] border border-transparent hover:border-rose-200 transition-all"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#6d8196]" /> Create Internal User Account
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-[5px] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. rajesh@kannaya.com"
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set login password..."
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-9 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  4-Digit Security PIN (For Mobile POS & Quick Login)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 1234 or 0000"
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] font-mono font-bold tracking-widest focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Used for unlocking mobile POS terminal (Default: Admin=1234, Staff=0000)</p>
              </div>

              <div>
                <MaterialSelect
                  label="Assigned Access Role"
                  value={role}
                  onChange={(val) => {
                    const newRole = val as 'ADMIN' | 'STAFF';
                    setRole(newRole);
                    if (pinCode === '0000' || pinCode === '1234') {
                      setPinCode(newRole === 'ADMIN' ? '1234' : '0000');
                    }
                  }}
                  options={[
                    { value: 'STAFF', label: 'Cashier Staff (POS & Billing Access)' },
                    { value: 'ADMIN', label: 'Store Admin (Full Store Management & Reports)' },
                  ]}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#cbcbcb] rounded-[5px] max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cbcbcb] pb-3">
              <h3 className="text-sm font-bold text-[#4a4a4a] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#6d8196]" /> Edit User Profile & PIN
              </h3>
              <button
                onClick={() => {
                  setEditUser(null);
                  setFormError('');
                }}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-[5px] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  4-Digit Security PIN
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                  <input
                    type="text"
                    required
                    maxLength={4}
                    pattern="\d{4}"
                    value={editPinCode}
                    onChange={(e) => setEditPinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="w-full bg-amber-50/50 border border-amber-300 rounded-[5px] pl-9 pr-3 py-2 text-[#4a4a4a] font-mono font-bold tracking-widest focus:bg-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#4a4a4a] uppercase text-[10px] font-bold block mb-1">
                  New Password (Optional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    placeholder="Leave blank to keep existing password"
                    className="w-full bg-slate-50 border border-[#cbcbcb] rounded-[5px] pl-9 pr-9 py-2 text-[#4a4a4a] focus:bg-white focus:border-[#6d8196] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <MaterialSelect
                  label="Assigned Access Role"
                  value={editRole}
                  onChange={(val) => setEditRole(val as 'ADMIN' | 'STAFF')}
                  options={[
                    { value: 'STAFF', label: 'Cashier Staff (POS & Billing Access)' },
                    { value: 'ADMIN', label: 'Store Admin (Full Store Management & Reports)' },
                  ]}
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="w-1/2 bg-slate-100 text-[#4a4a4a] py-2 rounded-[5px] font-bold border border-[#cbcbcb] hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-1/2 bg-[#6d8196] hover:bg-[#5b6f84] text-white py-2 rounded-[5px] font-bold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-[5px] max-w-sm w-full p-4 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Confirm User Deletion
            </h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete this internal user account? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setDeleteUserId(null)}
                className="w-1/2 bg-slate-100 text-slate-700 py-1.5 rounded-[5px] font-bold text-xs border border-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteUserId)}
                className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-[5px] font-bold text-xs shadow-sm"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminSecurityGuard>
  );
}
