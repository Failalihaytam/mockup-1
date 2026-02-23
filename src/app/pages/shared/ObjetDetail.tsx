import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ObjetsAPI,
  SFDsAPI,
  TicketsAPI,
  ProjectsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Objet, SFD, Ticket, Project, User, DevType } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, FileText, FolderOpen, Layers, Plus, Pencil, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// ---------------------------------------------------------------------------
// Badge helpers (shared with ticket pages)
// ---------------------------------------------------------------------------

const statusColor: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  WAITING_FEEDBACK: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
};

const priorityColor: Record<string, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const devTypeColor: Record<DevType, string> = {
  Formulaire: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  Report: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  Enhancement: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Programme: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type TabKey = 'tickets' | 'documentation' | 'sfds';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ObjetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [objet, setObjet] = useState<Objet | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sfds, setSfds] = useState<SFD[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('tickets');

  // SFD editing
  const [editingSFD, setEditingSFD] = useState<SFD | null>(null);
  const [sfdContent, setSfdContent] = useState('');
  const [sfdTitle, setSfdTitle] = useState('');
  const [showCreateSFD, setShowCreateSFD] = useState(false);
  const [newSFDTitle, setNewSFDTitle] = useState('');
  const [newSFDContent, setNewSFDContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canEditSFD = currentUser?.role === 'MANAGER' || currentUser?.role === 'CONSULTANT_FONCTIONNEL';

  useEffect(() => {
    if (!id) return;
    void loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [objetData, allTickets, sfdData, userData] = await Promise.all([
        ObjetsAPI.getById(id!),
        TicketsAPI.getAll(),
        SFDsAPI.getByObjet(id!),
        UsersAPI.getAll(),
      ]);
      setObjet(objetData);
      setTickets(allTickets.filter((t) => t.objetId === id));
      setSfds(sfdData);
      setUsers(userData);

      if (objetData) {
        const proj = await ProjectsAPI.getById(objetData.projectId);
        setProject(proj);
      }
    } finally {
      setLoading(false);
    }
  };

  const userName = (uid?: string) => users.find((u) => u.id === uid)?.name ?? '-';

  // SFD actions
  const startEditSFD = (sfd: SFD) => {
    setEditingSFD(sfd);
    setSfdTitle(sfd.title);
    setSfdContent(sfd.content);
  };

  const cancelEditSFD = () => {
    setEditingSFD(null);
    setSfdTitle('');
    setSfdContent('');
  };

  const saveSFD = async () => {
    if (!editingSFD || !currentUser) return;
    try {
      setIsSaving(true);
      const updated = await SFDsAPI.update(editingSFD.id, {
        title: sfdTitle.trim(),
        content: sfdContent,
        version: editingSFD.version + 1,
        updatedBy: currentUser.id,
      });
      setSfds((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      cancelEditSFD();
      toast.success('SFD mise à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const createSFD = async () => {
    if (!currentUser || !objet) return;
    if (!newSFDTitle.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    try {
      setIsSaving(true);
      const created = await SFDsAPI.create({
        objetId: objet.id,
        title: newSFDTitle.trim(),
        content: newSFDContent,
        version: 1,
        createdBy: currentUser.id,
      });
      setSfds((prev) => [...prev, created]);
      setShowCreateSFD(false);
      setNewSFDTitle('');
      setNewSFDContent('');
      toast.success('SFD créée');
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Chargement...
      </div>
    );
  }

  if (!objet) {
    return (
      <div className="min-h-screen bg-background p-6">
        <p className="text-muted-foreground">Objet introuvable.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Retour
        </Button>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'tickets', label: 'Tickets', icon: Layers, count: tickets.length },
    { key: 'documentation', label: 'Documentation', icon: FileText, count: project?.documentation ? 1 : 0 },
    { key: 'sfds', label: 'SFDs', icon: FolderOpen, count: sfds.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={objet.name}
        subtitle={objet.description || `Objet du projet ${project?.name ?? ''}`}
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: project?.name ?? 'Projet', path: '/manager/projects' },
          { label: objet.name },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg border border-border p-0.5 w-fit">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <Button
              key={key}
              size="sm"
              variant={activeTab === key ? 'default' : 'ghost'}
              onClick={() => setActiveTab(key)}
              className="gap-1.5"
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className="ml-0.5 text-xs opacity-70">({count})</span>
            </Button>
          ))}
        </div>

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Tickets liés à cet objet</h3>
            </div>
            {tickets.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Aucun ticket lié.</div>
            ) : (
              <div className="divide-y">
                {tickets.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3 hover:bg-accent/40 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    </div>
                    <Badge className={statusColor[t.status] + ' text-[10px]'}>{t.status.replace('_', ' ')}</Badge>
                    <Badge className={priorityColor[t.priority] + ' text-[10px]'}>{t.priority}</Badge>
                    {t.devType && <Badge className={devTypeColor[t.devType] + ' text-[10px]'}>{t.devType}</Badge>}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{userName(t.assignedTo)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documentation Tab */}
        {activeTab === 'documentation' && (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Documentation Projet</h3>
            {project?.documentation ? (
              <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                {project.documentation}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucune documentation disponible.</p>
            )}
          </div>
        )}

        {/* SFDs Tab */}
        {activeTab === 'sfds' && (
          <div className="space-y-4">
            {canEditSFD && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowCreateSFD(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nouvelle SFD
                </Button>
              </div>
            )}

            {sfds.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                Aucune SFD pour cet objet.
              </div>
            ) : (
              sfds.map((sfd) => (
                <div key={sfd.id} className="rounded-lg border bg-card">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div>
                      {editingSFD?.id === sfd.id ? (
                        <Input
                          value={sfdTitle}
                          onChange={(e) => setSfdTitle(e.target.value)}
                          className="max-w-md"
                        />
                      ) : (
                        <h4 className="text-sm font-semibold">{sfd.title}</h4>
                      )}
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>v{sfd.version}</span>
                        <span>par {userName(sfd.createdBy)}</span>
                        {sfd.updatedBy && <span>· modifié par {userName(sfd.updatedBy)}</span>}
                      </div>
                    </div>
                    {canEditSFD && (
                      editingSFD?.id === sfd.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={cancelEditSFD}><X className="h-3 w-3" /></Button>
                          <Button size="sm" onClick={() => void saveSFD()} disabled={isSaving}>
                            <Save className="h-3 w-3 mr-1" /> {isSaving ? 'Saving...' : 'Sauvegarder'}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEditSFD(sfd)}>
                          <Pencil className="h-3 w-3 mr-1" /> Modifier
                        </Button>
                      )
                    )}
                  </div>
                  <div className="p-4">
                    {editingSFD?.id === sfd.id ? (
                      <Textarea
                        value={sfdContent}
                        onChange={(e) => setSfdContent(e.target.value)}
                        rows={12}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {sfd.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create SFD Dialog */}
      <Dialog open={showCreateSFD} onOpenChange={setShowCreateSFD}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle SFD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={newSFDTitle} onChange={(e) => setNewSFDTitle(e.target.value)} />
            </div>
            <div>
              <Label>Contenu (Markdown)</Label>
              <Textarea
                value={newSFDContent}
                onChange={(e) => setNewSFDContent(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder="## Objectif&#10;&#10;Description ici..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateSFD(false)}>Annuler</Button>
              <Button onClick={() => void createSFD()} disabled={isSaving}>
                {isSaving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
