import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  Clock,
  FileText,
  XCircle,
  Plus,
  Search,
  Eye,
  History,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import {
  DeliverablesAPI,
  DocumentationsAPI,
  NotificationsAPI,
  ObjetsAPI,
  ProjectsAPI,
} from '../../services/odataClient';
import { Deliverable, Documentation, Objet, Project, ValidationStatus } from '../../types/entities';

type TabKey = 'sfds' | 'documents';

// ---------------------------------------------------------------------------
// Status badge helper
// ---------------------------------------------------------------------------

const getStatusBadge = (status: ValidationStatus) => {
  switch (status) {
    case 'APPROVED':
      return { tone: 'bg-primary/12 text-primary', icon: CheckCircle };
    case 'CHANGES_REQUESTED':
      return { tone: 'bg-destructive/12 text-destructive', icon: XCircle };
    case 'PENDING':
      return { tone: 'bg-muted text-muted-foreground', icon: Clock };
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DocumentsSFDs: React.FC = () => {
  const { currentUser } = useAuth();

  // Data
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<TabKey>('sfds');

  // Filters
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState<string>('all');

  // SFD create dialog
  const [showCreateSFD, setShowCreateSFD] = useState(false);
  const [sfdObjetId, setSfdObjetId] = useState('');
  const [sfdTitle, setSfdTitle] = useState('');
  const [sfdContent, setSfdContent] = useState('');
  const [isCreatingSFD, setIsCreatingSFD] = useState(false);

  // Document create dialog
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [docProjectId, setDocProjectId] = useState('');
  const [docType, setDocType] = useState('Functional Specification');
  const [docName, setDocName] = useState('');
  const [docFileRef, setDocFileRef] = useState('');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // SFD preview
  const [previewDoc, setPreviewDoc] = useState<Documentation | null>(null);

  // Version history
  const [versionDoc, setVersionDoc] = useState<Documentation | null>(null);

  // Review dialog
  const [reviewDeliverable, setReviewDeliverable] = useState<Deliverable | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [docData, delData, projData, objData] = await Promise.all([
        DocumentationsAPI.getAll(),
        DeliverablesAPI.getAll(),
        ProjectsAPI.getAll(),
        ObjetsAPI.getAll(),
      ]);
      setDocs(docData);
      setDeliverables(delData);
      setProjects(projData);
      setObjets(objData);
    } finally {
      setLoading(false);
    }
  };

  // Filtered SFDs
  const filteredSFDs = useMemo(() => {
    const q = search.toLowerCase();
    return docs.filter((d) => {
      const obj = objets.find((o) => o.id === d.objetId);
      const matchSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        (obj?.name.toLowerCase().includes(q) ?? false) ||
        (obj?.code.toLowerCase().includes(q) ?? false);
      const matchProject =
        filterProject === 'all' || (obj && obj.projectId === filterProject);
      return matchSearch && matchProject;
    });
  }, [docs, objets, search, filterProject]);

  // Filtered Deliverables
  const filteredDeliverables = useMemo(() => {
    const q = search.toLowerCase();
    return deliverables.filter((d) => {
      const matchSearch =
        !q || d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
      const matchProject = filterProject === 'all' || d.projectId === filterProject;
      return matchSearch && matchProject;
    });
  }, [deliverables, search, filterProject]);

  // Create SFD
  const handleCreateSFD = async () => {
    if (!currentUser) return;
    if (!sfdObjetId || !sfdTitle.trim() || !sfdContent.trim()) {
      toast.error('Objet, titre et contenu sont requis');
      return;
    }
    setIsCreatingSFD(true);
    try {
      const created = await DocumentationsAPI.create({
        objetId: sfdObjetId,
        title: sfdTitle.trim(),
        content: sfdContent.trim(),
        version: 1,
        createdBy: currentUser.id,
      });
      setDocs((prev) => [created, ...prev]);
      setShowCreateSFD(false);
      setSfdObjetId('');
      setSfdTitle('');
      setSfdContent('');
      toast.success('SFD créé avec succès');
    } catch {
      toast.error('Erreur lors de la création');
    } finally {
      setIsCreatingSFD(false);
    }
  };

  // Create Document (deliverable)
  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !docProjectId || !docName.trim()) {
      toast.error('Projet et nom sont requis');
      return;
    }
    setIsCreatingDoc(true);
    try {
      const created = await DeliverablesAPI.create({
        projectId: docProjectId,
        type: docType.trim(),
        name: docName.trim(),
        fileRef: docFileRef.trim() || undefined,
        validationStatus: 'PENDING',
        functionalComment: '',
      });
      setDeliverables((prev) => [created, ...prev]);

      const project = projects.find((p) => p.id === docProjectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_SUBMITTED',
          title: 'Nouvelle Spécification Fonctionnelle',
          message: `${currentUser.name} a soumis "${created.name}" pour validation.`,
          read: false,
        });
      }

      setShowCreateDoc(false);
      setDocProjectId('');
      setDocType('Functional Specification');
      setDocName('');
      setDocFileRef('');
      toast.success('Document soumis pour validation');
    } catch {
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Review deliverable
  const handleReview = async (status: ValidationStatus) => {
    if (!reviewDeliverable) return;
    setIsReviewing(true);
    try {
      const updated = await DeliverablesAPI.update(reviewDeliverable.id, {
        validationStatus: status,
        functionalComment: reviewComment,
      });
      setDeliverables((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

      const project = projects.find((p) => p.id === updated.projectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_REVIEWED',
          title: 'Document Révisé',
          message: `"${updated.name}" → ${status}.`,
          read: false,
        });
      }

      toast.success('Statut mis à jour');
      setReviewDeliverable(null);
      setReviewComment('');
    } catch {
      toast.error('Échec de la mise à jour');
    } finally {
      setIsReviewing(false);
    }
  };

  // Version bump
  const handleNewVersion = async (doc: Documentation) => {
    if (!currentUser) return;
    try {
      const updated = await DocumentationsAPI.update(doc.id, {
        version: doc.version + 1,
        updatedBy: currentUser.id,
      });
      setDocs((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      toast.success(`Version mise à jour → v${updated.version}`);
      setVersionDoc(null);
    } catch {
      toast.error('Erreur');
    }
  };

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'sfds', label: 'SFDs (Spécifications)' },
    { key: 'documents', label: 'Documents & Livrables' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Documents & SFDs"
        subtitle="Spécifications fonctionnelles détaillées et livrables projet"
        breadcrumbs={[
          { label: 'Tableau de Bord', path: '/consultant-func/dashboard' },
          { label: 'Documents & SFDs' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded border px-4 py-2 text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-accent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() =>
              activeTab === 'sfds' ? setShowCreateSFD(true) : setShowCreateDoc(true)
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            {activeTab === 'sfds' ? 'Nouveau SFD' : 'Nouveau Document'}
          </Button>
        </div>

        {/* SFDs Tab */}
        {activeTab === 'sfds' && (
          loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : filteredSFDs.length === 0 ? (
            <Card className="bg-card/92">
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">Aucun SFD trouvé</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Créez un SFD pour commencer la documentation fonctionnelle.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredSFDs.map((doc) => {
                const obj = objets.find((o) => o.id === doc.objetId);
                const proj = obj ? projects.find((p) => p.id === obj.projectId) : null;
                return (
                  <Card key={doc.id} className="bg-card/92">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <Badge variant="outline" className="text-xs">
                          v{doc.version}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{doc.title}</p>
                        {obj && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {obj.code} — {obj.name}
                          </p>
                        )}
                        {proj && (
                          <p className="text-xs text-muted-foreground">
                            Projet: {proj.name}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {doc.content.replace(/[#*\-|]/g, '').slice(0, 120)}…
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{new Date(doc.updatedAt ?? doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          onClick={() => setPreviewDoc(doc)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Aperçu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setVersionDoc(doc)}
                        >
                          <History className="mr-1 h-3.5 w-3.5" />
                          Version
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          loading ? (
            <p className="text-muted-foreground">Chargement…</p>
          ) : filteredDeliverables.length === 0 ? (
            <Card className="bg-card/92">
              <CardContent className="py-12 text-center">
                <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-semibold">Aucun document</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Soumettez un document pour validation.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDeliverables.map((del) => {
                const badge = getStatusBadge(del.validationStatus);
                const StatusIcon = badge.icon;
                const projName = projects.find((p) => p.id === del.projectId)?.name ?? del.projectId;
                return (
                  <Card key={del.id} className="bg-card/92">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <Badge className={badge.tone}>
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {del.validationStatus}
                        </Badge>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{del.name}</p>
                        <p className="text-xs text-muted-foreground">{del.type}</p>
                        <p className="text-xs text-muted-foreground">Projet: {projName}</p>
                      </div>
                      {del.functionalComment && (
                        <p className="rounded bg-surface-2 p-2 text-xs text-muted-foreground">
                          {del.functionalComment}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Créé: {new Date(del.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                      {del.validationStatus === 'PENDING' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setReviewDeliverable(del);
                            setReviewComment(del.functionalComment ?? '');
                          }}
                        >
                          Réviser
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Create SFD Dialog */}
      <Dialog open={showCreateSFD} onOpenChange={setShowCreateSFD}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouveau SFD</DialogTitle>
            <DialogDescription>
              Créer une spécification fonctionnelle détaillée pour un objet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Objet</Label>
              <Select value={sfdObjetId} onValueChange={setSfdObjetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un objet" />
                </SelectTrigger>
                <SelectContent>
                  {objets.map((o) => {
                    const proj = projects.find((p) => p.id === o.projectId);
                    return (
                      <SelectItem key={o.id} value={o.id}>
                        {o.code} — {o.name} ({proj?.name ?? o.projectId})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Titre</Label>
              <Input
                value={sfdTitle}
                onChange={(e) => setSfdTitle(e.target.value)}
                placeholder="SFD – Migration données client KNA1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contenu (Markdown)</Label>
              <Textarea
                value={sfdContent}
                onChange={(e) => setSfdContent(e.target.value)}
                rows={8}
                placeholder="## Objectif&#10;&#10;Décrire le périmètre fonctionnel…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSFD(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateSFD} disabled={isCreatingSFD}>
              {isCreatingSFD ? 'Création…' : 'Créer SFD'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDoc} onOpenChange={setShowCreateDoc}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau Document</DialogTitle>
            <DialogDescription>
              Soumettre un livrable pour validation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDoc} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Projet</Label>
              <Select value={docProjectId} onValueChange={setDocProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Input value={docType} onChange={(e) => setDocType(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Nom du document</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Spécification fonctionnelle v1"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Référence fichier (optionnel)</Label>
              <Input
                value={docFileRef}
                onChange={(e) => setDocFileRef(e.target.value)}
                placeholder="Lien SharePoint ou code fichier"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setShowCreateDoc(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isCreatingDoc}>
                {isCreatingDoc ? 'Soumission…' : 'Soumettre'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SFD Preview Dialog */}
      <Dialog open={previewDoc !== null} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.title}</DialogTitle>
            <DialogDescription>
              Version {previewDoc?.version} — Dernière mise à jour:{' '}
              {previewDoc && new Date(previewDoc.updatedAt ?? previewDoc.createdAt).toLocaleDateString('fr-FR')}
            </DialogDescription>
          </DialogHeader>
          {previewDoc && (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
              {previewDoc.content}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={versionDoc !== null} onOpenChange={(open) => !open && setVersionDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Historique des versions</DialogTitle>
            <DialogDescription>{versionDoc?.title}</DialogDescription>
          </DialogHeader>
          {versionDoc && (
            <div className="space-y-3">
              <div className="rounded border border-border p-3 space-y-1">
                <p className="text-sm font-medium">Version actuelle: v{versionDoc.version}</p>
                <p className="text-xs text-muted-foreground">
                  Créé: {new Date(versionDoc.createdAt).toLocaleDateString('fr-FR')}
                </p>
                {versionDoc.updatedAt && (
                  <p className="text-xs text-muted-foreground">
                    Modifié: {new Date(versionDoc.updatedAt).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
              <Button className="w-full" onClick={() => handleNewVersion(versionDoc)}>
                <Plus className="mr-1 h-4 w-4" />
                Créer version v{versionDoc.version + 1}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Deliverable Dialog */}
      <Dialog
        open={reviewDeliverable !== null}
        onOpenChange={(open) => {
          if (!open) {
            setReviewDeliverable(null);
            setReviewComment('');
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Réviser le document</DialogTitle>
            <DialogDescription>
              Valider ou demander des modifications.
            </DialogDescription>
          </DialogHeader>
          {reviewDeliverable && (
            <div className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input value={reviewDeliverable.name} disabled />
              </div>
              <div>
                <Label>Type</Label>
                <Input value={reviewDeliverable.type} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>Commentaire fonctionnel</Label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Ajoutez vos commentaires…"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDeliverable(null)}>
              Annuler
            </Button>
            <Button disabled={isReviewing} onClick={() => handleReview('APPROVED')}>
              <CheckCircle className="h-4 w-4" />
              {isReviewing ? 'Enregistrement…' : 'Approuver'}
            </Button>
            <Button
              variant="destructive"
              disabled={isReviewing}
              onClick={() => handleReview('CHANGES_REQUESTED')}
            >
              <XCircle className="h-4 w-4" />
              {isReviewing ? 'Enregistrement…' : 'Demander modifications'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
