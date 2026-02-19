import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  AllocationsAPI,
  NotificationsAPI,
  ProjectsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Allocation, Project, User } from '../../types/entities';
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

const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  !(endA < startB || endB < startA);

export const ResourceAllocation: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewAllocationForm>(EMPTY_FORM);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationPendingDelete, setAllocationPendingDelete] = useState<Allocation | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, string>>({});

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
      setAllocationDrafts({});
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

  const createAllocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.userId || !form.projectId) {
      toast.error('User and project are required');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (form.allocationPercent < 0 || form.allocationPercent > 100) {
      toast.error('Allocation percent must be between 0 and 100');
      return;
    }

    const duplicatePeriod = allocations.some(
      (allocation) =>
        allocation.userId === form.userId &&
        allocation.projectId === form.projectId &&
        rangesOverlap(form.startDate, form.endDate, allocation.startDate, allocation.endDate)
    );
    if (duplicatePeriod) {
      toast.error('This consultant already has an overlapping allocation for this project');
      return;
    }

    const currentTotal = userTotalAllocation.get(form.userId) ?? 0;
    const nextTotal = currentTotal + form.allocationPercent;
    if (nextTotal > 100) {
      toast.error(`Allocation exceeds 100% for this user (${nextTotal}%)`);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await AllocationsAPI.create({ ...form });
      setAllocations((prev) => [created, ...prev]);

      const projectName = projects.find((project) => project.id === form.projectId)?.name ?? 'project';
      await NotificationsAPI.create({
        userId: form.userId,
        type: 'ALLOCATION_UPDATED',
        title: 'New Allocation Assigned',
        message: `You have been allocated ${form.allocationPercent}% on ${projectName}.`,
        read: false,
      });

      setForm(EMPTY_FORM);
      toast.success('Allocation created');
    } catch (error) {
      toast.error('Failed to create allocation');
    } finally {
      setIsSubmitting(false);
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
      setAllocations((prev) => prev.map((entry) => (entry.id === allocation.id ? updated : entry)));
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
    } finally {
      setAllocationPendingDelete(null);
    }
  };

  const resolveUser = (userId: string) => users.find((user) => user.id === userId);
  const resolveProject = (projectId: string) => projects.find((project) => project.id === projectId);

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

      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3 lg:p-8">
        <Card className="h-fit bg-card/92">
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">New Allocation</h3>
            <form onSubmit={createAllocation} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="allocation-user">Consultant</Label>
                <Select
                  value={form.userId}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, userId: val }))}
                >
                  <SelectTrigger id="allocation-user">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allocation-project">Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, projectId: val }))}
                >
                  <SelectTrigger id="allocation-project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allocation-percent">Allocation %</Label>
                <Input
                  id="allocation-percent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.allocationPercent}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, allocationPercent: Number(event.target.value || 0) }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="allocation-start">Start</Label>
                  <Input
                    id="allocation-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allocation-end">End</Label>
                  <Input
                    id="allocation-end"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Add Allocation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-card/92 xl:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Allocation Matrix</h3>
              <div className="space-y-1">
                <Label htmlFor="allocation-project-filter" className="sr-only">
                  Filter by project
                </Label>
                <Select
                  value={projectFilter}
                  onValueChange={(val) => setProjectFilter(val)}
                >
                  <SelectTrigger id="allocation-project-filter" className="w-[180px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/65">
                <TableRow>
                  <TableHead className="px-4">Consultant</TableHead>
                  <TableHead className="px-4">Project</TableHead>
                  <TableHead className="px-4">Allocation</TableHead>
                  <TableHead className="px-4">Total/User</TableHead>
                  <TableHead className="px-4">Period</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading allocations...
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No allocations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((allocation) => {
                    const user = resolveUser(allocation.userId);
                    const project = resolveProject(allocation.projectId);
                    const total = userTotalAllocation.get(allocation.userId) ?? 0;

                    return (
                      <TableRow key={allocation.id} className="hover:bg-accent/40">
                        <TableCell className="px-4 py-3 font-medium">{user?.name ?? '-'}</TableCell>
                        <TableCell className="px-4 py-3">{project?.name ?? '-'}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              allocationDrafts[allocation.id] ??
                              String(allocation.allocationPercent)
                            }
                            className="h-8 w-20"
                            onChange={(event) =>
                              setAllocationDrafts((prev) => ({
                                ...prev,
                                [allocation.id]: event.target.value,
                              }))
                            }
                            onBlur={() => {
                              const raw = allocationDrafts[allocation.id];
                              const next = Number(
                                raw !== undefined ? raw : allocation.allocationPercent
                              );
                              setAllocationDrafts((prev) => {
                                const copy = { ...prev };
                                delete copy[allocation.id];
                                return copy;
                              });
                              if (Number.isFinite(next)) {
                                void updatePercent(allocation, next);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                (event.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 font-medium ${
                            total > 100 ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {total}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {allocation.startDate} to {allocation.endDate}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAllocationPendingDelete(allocation)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={allocationPendingDelete !== null}
        onOpenChange={(open) => !open && setAllocationPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove allocation</AlertDialogTitle>
            <AlertDialogDescription>
              {allocationPendingDelete
                ? 'This allocation entry will be removed from the mock data.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => allocationPendingDelete && void removeAllocation(allocationPendingDelete.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
