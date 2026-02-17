// Admin Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { UsersAPI, ProjectsAPI, TasksAPI } from '../../services/odataClient';

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

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            System Information
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Platform Version</span>
              <span className="font-medium">v1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">Backend Status</span>
              <span className="font-medium text-green-600">Mock Mode Active</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-muted-foreground">OData Endpoint</span>
              <span className="font-medium text-muted-foreground">
                /odata/v4/performance
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
