import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { ObjetsAPI, ProjectsAPI, TicketsAPI, DocumentationsAPI } from '../../services/odataClient';
import { Objet, Project, Ticket, Documentation, DevType } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  FolderOpen,
  Layers,
  Plus,
  Search,
  Ticket as TicketIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

const devTypeColor: Record<DevType, string> = {
  Formulaire: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  Report: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  Enhancement: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Programme: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ObjetsListPageProps {
  basePath: string; // e.g. '/manager', '/consultant-tech', '/consultant-func'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ObjetsListPage: React.FC<ObjetsListPageProps> = ({ basePath }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [objets, setObjets] = useState<Objet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProjectId, setNewProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [objetData, projectData, ticketData, docData] = await Promise.all([
        ObjetsAPI.getAll(),
        ProjectsAPI.getAll(),
        TicketsAPI.getAll(),
        DocumentationsAPI.getAll(),
      ]);
      setObjets(objetData);
      setProjects(projectData);
      setTickets(ticketData);
      setDocs(docData);
    } finally {
      setLoading(false);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  // Stats per objet
  const objetStats = useMemo(() => {
    const map: Record<string, { ticketCount: number; openTickets: number; docCount: number; devTypes: Set<string> }> = {};
    objets.forEach((o) => {
      map[o.id] = { ticketCount: 0, openTickets: 0, docCount: 0, devTypes: new Set() };
    });
    tickets.forEach((t) => {
      if (t.objetId && map[t.objetId]) {
        map[t.objetId].ticketCount++;
        if (t.status !== 'CLOSED' && t.status !== 'RESOLVED') {
          map[t.objetId].openTickets++;
        }
        if (t.devType) map[t.objetId].devTypes.add(t.devType);
      }
    });
    docs.forEach((d) => {
      if (map[d.objetId]) map[d.objetId].docCount++;
    });
    return map;
  }, [objets, tickets, docs]);

  const filteredObjets = useMemo(() => {
    return objets.filter((o) => {
      if (projectFilter !== 'ALL' && o.projectId !== projectFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          o.name.toLowerCase().includes(q) ||
          (o.description ?? '').toLowerCase().includes(q) ||
          projectName(o.projectId).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [objets, projectFilter, searchQuery, projects]);

  // Unique projects from objets
  const objetProjects = useMemo(() => {
    const ids = [...new Set(objets.map((o) => o.projectId))];
    return ids.map((id) => ({ id, name: projectName(id) }));
  }, [objets, projects]);

  const canCreate =
    currentUser?.role === 'MANAGER' || currentUser?.role === 'CONSULTANT_FONCTIONNEL';

  const createObjet = async () => {
    if (!newProjectId || !newName.trim()) {
      toast.error('Project and name are required');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await ObjetsAPI.create({
        projectId: newProjectId,
        name: newName.trim(),
        description: newDesc.trim() || undefined,
      });
      setObjets((prev) => [...prev, created]);
      setNewName('');
      setNewDesc('');
      setNewProjectId('');
      setShowCreate(false);
      toast.success('Objet created');
    } catch {
      toast.error('Failed to create objet');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Objets"
        subtitle="Browse functional objects grouped by project"
        breadcrumbs={[
          { label: 'Home', path: `${basePath}/dashboard` },
          { label: 'Objets' },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search objets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-8"
            />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {objetProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          {canCreate && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-1 h-4 w-4" /> New Objet
            </Button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Layers className="h-4 w-4" /> Total Objets
            </div>
            <p className="text-2xl font-bold">{objets.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TicketIcon className="h-4 w-4" /> Tickets associés
            </div>
            <p className="text-2xl font-bold">
              {tickets.filter((t) => t.objetId).length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FileText className="h-4 w-4" /> Documentations
            </div>
            <p className="text-2xl font-bold">{docs.length}</p>
          </div>
        </div>

        {/* Objet grid */}
        {loading ? (
          <p className="text-muted-foreground">Loading objets...</p>
        ) : filteredObjets.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">No objets found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredObjets.map((objet) => {
              const stats = objetStats[objet.id] ?? { ticketCount: 0, openTickets: 0, docCount: 0, devTypes: new Set() };
              return (
                <Card
                  key={objet.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/40 hover:border-l-primary"
                  onClick={() => void navigate(`${basePath}/objets/${objet.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <FolderOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-foreground truncate">{objet.name}</h3>
                          <p className="text-xs text-muted-foreground">{projectName(objet.projectId)}</p>
                        </div>
                      </div>
                    </div>

                    {objet.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{objet.description}</p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <TicketIcon className="h-3 w-3" />
                        {stats.ticketCount} ticket{stats.ticketCount !== 1 ? 's' : ''}
                      </span>
                      {stats.openTickets > 0 && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          {stats.openTickets} open
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {stats.docCount} doc{stats.docCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Dev types */}
                    {stats.devTypes.size > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {[...stats.devTypes].map((dt) => (
                          <Badge key={dt} className={`${devTypeColor[dt as DevType]} text-[10px]`}>{dt}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 text-[10px] text-muted-foreground">
                      Created {new Date(objet.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Objet Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Objet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Project *</Label>
              <Select value={newProjectId} onValueChange={setNewProjectId}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Object name" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button onClick={() => void createObjet()} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
