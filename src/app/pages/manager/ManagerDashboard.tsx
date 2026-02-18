// Manager Performance Dashboard - SAP Fiori Overview Page (OVP) Pattern
import React, { useEffect, useState } from 'react';
import {
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  FlexBox,
  FlexBoxDirection,
  FlexBoxWrap,
  Label,
  Title,
  Card,
  CardHeader,
  List,
  ListItemStandard,
  ValueColor,
} from '@ui5/webcomponents-react';
import {
  BarChart,
  DonutChart,
  LineChart,
} from '@ui5/webcomponents-react-charts';
import { AnalyticalKPICard } from '../../components/common/AnalyticalKPICard';
import {
  getProjectProgressTrend,
  getTasksByStatus,
  getConsultantWorkload,
  getAllocationByProject,
  mockKPI,
} from '../../services/mockData';

import '@ui5/webcomponents-icons/dist/trend-up.js';
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/history.js';
import '@ui5/webcomponents-icons/dist/task.js';
import '@ui5/webcomponents-icons/dist/warning.js';
import '@ui5/webcomponents-icons/dist/performance.js';

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
    // Mapping data for UI5 Charts
    setProgressTrend(getProjectProgressTrend().map(d => ({ month: d.date, progress: d.progress })));
    setTasksByStatus(getTasksByStatus().map(d => ({ status: d.status, count: d.count })));
    setConsultantWorkload(getConsultantWorkload().map(d => ({ name: d.name, planned: d.planned, actual: d.actual })));
    setAllocationData(getAllocationByProject().map(d => ({ name: d.project, value: d.allocation })));
  };

  return (
    <DynamicPage
      titleArea={
        <DynamicPageTitle
          heading={<Title>Performance Overview</Title>}
          subheading={<Label>Real-time project and team analytics</Label>}
        />
      }
      headerArea={
        <DynamicPageHeader>
          <FlexBox wrap={FlexBoxWrap.Wrap} direction={FlexBoxDirection.Row} style={{ gap: '2rem' }}>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>Manager</Label>
              <Title level="H5">Marie Martin</Title>
            </FlexBox>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>Department</Label>
              <Title level="H5">SAP Solutions</Title>
            </FlexBox>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>Reporting Period</Label>
              <Title level="H5">Q1 2026</Title>
            </FlexBox>
          </FlexBox>
        </DynamicPageHeader>
      }
      style={{ height: '100%' }}
    >
      <FlexBox direction={FlexBoxDirection.Column} style={{ padding: '1rem', gap: '1rem' }}>
        {/* KPI Cards Row */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '1rem' }}>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }}>
            <AnalyticalKPICard
              title="Overall Progress"
              value={kpi.projectProgress}
              unit="%"
              trend="Up"
              state={ValueColor.Good}
              subtitle="Current vs Target"
              target={70}
              icon="trend-up"
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }}>
            <AnalyticalKPICard
              title="Tasks Performance"
              value={`${kpi.tasksOnTrack}/${kpi.tasksOnTrack + kpi.tasksLate}`}
              subtitle="On Track / Total"
              state={ValueColor.None}
              icon="task"
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }}>
            <AnalyticalKPICard
              title="Critical Tasks"
              value={kpi.criticalTasks}
              state={ValueColor.Error}
              trend="Up"
              subtitle="Immediate Action Required"
              deviation="High"
              icon="warning"
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }}>
            <AnalyticalKPICard
              title="Team Productivity"
              value={kpi.averageProductivity.toFixed(1)}
              unit="/ 5"
              state={ValueColor.Good}
              subtitle="Average Performance"
              target={5}
              icon="performance"
            />
          </div>
        </FlexBox>

        {/* Charts Row */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '1rem' }}>
          {/* Progress Trend Chart */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card 
              header={
                <CardHeader 
                  titleText="Project Progress Trend" 
                  subtitleText="Monthly growth percentage" 
                />
              }
            >
              <div style={{ padding: '1rem', height: '300px' }}>
                <LineChart
                  dimensions={[{ accessor: 'month' }]}
                  measures={[{ accessor: 'progress', label: 'Progress %' }]}
                  dataset={progressTrend}
                  noLegend
                />
              </div>
            </Card>
          </div>

          {/* Tasks Distribution Chart */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card 
              header={
                <CardHeader 
                  titleText="Tasks Status Distribution" 
                  subtitleText="Current workload status" 
                />
              }
            >
              <div style={{ padding: '1rem', height: '300px' }}>
                <BarChart
                  dimensions={[{ accessor: 'status' }]}
                  measures={[{ accessor: 'count', label: 'Tasks' }]}
                  dataset={tasksByStatus}
                />
              </div>
            </Card>
          </div>

          {/* Consultant Workload Chart */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card 
              header={
                <CardHeader 
                  titleText="Resource Workload Analysis" 
                  subtitleText="Planned vs Actual Hours" 
                />
              }
            >
              <div style={{ padding: '1rem', height: '300px' }}>
                <BarChart
                  dimensions={[{ accessor: 'name' }]}
                  measures={[
                    { accessor: 'planned', label: 'Planned' },
                    { accessor: 'actual', label: 'Actual' }
                  ]}
                  dataset={consultantWorkload}
                />
              </div>
            </Card>
          </div>

          {/* Allocation Donut Chart */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card 
              header={
                <CardHeader 
                  titleText="Resource Allocation" 
                  subtitleText="By Project Portfolio" 
                />
              }
            >
              <div style={{ padding: '1rem', height: '300px' }}>
                <DonutChart
                  dimension={{ accessor: 'name' }}
                  measure={{ accessor: 'value' }}
                  dataset={allocationData}
                />
              </div>
            </Card>
          </div>
        </FlexBox>

        {/* Critical Alerts */}
        <Card header={<CardHeader titleText="Critical Alerts & Risk Factors" />}>
          <List>
            <ListItemStandard
              icon="alert"
              description="Waiting for test environment access"
              additionalText="Blocked"
              additionalTextState="Negative"
            >
              Task Blocked: Testing & Validation
            </ListItemStandard>
            <ListItemStandard
              icon="history"
              description="Fiori App Configuration is due in 3 days"
              additionalText="Due Soon"
              additionalTextState="Critical"
            >
              Deadline Approaching
            </ListItemStandard>
          </List>
        </Card>
      </FlexBox>
    </DynamicPage>
  );
};
