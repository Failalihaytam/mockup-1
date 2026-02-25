import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Search } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectsAPI, TasksAPI, UsersAPI, TicketsAPI } from '../../services/odataClient';
import { Project, Task, User, Ticket } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  COMPLETED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

interface MyProjectsProps {
  basePath?: string;
}

export const MyProjects: React.FC<MyProjectsProps> = ({ basePath = '/consultant-tech' }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    void loadData(currentUser.id);
  }, [currentUser]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [userTasks, allProjects, allUsers, allTickets] = await Promise.all([
        TasksAPI.getByUser(userId),
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
      ]);

      const projectIds = new Set(userTasks.map((task) => task.projectId));
      setProjects(allProjects.filter((project) => projectIds.has(project.id)));
      setTasks(userTasks);
      setUsers(allUsers);
      setTickets(allTickets.filter((t) => t.assignedTo === userId || t.createdBy === userId));
    } finally {
      setLoading(false);
    }
  };

  const projectsWithStats = useMemo(() => {
    return projects
      .filter((p) => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
      })
      .map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const done = projectTasks.filter((task) => task.status === 'DONE').length;
        const blocked = projectTasks.filter((task) => task.status === 'BLOCKED').length;
        const inProgress = projectTasks.filter((task) => task.status === 'IN_PROGRESS').length;
        const progress = projectTasks.length
          ? projectTasks.reduce((sum, task) => sum + task.progressPercent, 0) / projectTasks.length
          : project.progress ?? 0;
        const manager = users.find((user) => user.id === project.managerId);
        const projectTickets = tickets.filter((t) => t.projectId === project.id);
        return { project, manager, done, blocked, inProgress, progress, projectTasks, projectTickets };
      });
  }, [projects, tasks, users, tickets, search]);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Mes Projets"
        subtitle="Vue d'ensemble de vos projets et tâches assignées"
        breadcrumbs={[
          { label: 'Tableau de Bord', path: `${basePath}/dashboard` },
          { label: 'Mes Projets' },
        ]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : projectsWithStats.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            Aucun projet assigné.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {projectsWithStats.map(({ project, manager, done, blocked, inProgress, progress, projectTasks, projectTickets }) => (
              <div
                key={project.id}
                className="cursor-pointer space-y-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:shadow-md"
                onClick={() => navigate(`${basePath}/projects/${project.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{project.code}</span>
                      <Badge className={statusColor[project.status] ?? 'bg-muted text-muted-foreground'}>
                        {project.status}
                      </Badge>
                    </div>
                    <h3 className="mt-1 text-lg font-semibold text-foreground">{project.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.description}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-muted-foreground">Ma progression</span>
                    <span className="font-medium text-foreground">{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg border border-border p-2">
                    <div className="text-xl font-semibold text-foreground">{projectTasks.length}</div>
                    <div className="text-xs text-muted-foreground">Tâches</div>
                  </div>
                  <div className="rounded-lg border border-border p-2">
                    <div className="text-xl font-semibold text-primary">{done}</div>
                    <div className="text-xs text-muted-foreground">Terminées</div>
                  </div>
                  <div className="rounded-lg border border-border p-2">
                    <div className="text-xl font-semibold text-amber-600 dark:text-amber-400">{inProgress}</div>
                    <div className="text-xs text-muted-foreground">En cours</div>
                  </div>
                  <div className="rounded-lg border border-border p-2">
                    <div className="text-xl font-semibold text-destructive">{blocked}</div>
                    <div className="text-xs text-muted-foreground">Bloquées</div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Manager : {manager?.name ?? '—'}</span>
                  <span>{projectTickets.length} ticket{projectTickets.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(project.startDate).toLocaleDateString('fr-FR')} → {new Date(project.endDate).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
