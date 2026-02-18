import React from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  BarChart3,
  ClipboardList,
  FolderKanban,
  Gauge,
  LayoutDashboard,
  Shield,
  SlidersHorizontal,
  Ticket,
  TriangleAlert,
  UserRound,
  Users,
  Wrench,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/entities';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
  section: string;
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/admin/dashboard',
    icon: Shield,
    roles: ['ADMIN'],
    section: 'Administration',
  },
  {
    label: 'Users',
    path: '/admin/users',
    icon: Users,
    roles: ['ADMIN'],
    section: 'Administration',
  },
  {
    label: 'Reference Data',
    path: '/admin/reference-data',
    icon: SlidersHorizontal,
    roles: ['ADMIN'],
    section: 'Administration',
  },
  {
    label: 'Performance',
    path: '/manager/dashboard',
    icon: BarChart3,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Projects',
    path: '/manager/projects',
    icon: FolderKanban,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Team',
    path: '/manager/team',
    icon: Users,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Allocations',
    path: '/manager/allocations',
    icon: LayoutDashboard,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Risks',
    path: '/manager/risks',
    icon: TriangleAlert,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Evaluations',
    path: '/manager/evaluations',
    icon: ClipboardList,
    roles: ['MANAGER'],
    section: 'Manager',
  },
  {
    label: 'Dashboard',
    path: '/consultant-tech/dashboard',
    icon: Gauge,
    roles: ['CONSULTANT_TECHNIQUE'],
    section: 'Tech Consultant',
  },
  {
    label: 'Projects',
    path: '/consultant-tech/projects',
    icon: FolderKanban,
    roles: ['CONSULTANT_TECHNIQUE'],
    section: 'Tech Consultant',
  },
  {
    label: 'Tasks',
    path: '/consultant-tech/tasks',
    icon: ClipboardList,
    roles: ['CONSULTANT_TECHNIQUE'],
    section: 'Tech Consultant',
  },
  {
    label: 'Timesheet',
    path: '/consultant-tech/timesheet',
    icon: LayoutDashboard,
    roles: ['CONSULTANT_TECHNIQUE'],
    section: 'Tech Consultant',
  },
  {
    label: 'Performance',
    path: '/consultant-tech/performance',
    icon: BarChart3,
    roles: ['CONSULTANT_TECHNIQUE'],
    section: 'Tech Consultant',
  },
  {
    label: 'Dashboard',
    path: '/consultant-func/dashboard',
    icon: Gauge,
    roles: ['CONSULTANT_FONCTIONNEL'],
    section: 'Functional Consultant',
  },
  {
    label: 'Projects',
    path: '/consultant-func/projects',
    icon: FolderKanban,
    roles: ['CONSULTANT_FONCTIONNEL'],
    section: 'Functional Consultant',
  },
  {
    label: 'Deliverables',
    path: '/consultant-func/deliverables',
    icon: Wrench,
    roles: ['CONSULTANT_FONCTIONNEL'],
    section: 'Functional Consultant',
  },
  {
    label: 'Tickets',
    path: '/consultant-func/tickets',
    icon: Ticket,
    roles: ['CONSULTANT_FONCTIONNEL'],
    section: 'Functional Consultant',
  },
];

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
}

const roleLabel: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CONSULTANT_TECHNIQUE: 'Technical Consultant',
  CONSULTANT_FONCTIONNEL: 'Functional Consultant',
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;

  const items = navigationItems.filter((item) => item.roles.includes(currentUser.role));

  const sections = items.reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.section]) {
      acc[item.section] = [];
    }
    acc[item.section].push(item);
    return acc;
  }, {});

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const renderSidebar = (mobile = false) => {
    const compact = !mobile && collapsed;

    return (
      <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
        <div
          className={cn(
            'flex h-16 items-center border-b border-sidebar-border px-4',
            compact ? 'justify-center' : 'justify-between'
          )}
        >
          <div className={cn('flex items-center gap-3', compact && 'justify-center')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            {!compact && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Inetum
                </p>
                <p className="text-sm font-semibold text-sidebar-foreground">Performance Hub</p>
              </div>
            )}
          </div>

          {mobile ? (
            <Button variant="ghost" size="icon" onClick={onCloseMobile} aria-label="Close navigation">
              <X className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {compact ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          {Object.entries(sections).map(([sectionName, sectionItems]) => (
            <div key={sectionName} className="mb-5 last:mb-0">
              {!compact && (
                <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {sectionName}
                </p>
              )}
              <div className="space-y-1.5">
                {sectionItems.map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.path}
                      type="button"
                      title={compact ? item.label : undefined}
                      aria-label={item.label}
                      onClick={() => {
                        navigate(item.path);
                        if (mobile) {
                          onCloseMobile();
                        }
                      }}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                        compact && 'justify-center'
                      )}
                    >
                      <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-sidebar-foreground/70')} />
                      {!compact && <span className="truncate font-medium">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={cn('border-t border-sidebar-border p-3', collapsed && !mobile ? 'px-2' : 'px-3')}>
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg bg-surface-2 p-2',
              collapsed && !mobile && 'justify-center'
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <UserRound className="h-4 w-4" />
            </div>
            {(!collapsed || mobile) && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">{currentUser.name}</p>
                <p className="truncate text-xs text-muted-foreground">{roleLabel[currentUser.role]}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className={cn('hidden shrink-0 transition-[width] duration-300 md:block', collapsed ? 'w-[92px]' : 'w-[280px]')}>
        {renderSidebar(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/45"
            onClick={onCloseMobile}
          />
          <aside
            id="app-mobile-navigation"
            className="relative h-full w-[86%] max-w-[320px] animate-slide-in-left"
          >
            {renderSidebar(true)}
          </aside>
        </div>
      )}
    </>
  );
};
