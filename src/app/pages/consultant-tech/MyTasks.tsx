// My Tasks - Kanban Board for Technical Consultant

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { NotificationsAPI, TasksAPI, UsersAPI } from '../../services/odataClient';
import { Task, TaskStatus, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Clock, AlertCircle, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { todayLocalDateKey } from '../../utils/date';

const TASK_STATUSES: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'TO_DO', label: 'To Do', color: 'bg-gray-100' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'bg-blue-100' },
  { status: 'BLOCKED', label: 'Blocked', color: 'bg-red-100' },
  { status: 'DONE', label: 'Done', color: 'bg-green-100' },
];

const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TO_DO: ['IN_PROGRESS', 'BLOCKED'],
  IN_PROGRESS: ['BLOCKED', 'DONE'],
  BLOCKED: ['IN_PROGRESS', 'DONE'],
  DONE: [],
  CANCELLED: [],
};

export const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      void loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [taskData, userData] = await Promise.all([
        TasksAPI.getByUser(currentUser.id),
        UsersAPI.getAll(),
      ]);
      setTasks(taskData);
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  const patchTaskInState = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
    setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, ...patch } : prev));
  };

  const persistTask = async (taskId: string, patch: Partial<Task>, successMessage: string) => {
    try {
      const updated = await TasksAPI.update(taskId, patch);
      patchTaskInState(taskId, updated);
      toast.success(successMessage);
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const createLocalNotification = async (title: string, message: string) => {
    if (!currentUser) return;
    try {
      await NotificationsAPI.create({
        userId: currentUser.id,
        type: 'TASK_UPDATED',
        title,
        message,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      // In mock mode, this should not fail; silently ignore if it does.
    }
  };

  const getAllowedStatuses = (status: TaskStatus) => {
    return [status, ...(ALLOWED_TRANSITIONS[status] ?? [])];
  };

  const updateTaskStatus = async (task: Task, newStatus: TaskStatus) => {
    const allowed = getAllowedStatuses(task.status);
    if (!allowed.includes(newStatus)) {
      toast.error(`Invalid lifecycle transition: ${task.status} -> ${newStatus}`);
      return;
    }

    const patch: Partial<Task> = {
      status: newStatus,
      progressPercent: newStatus === 'DONE' ? 100 : task.progressPercent,
      realEnd: newStatus === 'DONE' ? todayLocalDateKey() : task.realEnd,
    };
    await persistTask(task.id, patch, 'Task status updated');
    await createLocalNotification('Task Status Updated', `${task.title}: ${newStatus}`);
  };

  const updateTaskProgress = async (task: Task, progress: number) => {
    const safeProgress = Math.min(100, Math.max(0, progress));
    const patch: Partial<Task> = {
      progressPercent: safeProgress,
      status: safeProgress === 100 ? 'DONE' : task.status,
      realEnd: safeProgress === 100 ? todayLocalDateKey() : task.realEnd,
    };
    await persistTask(task.id, patch, 'Progress updated');
  };

  const updateTaskComment = async (task: Task, comment: string) => {
    await persistTask(task.id, { comments: comment }, 'Comments updated');
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50';
      case 'LOW':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'DONE' && new Date(task.plannedEnd) < new Date() && !task.realEnd;
  };

  const functionalContact = useMemo(() => {
    return users.find((user) => user.role === 'CONSULTANT_FONCTIONNEL');
  }, [users]);

  const openTeamsDiscussion = () => {
    if (!currentUser || !functionalContact) return;
    const usersParam = encodeURIComponent(`${currentUser.email},${functionalContact.email}`);
    const message = encodeURIComponent(
      `Question regarding task: ${selectedTask?.title ?? 'Current task'}`
    );
    window.open(
      `https://teams.microsoft.com/l/chat/0/0?users=${usersParam}&message=${message}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="My Tasks"
        subtitle="Manage your tasks using the Kanban board"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-tech/dashboard' },
          { label: 'My Tasks' },
        ]}
      />

      <div className="p-6">
        {loading ? (
          <div className="text-muted-foreground">Loading tasks...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TASK_STATUSES.map(({ status, label, color }) => (
              <div key={status} className="flex flex-col">
                <div className={`${color} dark:bg-secondary rounded-t-lg px-4 py-3 border-b-2 border-border`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{label}</h3>
                    <span className="bg-card px-2 py-1 rounded-full text-xs font-medium">
                      {getTasksByStatus(status).length}
                    </span>
                  </div>
                </div>

                <div className="bg-muted rounded-b-lg p-4 flex-1 space-y-3 min-h-[500px]">
                  {getTasksByStatus(status).map((task) => (
                    <div
                      key={task.id}
                      className="bg-card rounded-lg shadow-sm border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedTask(task)}
                    >
                      <h4 className="font-medium text-foreground mb-2">{task.title}</h4>

                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>

                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>{task.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${task.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          <span>Due: {new Date(task.plannedEnd).toLocaleDateString()}</span>
                          {isOverdue(task) && <AlertCircle className="w-3 h-3 ml-1 text-red-500" />}
                        </div>

                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>
                            {task.actualHours}h / {task.estimatedHours}h
                          </span>
                        </div>

                        {task.isCritical && (
                          <div className="pt-2">
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-red-600 bg-red-50 rounded">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Critical
                            </span>
                          </div>
                        )}
                      </div>

                      {status !== 'DONE' && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <select
                            value={task.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              void updateTaskStatus(task, e.target.value as TaskStatus);
                            }}
                            className="w-full text-xs px-2 py-1 border border-border rounded focus:ring-2 focus:ring-primary bg-card text-foreground"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getAllowedStatuses(task.status).map((allowedStatus) => (
                              <option key={allowedStatus} value={allowedStatus}>
                                Move to {TASK_STATUSES.find((s) => s.status === allowedStatus)?.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}

                  {getTasksByStatus(status).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedTask(null)}>
          <div
            className="absolute right-0 top-0 h-full w-full max-w-2xl bg-card shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-semibold text-foreground">{selectedTask.title}</h2>
                <button
                  onClick={() => setSelectedTask(null)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close task details panel"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Description
                  </label>
                  <p className="text-foreground">{selectedTask.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Progress: {selectedTask.progressPercent}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={selectedTask.progressPercent}
                    onChange={(e) => void updateTaskProgress(selectedTask, Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={selectedTask.status}
                    onChange={(e) =>
                      void updateTaskStatus(selectedTask, e.target.value as TaskStatus)
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                  >
                    {getAllowedStatuses(selectedTask.status).map((status) => (
                      <option key={status} value={status}>
                        {TASK_STATUSES.find((entry) => entry.status === status)?.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Planned Start
                    </label>
                    <input
                      type="date"
                      value={selectedTask.plannedStart}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Planned End
                    </label>
                    <input
                      type="date"
                      value={selectedTask.plannedEnd}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      value={selectedTask.estimatedHours}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Actual Hours
                    </label>
                    <input
                      type="number"
                      value={selectedTask.actualHours}
                      disabled
                      className="w-full px-3 py-2 border border-border rounded-lg bg-muted"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Comments / Blockers
                  </label>
                  <textarea
                    value={selectedTask.comments || ''}
                    onChange={(e) =>
                      setSelectedTask((prev) =>
                        prev ? { ...prev, comments: e.target.value } : prev
                      )
                    }
                    onBlur={(e) => void updateTaskComment(selectedTask, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                    placeholder="Describe blockers, dependencies, or notes..."
                  />
                </div>

                <div>
                  <button
                    onClick={openTeamsDiscussion}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Teams Discussion (Functional Consultant)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
