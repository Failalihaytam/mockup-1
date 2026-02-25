import React, { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, FolderKanban, AlertTriangle, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import { EvaluationsAPI, ProjectsAPI, TasksAPI, TimesheetsAPI, TicketsAPI } from '../../services/odataClient';
import { Evaluation, Project, Task, Timesheet, Ticket } from '../../types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { getFridayOfWeek, getMondayOfWeek, toLocalDateKey } from '../../utils/date';

const priorityColor: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
};

export const TechDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const loadDashboardData = async () => {
      setLoading(true);

      try {
        const [taskData, allProjects, evals, timesheetData, allTickets] = await Promise.all([
          TasksAPI.getByUser(currentUser.id),
          ProjectsAPI.getAll(),
          EvaluationsAPI.getByUser(currentUser.id),
          TimesheetsAPI.getByUser(currentUser.id),
          TicketsAPI.getAll(),
        ]);

        const myProjectIds = new Set(taskData.map((task) => task.projectId));
        setTasks(taskData);
        setProjects(allProjects.filter((project) => myProjectIds.has(project.id)));
        setEvaluations(evals);
        setTimesheets(timesheetData);
        setTickets(allTickets.filter((t) => t.assignedTo === currentUser.id || t.createdBy === currentUser.id));
      } finally {
        setLoading(false);
      }
    };

    void loadDashboardData();
  }, [currentUser]);

  const myTasksCount = tasks.length;
  const overdueTasks = tasks.filter(
    (task) => task.status !== 'DONE' && new Date(task.plannedEnd) < new Date() && !task.realEnd
  ).length;

  const weekStart = toLocalDateKey(getMondayOfWeek(new Date()));
  const weekEnd = toLocalDateKey(getFridayOfWeek(new Date()));
  const hoursThisWeek = timesheets
    .filter((entry) => entry.date >= weekStart && entry.date <= weekEnd)
    .reduce((sum, entry) => sum + entry.hours, 0);

  const activeProjects = projects.filter((project) => project.status === 'ACTIVE').length;
  const averageScore =
    evaluations.length > 0
      ? evaluations.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluations.length
      : 0;

  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  const upcomingTasks = tasks
    .filter((task) => task.status === 'TO_DO' || task.status === 'IN_PROGRESS')
    .sort((a, b) => new Date(a.plannedEnd).getTime() - new Date(b.plannedEnd).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={`Bonjour, ${currentUser?.name.split(' ')[0] ?? 'Consultant'}`}
        subtitle="Cockpit d'exécution – tâches, charge et qualité"
        breadcrumbs={[{ label: 'Tableau de Bord' }]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KPICard title="Mes Tâches" value={myTasksCount} icon="task" color="blue" />
          <KPICard title="Tâches en retard" value={overdueTasks} icon="alert" color="red" />
          <KPICard title="Heures (semaine)" value={hoursThisWeek} icon="timesheet" color="green" />
          <KPICard
            title="Projets actifs"
            value={activeProjects}
            icon="project-definition-triangle-2"
            color="yellow"
          />
          <KPICard
            title="Score qualité"
            value={averageScore.toFixed(1)}
            unit="/5"
            icon="trend-up"
            color="blue"
            progress={(averageScore / 5) * 100}
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_1fr]">
          {/* Upcoming Tasks */}
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Tâches à venir</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/consultant-tech/projects')}>
                Voir tout <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : upcomingTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune tâche à venir.</p>
              ) : (
                upcomingTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => navigate(`/consultant-tech/projects`)}
                    className="w-full rounded-xl border border-border/70 bg-surface-1 p-4 text-left transition hover-lift"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{task.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{task.description}</p>
                      </div>
                      <Badge className={priorityColor[task.priority] ?? 'bg-muted text-muted-foreground'}>
                        {task.priority}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3.5 w-3.5" />
                        Échéance {new Date(task.plannedEnd).toLocaleDateString('fr-FR')}
                      </span>
                      <span>{task.progressPercent}%</span>
                    </div>
                    <Progress className="mt-2" value={task.progressPercent} />
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* Assigned Projects */}
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-lg">Mes Projets</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => navigate('/consultant-tech/projects')}
              >
                Ouvrir <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun projet assigné.</p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="cursor-pointer rounded-xl border border-border/70 bg-surface-1 p-4 transition hover-lift"
                    onClick={() => navigate(`/consultant-tech/projects/${project.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {project.description}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-1 text-xs font-medium text-primary">
                        <FolderKanban className="h-3.5 w-3.5" />
                        {project.status}
                      </span>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progression</span>
                        <span>{project.progress ?? 0}%</span>
                      </div>
                      <Progress value={project.progress ?? 0} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom row: Productivity + Tickets */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="bg-card/92">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-primary" />
                Productivité
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-surface-1 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Cette semaine</p>
                <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Clock3 className="h-5 w-5 text-primary" />
                  {hoursThisWeek}h
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface-1 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Tâches terminées</p>
                <p className="mt-2 inline-flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {tasks.filter((task) => task.status === 'DONE').length}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-surface-1 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Score qualité</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{averageScore.toFixed(2)} / 5</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-primary" />
                Tickets ouverts ({openTickets})
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/consultant-tech/tickets')}>
                Voir <ArrowRight className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : tickets.filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED').length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun ticket ouvert.</p>
              ) : (
                tickets
                  .filter((t) => t.status !== 'CLOSED' && t.status !== 'RESOLVED')
                  .slice(0, 4)
                  .map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-border/70 bg-surface-1 p-3 cursor-pointer transition hover-lift"
                      onClick={() => navigate(`/consultant-tech/tickets/${t.id}`)}
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{t.status.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge className={priorityColor[t.priority] ?? 'bg-muted text-muted-foreground'}>
                        {t.priority}
                      </Badge>
                    </div>
                  ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
