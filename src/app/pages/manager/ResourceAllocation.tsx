import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Bot, Check, ChevronDown, ChevronUp, Loader2, Plus, Sparkles, Trash2, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  AllocationsAPI,
  EvaluationsAPI,
  NotificationsAPI,
  ObjetsAPI,
  ProjectsAPI,
  TicketsAPI,
  UsersAPI,
  WorkSessionsAPI,
} from '../../services/odataClient';
import { Allocation, Evaluation, Objet, Project, Ticket, User, WorkSession } from '../../types/entities';
import { todayLocalDateKey } from '../../utils/date';
import { computeRecommendations, TicketRecommendation } from '../../utils/aiDispatcher';

interface NewAllocationForm {
  userId: string;
  projectId: string;
  allocationPercent: number;
  startDate: string;
  endDate: string;
}

const EMPTY_FORM: NewAllocationForm = {
  userId: '',
  projectId: '',
  allocationPercent: 50,
  startDate: todayLocalDateKey(),
  endDate: todayLocalDateKey(),
};

const rangesOverlap = (startA: string, endA: string, startB: string, endB: string) =>
  !(endA < startB || endB < startA);

export const ResourceAllocation: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<NewAllocationForm>(EMPTY_FORM);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationPendingDelete, setAllocationPendingDelete] = useState<Allocation | null>(null);
  const [allocationDrafts, setAllocationDrafts] = useState<Record<string, string>>({});

  // AI Dispatcher state
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<TicketRecommendation[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, projectData, allocationData, ticketData, sessionData, evalData, objetData] = await Promise.all([
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        AllocationsAPI.getAll(),
        TicketsAPI.getAll(),
        WorkSessionsAPI.getAll(),
        EvaluationsAPI.getAll(),
        ObjetsAPI.getAll(),
      ]);
      setUsers(userData.filter((user) => user.role !== 'ADMIN'));
      setProjects(projectData);
      setAllocations(allocationData);
      setTickets(ticketData);
      setSessions(sessionData);
      setEvaluations(evalData);
      setObjets(objetData);
      setAllocationDrafts({});
    } finally {
      setLoading(false);
    }
  };

  const filteredAllocations = useMemo(() => {
    if (projectFilter === 'ALL') return allocations;
    return allocations.filter((allocation) => allocation.projectId === projectFilter);
  }, [allocations, projectFilter]);

  const userTotalAllocation = useMemo(() => {
    const totals = new Map<string, number>();
    allocations.forEach((allocation) => {
      totals.set(
        allocation.userId,
        (totals.get(allocation.userId) ?? 0) + allocation.allocationPercent
      );
    });
    return totals;
  }, [allocations]);

  const createAllocation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.userId || !form.projectId) {
      toast.error('User and project are required');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (form.allocationPercent < 0 || form.allocationPercent > 100) {
      toast.error('Allocation percent must be between 0 and 100');
      return;
    }

    const duplicatePeriod = allocations.some(
      (allocation) =>
        allocation.userId === form.userId &&
        allocation.projectId === form.projectId &&
        rangesOverlap(form.startDate, form.endDate, allocation.startDate, allocation.endDate)
    );
    if (duplicatePeriod) {
      toast.error('This consultant already has an overlapping allocation for this project');
      return;
    }

    const currentTotal = userTotalAllocation.get(form.userId) ?? 0;
    const nextTotal = currentTotal + form.allocationPercent;
    if (nextTotal > 100) {
      toast.error(`Allocation exceeds 100% for this user (${nextTotal}%)`);
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await AllocationsAPI.create({ ...form });
      setAllocations((prev) => [created, ...prev]);

      const projectName = projects.find((project) => project.id === form.projectId)?.name ?? 'project';
      await NotificationsAPI.create({
        userId: form.userId,
        type: 'ALLOCATION_UPDATED',
        title: 'New Allocation Assigned',
        message: `You have been allocated ${form.allocationPercent}% on ${projectName}.`,
        read: false,
      });

      setForm(EMPTY_FORM);
      toast.success('Allocation created');
    } catch (error) {
      toast.error('Failed to create allocation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePercent = async (allocation: Allocation, nextPercent: number) => {
    if (nextPercent < 0 || nextPercent > 100) {
      toast.error('Allocation percent must be between 0 and 100');
      return;
    }

    const currentTotal = userTotalAllocation.get(allocation.userId) ?? 0;
    const totalWithoutCurrent = currentTotal - allocation.allocationPercent;
    const nextTotal = totalWithoutCurrent + nextPercent;
    if (nextTotal > 100) {
      toast.error(`Allocation exceeds 100% for this user (${nextTotal}%)`);
      return;
    }

    try {
      const updated = await AllocationsAPI.update(allocation.id, {
        allocationPercent: nextPercent,
      });
      setAllocations((prev) => prev.map((entry) => (entry.id === allocation.id ? updated : entry)));
    } catch (error) {
      toast.error('Failed to update allocation');
    }
  };

  const removeAllocation = async (id: string) => {
    try {
      await AllocationsAPI.delete(id);
      setAllocations((prev) => prev.filter((entry) => entry.id !== id));
      toast.success('Allocation removed');
    } catch (error) {
      toast.error('Failed to remove allocation');
    } finally {
      setAllocationPendingDelete(null);
    }
  };

  const resolveUser = (userId: string) => users.find((user) => user.id === userId);
  const resolveProject = (projectId: string) => projects.find((project) => project.id === projectId);

  // ---------------------------------------------------------------------------
  // AI Dispatcher – Deterministic scoring engine
  // ---------------------------------------------------------------------------

  const runAIDispatcher = useCallback(() => {
    setAiLoading(true);
    setAiRecommendations([]);
    // Simulate "thinking" delay for UX
    setTimeout(() => {
      const results = computeRecommendations({
        tickets,
        users,
        projects,
        objets,
        workSessions: sessions,
        evaluations,
      });
      setAiRecommendations(results);
      setAiLoading(false);
      if (results.length === 0) {
        toast.info('Aucun ticket non assigné trouvé.');
      } else {
        toast.success(`${results.length} recommandation${results.length > 1 ? 's' : ''} générée${results.length > 1 ? 's' : ''}.`);
      }
    }, 1500);
  }, [tickets, users, projects, objets, sessions, evaluations]);

  const applyRecommendation = async (ticketId: string, userId: string) => {
    try {
      const updated = await TicketsAPI.update(ticketId, { assignedTo: userId });
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? updated : t)));
      setAiRecommendations((prev) => prev.filter((r) => r.ticket.id !== ticketId));

      const user = users.find((u) => u.id === userId);
      const ticket = tickets.find((t) => t.id === ticketId);
      await NotificationsAPI.create({
        userId,
        type: 'TICKET_ASSIGNED',
        title: 'Nouveau ticket assigné',
        message: `Le ticket «${ticket?.title ?? ticketId}» vous a été assigné par l'AI Dispatcher.`,
        read: false,
      });
      toast.success(`Ticket assigné à ${user?.name ?? userId}`);
    } catch {
      toast.error('Échec de l\'assignation');
    }
  };

  const toggleCardExpand = (ticketId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const confidenceColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 45) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const confidenceBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 70) return 'default';
    if (score >= 45) return 'secondary';
    return 'destructive';
  };

  const priorityColor: Record<string, string> = {
    CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    MEDIUM: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    LOW: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Resource Allocation"
        subtitle="Assign consultants to projects and monitor allocation rates"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Resource Allocation' },
        ]}
      />

      {/* AI Dispatcher Panel */}
      <div className="px-6 pt-6 lg:px-8">
        <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-0">
            <button
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-accent/30 transition"
              onClick={() => setShowAI(!showAI)}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    AI Dispatcher <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Recommandations intelligentes d'assignation de tickets basées sur les compétences, la charge et les évaluations
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {showAI ? 'Masquer' : 'Afficher'}
              </Badge>
            </button>

            {showAI && (
              <div className="border-t px-5 py-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Button
                    onClick={runAIDispatcher}
                    disabled={aiLoading}
                    className="bg-primary"
                  >
                    {aiLoading ? (
                      <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyse en cours...</span>
                    ) : (
                      <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Lancer l'analyse IA</span>
                    )}
                  </Button>
                  {aiRecommendations.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {aiRecommendations.length} recommandation{aiRecommendations.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Recommendation cards */}
                {aiRecommendations.length > 0 && (
                  <div className="space-y-3">
                    {aiRecommendations.map((rec) => {
                      const expanded = expandedCards.has(rec.ticket.id);
                      return (
                        <Card key={rec.ticket.id} className="border border-border/60">
                          <CardContent className="p-4 space-y-3">
                            {/* Ticket header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <Badge className={`${priorityColor[rec.ticket.priority]} text-[10px] font-semibold`}>
                                    {rec.ticket.priority}
                                  </Badge>
                                  {rec.ticket.devType && (
                                    <Badge variant="outline" className="text-[10px]">{rec.ticket.devType}</Badge>
                                  )}
                                  <span className="text-[10px] text-muted-foreground">{rec.projectName}</span>
                                  {rec.objetName && (
                                    <span className="text-[10px] text-muted-foreground">/ {rec.objetName}</span>
                                  )}
                                </div>
                                <h4 className="text-sm font-medium text-foreground truncate">{rec.ticket.title}</h4>
                              </div>
                            </div>

                            {/* Best match */}
                            <div className="rounded-lg border bg-accent/20 p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <UserCheck className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-semibold">{rec.bestMatch.userName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={confidenceBadgeVariant(rec.bestMatch.confidenceScore)} className="text-xs">
                                    {rec.bestMatch.confidenceScore}%
                                  </Badge>
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => void applyRecommendation(rec.ticket.id, rec.bestMatch.userId)}
                                  >
                                    <Check className="h-3 w-3 mr-1" /> Assigner
                                  </Button>
                                </div>
                              </div>

                              {/* Confidence bar */}
                              <div className="flex items-center gap-2">
                                <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${confidenceColor(rec.bestMatch.confidenceScore)}`}
                                    style={{ width: `${rec.bestMatch.confidenceScore}%` }}
                                  />
                                </div>
                              </div>

                              {/* Reasoning */}
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {rec.bestMatch.reasoning}
                              </p>

                              {/* Criterion breakdown */}
                              <div className="grid grid-cols-5 gap-2 text-[10px]">
                                <div>
                                  <p className="text-muted-foreground">DevType</p>
                                  <Progress value={rec.bestMatch.detail.devTypeExp * 100} className="h-1 mt-0.5" />
                                  <p className="font-medium">{Math.round(rec.bestMatch.detail.devTypeExp * 100)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Skills</p>
                                  <Progress value={rec.bestMatch.detail.skillMatch * 100} className="h-1 mt-0.5" />
                                  <p className="font-medium">{Math.round(rec.bestMatch.detail.skillMatch * 100)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Dispo</p>
                                  <Progress value={rec.bestMatch.detail.availability * 100} className="h-1 mt-0.5" />
                                  <p className="font-medium">{Math.round(rec.bestMatch.detail.availability * 100)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Charge</p>
                                  <Progress value={rec.bestMatch.detail.workload * 100} className="h-1 mt-0.5" />
                                  <p className="font-medium">{Math.round(rec.bestMatch.detail.workload * 100)}%</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Éval</p>
                                  <Progress value={rec.bestMatch.detail.evaluation * 100} className="h-1 mt-0.5" />
                                  <p className="font-medium">{Math.round(rec.bestMatch.detail.evaluation * 100)}%</p>
                                </div>
                              </div>
                            </div>

                            {/* Alternatives toggle */}
                            {rec.alternatives.length > 0 && (
                              <div>
                                <button
                                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition"
                                  onClick={() => toggleCardExpand(rec.ticket.id)}
                                >
                                  {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  {expanded ? 'Masquer' : 'Voir'} les alternatives ({rec.alternatives.length})
                                </button>

                                {expanded && (
                                  <div className="mt-2 space-y-2">
                                    {rec.alternatives.map((alt) => (
                                      <div key={alt.userId} className="rounded-lg border bg-card p-3 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">{alt.userName}</span>
                                            <Badge variant={confidenceBadgeVariant(alt.confidenceScore)} className="text-[10px]">
                                              {alt.confidenceScore}%
                                            </Badge>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alt.reasoning}</p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-7 text-xs shrink-0"
                                          onClick={() => void applyRecommendation(rec.ticket.id, alt.userId)}
                                        >
                                          Assigner
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 xl:grid-cols-3 lg:p-8">
        <Card className="h-fit bg-card/92">
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">New Allocation</h3>
            <form onSubmit={createAllocation} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="allocation-user">Consultant</Label>
                <Select
                  value={form.userId}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, userId: val }))}
                >
                  <SelectTrigger id="allocation-user">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allocation-project">Project</Label>
                <Select
                  value={form.projectId}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, projectId: val }))}
                >
                  <SelectTrigger id="allocation-project">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="allocation-percent">Allocation %</Label>
                <Input
                  id="allocation-percent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.allocationPercent}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, allocationPercent: Number(event.target.value || 0) }))
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="allocation-start">Start</Label>
                  <Input
                    id="allocation-start"
                    type="date"
                    value={form.startDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="allocation-end">End</Label>
                  <Input
                    id="allocation-end"
                    type="date"
                    value={form.endDate}
                    onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                <Plus className="h-4 w-4" />
                {isSubmitting ? 'Saving...' : 'Add Allocation'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-card/92 xl:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between gap-3 border-b border-border p-4">
              <h3 className="text-lg font-semibold text-foreground">Allocation Matrix</h3>
              <div className="space-y-1">
                <Label htmlFor="allocation-project-filter" className="sr-only">
                  Filter by project
                </Label>
                <Select
                  value={projectFilter}
                  onValueChange={(val) => setProjectFilter(val)}
                >
                  <SelectTrigger id="allocation-project-filter" className="w-[180px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Projects</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/65">
                <TableRow>
                  <TableHead className="px-4">Consultant</TableHead>
                  <TableHead className="px-4">Project</TableHead>
                  <TableHead className="px-4">Allocation</TableHead>
                  <TableHead className="px-4">Total/User</TableHead>
                  <TableHead className="px-4">Period</TableHead>
                  <TableHead className="px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Loading allocations...
                    </TableCell>
                  </TableRow>
                ) : filteredAllocations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No allocations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAllocations.map((allocation) => {
                    const user = resolveUser(allocation.userId);
                    const project = resolveProject(allocation.projectId);
                    const total = userTotalAllocation.get(allocation.userId) ?? 0;

                    return (
                      <TableRow key={allocation.id} className="hover:bg-accent/40">
                        <TableCell className="px-4 py-3 font-medium">{user?.name ?? '-'}</TableCell>
                        <TableCell className="px-4 py-3">{project?.name ?? '-'}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              allocationDrafts[allocation.id] ??
                              String(allocation.allocationPercent)
                            }
                            className="h-8 w-20"
                            onChange={(event) =>
                              setAllocationDrafts((prev) => ({
                                ...prev,
                                [allocation.id]: event.target.value,
                              }))
                            }
                            onBlur={() => {
                              const raw = allocationDrafts[allocation.id];
                              const next = Number(
                                raw !== undefined ? raw : allocation.allocationPercent
                              );
                              setAllocationDrafts((prev) => {
                                const copy = { ...prev };
                                delete copy[allocation.id];
                                return copy;
                              });
                              if (Number.isFinite(next)) {
                                void updatePercent(allocation, next);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                (event.target as HTMLInputElement).blur();
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className={`px-4 py-3 font-medium ${
                            total > 100 ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {total}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {allocation.startDate} to {allocation.endDate}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAllocationPendingDelete(allocation)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Remove</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={allocationPendingDelete !== null}
        onOpenChange={(open) => !open && setAllocationPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove allocation</AlertDialogTitle>
            <AlertDialogDescription>
              {allocationPendingDelete
                ? 'This allocation entry will be removed from the mock data.'
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => allocationPendingDelete && void removeAllocation(allocationPendingDelete.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
