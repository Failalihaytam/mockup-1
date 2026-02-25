import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ImputationPeriodsAPI, UsersAPI, WorkSessionsAPI, ProjectsAPI, TicketsAPI } from '../../services/odataClient';
import { ImputationPeriod, User, WorkSession, Project, Ticket } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, Clock, XCircle, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const MONTH_NAMES = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const formatHours = (h: number): string => {
  if (h >= 1) return `${h.toFixed(1).replace(/\.0$/, '')}h`;
  return `${Math.round(h * 60)}min`;
};

export const ValidationImputations: React.FC = () => {
  const { currentUser } = useAuth();
  const [periods, setPeriods] = useState<ImputationPeriod[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<ImputationPeriod | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showReject, setShowReject] = useState<ImputationPeriod | null>(null);
  const [userFilter, setUserFilter] = useState<string>('ALL');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, uData, sData, prData, tData] = await Promise.all([
        ImputationPeriodsAPI.getAll(),
        UsersAPI.getAll(),
        WorkSessionsAPI.getAll(),
        ProjectsAPI.getAll(),
        TicketsAPI.getAll(),
      ]);
      setPeriods(pData);
      setUsers(uData);
      setSessions(sData);
      setProjects(prData);
      setTickets(tData);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const ticketTitle = (id: string) => tickets.find((t) => t.id === id)?.title ?? id;

  const consultants = useMemo(
    () => users.filter((u) => ['CONSULTANT_TECHNIQUE', 'CONSULTANT_FONCTIONNEL', 'COORDINATEUR_DEV'].includes(u.role)),
    [users],
  );

  const pendingPeriods = useMemo(() => {
    let p = periods.filter((ip) => ip.status === 'sent' || ip.status === 'pending');
    if (userFilter !== 'ALL') p = p.filter((ip) => ip.userId === userFilter);
    return p;
  }, [periods, userFilter]);

  const processedPeriods = useMemo(() => {
    let p = periods.filter((ip) => ip.status === 'validated' || ip.status === 'rejected');
    if (userFilter !== 'ALL') p = p.filter((ip) => ip.userId === userFilter);
    return p.sort((a, b) => (b.validatedAt ?? '').localeCompare(a.validatedAt ?? ''));
  }, [periods, userFilter]);

  const periodSessions = (p: ImputationPeriod) => {
    const lastDay = new Date(p.year, p.month, 0).getDate();
    const startDay = p.period === 1 ? 1 : 16;
    const endDay = p.period === 1 ? 15 : lastDay;
    const start = `${p.year}-${String(p.month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
    const end = `${p.year}-${String(p.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    return sessions.filter((s) => s.userId === p.userId && s.date >= start && s.date <= end);
  };

  const periodLabel = (p: ImputationPeriod) => {
    const lastDay = new Date(p.year, p.month, 0).getDate();
    const startDay = p.period === 1 ? 1 : 16;
    const endDay = p.period === 1 ? 15 : lastDay;
    return `${startDay}–${endDay} ${MONTH_NAMES[p.month]} ${p.year}`;
  };

  const handleValidate = async (p: ImputationPeriod) => {
    try {
      const updated = await ImputationPeriodsAPI.update(p.id, {
        status: 'validated',
        validatedBy: currentUser?.id,
        validatedAt: new Date().toISOString(),
      });
      setPeriods((prev) => prev.map((ip) => (ip.id === updated.id ? updated : ip)));
      setSelectedPeriod(null);
      toast.success(`Période validée pour ${userName(p.userId)}`);
    } catch {
      toast.error('Erreur lors de la validation');
    }
  };

  const handleReject = async () => {
    if (!showReject) return;
    if (!rejectionReason.trim()) {
      toast.error('Veuillez indiquer le motif du rejet');
      return;
    }
    try {
      const updated = await ImputationPeriodsAPI.update(showReject.id, {
        status: 'rejected',
        validatedBy: currentUser?.id,
        validatedAt: new Date().toISOString(),
        rejectionReason: rejectionReason.trim(),
      });
      setPeriods((prev) => prev.map((ip) => (ip.id === updated.id ? updated : ip)));
      setShowReject(null);
      setRejectionReason('');
      setSelectedPeriod(null);
      toast.success(`Période rejetée pour ${userName(showReject.userId)}`);
    } catch {
      toast.error('Erreur lors du rejet');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Validation des Imputations"
        subtitle="Validez ou rejetez les périodes soumises par les consultants"
        breadcrumbs={[
          { label: 'Dashboard', path: '/chef-projet/dashboard' },
          { label: 'Validation' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tous les consultants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les consultants</SelectItem>
              {consultants.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              À valider ({pendingPeriods.length})
            </TabsTrigger>
            <TabsTrigger value="processed">
              Historique ({processedPeriods.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {loading ? (
              <p className="text-muted-foreground">Chargement...</p>
            ) : pendingPeriods.length === 0 ? (
              <div className="rounded-lg border bg-card p-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="mt-3 text-muted-foreground">Aucune période en attente de validation.</p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="px-4">Consultant</TableHead>
                      <TableHead className="px-4">Période</TableHead>
                      <TableHead className="px-4">Heures</TableHead>
                      <TableHead className="px-4">Sessions</TableHead>
                      <TableHead className="px-4">Envoyé le</TableHead>
                      <TableHead className="px-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingPeriods.map((p) => {
                      const pSessions = periodSessions(p);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="px-4 py-3 text-sm font-medium">{userName(p.userId)}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">{periodLabel(p)}</TableCell>
                          <TableCell className="px-4 py-3 text-sm font-mono">{formatHours(p.totalHours)}</TableCell>
                          <TableCell className="px-4 py-3 text-sm">{pSessions.length}</TableCell>
                          <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                            {p.sentAt ? new Date(p.sentAt).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setSelectedPeriod(p)}>
                                <Eye className="h-3 w-3 mr-1" /> Détail
                              </Button>
                              <Button size="sm" onClick={() => void handleValidate(p)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Valider
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => setShowReject(p)}>
                                <XCircle className="h-3 w-3 mr-1" /> Rejeter
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="processed" className="mt-4">
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Consultant</TableHead>
                    <TableHead className="px-4">Période</TableHead>
                    <TableHead className="px-4">Heures</TableHead>
                    <TableHead className="px-4">Statut</TableHead>
                    <TableHead className="px-4">Date de traitement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedPeriods.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="px-4 py-3 text-sm font-medium">{userName(p.userId)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{periodLabel(p)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-mono">{formatHours(p.totalHours)}</TableCell>
                      <TableCell className="px-4 py-3">
                        {p.status === 'validated' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Validée</Badge>
                        ) : (
                          <Badge variant="destructive">Rejetée</Badge>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {p.validatedAt ? new Date(p.validatedAt).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {processedPeriods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Aucun historique.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedPeriod} onOpenChange={() => setSelectedPeriod(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPeriod && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {userName(selectedPeriod.userId)} — {periodLabel(selectedPeriod)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total:</span>{' '}
                    <span className="font-semibold">{formatHours(selectedPeriod.totalHours)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Envoyé le:</span>{' '}
                    {selectedPeriod.sentAt ? new Date(selectedPeriod.sentAt).toLocaleDateString('fr-FR') : '-'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Statut:</span>{' '}
                    <Badge variant="outline">{selectedPeriod.status}</Badge>
                  </div>
                </div>

                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="px-3">Date</TableHead>
                        <TableHead className="px-3">Projet</TableHead>
                        <TableHead className="px-3">Ticket</TableHead>
                        <TableHead className="px-3">Heures</TableHead>
                        <TableHead className="px-3">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periodSessions(selectedPeriod).map((ws) => (
                        <TableRow key={ws.id}>
                          <TableCell className="px-3 py-2 text-sm">{ws.date}</TableCell>
                          <TableCell className="px-3 py-2 text-sm">{projectName(ws.projectId)}</TableCell>
                          <TableCell className="px-3 py-2 text-sm font-medium">{ticketTitle(ws.ticketId)}</TableCell>
                          <TableCell className="px-3 py-2 text-sm font-mono">{formatHours(ws.hours)}</TableCell>
                          <TableCell className="px-3 py-2 text-sm text-muted-foreground">{ws.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                      {periodSessions(selectedPeriod).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">Aucune session trouvée.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {(selectedPeriod.status === 'sent' || selectedPeriod.status === 'pending') && (
                  <div className="flex gap-2 justify-end">
                    <Button variant="destructive" onClick={() => { setShowReject(selectedPeriod); }}>
                      <XCircle className="h-4 w-4 mr-1" /> Rejeter
                    </Button>
                    <Button onClick={() => void handleValidate(selectedPeriod)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Valider
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!showReject} onOpenChange={() => { setShowReject(null); setRejectionReason(''); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rejeter la période</DialogTitle>
          </DialogHeader>
          {showReject && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vous allez rejeter la période de <strong>{userName(showReject.userId)}</strong> ({periodLabel(showReject)}).
                Le consultant sera notifié et pourra corriger ses imputations.
              </p>
              <div>
                <Textarea
                  placeholder="Motif du rejet *"
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowReject(null); setRejectionReason(''); }}>Annuler</Button>
                <Button variant="destructive" onClick={() => void handleReject()}>Confirmer le rejet</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
