import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  getAllocationByProject,
  getConsultantWorkload,
  getProjectProgressTrend,
  getTasksByStatus,
  mockKPI,
} from '../../services/mockData';
import {
  EvaluationsAPI,
  TasksAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Evaluation, Task, User } from '../../types/entities';
import { TopPerformersWidget } from '../../components/business/TopPerformersWidget';
import { GaugeChart } from '../../components/charts/GaugeChart';

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
      <div className="h-[220px] rounded-md bg-surface-2 sm:h-[280px]" />
    </CardContent>
  </Card>
);

export const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [progressTrend, setProgressTrend] = useState<TrendData[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<StatusData[]>([]);
  const [consultantWorkload, setConsultantWorkload] = useState<WorkloadData[]>([]);
  const [allocationData, setAllocationData] = useState<AllocationData[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoadError(null);
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
      
      const [fetchedTasks, fetchedUsers, fetchedEvaluations] = await Promise.all([
        TasksAPI.getAll(),
        UsersAPI.getAll(),
        EvaluationsAPI.getAll(),
      ]);

      setTasks(fetchedTasks);
      setUsers(fetchedUsers);
      setEvaluations(fetchedEvaluations);
    } catch (error) {
      setLoadError('Unable to load dashboard data. Some metrics may be outdated.');
    }
  };

  useEffect(() => {
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

      <div className="space-y-4 p-4 sm:space-y-6 sm:p-6 lg:p-8">
        {loadError && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <p className="text-sm text-destructive">{loadError}</p>
              <Button type="button" variant="outline" onClick={() => void loadData()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Throughput"
            value={Math.round(productivityMetrics.throughputRate)}
            unit="%"
            subtitle="Completed tasks ratio"
            icon="trend-up"
            state={productivityMetrics.throughputRate >= 70 ? 'Positive' : 'Warning'}
            progress={productivityMetrics.throughputRate}
          />
          <KPICard
            title="Velocity"
            value={productivityMetrics.velocity}
            subtitle="Tasks closed this month"
            icon="task"
            state={productivityMetrics.velocity >= 8 ? 'Positive' : 'Neutral'}
          />
          <KPICard
            title="Cycle Time"
            value={productivityMetrics.cycleTimeDays.toFixed(1)}
            unit="days"
            subtitle="Average completion duration"
            icon="timesheet"
            state={productivityMetrics.cycleTimeDays <= 5 ? 'Positive' : 'Warning'}
          />
          <KPICard
            title="Risk Hotspots"
            value={productivityMetrics.criticalIssues}
            subtitle="Critical or blocked tasks"
            icon="warning"
            state={productivityMetrics.criticalIssues > 0 ? 'Error' : 'Positive'}
          />
        </section>

        <div className="grid items-start gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)]">
              <div className="relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-2xl bg-sidebar-foreground p-5 text-background shadow-lg sm:p-6">
                <div className="relative z-10">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-sidebar-border/80">
                    Total Portfolio Health
                  </p>
                  <h3 className="mb-4 text-3xl font-bold">{mockKPI.projectProgress}% Complete</h3>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-sidebar-border/60">Tasks On Track</p>
                      <p className="text-xl font-semibold text-primary">{completionRatio}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-sidebar-border/60">Critical Risks</p>
                      <p className="text-xl font-semibold text-destructive">{mockKPI.criticalTasks}</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-primary/20 blur-2xl" />
              </div>

              <Card className="border-border/80 bg-card">
                <CardContent className="flex items-center justify-center p-4 sm:p-6">
                  <GaugeChart
                    value={mockKPI.averageProductivity * 20}
                    label="Team Productivity"
                    sublabel="Based on avg score"
                    color="var(--color-primary)"
                    size={180}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              <Suspense fallback={<ChartCardFallback />}>
                <ProjectProgressTrendChart data={progressTrend} />
              </Suspense>

              <Suspense fallback={<ChartCardFallback />}>
                <TaskDistributionChart data={tasksByStatus} palette={piePalette} />
              </Suspense>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
              <Suspense fallback={<ChartCardFallback />}>
                <WorkloadComparisonChart data={consultantWorkload} />
              </Suspense>

              <Suspense fallback={<ChartCardFallback />}>
                <AllocationPortfolioChart data={allocationData} palette={piePalette} />
              </Suspense>
            </div>
          </div>

          <aside className="space-y-4 sm:space-y-6 xl:sticky xl:top-20">
            <TopPerformersWidget users={users} evaluations={evaluations} />

            <Card className="border-border/80 bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <p className="font-semibold text-xs text-destructive uppercase tracking-wide">Testing Blocked</p>
                  <p className="mt-1 text-sm text-foreground">
                    Waiting for test environment access.
                  </p>
                </div>
                <div className="rounded-lg border border-accent bg-accent/40 p-3">
                  <p className="font-semibold text-xs text-accent-foreground uppercase tracking-wide">
                    Deadline Risk
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    Fiori App Configuration due in 3 days.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/manager/allocations')}
                >
                  Allocate Resources
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => navigate('/manager/evaluations')}
                >
                  New Evaluation
                </Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
};
