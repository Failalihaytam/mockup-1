// React Router configuration with role-based routing

import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate, Outlet, useLocation } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { getDefaultRouteForRole, useAuth } from './context/AuthContext';
import { UserRole } from './types/entities';

// Lazy-loaded page components for code splitting
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const UsersManagement = lazy(() => import('./pages/admin/UsersManagement').then(m => ({ default: m.UsersManagement })));
const ReferenceDataManagement = lazy(() => import('./pages/admin/ReferenceData').then(m => ({ default: m.ReferenceDataManagement })));

const ManagerDashboard = lazy(() => import('./pages/manager/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const Projects = lazy(() => import('./pages/manager/ProjectsEnhanced').then(m => ({ default: m.ProjectsEnhanced })));
const ProjectDetails = lazy(() => import('./pages/manager/ProjectDetails').then(m => ({ default: m.ProjectDetails })));
const TeamPerformance = lazy(() => import('./pages/manager/TeamPerformance').then(m => ({ default: m.TeamPerformance })));
const ResourceAllocation = lazy(() => import('./pages/manager/ResourceAllocation').then(m => ({ default: m.ResourceAllocation })));
const RisksAndCriticalTasks = lazy(() => import('./pages/manager/RisksAndCriticalTasks').then(m => ({ default: m.RisksAndCriticalTasks })));
const TeamEvaluations = lazy(() => import('./pages/manager/TeamEvaluations').then(m => ({ default: m.TeamEvaluations })));

const TechDashboard = lazy(() => import('./pages/consultant-tech/TechDashboard').then(m => ({ default: m.TechDashboard })));
const TechTickets = lazy(() => import('./pages/consultant-tech/TechTickets').then(m => ({ default: m.TechTickets })));
const MyProjects = lazy(() => import('./pages/consultant-tech/MyProjects').then(m => ({ default: m.MyProjects })));
const MyPerformance = lazy(() => import('./pages/consultant-tech/MyPerformance').then(m => ({ default: m.MyPerformance })));

const FuncDashboard = lazy(() => import('./pages/consultant-func/FuncDashboard').then(m => ({ default: m.FuncDashboard })));
const Deliverables = lazy(() => import('./pages/consultant-func/Deliverables').then(m => ({ default: m.Deliverables })));
const FuncProjects = lazy(() => import('./pages/consultant-func/Projects').then(m => ({ default: m.FuncProjects })));
const FuncTickets = lazy(() => import('./pages/consultant-func/Tickets').then(m => ({ default: m.FuncTickets })));
const DocumentsSFDs = lazy(() => import('./pages/consultant-func/DocumentsSFDs').then(m => ({ default: m.DocumentsSFDs })));
const FuncNotifications = lazy(() => import('./pages/consultant-func/FuncNotifications').then(m => ({ default: m.FuncNotifications })));
const FuncProfile = lazy(() => import('./pages/consultant-func/FuncProfile').then(m => ({ default: m.FuncProfile })));

const ManagerTickets = lazy(() => import('./pages/manager/ManagerTickets').then(m => ({ default: m.ManagerTickets })));
const CertifiedConsultants = lazy(() => import('./pages/manager/CertifiedConsultants').then(m => ({ default: m.CertifiedConsultants })));
const GestionConges = lazy(() => import('./pages/manager/GestionConges').then(m => ({ default: m.GestionConges })));

const ObjetDetail = lazy(() => import('./pages/shared/ObjetDetail').then(m => ({ default: m.ObjetDetail })));

const MyCertifications = lazy(() => import('./pages/consultant-tech/MyCertifications').then(m => ({ default: m.MyCertifications })));
const MesConges = lazy(() => import('./pages/consultant-tech/MesConges').then(m => ({ default: m.MesConges })));
const MesImputations = lazy(() => import('./pages/consultant-tech/MesImputations').then(m => ({ default: m.MesImputations })));
const TechNotifications = lazy(() => import('./pages/consultant-tech/TechNotifications').then(m => ({ default: m.TechNotifications })));
const TechProfile = lazy(() => import('./pages/consultant-tech/TechProfile').then(m => ({ default: m.TechProfile })));

const SharedMesImputations = lazy(() => import('./pages/shared/MesImputations').then(m => ({ default: m.MesImputations })));

const ChefProjetDashboard = lazy(() => import('./pages/chef-projet/ChefProjetDashboard').then(m => ({ default: m.ChefProjetDashboard })));
const ValidationImputations = lazy(() => import('./pages/chef-projet/ValidationImputations').then(m => ({ default: m.ValidationImputations })));

const CoordinateurDashboard = lazy(() => import('./pages/coordinateur/CoordinateurDashboard').then(m => ({ default: m.CoordinateurDashboard })));
const CoordinateurTickets = lazy(() => import('./pages/coordinateur/CoordinateurTickets').then(m => ({ default: m.CoordinateurTickets })));

const TicketDetailPage = lazy(() => import('./pages/shared/TicketDetailPage').then(m => ({ default: m.TicketDetailPage })));

const ProfilePage = lazy(() => import('./pages/shared/Profile').then(m => ({ default: m.ProfilePage })));
const SettingsPage = lazy(() => import('./pages/shared/Settings').then(m => ({ default: m.SettingsPage })));

const PageLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
    Loading...
  </div>
);

const SuspensePage = ({ children }: { children: ReactElement }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

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
            element: <SuspensePage><AdminDashboard /></SuspensePage>,
          },
          {
            path: 'users',
            element: <SuspensePage><UsersManagement /></SuspensePage>,
          },
          {
            path: 'reference-data',
            element: <SuspensePage><ReferenceDataManagement /></SuspensePage>,
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
            element: <SuspensePage><ManagerDashboard /></SuspensePage>,
          },
          {
            path: 'projects',
            element: <SuspensePage><Projects /></SuspensePage>,
          },
          {
            path: 'projects/:id',
            element: <SuspensePage><ProjectDetails /></SuspensePage>,
          },
          {
            path: 'team',
            element: <SuspensePage><TeamPerformance /></SuspensePage>,
          },
          {
            path: 'allocations',
            element: <SuspensePage><ResourceAllocation /></SuspensePage>,
          },
          {
            path: 'risks',
            element: <SuspensePage><RisksAndCriticalTasks /></SuspensePage>,
          },
          {
            path: 'evaluations',
            element: <SuspensePage><TeamEvaluations /></SuspensePage>,
          },
          {
            path: 'tickets',
            element: <SuspensePage><ManagerTickets /></SuspensePage>,
          },
          {
            path: 'tickets/:ticketId',
            element: <SuspensePage><TicketDetailPage /></SuspensePage>,
          },
          {
            path: 'certifications',
            element: <SuspensePage><CertifiedConsultants /></SuspensePage>,
          },
          {
            path: 'leave',
            element: <SuspensePage><GestionConges /></SuspensePage>,
          },
          {
            path: 'imputations',
            element: <SuspensePage><SharedMesImputations basePath="/manager" /></SuspensePage>,
          },
          {
            path: 'objets/:id',
            element: <SuspensePage><ObjetDetail /></SuspensePage>,
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
            element: <SuspensePage><TechDashboard /></SuspensePage>,
          },
          {
            path: 'projects',
            element: <SuspensePage><MyProjects /></SuspensePage>,
          },
          {
            path: 'projects/:id',
            element: <SuspensePage><ProjectDetails basePath="/consultant-tech" /></SuspensePage>,
          },
          {
            path: 'tickets',
            element: <SuspensePage><TechTickets /></SuspensePage>,
          },
          {
            path: 'tickets/:ticketId',
            element: <SuspensePage><TicketDetailPage /></SuspensePage>,
          },
          {
            path: 'performance',
            element: <SuspensePage><MyPerformance /></SuspensePage>,
          },
          {
            path: 'certifications',
            element: <SuspensePage><MyCertifications /></SuspensePage>,
          },
          {
            path: 'leave',
            element: <SuspensePage><MesConges /></SuspensePage>,
          },
          {
            path: 'imputations',
            element: <SuspensePage><MesImputations /></SuspensePage>,
          },
          {
            path: 'objets/:id',
            element: <SuspensePage><ObjetDetail /></SuspensePage>,
          },
          {
            path: 'notifications',
            element: <SuspensePage><TechNotifications /></SuspensePage>,
          },
          {
            path: 'profile',
            element: <SuspensePage><TechProfile /></SuspensePage>,
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
            element: <SuspensePage><FuncDashboard /></SuspensePage>,
          },
          {
            path: 'projects',
            element: <SuspensePage><FuncProjects /></SuspensePage>,
          },
          {
            path: 'projects/:id',
            element: <SuspensePage><ProjectDetails basePath="/consultant-func" /></SuspensePage>,
          },
          {
            path: 'deliverables',
            element: <SuspensePage><Deliverables /></SuspensePage>,
          },
          {
            path: 'documents',
            element: <SuspensePage><DocumentsSFDs /></SuspensePage>,
          },
          {
            path: 'tickets',
            element: <SuspensePage><FuncTickets /></SuspensePage>,
          },
          {
            path: 'tickets/:ticketId',
            element: <SuspensePage><TicketDetailPage /></SuspensePage>,
          },
          {
            path: 'objets/:id',
            element: <SuspensePage><ObjetDetail /></SuspensePage>,
          },
          {
            path: 'notifications',
            element: <SuspensePage><FuncNotifications /></SuspensePage>,
          },
          {
            path: 'profile',
            element: <SuspensePage><FuncProfile /></SuspensePage>,
          },
        ],
      },

      // Chef de Projet routes
      {
        path: 'chef-projet',
        element: <RequireRole allowedRoles={['CHEF_DE_PROJET']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <SuspensePage><ChefProjetDashboard /></SuspensePage>,
          },
          {
            path: 'validation',
            element: <SuspensePage><ValidationImputations /></SuspensePage>,
          },
          {
            path: 'suivi',
            element: <SuspensePage><Projects /></SuspensePage>,
          },
          {
            path: 'imputations',
            element: <SuspensePage><SharedMesImputations basePath="/chef-projet" /></SuspensePage>,
          },
          {
            path: 'tickets/:ticketId',
            element: <SuspensePage><TicketDetailPage /></SuspensePage>,
          },
        ],
      },

      // Coordinateur Dev routes
      {
        path: 'coordinateur',
        element: <RequireRole allowedRoles={['COORDINATEUR_DEV']} />,
        children: [
          {
            index: true,
            element: <Navigate to="dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <SuspensePage><CoordinateurDashboard /></SuspensePage>,
          },
          {
            path: 'tickets',
            element: <SuspensePage><CoordinateurTickets /></SuspensePage>,
          },
          {
            path: 'tickets/:ticketId',
            element: <SuspensePage><TicketDetailPage /></SuspensePage>,
          },
          {
            path: 'allocations',
            element: <SuspensePage><ResourceAllocation basePath="/coordinateur" /></SuspensePage>,
          },
          {
            path: 'projects',
            element: <SuspensePage><MyProjects basePath="/coordinateur" /></SuspensePage>,
          },
          {
            path: 'projects/:id',
            element: <SuspensePage><ProjectDetails basePath="/coordinateur" /></SuspensePage>,
          },
          {
            path: 'imputations',
            element: <SuspensePage><SharedMesImputations basePath="/coordinateur" /></SuspensePage>,
          },
          {
            path: 'objets/:id',
            element: <SuspensePage><ObjetDetail /></SuspensePage>,
          },
        ],
      },

      // Shared routes
      {
        path: 'profile',
        element: <SuspensePage><ProfilePage /></SuspensePage>,
      },
      {
        path: 'settings',
        element: <SuspensePage><SettingsPage /></SuspensePage>,
      },
      {
        path: '*',
        element: (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Page not found</h1>
            <p className="mt-2 text-muted-foreground">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-foreground">404</h1>
          <p className="text-muted-foreground">Page not found</p>
        </div>
      </div>
    ),
  },
]);
