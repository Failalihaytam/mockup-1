// Users Management for Admin

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { UsersAPI } from '../../services/odataClient';
import { User, UserRole } from '../../types/entities';
import { Plus, Search, Edit, Trash2, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface UserForm {
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  skills: string;
  certifications: string;
  availabilityPercent: number;
}

const EMPTY_FORM: UserForm = {
  name: '',
  email: '',
  role: 'CONSULTANT_TECHNIQUE',
  active: true,
  skills: '',
  certifications: '',
  availabilityPercent: 100,
};

export const UsersManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'ALL'>('ALL');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await UsersAPI.getAll();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const resetDialog = () => {
    setShowDialog(false);
    setEditingUserId(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setEditingUserId(null);
    setForm(EMPTY_FORM);
    setShowDialog(true);
  };

  const openEdit = (user: User) => {
    setEditingUserId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      active: user.active,
      skills: user.skills.join(', '),
      certifications: user.certifications.join(', '),
      availabilityPercent: user.availabilityPercent,
    });
    setShowDialog(true);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const updated = await UsersAPI.update(userId, { active: !currentStatus });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const saveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required');
      return;
    }
    const email = form.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (form.availabilityPercent < 0 || form.availabilityPercent > 100) {
      toast.error('Availability must be between 0 and 100');
      return;
    }

    const payload = {
      name: form.name.trim(),
      email,
      role: form.role,
      active: form.active,
      skills: form.skills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      certifications: form.certifications
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      availabilityPercent: form.availabilityPercent,
      teamId: 't1',
    };

    try {
      setIsSubmitting(true);
      if (editingUserId) {
        const updated = await UsersAPI.update(editingUserId, payload);
        setUsers((prev) => prev.map((user) => (user.id === editingUserId ? updated : user)));
        toast.success('User updated');
      } else {
        const created = await UsersAPI.create(payload);
        setUsers((prev) => [created, ...prev]);
        toast.success('User created');
      }
      resetDialog();
    } catch (error) {
      toast.error('Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      toast.error('You cannot delete the currently connected user');
      return;
    }
    const confirmed = window.confirm('Delete this user account?');
    if (!confirmed) return;

    try {
      await UsersAPI.delete(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      ADMIN: 'bg-red-100 text-red-800',
      MANAGER: 'bg-blue-100 text-blue-800',
      CONSULTANT_TECHNIQUE: 'bg-green-100 text-green-800',
      CONSULTANT_FONCTIONNEL: 'bg-purple-100 text-purple-800',
    };
    return styles[role];
  };

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      ADMIN: 'Administrator',
      MANAGER: 'Manager',
      CONSULTANT_TECHNIQUE: 'Technical Consultant',
      CONSULTANT_FONCTIONNEL: 'Functional Consultant',
    };
    return labels[role];
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === 'ALL' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, filterRole]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Users Management"
        subtitle="Manage user accounts, roles, and permissions"
        breadcrumbs={[
          { label: 'Home', path: '/admin/dashboard' },
          { label: 'Users Management' },
        ]}
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        }
      />

      <div className="p-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-card text-foreground"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as UserRole | 'ALL')}
              className="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="MANAGER">Manager</option>
              <option value="CONSULTANT_TECHNIQUE">Technical Consultant</option>
              <option value="CONSULTANT_FONCTIONNEL">Functional Consultant</option>
            </select>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Skills
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-accent transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold">
                          {user.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {user.skills.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="inline-flex px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                            +{user.skills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-muted rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${user.availabilityPercent}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {user.availabilityPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => void toggleUserStatus(user.id, user.active)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.active ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label={`Edit ${user.name}`}
                          title={`Edit ${user.name}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => void deleteUser(user.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label={`Delete ${user.name}`}
                          title={`Delete ${user.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showDialog && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={resetDialog}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                {editingUserId ? 'Edit User' : 'Create User'}
              </h3>
              <button
                onClick={resetDialog}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close user dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveUser} className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Role</label>
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))
                    }
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  >
                    <option value="ADMIN">Administrator</option>
                    <option value="MANAGER">Manager</option>
                    <option value="CONSULTANT_TECHNIQUE">Technical Consultant</option>
                    <option value="CONSULTANT_FONCTIONNEL">Functional Consultant</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">
                    Availability %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={form.availabilityPercent}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        availabilityPercent: Number(e.target.value || 0),
                      }))
                    }
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Skills (comma-separated)
                </label>
                <textarea
                  rows={3}
                  value={form.skills}
                  onChange={(e) => setForm((prev) => ({ ...prev, skills: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-1">
                  Certifications (comma-separated)
                </label>
                <textarea
                  rows={2}
                  value={form.certifications}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, certifications: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Active account
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={resetDialog}
                  className="px-4 py-2 border border-border rounded hover:bg-accent text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : editingUserId ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
