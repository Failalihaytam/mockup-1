import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Edit,
  Plus,
  Save,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Progress } from '../../components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { cn } from '../../components/ui/utils';
import { useAuth } from '../../context/AuthContext';
import { UsersAPI } from '../../services/odataClient';
import { User, UserRole } from '../../types/entities';

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

const getRoleLabel = (role: UserRole) => {
  const labels = {
    ADMIN: 'Administrator',
    MANAGER: 'Manager',
    CONSULTANT_TECHNIQUE: 'Technical Consultant',
    CONSULTANT_FONCTIONNEL: 'Functional Consultant',
  };
  return labels[role];
};

const getRoleBadgeTone = (role: UserRole) => {
  const styles: Record<UserRole, string> = {
    ADMIN: 'bg-destructive/12 text-destructive',
    MANAGER: 'bg-primary/12 text-primary',
    CONSULTANT_TECHNIQUE: 'bg-accent text-accent-foreground',
    CONSULTANT_FONCTIONNEL: 'bg-secondary text-secondary-foreground',
  };
  return styles[role];
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
  const [userPendingDelete, setUserPendingDelete] = useState<User | null>(null);

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
      setUsers((prev) => prev.map((entry) => (entry.id === userId ? updated : entry)));
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const saveUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        .map((entry) => entry.trim())
        .filter(Boolean),
      certifications: form.certifications
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
      availabilityPercent: form.availabilityPercent,
      teamId: 't1',
    };

    try {
      setIsSubmitting(true);
      if (editingUserId) {
        const updated = await UsersAPI.update(editingUserId, payload);
        setUsers((prev) => prev.map((entry) => (entry.id === editingUserId ? updated : entry)));
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

  const requestDeleteUser = (user: User) => {
    if (currentUser?.id === user.id) {
      toast.error('You cannot delete the currently connected user');
      return;
    }
    setUserPendingDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userPendingDelete) return;

    try {
      await UsersAPI.delete(userPendingDelete.id);
      setUsers((prev) => prev.filter((entry) => entry.id !== userPendingDelete.id));
      toast.success('User deleted');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setUserPendingDelete(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query || user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query);
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
          <Button type="button" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New User
          </Button>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        <Card className="bg-card/92">
          <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Label htmlFor="users-search" className="sr-only">
                Search users
              </Label>
              <Input
                id="users-search"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="users-role-filter" className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                Role
              </Label>
              <select
                id="users-role-filter"
                value={filterRole}
                onChange={(event) => setFilterRole(event.target.value as UserRole | 'ALL')}
                className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Administrator</option>
                <option value="MANAGER">Manager</option>
                <option value="CONSULTANT_TECHNIQUE">Technical Consultant</option>
                <option value="CONSULTANT_FONCTIONNEL">Functional Consultant</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-card/92">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px]">
                <thead className="bg-muted/65">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
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
                      <tr key={user.id} className="transition-colors hover:bg-accent/35">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-sm font-semibold text-primary">
                              {user.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">{user.name}</p>
                              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={getRoleBadgeTone(user.role)}>{getRoleLabel(user.role)}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {user.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={`${user.id}-${index}`} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                            {user.skills.length > 3 && (
                              <Badge variant="secondary">+{user.skills.length - 3}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-40 space-y-1">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Rate</span>
                              <span>{user.availabilityPercent}%</span>
                            </div>
                            <Progress value={user.availabilityPercent} />
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => void toggleUserStatus(user.id, user.active)}
                            aria-pressed={user.active}
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                              user.active
                                ? 'bg-primary/12 text-primary hover:bg-primary/18'
                                : 'bg-muted text-muted-foreground hover:bg-secondary'
                            )}
                          >
                            {user.active ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5" />
                                Inactive
                              </>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(user)}
                              aria-label={`Edit ${user.name}`}
                              title={`Edit ${user.name}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => requestDeleteUser(user)}
                              aria-label={`Delete ${user.name}`}
                              title={`Delete ${user.name}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          if (!open) {
            resetDialog();
            return;
          }
          setShowDialog(true);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingUserId ? 'Edit User' : 'Create User'}</DialogTitle>
            <DialogDescription>
              Manage account profile, role assignment, and staffing attributes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveUser} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-name">Name</Label>
                <Input
                  id="user-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-role">Role</Label>
                <select
                  id="user-role"
                  value={form.role}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, role: event.target.value as UserRole }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
                >
                  <option value="ADMIN">Administrator</option>
                  <option value="MANAGER">Manager</option>
                  <option value="CONSULTANT_TECHNIQUE">Technical Consultant</option>
                  <option value="CONSULTANT_FONCTIONNEL">Functional Consultant</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-availability">Availability %</Label>
                <Input
                  id="user-availability"
                  type="number"
                  min={0}
                  max={100}
                  value={form.availabilityPercent}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      availabilityPercent: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-skills">Skills (comma-separated)</Label>
              <Textarea
                id="user-skills"
                rows={3}
                value={form.skills}
                onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-certifications">Certifications (comma-separated)</Label>
              <Textarea
                id="user-certifications"
                rows={2}
                value={form.certifications}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, certifications: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="user-active"
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
              />
              <Label htmlFor="user-active">Active account</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : editingUserId ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={userPendingDelete !== null} onOpenChange={(open) => !open && setUserPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user</AlertDialogTitle>
            <AlertDialogDescription>
              {userPendingDelete
                ? `This will permanently remove "${userPendingDelete.name}" from the mock dataset.`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void confirmDeleteUser()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
