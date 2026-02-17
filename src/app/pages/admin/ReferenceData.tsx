import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ReferenceDataAPI } from '../../services/odataClient';
import { ReferenceData } from '../../types/entities';
import { Plus, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

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
    return items.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const q = search.trim().toLowerCase();
      if (!q) return matchesType;
      return (
        matchesType &&
        (item.code.toLowerCase().includes(q) || item.label.toLowerCase().includes(q))
      );
    });
  }, [items, search, typeFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.label.trim()) {
      toast.error('Code and label are required');
      return;
    }

    try {
      if (editingId) {
        const updated = await ReferenceDataAPI.update(editingId, {
          ...form,
          code: form.code.trim().toUpperCase(),
          label: form.label.trim(),
        });
        setItems((prev) => prev.map((item) => (item.id === editingId ? updated : item)));
        toast.success('Reference item updated');
      } else {
        const created = await ReferenceDataAPI.create({
          ...form,
          code: form.code.trim().toUpperCase(),
          label: form.label.trim(),
        });
        setItems((prev) => [created, ...prev]);
        toast.success('Reference item created');
      }
      resetForm();
    } catch (error) {
      toast.error('Failed to save reference item');
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

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-card border border-border rounded-lg p-5 h-fit">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {editingId ? 'Edit Reference Item' : 'Create Reference Item'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-muted-foreground">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    type: e.target.value as ReferenceData['type'],
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="TASK_STATUS">Task Status</option>
                <option value="PRIORITY">Priority</option>
                <option value="PROJECT_TYPE">Project Type</option>
                <option value="SKILL">Skill</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-muted-foreground">Code</label>
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                placeholder="EX: IN_PROGRESS"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-muted-foreground">Label</label>
              <input
                value={form.label}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                placeholder="Ex: In Progress"
              />
            </div>

            <div>
              <label className="block text-sm mb-1 text-muted-foreground">Order</label>
              <input
                type="number"
                min={1}
                value={form.order ?? 1}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, order: Number(e.target.value || 1) }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
              />
              Active
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-border rounded hover:bg-accent text-foreground flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col md:flex-row gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or label..."
              className="flex-1 px-3 py-2 border border-border rounded bg-card text-foreground"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as ReferenceType)}
              className="px-3 py-2 border border-border rounded bg-card text-foreground"
            >
              <option value="ALL">All Types</option>
              <option value="TASK_STATUS">Task Status</option>
              <option value="PRIORITY">Priority</option>
              <option value="PROJECT_TYPE">Project Type</option>
              <option value="SKILL">Skill</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase">
                    Label
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs text-muted-foreground uppercase">
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
                          onClick={() => void toggleActive(item)}
                          className={`px-2 py-1 rounded text-xs ${
                            item.active
                              ? 'bg-green-500/10 text-green-600'
                              : 'bg-gray-500/10 text-gray-500'
                          }`}
                        >
                          {item.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => startEdit(item)}
                            className="px-3 py-1.5 text-xs border border-border rounded hover:bg-accent"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => void removeItem(item.id)}
                            className="px-3 py-1.5 text-xs bg-red-500/10 text-red-600 rounded hover:bg-red-500/20 flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
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
      </div>
    </div>
  );
};
