import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectsAPI, TasksAPI, UsersAPI } from '../../services/odataClient';
import { Project, Task, TaskStatus, User } from '../../types/entities';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const RisksAndCriticalTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyCritical, setShowOnlyCritical] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskData, projectData, userData] = await Promise.all([
        TasksAPI.getAll(),
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
      ]);
      setTasks(taskData);
      setProjects(projectData);
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  const rows = useMemo(() => {
    const filtered = tasks.filter((task) => {
      const riskCondition =
        task.riskLevel === 'HIGH' ||
        task.riskLevel === 'CRITICAL' ||
        task.status === 'BLOCKED';
      if (showOnlyCritical) {
        return task.isCritical || riskCondition;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      const score = (task: Task) => {
        let risk = 0;
        if (task.riskLevel === 'CRITICAL') risk += 40;
        if (task.riskLevel === 'HIGH') risk += 30;
        if (task.status === 'BLOCKED') risk += 20;
        if (task.isCritical) risk += 10;
        return risk;
      };
      return score(b) - score(a);
    });
  }, [showOnlyCritical, tasks]);

  const counts = useMemo(() => {
    return {
      blocked: tasks.filter((task) => task.status === 'BLOCKED').length,
      highRisk: tasks.filter((task) => task.riskLevel === 'HIGH').length,
      criticalRisk: tasks.filter((task) => task.riskLevel === 'CRITICAL').length,
      criticalTasks: tasks.filter((task) => task.isCritical).length,
    };
  }, [tasks]);

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    try {
      const updated = await TasksAPI.update(taskId, patch);
      setTasks((prev) => prev.map((task) => (task.id === taskId ? updated : task)));
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const setMitigation = async (task: Task, mitigation: string) => {
    await updateTask(task.id, { comments: mitigation });
  };

  const statusOptions: TaskStatus[] = ['TO_DO', 'IN_PROGRESS', 'BLOCKED', 'DONE'];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Risks & Critical Tasks"
        subtitle="Track blocked work, risk level and mitigation actions"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Risks & Critical Tasks' },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Blocked Tasks</p>
            <p className="text-2xl font-semibold text-red-500">{counts.blocked}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-2xl font-semibold text-orange-500">{counts.highRisk}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Critical Risk</p>
            <p className="text-2xl font-semibold text-red-600">{counts.criticalRisk}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground">Critical Tasks</p>
            <p className="text-2xl font-semibold text-foreground">{counts.criticalTasks}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={showOnlyCritical}
              onChange={(e) => setShowOnlyCritical(e.target.checked)}
            />
            Show only critical or risky tasks
          </label>
          <div className="text-sm text-muted-foreground">
            {rows.length} tasks displayed
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Task
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Assignee
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Risk
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Mitigation
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Loading risk register...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No matching tasks.
                  </td>
                </tr>
              ) : (
                rows.map((task) => (
                  <tr key={task.id} className="hover:bg-accent/40 align-top">
                    <td className="px-4 py-3 text-sm text-foreground">
                      <div className="font-medium flex items-center gap-2">
                        {task.title}
                        {task.isCritical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-600">
                            <AlertTriangle className="w-3 h-3" />
                            Critical
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Planned end: {new Date(task.plannedEnd).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {projects.find((project) => project.id === task.projectId)?.name ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {users.find((user) => user.id === task.assigneeId)?.name ?? 'Unassigned'}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          void updateTask(task.id, {
                            status: e.target.value as TaskStatus,
                          })
                        }
                        className="px-2 py-1 border border-border rounded bg-card text-sm text-foreground"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
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
                        className="px-2 py-1 border border-border rounded bg-card text-sm text-foreground"
                      >
                        <option value="NONE">NONE</option>
                        <option value="LOW">LOW</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HIGH">HIGH</option>
                        <option value="CRITICAL">CRITICAL</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <textarea
                        defaultValue={task.comments ?? ''}
                        onBlur={(e) => void setMitigation(task, e.target.value)}
                        placeholder="Mitigation action / blocker details"
                        rows={2}
                        className="w-full min-w-[240px] px-2 py-1 border border-border rounded bg-card text-sm text-foreground"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
