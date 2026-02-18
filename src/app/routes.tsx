// React Router configuration with role-based routing

import type { ReactElement } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { getDefaultRouteForRole, useAuth } from './context/AuthContext';
import { UserRole } from './types/entities';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UsersManagement } from './pages/admin/UsersManagement';
import { ReferenceDataManagement } from './pages/admin/ReferenceData';

// Manager pages
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ProjectsEnhanced as Projects } from './pages/manager/ProjectsEnhanced';
import { ProjectDetails } from './pages/manager/ProjectDetails';
import { TeamPerformance } from './pages/manager/TeamPerformance';
import { ResourceAllocation } from './pages/manager/ResourceAllocation';
import { RisksAndCriticalTasks } from './pages/manager/RisksAndCriticalTasks';
import { TeamEvaluations } from './pages/manager/TeamEvaluations';

// Technical Consultant pages
import { TechDashboard } from './pages/consultant-tech/TechDashboard';
import { MyTasks } from './pages/consultant-tech/MyTasks';
import { TimesheetPage } from './pages/consultant-tech/Timesheet';
import { MyProjects } from './pages/consultant-tech/MyProjects';
import { MyPerformance } from './pages/consultant-tech/MyPerformance';

// Functional Consultant pages
import { FuncDashboard } from './pages/consultant-func/FuncDashboard';
import { Deliverables } from './pages/consultant-func/Deliverables';
import { FuncProjects } from './pages/consultant-func/Projects';
import { FuncTickets } from './pages/consultant-func/Tickets';

// Shared pages
import { ProfilePage } from './pages/shared/Profile';
import { SettingsPage } from './pages/shared/Settings';

const AuthLoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
    Loading session...
  </div>
);

const RequireAuth = ({ children }: { children: ReactElement }) => {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return children;
};

const PublicOnlyRoute = ({ children }: { children: ReactElement }) => {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated && currentUser) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return children;
};

const RequireRole = ({ allowedRoles }: { allowedRoles: UserRole[] }) => {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
  }

  return <Outlet />;
};

const RoleDashboardRedirect = () => {
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },

      // Auto-redirect dashboard to role-specific dashboard
      {
        path: 'dashboard',
        element: <RoleDashboardRedirect />,
      },

      // Admin routes
      {
        path: 'admin',
        element: <RequireRole allowedRoles={['ADMIN']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboard />,
          },
          {
            path: 'users',
            element: <UsersManagement />,
          },
          {
            path: 'reference-data',
            element: <ReferenceDataManagement />,
          },
        ],
      },

      // Manager routes
      {
        path: 'manager',
        element: <RequireRole allowedRoles={['MANAGER']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <ManagerDashboard />,
          },
          {
            path: 'projects',
            element: <Projects />,
          },
          {
            path: 'projects/:id',
            element: <ProjectDetails />,
          },
          {
            path: 'team',
            element: <TeamPerformance />,
          },
          {
            path: 'allocations',
            element: <ResourceAllocation />,
          },
          {
            path: 'risks',
            element: <RisksAndCriticalTasks />,
          },
          {
            path: 'evaluations',
            element: <TeamEvaluations />,
          },
        ],
      },

      // Technical Consultant routes
      {
        path: 'consultant-tech',
        element: <RequireRole allowedRoles={['CONSULTANT_TECHNIQUE']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <TechDashboard />,
          },
          {
            path: 'projects',
            element: <MyProjects />,
          },
          {
            path: 'tasks',
            element: <MyTasks />,
          },
          {
            path: 'timesheet',
            element: <TimesheetPage />,
          },
          {
            path: 'performance',
            element: <MyPerformance />,
          },
        ],
      },

      // Functional Consultant routes
      {
        path: 'consultant-func',
        element: <RequireRole allowedRoles={['CONSULTANT_FONCTIONNEL']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <FuncDashboard />,
          },
          {
            path: 'projects',
            element: <FuncProjects />,
          },
          {
            path: 'deliverables',
            element: <Deliverables />,
          },
          {
            path: 'tickets',
            element: <FuncTickets />,
          },
        ],
      },

      // Shared routes
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="text-gray-600 mt-2">
              The page you requested does not exist.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    path: '*',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600">Page not found</p>
        </div>
      </div>
    ),
  },
]);
