import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ObjetsAPI,
  DocumentationsAPI,
  TicketsAPI,
  ProjectsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Objet, Documentation, Ticket, Project, User, DevType } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, FileText, Layers, Plus, Pencil, Save, X } from 'lucide-react';
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

type TabKey = 'tickets' | 'documentation';

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
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('tickets');

  // Documentation editing
  const [editingDoc, setEditingDoc] = useState<Documentation | null>(null);
  const [docContent, setDocContent] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canEditDoc = currentUser?.role === 'MANAGER' || currentUser?.role === 'CONSULTANT_FONCTIONNEL';

  useEffect(() => {
    if (!id) return;
    void loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [objetData, allTickets, docData, userData] = await Promise.all([
        ObjetsAPI.getById(id!),
        TicketsAPI.getAll(),
        DocumentationsAPI.getByObjet(id!),
        UsersAPI.getAll(),
      ]);
      setObjet(objetData);
      setTickets(allTickets.filter((t) => t.objetId === id));
      setDocs(docData);
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

  // Documentation actions
  const startEditDoc = (doc: Documentation) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocContent(doc.content);
  };

  const cancelEditDoc = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocContent('');
  };

  const saveDoc = async () => {
    if (!editingDoc || !currentUser) return;
    try {
      setIsSaving(true);
      const updated = await DocumentationsAPI.update(editingDoc.id, {
        title: docTitle.trim(),
        content: docContent,
        version: editingDoc.version + 1,
        updatedBy: currentUser.id,
      });
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      cancelEditDoc();
      toast.success('Documentation mise à jour');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const createDoc = async () => {
    if (!currentUser || !objet) return;
    if (!newDocTitle.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    try {
      setIsSaving(true);
      const created = await DocumentationsAPI.create({
        objetId: objet.id,
        title: newDocTitle.trim(),
        content: newDocContent,
        version: 1,
        createdBy: currentUser.id,
      });
      setDocs((prev) => [...prev, created]);
      setShowCreateDoc(false);
      setNewDocTitle('');
      setNewDocContent('');
      toast.success('Documentation créée');
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
    { key: 'documentation', label: 'Documentation', icon: FileText, count: docs.length },
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
          <div className="space-y-4">
            {canEditDoc && (
              <div className="flex justify-end">
                <Button size="sm" onClick={() => setShowCreateDoc(true)}>
                  <Plus className="h-4 w-4 mr-1" /> Nouvelle Documentation
                </Button>
              </div>
            )}

            {docs.length === 0 ? (
              <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                Aucune documentation pour cet objet.
              </div>
            ) : (
              docs.map((doc) => (
                <div key={doc.id} className="rounded-lg border bg-card">
                  <div className="px-4 py-3 border-b flex items-center justify-between">
                    <div>
                      {editingDoc?.id === doc.id ? (
                        <Input
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="max-w-md"
                        />
                      ) : (
                        <h4 className="text-sm font-semibold">{doc.title}</h4>
                      )}
                      <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>v{doc.version}</span>
                        <span>par {userName(doc.createdBy)}</span>
                        {doc.updatedBy && <span>· modifié par {userName(doc.updatedBy)}</span>}
                      </div>
                    </div>
                    {canEditDoc && (
                      editingDoc?.id === doc.id ? (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={cancelEditDoc}><X className="h-3 w-3" /></Button>
                          <Button size="sm" onClick={() => void saveDoc()} disabled={isSaving}>
                            <Save className="h-3 w-3 mr-1" /> {isSaving ? 'Saving...' : 'Sauvegarder'}
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEditDoc(doc)}>
                          <Pencil className="h-3 w-3 mr-1" /> Modifier
                        </Button>
                      )
                    )}
                  </div>
                  <div className="p-4">
                    {editingDoc?.id === doc.id ? (
                      <Textarea
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        rows={12}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {doc.content}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Documentation Dialog */}
      <Dialog open={showCreateDoc} onOpenChange={setShowCreateDoc}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle Documentation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Titre *</Label>
              <Input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} />
            </div>
            <div>
              <Label>Contenu (Markdown)</Label>
              <Textarea
                value={newDocContent}
                onChange={(e) => setNewDocContent(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder="## Objectif&#10;&#10;Description ici..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDoc(false)}>Annuler</Button>
              <Button onClick={() => void createDoc()} disabled={isSaving}>
                {isSaving ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
