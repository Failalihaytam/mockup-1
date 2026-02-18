import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { AnalyticalKPICard } from '../../components/common/AnalyticalKPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  getAllocationByProject,
  getConsultantWorkload,
  getProjectProgressTrend,
  getTasksByStatus,
  mockKPI,
} from '../../services/mockData';
import { TasksAPI } from '../../services/odataClient';
import { Task } from '../../types/entities';

interface TrendData {
  month: string;
  progress: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface WorkloadData {
  name: string;
  planned: number;
  actual: number;
}

interface AllocationData {
  name: string;
  value: number;
}

const ProjectProgressTrendChart = lazy(() =>
  import('../../components/charts/ProjectProgressTrendChart').then((module) => ({
    default: module.ProjectProgressTrendChart,
  }))
);

const TaskDistributionChart = lazy(() =>
  import('../../components/charts/TaskDistributionChart').then((module) => ({
    default: module.TaskDistributionChart,
  }))
);

const WorkloadComparisonChart = lazy(() =>
  import('../../components/charts/WorkloadComparisonChart').then((module) => ({
    default: module.WorkloadComparisonChart,
  }))
);

const AllocationPortfolioChart = lazy(() =>
  import('../../components/charts/AllocationPortfolioChart').then((module) => ({
    default: module.AllocationPortfolioChart,
  }))
);

const piePalette = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
];

const ChartCardFallback: React.FC = () => (
  <Card className="border-border/80 bg-card">
    <CardHeader>
      <CardTitle className="text-lg">Loading chart...</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[280px] rounded-md bg-surface-2" />
    </CardContent>
  </Card>
);

export const ManagerDashboard: React.FC = () => {
  const [progressTrend, setProgressTrend] = useState<TrendData[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<StatusData[]>([]);
  const [consultantWorkload, setConsultantWorkload] = useState<WorkloadData[]>([]);
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setProgressTrend(
        getProjectProgressTrend().map((entry) => ({ month: entry.date, progress: entry.progress }))
      );
      setTasksByStatus(
        getTasksByStatus().map((entry) => ({ status: entry.status, count: entry.count }))
      );
      setConsultantWorkload(
        getConsultantWorkload().map((entry) => ({
          name: entry.name,
          planned: entry.planned,
          actual: entry.actual,
        }))
      );
      setAllocationData(
        getAllocationByProject().map((entry) => ({ name: entry.project, value: entry.allocation }))
      );
      setTasks(await TasksAPI.getAll());
    };

    void loadData();
  }, []);

  const completionRatio = useMemo(() => {
    const total = mockKPI.tasksOnTrack + mockKPI.tasksLate;
    if (!total) return 0;
    return Math.round((mockKPI.tasksOnTrack / total) * 100);
  }, []);

  const productivityMetrics = useMemo(() => {
    const completed = tasks.filter((task) => task.status === 'DONE');
    const now = new Date();
    const completedThisMonth = completed.filter((task) => {
      if (!task.realEnd) return false;
      const end = new Date(task.realEnd);
      return end.getFullYear() === now.getFullYear() && end.getMonth() === now.getMonth();
    }).length;

    const cycleDurations = completed
      .filter((task) => task.realStart && task.realEnd)
      .map((task) => {
        const start = new Date(task.realStart as string).getTime();
        const end = new Date(task.realEnd as string).getTime();
        return Math.max(0, end - start) / (1000 * 60 * 60 * 24);
      });

    const averageCycleTime = cycleDurations.length
      ? cycleDurations.reduce((sum, days) => sum + days, 0) / cycleDurations.length
      : 0;

    const throughput = tasks.length ? (completed.length / tasks.length) * 100 : 0;
    const criticalIssues = tasks.filter(
      (task) => task.riskLevel === 'CRITICAL' || task.status === 'BLOCKED'
    ).length;

    return {
      velocity: completedThisMonth,
      cycleTimeDays: averageCycleTime,
      throughputRate: throughput,
      criticalIssues,
      qualityCoverage: tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Manager Dashboard"
        subtitle="Delivery progress, workload, and allocation in one view"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Manager Dashboard' },
        ]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AnalyticalKPICard
            title="Portfolio Progress"
            subtitle="Current quarter"
            value={mockKPI.projectProgress}
            unit="%"
            trend="Up"
            state="Positive"
            target={85}
            icon="trend-up"
          />
          <AnalyticalKPICard
            title="Task Reliability"
            subtitle="On-track ratio"
            value={completionRatio}
            unit="%"
            state="Good"
            target={100}
            icon="task"
          />
          <AnalyticalKPICard
            title="Critical Tasks"
            subtitle="Requires immediate action"
            value={mockKPI.criticalTasks}
            state="Error"
            trend="Up"
            deviation="Escalation advised"
            icon="warning"
          />
          <AnalyticalKPICard
            title="Team Productivity"
            subtitle="Average consultant score"
            value={mockKPI.averageProductivity.toFixed(1)}
            unit="/5"
            state="Positive"
            target={5}
            icon="performance"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Suspense fallback={<ChartCardFallback />}>
            <ProjectProgressTrendChart data={progressTrend} />
          </Suspense>

          <Suspense fallback={<ChartCardFallback />}>
            <TaskDistributionChart data={tasksByStatus} palette={piePalette} />
          </Suspense>

          <Suspense fallback={<ChartCardFallback />}>
            <WorkloadComparisonChart data={consultantWorkload} />
          </Suspense>

          <Suspense fallback={<ChartCardFallback />}>
            <AllocationPortfolioChart data={allocationData} palette={piePalette} />
          </Suspense>
        </div>

        <Card className="border-border/80 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="font-semibold text-destructive">Task Blocked: Testing & Validation</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Waiting for test environment access. Mitigation owner pending confirmation.
              </p>
            </div>
            <div className="rounded-lg border border-border/80 bg-surface-2 p-4">
              <p className="font-semibold text-foreground">Deadline Risk: Fiori App Configuration</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Delivery due in 3 days with unresolved dependencies from integration squad.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="border-border/80 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Productivity Metrics (Mock)</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Velocity</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{productivityMetrics.velocity}</p>
                <p className="mt-1 text-xs text-muted-foreground">Completed tasks this month</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Cycle Time</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {productivityMetrics.cycleTimeDays.toFixed(1)}d
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Average real start to real end</p>
              </div>
              <div className="rounded-lg border border-border/70 bg-surface-2 p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">Throughput</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">
                  {productivityMetrics.throughputRate.toFixed(0)}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Completed over total tasks</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 bg-card">
            <CardHeader>
              <CardTitle className="text-lg">Code Quality Snapshot (Mock Integration)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-2 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Static analysis connector</span>
                <span className="font-semibold text-foreground">Configured (mock)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-2 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Open critical findings</span>
                <span className="font-semibold text-destructive">{productivityMetrics.criticalIssues}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-2 px-4 py-3 text-sm">
                <span className="text-muted-foreground">Quality gate coverage</span>
                <span className="font-semibold text-foreground">{productivityMetrics.qualityCoverage}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
