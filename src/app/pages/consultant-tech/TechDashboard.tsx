// Technical Consultant Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import { TasksAPI, ProjectsAPI, EvaluationsAPI, TimesheetsAPI } from '../../services/odataClient';
import { Task, Project, Evaluation, Timesheet } from '../../types/entities';
import { useNavigate } from 'react-router';
import { getFridayOfWeek, getMondayOfWeek, toLocalDateKey } from '../../utils/date';
import {
  Card,
  CardHeader,
  AnalyticalTable,
  Button,
  ProgressIndicator,
  List,
  ListItemStandard,
  Icon,
  FlexBox,
  FlexBoxAlignItems,
  FlexBoxJustifyContent,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/table-view.js';
import '@ui5/webcomponents-icons/dist/task.js';
import '@ui5/webcomponents-icons/dist/project-definition-triangle-2.js';
import '@ui5/webcomponents-icons/dist/nav-back.js';

const kpiColumns = [
  { Header: 'KPI', accessor: 'name', width: 200 },
  { Header: 'Formula', accessor: 'formula', width: 320 },
  { Header: 'Source', accessor: 'source', width: 150 },
  { Header: 'Refresh', accessor: 'refresh', width: 150 },
];

const kpiReferences = [
  {
    name: 'My Tasks',
    formula: 'count(tasks assigned to current user)',
    source: 'Tasks',
    refresh: 'On dashboard load',
  },
  {
    name: 'Overdue Tasks',
    formula: "count(status != 'DONE' and plannedEnd < today)",
    source: 'Tasks',
    refresh: 'On dashboard load',
  },
  {
    name: 'Hours This Week',
    formula: 'sum(timesheet.hours) for current week',
    source: 'Timesheets',
    refresh: 'On dashboard load',
  },
  {
    name: 'Active Projects',
    formula: "count(project.status = 'ACTIVE' for assigned tasks)",
    source: 'Projects + Tasks',
    refresh: 'On dashboard load',
  },
  {
    name: 'Performance Score',
    formula: 'avg(evaluation.score)',
    source: 'Evaluations',
    refresh: 'On dashboard load',
  },
];

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

  const getPriorityState = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'Negative';
      case 'HIGH':
        return 'Critical';
      case 'MEDIUM':
        return 'None';
      case 'LOW':
        return 'Positive';
      default:
        return 'None';
    }
  };

  const getProgressState = (percent: number) => {
    if (percent >= 80) return 'Positive';
    if (percent >= 40) return 'None';
    return 'Critical';
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

        {/* KPI Definitions */}
        <Card
          header={
            <CardHeader
              titleText="KPI Definitions"
              subtitleText="Formula / Source / Refresh"
              avatar={<Icon name="table-view" />}
            />
          }
        >
          <AnalyticalTable
            columns={kpiColumns}
            data={kpiReferences}
            minRows={5}
            visibleRows={5}
            scaleWidthMode="Smart"
            alternateRowColor
          />
        </Card>

        {/* Upcoming Tasks */}
        <Card
          header={
            <CardHeader
              titleText="Upcoming Tasks"
              subtitleText={`${upcomingTasks.length} task${upcomingTasks.length !== 1 ? 's' : ''} pending`}
              avatar={<Icon name="task" />}
              action={
                <Button design="Transparent" onClick={() => navigate('/consultant-tech/tasks')}>
                  View All
                </Button>
              }
            />
          }
        >
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming tasks
            </div>
          ) : (
            <List>
              {upcomingTasks.map((task) => (
                <ListItemStandard
                  key={task.id}
                  description={`Due: ${new Date(task.plannedEnd).toLocaleDateString()}`}
                  additionalText={task.priority}
                  additionalTextState={getPriorityState(task.priority)}
                  onClick={() => navigate('/consultant-tech/tasks')}
                >
                  {task.title}
                </ListItemStandard>
              ))}
            </List>
          )}
        </Card>

        {/* My Projects */}
        <Card
          header={
            <CardHeader
              titleText="My Projects"
              subtitleText={`${projects.length} project${projects.length !== 1 ? 's' : ''} assigned`}
              avatar={<Icon name="project-definition-triangle-2" />}
              action={
                <Button design="Transparent" onClick={() => navigate('/consultant-tech/projects')}>
                  View All
                </Button>
              }
            />
          }
        >
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card
                  key={project.id}
                  header={
                    <CardHeader
                      titleText={project.name}
                      subtitleText={project.description}
                    />
                  }
                >
                  <div className="p-3">
                    <FlexBox
                      alignItems={FlexBoxAlignItems.Center}
                      justifyContent={FlexBoxJustifyContent.SpaceBetween}
                      className="mb-2"
                    >
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-semibold">{project.progress || 0}%</span>
                    </FlexBox>
                    <ProgressIndicator
                      value={project.progress || 0}
                      valueState={getProgressState(project.progress || 0)}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
