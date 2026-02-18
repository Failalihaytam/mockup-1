// SAP Fiori-style sidebar navigation

import React from 'react';
import { SideNavigation, SideNavigationItem } from '@ui5/webcomponents-react';
import { useLocation, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/entities';

import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/database.js';
import '@ui5/webcomponents-icons/dist/project-definition-triangle-2.js';
import '@ui5/webcomponents-icons/dist/kpi-corporate-performance.js';
import '@ui5/webcomponents-icons/dist/hr-approval.js';
import '@ui5/webcomponents-icons/dist/warning.js';
import '@ui5/webcomponents-icons/dist/opportunity.js';
import '@ui5/webcomponents-icons/dist/list.js';
import '@ui5/webcomponents-icons/dist/timesheet.js';
import '@ui5/webcomponents-icons/dist/task.js';
import '@ui5/webcomponents-icons/dist/incident.js';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  // Admin
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: 'home',
    roles: ['ADMIN'],
  },
  {
    label: 'Users Management',
    path: '/admin/users',
    icon: 'group',
    roles: ['ADMIN'],
  },
  {
    label: 'Reference Data',
    path: '/admin/reference-data',
    icon: 'database',
    roles: ['ADMIN'],
  },

  // Manager
  {
    label: 'Performance Dashboard',
    path: '/manager/dashboard',
    icon: 'kpi-corporate-performance',
    roles: ['MANAGER'],
  },
  {
    label: 'Projects',
    path: '/manager/projects',
    icon: 'project-definition-triangle-2',
    roles: ['MANAGER'],
  },
  {
    label: 'Team Performance',
    path: '/manager/team',
    icon: 'group',
    roles: ['MANAGER'],
  },
  {
    label: 'Resource Allocation',
    path: '/manager/allocations',
    icon: 'hr-approval',
    roles: ['MANAGER'],
  },
  {
    label: 'Risks & Critical Tasks',
    path: '/manager/risks',
    icon: 'warning',
    roles: ['MANAGER'],
  },
  {
    label: 'Evaluations',
    path: '/manager/evaluations',
    icon: 'opportunity',
    roles: ['MANAGER'],
  },

  // Technical Consultant
  {
    label: 'My Dashboard',
    path: '/consultant-tech/dashboard',
    icon: 'home',
    roles: ['CONSULTANT_TECHNIQUE'],
  },
  {
    label: 'My Projects',
    path: '/consultant-tech/projects',
    icon: 'project-definition-triangle-2',
    roles: ['CONSULTANT_TECHNIQUE'],
  },
  {
    label: 'My Tasks',
    path: '/consultant-tech/tasks',
    icon: 'task',
    roles: ['CONSULTANT_TECHNIQUE'],
  },
  {
    label: 'Timesheet',
    path: '/consultant-tech/timesheet',
    icon: 'timesheet',
    roles: ['CONSULTANT_TECHNIQUE'],
  },
  {
    label: 'My Performance',
    path: '/consultant-tech/performance',
    icon: 'kpi-corporate-performance',
    roles: ['CONSULTANT_TECHNIQUE'],
  },

  // Functional Consultant
  {
    label: 'My Dashboard',
    path: '/consultant-func/dashboard',
    icon: 'home',
    roles: ['CONSULTANT_FONCTIONNEL'],
  },
  {
    label: 'Projects',
    path: '/consultant-func/projects',
    icon: 'project-definition-triangle-2',
    roles: ['CONSULTANT_FONCTIONNEL'],
  },
  {
    label: 'Deliverables',
    path: '/consultant-func/deliverables',
    icon: 'list',
    roles: ['CONSULTANT_FONCTIONNEL'],
  },
  {
    label: 'Tickets',
    path: '/consultant-func/tickets',
    icon: 'incident',
    roles: ['CONSULTANT_FONCTIONNEL'],
  },
];

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const userNavItems = navigationItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  return (
    <SideNavigation
      collapsed={collapsed}
      onSelectionChange={(e) => {
        const item = e.detail.item;
        const path = item.getAttribute('data-path');
        if (path) {
          navigate(path);
        }
      }}
    >
      {userNavItems.map((item) => (
        <SideNavigationItem
          key={item.path}
          text={item.label}
          icon={item.icon}
          tooltip={item.label}
          selected={
            location.pathname === item.path ||
            location.pathname.startsWith(`${item.path}/`)
          }
          data-path={item.path}
        />
      ))}
    </SideNavigation>
  );
};
