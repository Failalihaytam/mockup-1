// Manager Performance Dashboard - Main KPI and charts view

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import {
  Card,
  CardHeader,
  List,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/trend-up.js';
import '@ui5/webcomponents-icons/dist/sys-enter-2.js';
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/history.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/goal.js';
import '@ui5/webcomponents-icons/dist/activity-items.js';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import {
  getProjectProgressTrend,
  getTasksByStatus,
  getConsultantWorkload,
  getAllocationByProject,
  mockKPI,
} from '../../services/mockData';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const tooltipStyle = {
  backgroundColor: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  color: 'var(--foreground)',
};

export const ManagerDashboard: React.FC = () => {
  const [kpi, setKpi] = useState(mockKPI);
  const [progressTrend, setProgressTrend] = useState<any[]>([]);
  const [tasksByStatus, setTasksByStatus] = useState<any[]>([]);
  const [consultantWorkload, setConsultantWorkload] = useState<any[]>([]);
  const [allocationData, setAllocationData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setProgressTrend(getProjectProgressTrend());
    setTasksByStatus(getTasksByStatus());
    setConsultantWorkload(getConsultantWorkload());
    setAllocationData(getAllocationByProject());
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <PageHeader
        title="Performance Dashboard"
        subtitle="Global view of projects, tasks, and team performance"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Dashboard' },
        ]}
      />

      <div className="space-y-6 mt-6">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Overall Project Progress"
            value={`${kpi.projectProgress}%`}
            icon="trend-up"
            color="blue"
            progress={kpi.projectProgress}
            trend={{ value: 8, label: 'vs last month' }}
          />
          <KPICard
            title="Tasks Performance"
            value={`${kpi.tasksOnTrack}/${kpi.tasksOnTrack + kpi.tasksLate}`}
            subtitle="On Track / Total"
            icon="sys-enter-2"
            color="green"
          />
          <KPICard
            title="Critical Tasks"
            value={kpi.criticalTasks}
            subtitle="Require immediate attention"
            icon="alert"
            color="red"
          />
          <KPICard
            title="Team Productivity"
            value={kpi.averageProductivity.toFixed(1)}
            subtitle="Average score out of 5"
            icon="goal"
            color="purple"
            progress={(kpi.averageProductivity / 5) * 100}
          />
        </div>

        {/* Second Row KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <KPICard
            title="Resource Allocation Rate"
            value={`${kpi.allocationRate}%`}
            icon="group"
            color="blue"
            progress={kpi.allocationRate}
          />
          <KPICard
            title="Active Risks"
            value={kpi.activeRisks}
            subtitle="Blocked or at-risk tasks"
            icon="activity-items"
            color="yellow"
          />
          <KPICard
            title="Tasks Late"
            value={kpi.tasksLate}
            subtitle="Behind schedule"
            icon="history"
            color="red"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Project Progress Trend */}
          <Card header={<CardHeader titleText="Project Progress Over Time" />} className="h-[400px]">
            <div style={{ padding: '1rem', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={progressTrend}>
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00AA9B" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#00AA9B" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="progress"
                    stroke="#00AA9B"
                    fill="url(#colorProgress)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Tasks by Status */}
          <Card header={<CardHeader titleText="Tasks by Status" />} className="h-[400px]">
             <div style={{ padding: '1rem', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByStatus}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="status" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="count" fill="#00AA9B" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Consultant Workload */}
          <Card header={<CardHeader titleText="Consultant Workload (Hours)" />} className="h-[400px]">
            <div style={{ padding: '1rem', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultantWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="planned" fill="#06b6d4" name="Planned" />
                  <Bar dataKey="actual" fill="#00AA9B" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Allocation by Project */}
          <Card header={<CardHeader titleText="Resource Allocation by Project" />} className="h-[400px]">
             <div style={{ padding: '1rem', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={allocationData}
                    dataKey="allocation"
                    nameKey="project"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Recent Activities / Alerts */}
        <Card header={<CardHeader titleText="Recent Alerts & Activities" />}>
          <List>
            <ListItemStandard
              icon="alert"
              description="Waiting for test environment access"
              additionalText="Blocked"
              additionalTextState="Negative"
            >
              Critical Task Blocked: Testing & Validation
            </ListItemStandard>
            <ListItemStandard
              icon="history"
              description="Fiori App Configuration is due in 3 days"
              additionalText="Due Soon"
              additionalTextState="Critical"
            >
              Deadline Approaching
            </ListItemStandard>
            <ListItemStandard
              icon="sys-enter-2"
              description="Dashboard UI Design completed ahead of schedule"
              additionalText="Completed"
              additionalTextState="Positive"
            >
              Task Completed
            </ListItemStandard>
          </List>
        </Card>
      </div>
    </div>
  );
};
