// Admin Dashboard - Stunning Overview Page
import React, { useEffect, useState } from 'react';
import {
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  FlexBox,
  FlexBoxDirection,
  FlexBoxWrap,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Label,
  Title,
  Card,
  CardHeader,
  List,
  ListItemStandard,
  Button,
  Tag,
  ProgressIndicator,
  Icon,
  ValueColor,
} from '@ui5/webcomponents-react';
import { AnalyticalKPICard } from '../../components/common/AnalyticalKPICard';
import { UsersAPI, ProjectsAPI, TasksAPI } from '../../services/odataClient';
import { User, Project, Task } from '../../types/entities';

import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/business-objects-experience.js';
import '@ui5/webcomponents-icons/dist/task.js';
import '@ui5/webcomponents-icons/dist/activate.js';
import '@ui5/webcomponents-icons/dist/warning.js';
import '@ui5/webcomponents-icons/dist/sys-monitor.js';
import '@ui5/webcomponents-icons/dist/refresh.js';

export const AdminDashboardEnhanced: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [usersData, projectsData, tasksData] = await Promise.all([
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        TasksAPI.getAll(),
      ]);
      setUsers(usersData);
      setProjects(projectsData);
      setTasks(tasksData);
    } finally {
      setLoading(false);
    }
  };

  const activeUsers = users.filter((u) => u.active).length;
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const systemHealth = 98;

  const recentActivities = [
    {
      title: 'New user registered',
      description: 'Sophie Bernard joined as Functional Consultant',
      time: '2 hours ago',
      icon: 'group',
      state: 'Positive' as const,
    },
    {
      title: 'Project milestone reached',
      description: 'S/4HANA Migration - Phase 2 completed',
      time: '5 hours ago',
      icon: 'business-objects-experience',
      state: 'Information' as const,
    },
    {
      title: 'System maintenance scheduled',
      description: 'Planned downtime on Sunday 2AM-4AM',
      time: '1 day ago',
      icon: 'warning',
      state: 'Critical' as const,
    },
  ];

  const usersByRole = [
    { role: 'Admin', count: users.filter((u) => u.role === 'ADMIN').length, color: '#d32f2f' },
    { role: 'Manager', count: users.filter((u) => u.role === 'MANAGER').length, color: '#0854a0' },
    {
      role: 'Tech Consultant',
      count: users.filter((u) => u.role === 'CONSULTANT_TECHNIQUE').length,
      color: '#2e7d32',
    },
    {
      role: 'Func Consultant',
      count: users.filter((u) => u.role === 'CONSULTANT_FONCTIONNEL').length,
      color: '#ed6c02',
    },
  ];

  return (
    <DynamicPage
      titleArea={
        <DynamicPageTitle
          heading={<Title>System Administration</Title>}
          actionsBar={
            <FlexBox style={{ gap: '0.5rem' }}>
              <Button
                icon="refresh"
                design="Transparent"
                onClick={loadDashboardData}
                tooltip="Refresh Data"
              />
              <Button icon="sys-monitor" design="Emphasized">
                System Monitor
              </Button>
            </FlexBox>
          }
        />
      }
      headerArea={
        <DynamicPageHeader>
          <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '2rem' }}>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>Administrator</Label>
              <Title level="H5">Jean Dupont</Title>
            </FlexBox>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>System Status</Label>
              <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.5rem' }}>
                <Icon name="activate" style={{ color: 'var(--sapPositiveColor)' }} />
                <Title level="H5">Operational</Title>
              </FlexBox>
            </FlexBox>
            <FlexBox direction={FlexBoxDirection.Column}>
              <Label>Last Backup</Label>
              <Title level="H5">Today, 3:00 AM</Title>
            </FlexBox>
          </FlexBox>
        </DynamicPageHeader>
      }
      style={{ height: '100%' }}
    >
      <FlexBox direction={FlexBoxDirection.Column} style={{ padding: '1rem', gap: '1.5rem' }}>
        {/* KPI Cards */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '1rem' }} className="animate-fade-in">
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }} className="stagger-item">
            <AnalyticalKPICard
              title="Total Users"
              value={users.length}
              subtitle={`${activeUsers} active`}
              state={ValueColor.None}
              icon="group"
              target={users.length}
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }} className="stagger-item">
            <AnalyticalKPICard
              title="Active Projects"
              value={activeProjects}
              subtitle={`${projects.length} total`}
              state={ValueColor.Neutral}
              icon="business-objects-experience"
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }} className="stagger-item">
            <AnalyticalKPICard
              title="Completed Tasks"
              value={completedTasks}
              subtitle={`${tasks.length} total tasks`}
              state={ValueColor.Good}
              icon="task"
              trend="Up"
            />
          </div>
          <div style={{ flex: '1 1 calc(25% - 1rem)', minWidth: '250px' }} className="stagger-item">
            <AnalyticalKPICard
              title="System Health"
              value={systemHealth}
              unit="%"
              subtitle="All systems operational"
              state={ValueColor.Good}
              icon="sys-monitor"
              target={100}
            />
          </div>
        </FlexBox>

        {/* Content Grid */}
        <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '1rem' }}>
          {/* Users by Role */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card
              header={
                <CardHeader
                  titleText="Users by Role"
                  subtitleText="Distribution across the platform"
                  action={
                    <Button design="Transparent" icon="navigation-right-arrow" />
                  }
                />
              }
              className="hover-lift"
            >
              <div style={{ padding: '1.5rem' }}>
                <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '1rem' }}>
                  {usersByRole.map((item) => (
                    <FlexBox
                      key={item.role}
                      alignItems={FlexBoxAlignItems.Center}
                      justifyContent={FlexBoxJustifyContent.SpaceBetween}
                      style={{ gap: '1rem' }}
                    >
                      <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '1rem', flex: 1 }}>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: item.color,
                          }}
                        />
                        <Label style={{ flex: 1 }}>{item.role}</Label>
                      </FlexBox>
                      <Tag colorScheme="8">{item.count}</Tag>
                      <div style={{ width: '150px' }}>
                        <ProgressIndicator
                          value={(item.count / users.length) * 100}
                          valueState="Information"
                          hideValue
                        />
                      </div>
                    </FlexBox>
                  ))}
                </FlexBox>
              </div>
            </Card>
          </div>

          {/* Recent Activities */}
          <div style={{ flex: '1 1 calc(50% - 0.5rem)', minWidth: '400px' }}>
            <Card
              header={
                <CardHeader
                  titleText="Recent Activities"
                  subtitleText="Latest system events"
                  action={
                    <Button design="Transparent" icon="navigation-right-arrow" />
                  }
                />
              }
              className="hover-lift"
            >
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItemStandard
                    key={index}
                    icon={activity.icon}
                    description={activity.description}
                    additionalText={activity.time}
                    additionalTextState={activity.state}
                  >
                    {activity.title}
                  </ListItemStandard>
                ))}
              </List>
            </Card>
          </div>

          {/* Quick Actions */}
          <div style={{ flex: '1 1 100%' }}>
            <Card
              header={<CardHeader titleText="Quick Actions" subtitleText="Common administrative tasks" />}
            >
              <div style={{ padding: '1.5rem' }}>
                <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '1rem' }}>
                  <Button design="Emphasized" icon="add">
                    Create User
                  </Button>
                  <Button design="Default" icon="business-objects-experience">
                    Manage Projects
                  </Button>
                  <Button design="Default" icon="database">
                    Reference Data
                  </Button>
                  <Button design="Default" icon="sys-monitor">
                    System Logs
                  </Button>
                  <Button design="Default" icon="settings">
                    Configuration
                  </Button>
                  <Button design="Default" icon="download">
                    Export Data
                  </Button>
                </FlexBox>
              </div>
            </Card>
          </div>
        </FlexBox>
      </FlexBox>
    </DynamicPage>
  );
};
