import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertTriangle,
  FolderKanban,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import {
  ProjectsAPI,
  TicketsAPI,
  ObjetsAPI,
  DocumentationsAPI,
  DeliverablesAPI,
} from '../../services/odataClient';
import { Project, Ticket as TicketType, Objet, Documentation, Deliverable } from '../../types/entities';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export const FuncDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setLoading(true);
      try {
        const [p, t, o, d, del] = await Promise.all([
          ProjectsAPI.getAll(),
          TicketsAPI.getAll(),
          ObjetsAPI.getAll(),
          DocumentationsAPI.getAll(),
          DeliverablesAPI.getAll(),
        ]);
        setProjects(p);
        setTickets(t.filter((tk) => tk.createdBy === currentUser.id));
        setObjets(o);
        setDocs(d);
        setDeliverables(del);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentUser]);

  // KPIs
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const openTickets = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FEEDBACK'
  ).length;

  const objetsWithoutSFD = useMemo(() => {
    const documented = new Set(docs.map((d) => d.objetId));
    return objets.filter((o) => !documented.has(o.id));
  }, [objets, docs]);

  const pendingDocs = deliverables.filter(
    (d) => d.validationStatus === 'PENDING'
  ).length;

  // Recent projects (3)
  const recentProjects = useMemo(() => {
    return [...projects]
      .filter((p) => p.status === 'ACTIVE')
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .slice(0, 3);
  }, [projects]);

  // Recent activity from tickets
  const recentActivity = useMemo(() => {
    return [...tickets]
      .sort((a, b) => (b.updatedAt ?? b.createdAt).localeCompare(a.updatedAt ?? a.createdAt))
      .slice(0, 5);
  }, [tickets]);

  const statusColor: Record<string, string> = {
    OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    IN_PROGRESS: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    WAITING_FEEDBACK: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
  };

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title={`Bonjour, ${currentUser?.name.split(' ')[0] ?? 'Consultant'}`}
        subtitle="Tableau de bord fonctionnel — projets, tickets et documentation"
        breadcrumbs={[{ label: 'Tableau de Bord' }]}
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* KPI Row */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            title="Projets actifs"
            value={activeProjects}
            icon="project-definition-triangle-2"
            color="blue"
          />
          <KPICard
            title="Tickets ouverts"
            value={openTickets}
            icon="incident"
            color="yellow"
          />
          <KPICard
            title="Objets sans SFD"
            value={objetsWithoutSFD.length}
            icon="alert"
            color="red"
          />
          <KPICard
            title="Documents en attente"
            value={pendingDocs}
            icon="document"
            color="purple"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr]">
          {/* Mes Projets récents */}
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <FolderKanban className="h-4 w-4 text-primary" />
                Mes Projets récents
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/consultant-func/projects')}
              >
                Voir tout
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun projet actif.</p>
              ) : (
                recentProjects.map((project) => {
                  const projObjets = objets.filter((o) => o.projectId === project.id);
                  const projTickets = tickets.filter((t) => t.projectId === project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => navigate(`/consultant-func/projects/${project.id}`)}
                      className="w-full rounded-xl border border-border/70 bg-surface-1 p-4 text-left transition hover-lift"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">{project.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        {project.description}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{projObjets.length} objets</span>
                        <span>{projTickets.length} tickets</span>
                        <span>{project.progress ?? 0}% avancement</span>
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-primary" />
                Activité récente
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/consultant-func/tickets')}
              >
                Mes Tickets
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Chargement…</p>
              ) : recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité récente.</p>
              ) : (
                recentActivity.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-border/70 bg-surface-1 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{ticket.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {ticket.wricef}
                        </p>
                      </div>
                      <Badge className={statusColor[ticket.status] ?? ''}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(ticket.updatedAt ?? ticket.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span>{ticket.priority}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Objets sans SFD */}
        {objetsWithoutSFD.length > 0 && (
          <Card className="bg-card/92">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="inline-flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Objets sans SFD
              </CardTitle>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/consultant-func/documents')}
              >
                Gérer les documents
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Nom</th>
                      <th className="px-3 py-2">Module</th>
                      <th className="px-3 py-2">Projet</th>
                    </tr>
                  </thead>
                  <tbody>
                    {objetsWithoutSFD.slice(0, 8).map((obj) => {
                      const proj = projects.find((p) => p.id === obj.projectId);
                      return (
                        <tr
                          key={obj.id}
                          className="border-b border-border/50 hover:bg-accent/30 transition-colors"
                        >
                          <td className="px-3 py-2 font-mono text-xs">{obj.code}</td>
                          <td className="px-3 py-2 font-medium">{obj.name}</td>
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="text-xs">
                              {obj.module ?? '—'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">
                            {proj?.name ?? obj.projectId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {objetsWithoutSFD.length > 8 && (
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  +{objetsWithoutSFD.length - 8} autres objets sans SFD
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
