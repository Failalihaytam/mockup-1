import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { TicketsAPI, ProjectsAPI, WorkSessionsAPI, UsersAPI } from '../../services/odataClient';
import { Ticket, Project, WorkSession, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Users as UsersIcon,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router';

const PRIORITE_LABELS: Record<number, string> = { 0: 'P0 Critique', 1: 'P1 Haute', 2: 'P2 Moyenne', 3: 'P3 Basse' };

export const CoordinateurDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [t, p, s, u] = await Promise.all([
          TicketsAPI.getAll(),
          ProjectsAPI.getAll(),
          WorkSessionsAPI.getAll(),
          UsersAPI.getAll(),
        ]);
        setTickets(t);
        setProjects(p);
        setSessions(s);
        setUsers(u);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  // KPI computations
  const openTickets = useMemo(() => tickets.filter((t) => t.status === 'IN_PROGRESS' || t.status === 'OPEN'), [tickets]);
  const waitingTickets = useMemo(() => tickets.filter((t) => t.status === 'WAITING_FEEDBACK'), [tickets]);
  const completedThisMonth = useMemo(() => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    return tickets.filter((t) => t.status === 'RESOLVED' && t.updatedAt && t.updatedAt >= monthStart);
  }, [tickets]);

  const techConsultants = useMemo(
    () => users.filter((u) => u.role === 'CONSULTANT_TECHNIQUE' && u.active),
    [users],
  );

  // Hours this week
  const thisWeekHours = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1);
    const startStr = weekStart.toISOString().slice(0, 10);
    return sessions
      .filter((s) => s.date >= startStr)
      .reduce((sum, s) => sum + s.hours, 0);
  }, [sessions]);

  const activeProjects = useMemo(() => projects.filter((p) => p.status === 'ACTIVE'), [projects]);

  // Tickets by priority (priorite is 0–3; 2=Medium, 3=High → critical)
  const highPriorityTickets = useMemo(
    () => openTickets.filter((t) => t.priorite !== undefined && t.priorite <= 1),
    [openTickets],
  );

  const statusColor: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    WAITING_FEEDBACK: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    RESOLVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    CLOSED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };

  const prioriteColor: Record<number, string> = {
    0: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    1: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    2: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    3: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Bonjour, ${currentUser?.name.split(' ')[0] ?? 'Coordinateur'}`}
        subtitle="Vue d'ensemble de la coordination de développement"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Tickets Ouverts"
            value={openTickets.length}
            icon="task"
            trend={waitingTickets.length > 0 ? 'Down' : 'None'}
          />
          <KPICard
            title="Projets Actifs"
            value={activeProjects.length}
            icon="project-definition-triangle-2"
          />
          <KPICard
            title="Heures (semaine)"
            value={`${thisWeekHours.toFixed(1)}h`}
            icon="timesheet"
          />
          <KPICard
            title="Consultants Tech"
            value={techConsultants.length}
            icon="group"
            trend={completedThisMonth.length > 0 ? 'Up' : 'None'}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* High-priority / Waiting tickets */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Tickets Critiques & En attente
              </h3>
              <Button variant="ghost" size="sm" onClick={() => void navigate('/coordinateur/tickets')}>
                Voir tous <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : [...waitingTickets, ...highPriorityTickets].length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
                <p className="mt-2 text-sm text-muted-foreground">Aucun ticket critique ou en attente.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {[...waitingTickets, ...highPriorityTickets]
                  .filter((t, i, arr) => arr.findIndex((x) => x.id === t.id) === i)
                  .slice(0, 6)
                  .map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">{projectName(t.projectId)} — {userName(t.assignedTo ?? '')}</p>
                      </div>
                      <div className="flex gap-1.5 ml-2 shrink-0">
                        {t.priorite !== undefined && t.priorite > 0 && (
                          <Badge className={prioriteColor[t.priorite] ?? ''}>{PRIORITE_LABELS[t.priorite]}</Badge>
                        )}
                        <Badge className={statusColor[t.status] ?? ''}>{t.status.replace('_', ' ')}</Badge>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Team workload */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-violet-500" />
                Charge par Consultant
              </h3>
            </div>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement...</p>
            ) : (
              <ul className="space-y-3">
                {techConsultants.map((consultant) => {
                  const cTickets = openTickets.filter((t) => t.assignedTo === consultant.id);
                  const cWaiting = cTickets.filter((t) => t.status === 'WAITING_FEEDBACK').length;
                  const thisMonthSessions = sessions.filter((s) => {
                    const now = new Date();
                    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                    return s.consultantId === consultant.id && s.date >= monthStart;
                  });
                  const monthHours = thisMonthSessions.reduce((sum, s) => sum + s.hours, 0);
                  return (
                    <li key={consultant.id} className="rounded-md border bg-muted/30 px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{consultant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {cTickets.length} ticket{cTickets.length !== 1 ? 's' : ''} en cours
                            {cWaiting > 0 && <span className="text-orange-500 font-medium ml-1">({cWaiting} en attente)</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{monthHours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">ce mois</p>
                        </div>
                      </div>
                      {/* Progress bar showing ticket load */}
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            cTickets.length >= 4 ? 'bg-red-500' : cTickets.length >= 2 ? 'bg-amber-500' : 'bg-emerald-500',
                          )}
                          style={{ width: `${Math.min(100, (cTickets.length / 5) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
                {techConsultants.length === 0 && (
                  <li className="text-sm text-muted-foreground text-center py-4">Aucun consultant technique.</li>
                )}
              </ul>
            )}
          </div>
        </div>

        {/* Recent activity — resolved tickets */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Tickets Résolus Récemment
          </h3>
          {tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucun ticket résolu.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tickets
                .filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED')
                .slice(0, 6)
                .map((t) => (
                  <div key={t.id} className="rounded-md border bg-muted/30 px-3 py-2.5">
                    <p className="text-sm font-medium truncate">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{projectName(t.projectId)}</span>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                        {t.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
