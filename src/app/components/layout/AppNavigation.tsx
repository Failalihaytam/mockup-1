// SAP Fiori SideNavigation - Role-based Navigation
import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  SideNavigation,
  SideNavigationItem,
  SideNavigationSubItem,
} from '@ui5/webcomponents-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/entities';

import '@ui5/webcomponents-icons/dist/home.js';
import '@ui5/webcomponents-icons/dist/business-objects-experience.js';
import '@ui5/webcomponents-icons/dist/group.js';
import '@ui5/webcomponents-icons/dist/task.js';
import '@ui5/webcomponents-icons/dist/time-entry-request.js';
import '@ui5/webcomponents-icons/dist/performance.js';
import '@ui5/webcomponents-icons/dist/document.js';
import '@ui5/webcomponents-icons/dist/incident.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/database.js';
import '@ui5/webcomponents-icons/dist/org-chart.js';
import '@ui5/webcomponents-icons/dist/warning.js';
import '@ui5/webcomponents-icons/dist/feedback.js';
import '@ui5/webcomponents-icons/dist/activities.js';

interface NavigationItem {
  text: string;
  icon: string;
  path?: string;
  roles: UserRole[];
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  // Admin Navigation
  {
    text: 'Admin',
    icon: 'database',
    roles: ['ADMIN'],
    children: [
      { text: 'Dashboard', icon: 'home', path: '/admin/dashboard', roles: ['ADMIN'] },
      { text: 'Users Management', icon: 'group', path: '/admin/users', roles: ['ADMIN'] },
      { text: 'Reference Data', icon: 'database', path: '/admin/reference-data', roles: ['ADMIN'] },
    ],
  },
  // Manager Navigation
  {
    text: 'Manager',
    icon: 'business-objects-experience',
    roles: ['MANAGER'],
    children: [
      { text: 'Dashboard', icon: 'home', path: '/manager/dashboard', roles: ['MANAGER'] },
      { text: 'Projects', icon: 'business-objects-experience', path: '/manager/projects', roles: ['MANAGER'] },
      { text: 'Team Performance', icon: 'performance', path: '/manager/team', roles: ['MANAGER'] },
      { text: 'Resource Allocation', icon: 'org-chart', path: '/manager/allocations', roles: ['MANAGER'] },
      { text: 'Risks & Critical Tasks', icon: 'warning', path: '/manager/risks', roles: ['MANAGER'] },
      { text: 'Team Evaluations', icon: 'feedback', path: '/manager/evaluations', roles: ['MANAGER'] },
    ],
  },
  // Technical Consultant Navigation
  {
    text: 'My Work',
    icon: 'activities',
    roles: ['CONSULTANT_TECHNIQUE'],
    children: [
      { text: 'Dashboard', icon: 'home', path: '/consultant-tech/dashboard', roles: ['CONSULTANT_TECHNIQUE'] },
      { text: 'My Projects', icon: 'business-objects-experience', path: '/consultant-tech/projects', roles: ['CONSULTANT_TECHNIQUE'] },
      { text: 'My Tasks', icon: 'task', path: '/consultant-tech/tasks', roles: ['CONSULTANT_TECHNIQUE'] },
      { text: 'Timesheet', icon: 'time-entry-request', path: '/consultant-tech/timesheet', roles: ['CONSULTANT_TECHNIQUE'] },
      { text: 'My Performance', icon: 'performance', path: '/consultant-tech/performance', roles: ['CONSULTANT_TECHNIQUE'] },
    ],
  },
  // Functional Consultant Navigation
  {
    text: 'Functional',
    icon: 'document',
    roles: ['CONSULTANT_FONCTIONNEL'],
    children: [
      { text: 'Dashboard', icon: 'home', path: '/consultant-func/dashboard', roles: ['CONSULTANT_FONCTIONNEL'] },
      { text: 'Projects', icon: 'business-objects-experience', path: '/consultant-func/projects', roles: ['CONSULTANT_FONCTIONNEL'] },
      { text: 'Deliverables', icon: 'document', path: '/consultant-func/deliverables', roles: ['CONSULTANT_FONCTIONNEL'] },
      { text: 'Tickets', icon: 'incident', path: '/consultant-func/tickets', roles: ['CONSULTANT_FONCTIONNEL'] },
    ],
  },
];

export const AppNavigation: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const filteredItems = navigationItems.filter((item) =>
    item.roles.includes(currentUser.role)
  );

  const handleItemClick = (path?: string) => {
    if (path) {
      navigate(path);
    }
  };

  const isSelected = (path?: string) => {
    if (!path) return false;
    return location.pathname === path;
  };

  return (
    <SideNavigation
      style={{
        height: 'calc(100vh - 44px)',
        width: '250px',
      }}
    >
      {filteredItems.map((item) => (
        <SideNavigationItem
          key={item.text}
          text={item.text}
          icon={item.icon}
          expanded
        >
          {item.children?.map((child) => (
            <SideNavigationSubItem
              key={child.path}
              text={child.text}
              icon={child.icon}
              selected={isSelected(child.path)}
              onClick={() => handleItemClick(child.path)}
            />
          ))}
        </SideNavigationItem>
      ))}
    </SideNavigation>
  );
};
