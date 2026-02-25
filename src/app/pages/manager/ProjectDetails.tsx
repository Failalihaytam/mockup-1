import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AllocationsAPI,
  DeliverablesAPI,
  ProjectsAPI,
  TasksAPI,
  TicketsAPI,
  UsersAPI,
  AbaquesAPI,
} from '../../services/odataClient';
import { Allocation, Deliverable, Project, Task, Ticket, User, Abaque, AbaqueEntry } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Button } from '../../components/ui/button';
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

type TabKey = 'overview' | 'tasks' | 'team' | 'kpi' | 'docs' | 'abaques';
const PROJECT_TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'team', label: 'Team & Allocation' },
  { key: 'kpi', label: 'KPI Report' },
  { key: 'docs', label: 'Documentation' },
  { key: 'abaques', label: 'Abaques' },
];

interface ProjectDetailsProps {
  basePath?: string;
}

export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ basePath = '/manager' }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [abaques, setAbaques] = useState<Abaque[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [docText, setDocText] = useState('');
  const [docSaving, setDocSaving] = useState(false);

  // Abaque state
  const [selectedAbaqueId, setSelectedAbaqueId] = useState<string>('');
  const [abaqueEditMode, setAbaqueEditMode] = useState(false);
  const [editEntries, setEditEntries] = useState<AbaqueEntry[]>([]);
  const [abaqueSaving, setAbaqueSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void loadProjectData(id);
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      const [p, taskData, allocationData, userData, deliverableData, ticketData, abaqueData] =
        await Promise.all([
          ProjectsAPI.getById(projectId),
          TasksAPI.getByProject(projectId),
          AllocationsAPI.getAll(),
          UsersAPI.getAll(),
          DeliverablesAPI.getAll(),
          TicketsAPI.getAll(),
          AbaquesAPI.getByProject(projectId),
        ]);

      if (!p) {
        toast.error('Project not found');
        navigate(`${basePath}/projects`, { replace: true });
        return;
      }

      setProject(p);
      setDocText(p.documentation || '');
      setTasks(taskData);
      setAllocations(allocationData.filter((a) => a.projectId === projectId));
      setUsers(userData);
      setDeliverables(deliverableData.filter((d) => d.projectId === projectId));
      setTickets(ticketData.filter((t) => t.projectId === projectId));
      setAbaques(abaqueData);
      if (abaqueData.length > 0) {
        // Select latest version by default
        const sorted = [...abaqueData].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setSelectedAbaqueId(sorted[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const manager = useMemo(() => {
    if (!project) return null;
    return users.find((u) => u.id === project.managerId) ?? null;
  }, [project, users]);

  const kpis = useMemo(() => {
    if (!tasks.length) {
      return {
        onTrack: 0,
        late: 0,
        blocked: 0,
        completed: 0,
        critical: 0,
        productivity: 0,
      };
    }

    const late = tasks.filter(
      (task) => task.status !== 'DONE' && new Date(task.plannedEnd) < new Date()
    ).length;
    const blocked = tasks.filter((task) => task.status === 'BLOCKED').length;
    const completed = tasks.filter((task) => task.status === 'DONE').length;
    const critical = tasks.filter((task) => task.isCritical).length;
    const onTrack = tasks.length - late - blocked;
    const productivity =
      tasks.reduce((sum, task) => sum + task.progressPercent, 0) / tasks.length;

    return { onTrack, late, blocked, completed, critical, productivity };
  }, [tasks]);

  const kpiRules = [
    {
      name: 'Tasks On Track',
      formula: 'totalTasks - lateTasks - blockedTasks',
      source: 'Tasks',
    },
    {
      name: 'Late Tasks',
      formula: "count(status != 'DONE' and plannedEnd < today)",
      source: 'Tasks',
    },
    {
      name: 'Blocked Tasks',
      formula: "count(status = 'BLOCKED')",
      source: 'Tasks',
    },
    {
      name: 'Completed Tasks',
      formula: "count(status = 'DONE')",
      source: 'Tasks',
    },
    {
      name: 'Critical Tasks',
      formula: 'count(isCritical = true)',
      source: 'Tasks',
    },
    {
      name: 'Average Progress',
      formula: 'avg(task.progressPercent)',
      source: 'Tasks',
    },
  ] as const;

  // ---------------------------------------------------------------------------
  // Abaque helpers
  // ---------------------------------------------------------------------------

  const DEV_TYPES: Array<'Formulaire' | 'Report' | 'Enhancement' | 'Programme'> = ['Formulaire', 'Report', 'Enhancement', 'Programme'];
  const COMPLEXITES: Array<'Simple' | 'Moyen' | 'Complexe' | 'Très Complexe'> = ['Simple', 'Moyen', 'Complexe', 'Très Complexe'];
  const PRIORITES: Array<0 | 1 | 2 | 3> = [0, 1, 2, 3];

  const selectedAbaque = useMemo(() => abaques.find((a) => a.id === selectedAbaqueId) ?? null, [abaques, selectedAbaqueId]);
  const sortedAbaques = useMemo(() => [...abaques].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [abaques]);

  const canEditAbaque = currentUser?.role === 'MANAGER' || currentUser?.role === 'COORDINATEUR_DEV';

  const findEntry = useCallback((entries: AbaqueEntry[], dt: string, cx: string, pr: number) => {
    return entries.find((e) => e.devType === dt && e.complexite === cx && e.priorite === pr);
  }, []);

  const cellColor = (days: number) => {
    if (days <= 2) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    if (days <= 5) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    if (days <= 10) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
  };

  const enterEditMode = () => {
    if (!selectedAbaque) return;
    setEditEntries(selectedAbaque.entries.map((e) => ({ ...e })));
    setAbaqueEditMode(true);
  };

  const cancelEditMode = () => {
    setAbaqueEditMode(false);
    setEditEntries([]);
  };

  const updateEditEntry = (dt: string, cx: string, pr: number, field: 'standardDays' | 'maxDays' | 'notes', value: string) => {
    setEditEntries((prev) => {
      const existing = prev.find((e) => e.devType === dt && e.complexite === cx && e.priorite === pr);
      if (existing) {
        return prev.map((e) =>
          e.id === existing.id
            ? { ...e, [field]: field === 'notes' ? value : Math.max(0, Number(value) || 0) }
            : e
        );
      }
      // Create new entry
      const newEntry: AbaqueEntry = {
        id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        devType: dt as AbaqueEntry['devType'],
        complexite: cx as AbaqueEntry['complexite'],
        priorite: pr as AbaqueEntry['priorite'],
        standardDays: field === 'standardDays' ? (Number(value) || 0) : 0,
        maxDays: field === 'maxDays' ? (Number(value) || 0) : 0,
        notes: field === 'notes' ? value : undefined,
      };
      return [...prev, newEntry];
    });
  };

  const saveAbaque = async () => {
    if (!selectedAbaque || !currentUser) return;
    try {
      setAbaqueSaving(true);
      // Bump version: v1.0 -> v1.1, v1.9 -> v1.10
      const parts = selectedAbaque.version.replace('v', '').split('.');
      const newVersion = `v${parts[0]}.${parseInt(parts[1] || '0', 10) + 1}`;
      // Create new abaque version (keep old as snapshot)
      const newAbaque = await AbaquesAPI.create({
        projectId: selectedAbaque.projectId,
        title: selectedAbaque.title,
        version: newVersion,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser.id,
        approvedByClient: false,
        entries: editEntries.filter((e) => e.standardDays > 0 || e.maxDays > 0),
      });
      setAbaques((prev) => [...prev, newAbaque]);
      setSelectedAbaqueId(newAbaque.id);
      setAbaqueEditMode(false);
      setEditEntries([]);
      toast.success(`Abaque sauvegardé (${newVersion})`);
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setAbaqueSaving(false);
    }
  };

  const approveAbaque = async () => {
    if (!selectedAbaque || !currentUser) return;
    try {
      setAbaqueSaving(true);
      const updated = await AbaquesAPI.update(selectedAbaque.id, {
        approvedByClient: true,
        approvedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser.id,
      });
      setAbaques((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      toast.success('Abaque marqué comme approuvé par le client');
    } catch {
      toast.error('Erreur');
    } finally {
      setAbaqueSaving(false);
    }
  };

  const createNewVersion = async () => {
    if (!selectedAbaque || !currentUser) return;
    try {
      setAbaqueSaving(true);
      const majorParts = selectedAbaque.version.replace('v', '').split('.');
      const newVersion = `v${parseInt(majorParts[0] || '1', 10) + 1}.0`;
      const newAbaque = await AbaquesAPI.create({
        projectId: selectedAbaque.projectId,
        title: selectedAbaque.title,
        version: newVersion,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        lastUpdatedAt: new Date().toISOString(),
        lastUpdatedBy: currentUser.id,
        approvedByClient: false,
        entries: selectedAbaque.entries.map((e) => ({ ...e, id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      });
      setAbaques((prev) => [...prev, newAbaque]);
      setSelectedAbaqueId(newAbaque.id);
      // Open in edit mode
      setEditEntries(newAbaque.entries.map((e) => ({ ...e })));
      setAbaqueEditMode(true);
      toast.success(`Nouvelle version ${newVersion} créée`);
    } catch {
      toast.error('Erreur');
    } finally {
      setAbaqueSaving(false);
    }
  };

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      const updated = await TasksAPI.update(taskId, patch);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, tabKey: TabKey) => {
    const currentIndex = PROJECT_TABS.findIndex((tab) => tab.key === tabKey);
    if (currentIndex === -1) return;

    const moveFocusTo = (nextIndex: number) => {
      const nextTab = PROJECT_TABS[nextIndex];
      setActiveTab(nextTab.key);
      queueMicrotask(() => {
        const target = document.getElementById(`project-tab-${nextTab.key}`);
        target?.focus();
      });
    };

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveFocusTo((currentIndex + 1) % PROJECT_TABS.length);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveFocusTo((currentIndex - 1 + PROJECT_TABS.length) % PROJECT_TABS.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      moveFocusTo(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      moveFocusTo(PROJECT_TABS.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-8 text-muted-foreground">Loading project details...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={project.name}
        subtitle="Project cockpit with overview, tasks, team and KPI insights"
        breadcrumbs={[
          { label: 'Home', path: `${basePath}/dashboard` },
          { label: 'Projects', path: `${basePath}/projects` },
          { label: project.name },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="overflow-x-auto">
          <div role="tablist" aria-label="Project detail sections" className="flex min-w-max gap-2">
            {PROJECT_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`project-tab-${tab.key}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`project-panel-${tab.key}`}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded border px-4 py-2 text-sm whitespace-nowrap ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:bg-accent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === 'overview' && (
          <section
            id="project-panel-overview"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-overview"
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Project Snapshot</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">Manager</div>
                  <div className="font-medium text-foreground">{manager?.name ?? 'Unknown'}</div>
                </div>
                <div className="p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">Budget</div>
                  <div className="font-medium text-foreground">
                    ${project.budget?.toLocaleString() ?? 'N/A'}
                  </div>
                </div>
                <div className="p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">Start Date</div>
                  <div className="font-medium text-foreground">
                    {new Date(project.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="p-3 rounded border border-border">
                  <div className="text-xs text-muted-foreground">End Date</div>
                  <div className="font-medium text-foreground">
                    {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Global Progress</span>
                  <span className="font-medium text-foreground">{project.progress ?? 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 bg-primary rounded-full"
                    style={{ width: `${project.progress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Live Metrics</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tasks</span>
                <span className="font-medium text-foreground">{tasks.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deliverables</span>
                <span className="font-medium text-foreground">{deliverables.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Open Tickets</span>
                <span className="font-medium text-foreground">
                  {tickets.filter((ticket) => ticket.status !== 'CLOSED').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Critical Tasks</span>
                <span className="font-medium text-destructive">{kpis.critical}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Blocked</span>
                <span className="font-medium text-accent-foreground">{kpis.blocked}</span>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'tasks' && (
          <section
            id="project-panel-tasks"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-tasks"
            className="rounded-lg border bg-card"
          >
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Task</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Risk</TableHead>
                  <TableHead className="px-4">Progress</TableHead>
                  <TableHead className="px-4">Assignee</TableHead>
                  <TableHead className="px-4">Deadline</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="px-4 py-3">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Select
                        value={task.status}
                        onValueChange={(val) =>
                          void updateTask(task.id, {
                            status: val as Task['status'],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TO_DO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Select
                        value={task.riskLevel}
                        onValueChange={(val) =>
                          void updateTask(task.id, {
                            riskLevel: val as Task['riskLevel'],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-[110px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">None</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{task.progressPercent}%</TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {users.find((u) => u.id === task.assigneeId)?.name ?? 'Unassigned'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {new Date(task.plannedEnd).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
                {tasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No tasks found for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        )}

        {activeTab === 'team' && (
          <section
            id="project-panel-team"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-team"
            className="rounded-lg border bg-card"
          >
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Consultant</TableHead>
                  <TableHead className="px-4">Role</TableHead>
                  <TableHead className="px-4">Allocation</TableHead>
                  <TableHead className="px-4">Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((allocation) => {
                  const user = users.find((u) => u.id === allocation.userId);
                  return (
                    <TableRow key={allocation.id}>
                      <TableCell className="px-4 py-3 text-sm">{user?.name ?? '-'}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {user?.role ?? '-'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{allocation.allocationPercent}%</TableCell>
                      <TableCell className="px-4 py-3 text-sm">
                        {user?.availabilityPercent ?? '-'}%
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allocations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No allocations found for this project.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>
        )}

        {activeTab === 'kpi' && (
          <section
            id="project-panel-kpi"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-kpi"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Tasks On Track</div>
                <div className="text-2xl font-semibold text-foreground">{kpis.onTrack}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Late Tasks</div>
                <div className="text-2xl font-semibold text-accent-foreground">{kpis.late}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Blocked Tasks</div>
                <div className="text-2xl font-semibold text-destructive">{kpis.blocked}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Completed Tasks</div>
                <div className="text-2xl font-semibold text-primary">{kpis.completed}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Critical Tasks</div>
                <div className="text-2xl font-semibold text-destructive">{kpis.critical}</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Average Progress</div>
                <div className="text-2xl font-semibold text-foreground">
                  {kpis.productivity.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">KPI</TableHead>
                    <TableHead className="px-4">Formula</TableHead>
                    <TableHead className="px-4">Source</TableHead>
                    <TableHead className="px-4">Refresh</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kpiRules.map((rule) => (
                    <TableRow key={rule.name}>
                      <TableCell className="px-4 py-3 text-sm">{rule.name}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {rule.formula}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{rule.source}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">On page load</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* SLA Delay Breakdown */}
            {(() => {
              const lateTasks = tasks.filter(
                (t) => t.status !== 'DONE' && new Date(t.plannedEnd) < new Date()
              );
              const avgDelay = lateTasks.length
                ? lateTasks.reduce((sum, t) => {
                    const diff = Math.ceil(
                      (Date.now() - new Date(t.plannedEnd).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    return sum + diff;
                  }, 0) / lateTasks.length
                : 0;

              return (
                <div className="space-y-3">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-1">Average SLA Delay</div>
                    <div className="text-2xl font-semibold text-accent-foreground">
                      {avgDelay.toFixed(1)} days
                    </div>
                  </div>
                  {lateTasks.length > 0 && (
                    <div className="rounded-lg border bg-card">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="px-4">Late Task</TableHead>
                            <TableHead className="px-4">Planned End</TableHead>
                            <TableHead className="px-4">Delay (days)</TableHead>
                            <TableHead className="px-4">Assignee</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {lateTasks.map((t) => {
                            const delay = Math.ceil(
                              (Date.now() - new Date(t.plannedEnd).getTime()) / (1000 * 60 * 60 * 24)
                            );
                            return (
                              <TableRow key={t.id}>
                                <TableCell className="px-4 py-3 text-sm font-medium">{t.title}</TableCell>
                                <TableCell className="px-4 py-3 text-sm">{new Date(t.plannedEnd).toLocaleDateString()}</TableCell>
                                <TableCell className="px-4 py-3 text-sm font-semibold text-destructive">{delay}</TableCell>
                                <TableCell className="px-4 py-3 text-sm">{users.find((u) => u.id === t.assigneeId)?.name ?? 'Unassigned'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {activeTab === 'docs' && (
          <section
            id="project-panel-docs"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-docs"
            className="space-y-4"
          >
            {/* Project Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Complexity</div>
                <div className="text-lg font-semibold text-foreground">
                  <Badge variant="outline">{project.complexity ?? 'N/A'}</Badge>
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Budget (Chiffrage)</div>
                <div className="text-lg font-semibold text-foreground">
                  ${project.budget?.toLocaleString() ?? 'N/A'}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Time Spent (h)</div>
                <div className="text-lg font-semibold text-foreground">
                  {tasks.reduce((sum, t) => sum + t.actualHours, 0).toFixed(1)}
                </div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-1">Estimated Hours</div>
                <div className="text-lg font-semibold text-foreground">
                  {tasks.reduce((sum, t) => sum + t.estimatedHours, 0).toFixed(1)}
                </div>
              </div>
            </div>

            {/* Tech Keywords */}
            {project.techKeywords && project.techKeywords.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="text-xs text-muted-foreground mb-2">Tech Keywords</div>
                <div className="flex flex-wrap gap-2">
                  {project.techKeywords.map((kw) => (
                    <Badge key={kw} variant="secondary">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation area */}
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-lg font-semibold text-foreground">Project Documentation</h3>
              <Textarea
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                rows={12}
                placeholder="Write project documentation here (markdown supported)..."
                className="font-mono text-sm"
              />
              <div className="flex justify-end">
                <Button
                  disabled={docSaving}
                  onClick={async () => {
                    setDocSaving(true);
                    try {
                      await ProjectsAPI.update(project.id, { documentation: docText });
                      setProject((prev) => (prev ? { ...prev, documentation: docText } : prev));
                      toast.success('Documentation saved');
                    } catch {
                      toast.error('Failed to save documentation');
                    } finally {
                      setDocSaving(false);
                    }
                  }}
                >
                  {docSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Abaques Tab                                                       */}
        {/* ----------------------------------------------------------------- */}
        {activeTab === 'abaques' && (
          <section
            id="project-panel-abaques"
            role="tabpanel"
            tabIndex={0}
            aria-labelledby="project-tab-abaques"
            className="space-y-4"
          >
            {abaques.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center space-y-3">
                <p className="text-muted-foreground">Aucun abaque défini pour ce projet.</p>
                {canEditAbaque && (
                  <Button
                    onClick={async () => {
                      if (!currentUser || !project) return;
                      try {
                        setAbaqueSaving(true);
                        const created = await AbaquesAPI.create({
                          projectId: project.id,
                          title: `Abaque ${project.name}`,
                          version: 'v1.0',
                          createdAt: new Date().toISOString(),
                          createdBy: currentUser.id,
                          lastUpdatedAt: new Date().toISOString(),
                          lastUpdatedBy: currentUser.id,
                          approvedByClient: false,
                          entries: [],
                        });
                        setAbaques([created]);
                        setSelectedAbaqueId(created.id);
                        setEditEntries([]);
                        setAbaqueEditMode(true);
                        toast.success('Abaque créé — remplissez la grille');
                      } catch {
                        toast.error('Erreur');
                      } finally {
                        setAbaqueSaving(false);
                      }
                    }}
                    disabled={abaqueSaving}
                  >
                    Créer un Abaque
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Header bar */}
                <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
                  {/* Version selector */}
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Version :</Label>
                    <select
                      value={selectedAbaqueId}
                      onChange={(e) => { setSelectedAbaqueId(e.target.value); setAbaqueEditMode(false); }}
                      className="rounded border border-border bg-background px-2 py-1 text-sm"
                    >
                      {sortedAbaques.map((a) => (
                        <option key={a.id} value={a.id}>{a.version} — {new Date(a.createdAt).toLocaleDateString()}</option>
                      ))}
                    </select>
                  </div>

                  {selectedAbaque && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        par {users.find((u) => u.id === selectedAbaque.createdBy)?.name ?? selectedAbaque.createdBy}
                      </span>
                      {selectedAbaque.approvedByClient ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          Approuvé par le client ✓
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                          En attente d'approbation
                        </Badge>
                      )}
                    </>
                  )}

                  <div className="flex-1" />

                  {canEditAbaque && selectedAbaque && !abaqueEditMode && (
                    <div className="flex gap-2">
                      {selectedAbaque.approvedByClient ? (
                        <Button size="sm" onClick={() => void createNewVersion()} disabled={abaqueSaving}>
                          Créer une nouvelle version
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={enterEditMode}>
                            Modifier l'Abaque
                          </Button>
                          <Button size="sm" onClick={() => void approveAbaque()} disabled={abaqueSaving}>
                            Marquer comme approuvé par le client
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline" onClick={() => window.print()}>
                        Exporter en PDF
                      </Button>
                    </div>
                  )}

                  {abaqueEditMode && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelEditMode}>Annuler</Button>
                      <Button size="sm" onClick={() => void saveAbaque()} disabled={abaqueSaving}>
                        {abaqueSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Matrix grid */}
                {selectedAbaque && (
                  <div className="rounded-lg border bg-card overflow-x-auto print:border-none">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="px-3 py-2 text-left border-b font-semibold text-xs text-muted-foreground">DevType</th>
                          <th className="px-3 py-2 text-left border-b font-semibold text-xs text-muted-foreground">Complexité</th>
                          {PRIORITES.map((p) => (
                            <th key={p} className="px-3 py-2 text-center border-b font-semibold text-xs text-muted-foreground">P{p}</th>
                          ))}
                          <th className="px-3 py-2 text-left border-b font-semibold text-xs text-muted-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {DEV_TYPES.map((dt) => (
                          <React.Fragment key={dt}>
                            {COMPLEXITES.map((cx, cxIdx) => {
                              const entries = abaqueEditMode ? editEntries : selectedAbaque.entries;
                              return (
                                <tr key={`${dt}-${cx}`} className={cxIdx === 0 ? 'border-t-2 border-border' : ''}>
                                  {cxIdx === 0 && (
                                    <td rowSpan={COMPLEXITES.length} className="px-3 py-2 font-semibold text-xs align-top border-r border-border">
                                      {dt}
                                    </td>
                                  )}
                                  <td className="px-3 py-2 text-xs border-r border-border">{cx}</td>
                                  {PRIORITES.map((pr) => {
                                    const entry = findEntry(entries, dt, cx, pr);
                                    if (abaqueEditMode) {
                                      return (
                                        <td key={pr} className="px-1 py-1 text-center border-r border-border">
                                          <div className="flex gap-0.5 items-center justify-center">
                                            <Input
                                              type="number"
                                              min={0}
                                              value={entry?.standardDays ?? ''}
                                              onChange={(e) => updateEditEntry(dt, cx, pr, 'standardDays', e.target.value)}
                                              placeholder="std"
                                              className="w-14 h-7 text-xs text-center px-1"
                                            />
                                            <span className="text-muted-foreground text-[10px]">/</span>
                                            <Input
                                              type="number"
                                              min={0}
                                              value={entry?.maxDays ?? ''}
                                              onChange={(e) => updateEditEntry(dt, cx, pr, 'maxDays', e.target.value)}
                                              placeholder="max"
                                              className="w-14 h-7 text-xs text-center px-1"
                                            />
                                          </div>
                                        </td>
                                      );
                                    }
                                    if (!entry) {
                                      return <td key={pr} className="px-3 py-2 text-center text-muted-foreground text-xs border-r border-border">—</td>;
                                    }
                                    return (
                                      <td key={pr} className="px-2 py-1 text-center border-r border-border">
                                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cellColor(entry.standardDays)}`}>
                                          {entry.standardDays}j / {entry.maxDays}j
                                        </span>
                                      </td>
                                    );
                                  })}
                                  <td className="px-2 py-1 text-xs text-muted-foreground max-w-[200px]">
                                    {abaqueEditMode ? (
                                      <Input
                                        value={findEntry(editEntries, dt, cx, PRIORITES[0])?.notes ?? ''}
                                        onChange={(e) => {
                                          PRIORITES.forEach((pr) => updateEditEntry(dt, cx, pr, 'notes', e.target.value));
                                        }}
                                        placeholder="Notes..."
                                        className="h-7 text-xs"
                                      />
                                    ) : (
                                      (() => {
                                        const note = selectedAbaque.entries.find(
                                          (e) => e.devType === dt && e.complexite === cx && e.notes
                                        )?.notes;
                                        return note ?? '';
                                      })()
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-green-200 dark:bg-green-900/40" /> ≤ 2j</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-blue-200 dark:bg-blue-900/40" /> 3–5j</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-orange-200 dark:bg-orange-900/40" /> 6–10j</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded bg-red-200 dark:bg-red-900/40" /> &gt; 10j</span>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
