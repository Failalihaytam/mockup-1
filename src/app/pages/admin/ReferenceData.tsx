import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
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
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { ReferenceDataAPI } from '../../services/odataClient';
import { ReferenceData } from '../../types/entities';

type ReferenceType = ReferenceData['type'] | 'ALL';

const EMPTY_FORM: Omit<ReferenceData, 'id'> = {
  type: 'TASK_STATUS',
  code: '',
  label: '',
  active: true,
  order: 1,
};

export const ReferenceDataManagement: React.FC = () => {
  const [items, setItems] = useState<ReferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<ReferenceType>('ALL');
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<Omit<ReferenceData, 'id'>>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemPendingDelete, setItemPendingDelete] = useState<ReferenceData | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ReferenceDataAPI.getAll();
      setItems(data);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
        const query = search.trim().toLowerCase();
        if (!query) return matchesType;
        return (
          matchesType &&
          (item.code.toLowerCase().includes(query) || item.label.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type.localeCompare(b.type);
        if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
        return a.label.localeCompare(b.label);
      });
  }, [items, search, typeFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim() || !form.label.trim()) {
      toast.error('Code and label are required');
      return;
    }
    if ((form.order ?? 1) < 1) {
      toast.error('Order must be at least 1');
      return;
    }

    const normalizedCode = form.code.trim().toUpperCase();
    const duplicate = items.find(
      (item) =>
        item.type === form.type &&
        item.code.toUpperCase() === normalizedCode &&
        item.id !== editingId
    );
    if (duplicate) {
      toast.error('A reference item with this type and code already exists');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingId) {
        const updated = await ReferenceDataAPI.update(editingId, {
          ...form,
          code: normalizedCode,
          label: form.label.trim(),
        });
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        toast.success('Reference item updated');
      } else {
        const created = await ReferenceDataAPI.create({
          ...form,
          code: normalizedCode,
          label: form.label.trim(),
        });
        setItems((prev) => [created, ...prev]);
        toast.success('Reference item created');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save reference item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (item: ReferenceData) => {
    setEditingId(item.id);
    setForm({
      type: item.type,
      code: item.code,
      label: item.label,
      active: item.active,
      order: item.order ?? 1,
    });
  };

  const toggleActive = async (item: ReferenceData) => {
    try {
      const updated = await ReferenceDataAPI.update(item.id, { active: !item.active });
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const removeItem = async (id: string) => {
    try {
      await ReferenceDataAPI.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success('Reference item deleted');
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      toast.error('Failed to delete reference item');
    } finally {
      setItemPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Reference Data Management"
        subtitle="Manage task statuses, priorities, project types and skills"
        breadcrumbs={[
          { label: 'Home', path: '/admin/dashboard' },
          { label: 'Reference Data' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3 lg:p-8">
        <Card className="h-fit bg-card/92 xl:col-span-1">
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              {editingId ? 'Edit Reference Item' : 'Create Reference Item'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="reference-type">Type</Label>
                <select
                  id="reference-type"
                  value={form.type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      type: event.target.value as ReferenceData['type'],
                    }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-input-background px-3 text-sm"
                >
                  <option value="TASK_STATUS">Task Status</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="PROJECT_TYPE">Project Type</option>
                  <option value="SKILL">Skill</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-code">Code</Label>
                <Input
                  id="reference-code"
                  value={form.code}
                  onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                  placeholder="EX: IN_PROGRESS"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-label">Label</Label>
                <Input
                  id="reference-label"
                  value={form.label}
                  onChange={(event) => setForm((prev) => ({ ...prev, label: event.target.value }))}
                  placeholder="Ex: In Progress"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reference-order">Order</Label>
                <Input
                  id="reference-order"
                  type="number"
                  min={1}
                  value={form.order ?? 1}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, order: Number(event.target.value || 1) }))
                  }
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="reference-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
                />
                <Label htmlFor="reference-active">Active</Label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-card/92 xl:col-span-2">
          <CardContent className="p-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row">
              <div className="space-y-1 md:flex-1">
                <Label htmlFor="reference-search" className="sr-only">
                  Search reference data
                </Label>
                <Input
                  id="reference-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search code or label..."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="reference-type-filter" className="sr-only">
                  Filter by type
                </Label>
                <select
                  id="reference-type-filter"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value as ReferenceType)}
                  className="h-9 rounded-md border border-input bg-input-background px-3 text-sm md:w-[220px]"
                >
                  <option value="ALL">All Types</option>
                  <option value="TASK_STATUS">Task Status</option>
                  <option value="PRIORITY">Priority</option>
                  <option value="PROJECT_TYPE">Project Type</option>
                  <option value="SKILL">Skill</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-muted/65">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Label
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        Loading reference data...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No reference entries found
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3 text-sm text-foreground">{item.type}</td>
                        <td className="px-4 py-3 text-sm font-mono text-foreground">{item.code}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.label}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.order ?? '-'}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => void toggleActive(item)}
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.active
                                ? 'bg-primary/12 text-primary hover:bg-primary/18'
                                : 'bg-muted text-muted-foreground hover:bg-secondary'
                            }`}
                          >
                            {item.active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(item)}>
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setItemPendingDelete(item)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
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

      <AlertDialog open={itemPendingDelete !== null} onOpenChange={(open) => !open && setItemPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reference item</AlertDialogTitle>
            <AlertDialogDescription>
              {itemPendingDelete
                ? `Delete "${itemPendingDelete.label}" (${itemPendingDelete.code}) from reference data?`
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => itemPendingDelete && void removeItem(itemPendingDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
