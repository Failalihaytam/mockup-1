import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AllocationsAPI,
  DeliverablesAPI,
  ProjectsAPI,
  TasksAPI,
  TicketsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Allocation, Deliverable, Project, Task, Ticket, User } from '../../types/entities';
import { toast } from 'sonner';

type TabKey = 'overview' | 'tasks' | 'team' | 'kpi';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    void loadProjectData(id);
  }, [id]);

  const loadProjectData = async (projectId: string) => {
    setLoading(true);
    try {
      const [p, taskData, allocationData, userData, deliverableData, ticketData] =
        await Promise.all([
          ProjectsAPI.getById(projectId),
          TasksAPI.getByProject(projectId),
          AllocationsAPI.getAll(),
          UsersAPI.getAll(),
          DeliverablesAPI.getAll(),
          TicketsAPI.getAll(),
        ]);

      if (!p) {
        toast.error('Project not found');
        navigate('/manager/projects', { replace: true });
        return;
      }

      setProject(p);
      setTasks(taskData);
      setAllocations(allocationData.filter((a) => a.projectId === projectId));
      setUsers(userData);
      setDeliverables(deliverableData.filter((d) => d.projectId === projectId));
      setTickets(ticketData.filter((t) => t.projectId === projectId));
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

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      const updated = await TasksAPI.update(taskId, patch);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
      toast.success('Task updated');
    } catch (error) {
      toast.error('Failed to update task');
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
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Projects', path: '/manager/projects' },
          { label: project.name },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tasks', label: 'Tasks' },
            { key: 'team', label: 'Team & Allocation' },
            { key: 'kpi', label: 'KPI Report' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabKey)}
              className={`px-4 py-2 rounded border text-sm ${
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Project Snapshot</h3>
              <p className="text-sm text-muted-foreground">{project.description}</p>
              <div className="grid grid-cols-2 gap-4">
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
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Task</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Risk</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Progress</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Assignee</th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">Deadline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{task.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          void updateTask(task.id, {
                            status: e.target.value as Task['status'],
                          })
                        }
                        className="px-2 py-1 rounded border border-border bg-card text-sm"
                      >
                        <option value="TO_DO">TO_DO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.riskLevel}
                        onChange={(e) =>
                          void updateTask(task.id, {
                            riskLevel: e.target.value as Task['riskLevel'],
                          })
                        }
                        className="px-2 py-1 rounded border border-border bg-card text-sm"
                      >
                        <option value="NONE">NONE</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{task.progressPercent}%</td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {users.find((u) => u.id === task.assigneeId)?.name ?? 'Unassigned'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {new Date(task.plannedEnd).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Consultant
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Allocation
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Availability
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allocations.map((allocation) => {
                  const user = users.find((u) => u.id === allocation.userId);
                  return (
                    <tr key={allocation.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3 text-sm text-foreground">{user?.name ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user?.role ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {allocation.allocationPercent}%
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {user?.availabilityPercent ?? '-'}%
                      </td>
                    </tr>
                  );
                })}
                {!allocations.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      No allocations found for this project.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'kpi' && (
          <div className="space-y-4">
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

            <div className="bg-card border border-border rounded-lg overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground">
                      KPI
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground">
                      Formula
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground">
                      Source
                    </th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground">
                      Refresh
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {kpiRules.map((rule) => (
                    <tr key={rule.name} className="hover:bg-accent/40">
                      <td className="px-3 py-2 text-sm text-foreground">{rule.name}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground">{rule.formula}</td>
                      <td className="px-3 py-2 text-sm text-foreground">{rule.source}</td>
                      <td className="px-3 py-2 text-sm text-foreground">On page load</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
