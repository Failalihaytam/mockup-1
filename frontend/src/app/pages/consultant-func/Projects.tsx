import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ObjetsAPI,
  ProjectsAPI,
  TicketsAPI,
  DocumentationsAPI,
} from '../../services/odataClient';
import { Documentation, Objet, Project, Ticket } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { FolderKanban, ArrowRight, Search } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export const FuncProjects: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, o, t, d] = await Promise.all([
        ProjectsAPI.getAll(),
        ObjetsAPI.getAll(),
        TicketsAPI.getAll(),
        DocumentationsAPI.getAll(),
      ]);
      setProjects(p);
      setObjets(o);
      setTickets(t);
      setDocs(d);
    } finally {
      setLoading(false);
    }
  };

  const statusColor: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    PLANNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    ON_HOLD: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
    CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase();
    return projects
      .filter(
        (p) =>
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
      .map((project) => {
        const projObjets = objets.filter((o) => o.projectId === project.id);
        const projTickets = tickets.filter((t) => t.projectId === project.id);
        const documented = new Set(docs.filter((d) => projObjets.some((o) => o.id === d.objetId)).map((d) => d.objetId));
        const sfdsCount = documented.size;
        const objetsNoSFD = projObjets.length - sfdsCount;
        const openTickets = projTickets.filter(
          (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FEEDBACK'
        ).length;
        return { project, objetsCount: projObjets.length, sfdsCount, objetsNoSFD, openTickets };
      });
  }, [projects, objets, tickets, docs, search]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mes Projets"
        subtitle="Liste des projets et périmètre fonctionnel"
        breadcrumbs={[
          { label: 'Tableau de Bord', path: '/consultant-func/dashboard' },
          { label: 'Mes Projets' },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : rows.length === 0 ? (
          <Card className="bg-card/92">
            <CardContent className="py-12 text-center">
              <FolderKanban className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold text-foreground">Aucun projet trouvé</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Vos projets assignés apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ project, objetsCount, sfdsCount, objetsNoSFD, openTickets }) => (
              <Card
                key={project.id}
                className="bg-card/92 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/consultant-func/projects/${project.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground text-base truncate">
                        {project.name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{project.code}</p>
                    </div>
                    <Badge className={statusColor[project.status] ?? ''}>
                      {project.status}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Avancement</span>
                      <span className="font-semibold text-foreground">
                        {project.progress ?? 0}%
                      </span>
                    </div>
                    <Progress value={project.progress ?? 0} className="h-2" />
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded border border-border p-2 text-center">
                      <div className="text-lg font-semibold text-foreground">{objetsCount}</div>
                      <div className="text-[11px] text-muted-foreground">Objets</div>
                    </div>
                    <div className="rounded border border-border p-2 text-center">
                      <div className="text-lg font-semibold text-foreground">{sfdsCount}</div>
                      <div className="text-[11px] text-muted-foreground">SFDs</div>
                    </div>
                    <div className="rounded border border-border p-2 text-center">
                      <div className={`text-lg font-semibold ${objetsNoSFD > 0 ? 'text-destructive' : 'text-foreground'}`}>
                        {objetsNoSFD}
                      </div>
                      <div className="text-[11px] text-muted-foreground">Sans SFD</div>
                    </div>
                    <div className="rounded border border-border p-2 text-center">
                      <div className="text-lg font-semibold text-primary">{openTickets}</div>
                      <div className="text-[11px] text-muted-foreground">Tickets</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(project.startDate).toLocaleDateString('fr-FR')} –{' '}
                      {new Date(project.endDate).toLocaleDateString('fr-FR')}
                    </span>
                    <Button variant="ghost" size="sm" className="h-auto p-0 text-primary">
                      Voir détail
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
