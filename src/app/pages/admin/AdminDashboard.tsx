// Admin Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { UsersAPI, ProjectsAPI, TasksAPI } from '../../services/odataClient';
import {
  Card,
  CardHeader,
  AnalyticalTable,
  List,
  ListItemStandard,
  ObjectStatus,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/sys-monitor.js';
import '@ui5/webcomponents-icons/dist/table-view.js';

const kpiColumns = [
  { Header: 'KPI', accessor: 'name', width: 200 },
  { Header: 'Formula', accessor: 'formula', width: 280 },
  { Header: 'Source', accessor: 'source', width: 150 },
  { Header: 'Refresh', accessor: 'refresh', width: 150 },
];

const kpiReferences = [
  {
    name: 'Total Users',
    formula: 'count(all users)',
    source: 'Users',
    refresh: 'On dashboard load',
  },
  {
    name: 'Active Users',
    formula: 'count(users where active=true)',
    source: 'Users',
    refresh: 'On dashboard load',
  },
  {
    name: 'Projects',
    formula: 'count(all projects)',
    source: 'Projects',
    refresh: 'On dashboard load',
  },
  {
    name: 'Total Tasks',
    formula: 'count(all tasks)',
    source: 'Tasks',
    refresh: 'On dashboard load',
  },
];

export const AdminDashboard: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const users = await UsersAPI.getAll();
    const projects = await ProjectsAPI.getAll();
    const tasks = await TasksAPI.getAll();

    setUserCount(users.length);
    setProjectCount(projects.length);
    setTaskCount(tasks.length);
    setActiveUsers(users.filter((u) => u.active).length);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Admin Dashboard"
        subtitle="System overview and administration"
        breadcrumbs={[{ label: 'Admin Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Users" value={userCount} icon="group" color="blue" />
          <KPICard
            title="Active Users"
            value={activeUsers}
            icon="group"
            color="green"
          />
          <KPICard
            title="Projects"
            value={projectCount}
            icon="project-definition-triangle-2"
            color="purple"
          />
          <KPICard title="Total Tasks" value={taskCount} icon="task" color="yellow" />
        </div>

        {/* KPI Definitions Table */}
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
            minRows={4}
            visibleRows={4}
            scaleWidthMode="Smart"
            alternateRowColor
          />
        </Card>

        {/* System Information */}
        <Card
          header={
            <CardHeader
              titleText="System Information"
              subtitleText="Platform status and configuration"
              avatar={<Icon name="sys-monitor" />}
            />
          }
        >
          <List>
            <ListItemStandard
              description="v1.0.0"
              additionalText="Current"
              additionalTextState="Information"
            >
              Platform Version
            </ListItemStandard>
            <ListItemStandard
              description="Mock Mode"
              additionalText="Active"
              additionalTextState="Positive"
            >
              Backend Status
            </ListItemStandard>
            <ListItemStandard
              description="/odata/v4/performance"
              additionalText="Configured"
              additionalTextState="None"
            >
              OData Endpoint
            </ListItemStandard>
          </List>
        </Card>
      </div>
    </div>
  );
};
