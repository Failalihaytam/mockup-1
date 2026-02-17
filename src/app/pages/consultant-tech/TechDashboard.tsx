// Technical Consultant Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import { TasksAPI, ProjectsAPI, EvaluationsAPI, TimesheetsAPI } from '../../services/odataClient';
import { Task, Project, Evaluation, Timesheet } from '../../types/entities';
import { useNavigate } from 'react-router';
import { getFridayOfWeek, getMondayOfWeek, toLocalDateKey } from '../../utils/date';

export const TechDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [tasksData, allProjects, evals, timesheetsData] = await Promise.all([
        TasksAPI.getByUser(currentUser.id),
        ProjectsAPI.getAll(),
        EvaluationsAPI.getByUser(currentUser.id),
        TimesheetsAPI.getByUser(currentUser.id),
      ]);

      setTasks(tasksData);
      const myProjectIds = new Set(tasksData.map((t) => t.projectId));
      const myProjects = allProjects.filter((p) => myProjectIds.has(p.id));
      setProjects(myProjects);
      setEvaluations(evals);
      setTimesheets(timesheetsData);
    } finally {
      setLoading(false);
    }
  };

  const myTasksCount = tasks.length;
  const overdueTasks = tasks.filter(
    (t) =>
      t.status !== 'DONE' && new Date(t.plannedEnd) < new Date() && !t.realEnd
  ).length;
  const weekStart = toLocalDateKey(getMondayOfWeek(new Date()));
  const weekEnd = toLocalDateKey(getFridayOfWeek(new Date()));
  const hoursThisWeek = timesheets
    .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
    .reduce((sum, entry) => sum + entry.hours, 0);
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
      : 0;

  const upcomingTasks = tasks
    .filter((t) => t.status === 'TO_DO' || t.status === 'IN_PROGRESS')
    .sort(
      (a, b) =>
        new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime()
    )
    .slice(0, 5);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Welcome back, ${currentUser?.name.split(' ')[0]}!`}
        subtitle="Your personal performance dashboard"
        breadcrumbs={[{ label: 'My Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <KPICard
            title="My Tasks"
            value={myTasksCount}
            icon="task"
            color="blue"
          />
          <KPICard
            title="Overdue Tasks"
            value={overdueTasks}
            icon="alert"
            color="red"
          />
          <KPICard
            title="Hours This Week"
            value={hoursThisWeek}
            icon="timesheet"
            color="green"
          />
          <KPICard
            title="Active Projects"
            value={activeProjects}
            icon="project-definition-triangle-2"
            color="purple"
          />
          <KPICard
            title="Performance Score"
            value={averageScore.toFixed(1)}
            subtitle="Out of 5.0"
            icon="trend-up"
            color="blue"
            progress={(averageScore / 5) * 100}
          />
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Upcoming Tasks
            </h3>
            <button
              onClick={() => navigate('/consultant-tech/tasks')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All -&gt;
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming tasks
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate('/consultant-tech/tasks')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">{task.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      {task.isCritical && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-800">
                          Critical
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(task.plannedEnd).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {task.progressPercent}% Complete
                      </div>
                      <div className="w-32 bg-muted rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${task.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Projects */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">My Projects</h3>
            <button
              onClick={() => navigate('/consultant-tech/projects')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All -&gt;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-foreground mb-2">{project.name}</h4>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

