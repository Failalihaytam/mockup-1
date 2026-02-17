import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { AllocationsAPI, ProjectsAPI, UsersAPI } from '../../services/odataClient';
import { Allocation, Project, User } from '../../types/entities';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { todayLocalDateKey } from '../../utils/date';

interface NewAllocationForm {
  userId: string;
  projectId: string;
  allocationPercent: number;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: NewAllocationForm = {
  userId: '',
  projectId: '',
  allocationPercent: 50,
  startDate: todayLocalDateKey(),
  endDate: todayLocalDateKey(),
};

export const ResourceAllocation: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewAllocationForm>(EMPTY_FORM);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, projectData, allocationData] = await Promise.all([
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        AllocationsAPI.getAll(),
      ]);
      setUsers(userData.filter((user) => user.role !== 'ADMIN'));
      setProjects(projectData);
      setAllocations(allocationData);
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = useMemo(() => {
    if (projectFilter === 'ALL') return allocations;
    return allocations.filter((allocation) => allocation.projectId === projectFilter);
  }, [allocations, projectFilter]);

  const userTotalAllocation = useMemo(() => {
    const totals = new Map<string, number>();
    allocations.forEach((allocation) => {
      totals.set(
        allocation.userId,
        (totals.get(allocation.userId) ?? 0) + allocation.allocationPercent
      );
    });
    return totals;
  }, [allocations]);

  const createAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.userId || !form.projectId) {
      toast.error('User and project are required');
      return;
    }
    if (form.allocationPercent < 0 || form.allocationPercent > 100) {
      toast.error('Allocation percent must be between 0 and 100');
      return;
    }
    const currentTotal = userTotalAllocation.get(form.userId) ?? 0;
    const nextTotal = currentTotal + form.allocationPercent;
    if (nextTotal > 100) {
      toast.error(`Allocation exceeds 100% for this user (${nextTotal}%)`);
      return;
    }

    try {
      const created = await AllocationsAPI.create({
        ...form,
      });
      setAllocations((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      toast.success('Allocation created');
    } catch (error) {
      toast.error('Failed to create allocation');
    }
  };

  const updatePercent = async (allocation: Allocation, nextPercent: number) => {
    if (nextPercent < 0 || nextPercent > 100) {
      toast.error('Allocation percent must be between 0 and 100');
      return;
    }
    const currentTotal = userTotalAllocation.get(allocation.userId) ?? 0;
    const totalWithoutCurrent = currentTotal - allocation.allocationPercent;
    const nextTotal = totalWithoutCurrent + nextPercent;
    if (nextTotal > 100) {
      toast.error(`Allocation exceeds 100% for this user (${nextTotal}%)`);
      return;
    }

    try {
      const updated = await AllocationsAPI.update(allocation.id, {
        allocationPercent: nextPercent,
      });
      setAllocations((prev) =>
        prev.map((entry) => (entry.id === allocation.id ? updated : entry))
      );
    } catch (error) {
      toast.error('Failed to update allocation');
    }
  };

  const removeAllocation = async (id: string) => {
    try {
      await AllocationsAPI.delete(id);
      setAllocations((prev) => prev.filter((entry) => entry.id !== id));
      toast.success('Allocation removed');
    } catch (error) {
      toast.error('Failed to remove allocation');
    }
  };

  const resolveUser = (userId: string) => users.find((user) => user.id === userId);
  const resolveProject = (projectId: string) =>
    projects.find((project) => project.id === projectId);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Resource Allocation"
        subtitle="Assign consultants to projects and monitor allocation rates"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Resource Allocation' },
        ]}
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 h-fit">
          <h3 className="text-lg font-semibold text-foreground mb-4">New Allocation</h3>
          <form onSubmit={createAllocation} className="space-y-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Consultant</label>
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                Allocation %
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.allocationPercent}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    allocationPercent: Number(e.target.value || 0),
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Start</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">End</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Allocation
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Allocation Matrix</h3>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-2 border border-border rounded bg-card text-foreground"
            >
              <option value="ALL">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Consultant
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Allocation
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Total/User
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Period
                  </th>
                  <th className="px-4 py-3 text-right text-xs uppercase text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Loading allocations...
                    </td>
                  </tr>
                ) : filteredAllocations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No allocations found.
                    </td>
                  </tr>
                ) : (
                  filteredAllocations.map((allocation) => {
                    const user = resolveUser(allocation.userId);
                    const project = resolveProject(allocation.projectId);
                    const total = userTotalAllocation.get(allocation.userId) ?? 0;
                    return (
                      <tr key={allocation.id} className="hover:bg-accent/40">
                        <td className="px-4 py-3 text-sm text-foreground">{user?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{project?.name ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-foreground">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={allocation.allocationPercent}
                            onChange={(e) =>
                              void updatePercent(allocation, Number(e.target.value || 0))
                            }
                            className="w-20 px-2 py-1 border border-border rounded bg-card text-foreground"
                          />
                        </td>
                        <td
                          className={`px-4 py-3 text-sm font-medium ${
                            total > 100 ? 'text-red-500' : 'text-foreground'
                          }`}
                        >
                          {total}%
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {allocation.startDate} to {allocation.endDate}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              onClick={() => void removeAllocation(allocation.id)}
                              className="px-3 py-1.5 text-xs rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
