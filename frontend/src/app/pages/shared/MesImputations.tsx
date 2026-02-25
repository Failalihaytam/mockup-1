import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ImputationPeriodsAPI,
  ObjetsAPI,
  ProjectsAPI,
  TicketsAPI,
  WorkSessionsAPI,
} from '../../services/odataClient';
import { ImputationPeriod, Objet, Project, Ticket, WorkSession } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  History,
  List,
  Lock,
  Send,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatHours = (h: number): string => {
  if (h >= 1) return `${h.toFixed(1).replace(/\.0$/, '')}h`;
  return `${Math.round(h * 60)}min`;
};

const MONTH_NAMES = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

interface PeriodInfo {
  year: number;
  month: number;
  period: 1 | 2;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  label: string;
  daysRemaining: number;
}

function getCurrentPeriod(): PeriodInfo {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const lastDay = new Date(year, month, 0).getDate();

  if (day <= 15) {
    const end = new Date(year, month - 1, 15);
    const diff = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
    return {
      year,
      month,
      period: 1,
      startDate: `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: `${year}-${String(month).padStart(2, '0')}-15`,
      label: `1–15 ${MONTH_NAMES[month]} ${year}`,
      daysRemaining: diff,
    };
  } else {
    const end = new Date(year, month - 1, lastDay);
    const diff = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000));
    return {
      year,
      month,
      period: 2,
      startDate: `${year}-${String(month).padStart(2, '0')}-16`,
      endDate: `${year}-${String(month).padStart(2, '0')}-${lastDay}`,
      label: `16–${lastDay} ${MONTH_NAMES[month]} ${year}`,
      daysRemaining: diff,
    };
  }
}

function getPastPeriods(count: number): PeriodInfo[] {
  const periods: PeriodInfo[] = [];
  const cur = getCurrentPeriod();
  let y = cur.year;
  let m = cur.month;
  let p = cur.period;
  // go backwards
  for (let i = 0; i < count; i++) {
    p = p === 1 ? 2 : 1;
    if (p === 2) {
      m--;
      if (m < 1) { m = 12; y--; }
    }
    const lastDay = new Date(y, m, 0).getDate();
    const startDay = p === 1 ? 1 : 16;
    const endDay = p === 1 ? 15 : lastDay;
    periods.push({
      year: y,
      month: m,
      period: p as 1 | 2,
      startDate: `${y}-${String(m).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      endDate: `${y}-${String(m).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
      label: `${startDay}–${endDay} ${MONTH_NAMES[m]} ${y}`,
      daysRemaining: 0,
    });
  }
  return periods;
}

interface Props {
  basePath: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MesImputations: React.FC<Props> = ({ basePath }) => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [imputationPeriods, setImputationPeriods] = useState<ImputationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const currentPeriod = useMemo(() => getCurrentPeriod(), []);
  const pastPeriods = useMemo(() => getPastPeriods(6), []);

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sessionData, projectData, ticketData, objetData, ipData] = await Promise.all([
        WorkSessionsAPI.getByConsultant(currentUser!.id),
        ProjectsAPI.getAll(),
        TicketsAPI.getAll(),
        ObjetsAPI.getAll(),
        ImputationPeriodsAPI.getByUser(currentUser!.id),
      ]);
      setSessions(sessionData.sort((a, b) => b.date.localeCompare(a.date)));
      setProjects(projectData);
      setTickets(ticketData);
      setObjets(objetData);
      setImputationPeriods(ipData);
    } finally {
      setLoading(false);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const ticketTitle = (id: string) => tickets.find((t) => t.id === id)?.title ?? id;
  const ticketDevType = (id: string) => tickets.find((t) => t.id === id)?.devType ?? '-';
  const ticketObjet = (ticketId: string) => {
    const t = tickets.find((tk) => tk.id === ticketId);
    if (!t?.objetId) return '-';
    return objets.find((o) => o.id === t.objetId)?.name ?? '-';
  };

  // Sessions in current period
  const currentSessions = useMemo(() => {
    return sessions.filter(
      (s) => s.date >= currentPeriod.startDate && s.date <= currentPeriod.endDate,
    );
  }, [sessions, currentPeriod]);

  const unssentCurrentSessions = useMemo(
    () => currentSessions.filter((s) => !s.sentToStraTIME),
    [currentSessions],
  );

  const currentPeriodTotal = useMemo(
    () => currentSessions.reduce((s, ws) => s + ws.hours, 0),
    [currentSessions],
  );

  // Check if this period was already sent
  const currentPeriodRecord = useMemo(
    () =>
      imputationPeriods.find(
        (ip) =>
          ip.year === currentPeriod.year &&
          ip.month === currentPeriod.month &&
          ip.period === currentPeriod.period,
      ),
    [imputationPeriods, currentPeriod],
  );

  const periodIsSent = currentPeriodRecord && currentPeriodRecord.status !== 'draft';
  const periodIsRejected = currentPeriodRecord?.status === 'rejected';

  // Group current sessions by project then ticket
  const groupedSessions = useMemo(() => {
    const groups: Record<string, { projectId: string; tickets: Record<string, WorkSession[]> }> = {};
    currentSessions.forEach((s) => {
      if (!groups[s.projectId]) groups[s.projectId] = { projectId: s.projectId, tickets: {} };
      if (!groups[s.projectId].tickets[s.ticketId]) groups[s.projectId].tickets[s.ticketId] = [];
      groups[s.projectId].tickets[s.ticketId].push(s);
    });
    return groups;
  }, [currentSessions]);

  const handleSendPeriod = async () => {
    setShowConfirm(false);
    setSending(true);
    try {
      const ids = unssentCurrentSessions.map((s) => s.id);
      if (ids.length > 0) {
        const updated = await WorkSessionsAPI.sendBatchToStraTIME(ids);
        setSessions((prev) =>
          prev.map((s) => {
            const u = updated.find((ws) => ws.id === s.id);
            return u ?? s;
          }),
        );
      }

      // Create or update period record
      if (currentPeriodRecord) {
        const updatedPeriod = await ImputationPeriodsAPI.update(currentPeriodRecord.id, {
          totalHours: currentPeriodTotal,
          status: 'sent',
          sentAt: new Date().toISOString(),
          rejectionReason: undefined,
        });
        setImputationPeriods((prev) =>
          prev.map((ip) => (ip.id === updatedPeriod.id ? updatedPeriod : ip)),
        );
      } else {
        const created = await ImputationPeriodsAPI.create({
          userId: currentUser!.id,
          year: currentPeriod.year,
          month: currentPeriod.month,
          period: currentPeriod.period,
          totalHours: currentPeriodTotal,
          status: 'sent',
          sentAt: new Date().toISOString(),
        });
        setImputationPeriods((prev) => [...prev, created]);
      }

      toast.success('Période envoyée à StraTIME');
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  // Helper for past period sessions
  const sessionsForPeriod = (pi: PeriodInfo) =>
    sessions.filter((s) => s.date >= pi.startDate && s.date <= pi.endDate);

  const periodRecord = (pi: PeriodInfo) =>
    imputationPeriods.find(
      (ip) => ip.year === pi.year && ip.month === pi.month && ip.period === pi.period,
    );

  // ---- Calendar helpers ----
  const calLabel = `${MONTH_NAMES[calMonth.month]} ${calMonth.year}`;
  const prevCalMonth = () => setCalMonth((prev) => prev.month === 1 ? { year: prev.year - 1, month: 12 } : { year: prev.year, month: prev.month - 1 });
  const nextCalMonth = () => setCalMonth((prev) => prev.month === 12 ? { year: prev.year + 1, month: 1 } : { year: prev.year, month: prev.month + 1 });

  // Build calendar grid
  const calendarCells = useMemo(() => {
    const y = calMonth.year;
    const m = calMonth.month;
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0).getDate();
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon=0

    const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];
    // fill leading days from prev month
    if (startDow > 0) {
      const prevLastDay = new Date(y, m - 1, 0).getDate();
      for (let i = startDow - 1; i >= 0; i--) {
        const d = prevLastDay - i;
        const pm = m - 1 < 1 ? 12 : m - 1;
        const py = m - 1 < 1 ? y - 1 : y;
        cells.push({ date: `${py}-${String(pm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
      }
    }
    for (let d = 1; d <= lastDay; d++) {
      cells.push({ date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: true });
    }
    // trailing
    const remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      const nm = m + 1 > 12 ? 1 : m + 1;
      const ny = m + 1 > 12 ? y + 1 : y;
      for (let d = 1; d <= remaining; d++) {
        cells.push({ date: `${ny}-${String(nm).padStart(2, '0')}-${String(d).padStart(2, '0')}`, day: d, isCurrentMonth: false });
      }
    }
    return cells;
  }, [calMonth]);

  // Map date → sessions
  const sessionsByDate = useMemo(() => {
    const map: Record<string, WorkSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  // Get period status for a date
  const periodStatusForDate = (dateStr: string): 'validated' | 'sent' | 'rejected' | 'draft' | null => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const p = day <= 15 ? 1 : 2;
    const rec = imputationPeriods.find((ip) => ip.year === y && ip.month === m && ip.period === p);
    return rec?.status ?? null;
  };

  const periodBgForDate = (dateStr: string): string => {
    const status = periodStatusForDate(dateStr);
    switch (status) {
      case 'validated': return 'bg-emerald-50 dark:bg-emerald-950/30';
      case 'sent': case 'pending' as string: return 'bg-blue-50 dark:bg-blue-950/30';
      case 'rejected': return 'bg-red-50 dark:bg-red-950/30';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mes Imputations"
        subtitle="Envoi bi-mensuel de vos temps vers StraTIME"
        breadcrumbs={[
          { label: 'Home', path: `${basePath}/dashboard` },
          { label: 'Imputations' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Current Period Banner */}
        <div className="rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" /> Période en cours
              </div>
              <h2 className="text-xl font-bold">{currentPeriod.label}</h2>
              {currentPeriod.daysRemaining > 0 && !periodIsSent && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="inline h-3.5 w-3.5 mr-1" />
                  {currentPeriod.daysRemaining} jour{currentPeriod.daysRemaining > 1 ? 's' : ''} restant{currentPeriod.daysRemaining > 1 ? 's' : ''} pour soumettre
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xl font-bold">{formatHours(currentPeriodTotal)}</p>
                <p className="text-xs text-muted-foreground">cette période</p>
              </div>
              {periodIsSent && !periodIsRejected ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 px-3 py-1.5">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Période envoyée ✓
                </Badge>
              ) : periodIsRejected ? (
                <Button variant="destructive" onClick={() => setShowConfirm(true)} disabled={sending || currentSessions.length === 0}>
                  <Send className="h-4 w-4 mr-1" /> Renvoyer la période
                </Button>
              ) : (
                <Button
                  onClick={() => setShowConfirm(true)}
                  disabled={sending || currentSessions.length === 0}
                >
                  {sending ? (
                    <><Clock className="h-4 w-4 mr-1 animate-spin" /> Envoi...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-1" /> Envoyer la période</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Rejected banner */}
          {periodIsRejected && currentPeriodRecord?.rejectionReason && (
            <div className="mt-4 rounded-lg border border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800 p-3">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300">
                <XCircle className="h-4 w-4" /> Période rejetée
              </div>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {currentPeriodRecord.rejectionReason}
              </p>
            </div>
          )}

          {/* Sent & locked banner */}
          {periodIsSent && !periodIsRejected && (
            <div className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 p-3 flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
              <Lock className="h-4 w-4" /> Cette période est verrouillée. Les sessions ne peuvent plus être modifiées.
              {currentPeriodRecord?.status === 'validated' && (
                <Badge className="ml-auto bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
                  Validée
                </Badge>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="current">
          <TabsList>
            <TabsTrigger value="current">Période en cours</TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-3.5 w-3.5 mr-1" /> Historique des périodes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-4">
            {/* Summary cards + view toggle */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Période en cours</h3>
                <div className="flex gap-1 rounded-lg border border-border p-0.5">
                  <Button size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} onClick={() => setViewMode('table')}><List className="h-4 w-4" /></Button>
                  <Button size="sm" variant={viewMode === 'calendar' ? 'default' : 'ghost'} onClick={() => setViewMode('calendar')}><CalendarDays className="h-4 w-4" /></Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Clock className="h-4 w-4" /> Total période
                  </div>
                  <p className="text-2xl font-bold">{formatHours(currentPeriodTotal)}</p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sessions envoyées
                  </div>
                  <p className="text-2xl font-bold">
                    {currentSessions.filter((s) => s.sentToStraTIME).length} / {currentSessions.length}
                  </p>
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {unssentCurrentSessions.length > 0 ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    Non envoyées
                  </div>
                  <p className={`text-2xl font-bold ${unssentCurrentSessions.length > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                    {unssentCurrentSessions.length}
                  </p>
                </div>
              </div>
            </div>

            {viewMode === 'table' ? (
              <>
                {/* Sessions table grouped by project */}
                {loading ? (
                  <p className="text-muted-foreground">Chargement...</p>
                ) : currentSessions.length === 0 ? (
                  <div className="rounded-lg border bg-card p-12 text-center">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground/40" />
                    <p className="mt-3 text-muted-foreground">Aucune session pour cette période.</p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="px-4">Projet</TableHead>
                          <TableHead className="px-4">Objet</TableHead>
                          <TableHead className="px-4">Ticket</TableHead>
                          <TableHead className="px-4">Type de Dev</TableHead>
                          <TableHead className="px-4">Date</TableHead>
                          <TableHead className="px-4">Heures</TableHead>
                          <TableHead className="px-4">Note</TableHead>
                          <TableHead className="px-4">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(groupedSessions).map(([projId, group]) =>
                          Object.entries(group.tickets).map(([tkId, tkSessions]) =>
                            tkSessions.map((ws, idx) => (
                              <TableRow key={ws.id}>
                                {idx === 0 && (
                                  <TableCell className="px-4 py-3 text-sm font-medium" rowSpan={tkSessions.length}>
                                    {projectName(projId)}
                                  </TableCell>
                                )}
                                {idx === 0 && (
                                  <TableCell className="px-4 py-3 text-sm" rowSpan={tkSessions.length}>
                                    {ticketObjet(tkId)}
                                  </TableCell>
                                )}
                                {idx === 0 && (
                                  <TableCell className="px-4 py-3 text-sm font-medium" rowSpan={tkSessions.length}>
                                    {ticketTitle(tkId)}
                                  </TableCell>
                                )}
                                {idx === 0 && (
                                  <TableCell className="px-4 py-3 text-sm" rowSpan={tkSessions.length}>
                                    {ticketDevType(tkId)}
                                  </TableCell>
                                )}
                                <TableCell className="px-4 py-3 text-sm">{ws.date}</TableCell>
                                <TableCell className="px-4 py-3 text-sm font-mono">{formatHours(ws.hours)}</TableCell>
                                <TableCell className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                                  {ws.description || '-'}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {ws.sentToStraTIME ? (
                                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Envoyé
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                                      En attente
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            )),
                          ),
                        )}
                      </TableBody>
                    </Table>
                    <div className="border-t px-4 py-3 text-sm flex justify-between">
                      <span>{currentSessions.length} session(s)</span>
                      <span className="font-semibold">Total: {formatHours(currentPeriodTotal)}</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ---- CALENDAR VIEW ---- */
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button size="sm" variant="outline" onClick={prevCalMonth}><ChevronLeft className="h-4 w-4" /></Button>
                  <h3 className="text-lg font-semibold">{calLabel}</h3>
                  <Button size="sm" variant="outline" onClick={nextCalMonth}><ChevronRight className="h-4 w-4" /></Button>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-800 inline-block" /> Validée</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-800 inline-block" /> Envoyée</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-200 dark:bg-red-800 inline-block" /> Rejetée</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/20 inline-block" /> Sessions</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-muted-foreground inline-block" /> Limite de période (15)</span>
                </div>

                <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                    <div key={d} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
                  ))}
                  {calendarCells.map((cell) => {
                    const daySessions = sessionsByDate[cell.date] || [];
                    const dayTotal = daySessions.reduce((s, ws) => s + ws.hours, 0);
                    const isPeriodBoundary = cell.isCurrentMonth && cell.day === 15;
                    const periodBg = cell.isCurrentMonth ? periodBgForDate(cell.date) : '';
                    const today = new Date();
                    const isToday = cell.date === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

                    return (
                      <div
                        key={cell.date}
                        className={`min-h-[80px] bg-card p-1.5 ${!cell.isCurrentMonth ? 'opacity-40' : ''} ${periodBg} ${isPeriodBoundary ? 'border-r-2 border-dashed border-muted-foreground/50' : ''}`}
                      >
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center' : 'text-muted-foreground'}`}>
                          {cell.day}
                        </div>
                        {dayTotal > 0 && (
                          <div className="mb-0.5 rounded px-1 py-0.5 text-[10px] font-mono font-semibold bg-primary/10 text-primary">
                            {formatHours(dayTotal)}
                          </div>
                        )}
                        {daySessions.slice(0, 2).map((ws) => (
                          <div
                            key={ws.id}
                            className="mb-0.5 truncate rounded px-1 py-0.5 text-[10px] bg-muted text-muted-foreground"
                            title={`${ticketTitle(ws.ticketId)} — ${formatHours(ws.hours)}`}
                          >
                            {ticketTitle(ws.ticketId)}
                          </div>
                        ))}
                        {daySessions.length > 2 && (
                          <div className="text-[10px] text-muted-foreground">+{daySessions.length - 2}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Période</TableHead>
                    <TableHead className="px-4">Heures</TableHead>
                    <TableHead className="px-4">Sessions</TableHead>
                    <TableHead className="px-4">Statut</TableHead>
                    <TableHead className="px-4">Envoyé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastPeriods.map((pi) => {
                    const pSessions = sessionsForPeriod(pi);
                    const pRecord = periodRecord(pi);
                    const pTotal = pSessions.reduce((s, ws) => s + ws.hours, 0);
                    return (
                      <TableRow key={`${pi.year}-${pi.month}-${pi.period}`}>
                        <TableCell className="px-4 py-3 text-sm font-medium">{pi.label}</TableCell>
                        <TableCell className="px-4 py-3 text-sm font-mono">{formatHours(pTotal)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm">{pSessions.length}</TableCell>
                        <TableCell className="px-4 py-3">
                          {pRecord?.status === 'validated' ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                              Validée
                            </Badge>
                          ) : pRecord?.status === 'sent' || pRecord?.status === 'pending' ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400">
                              Envoyée
                            </Badge>
                          ) : pRecord?.status === 'rejected' ? (
                            <Badge variant="destructive">Rejetée</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Non envoyée
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {pRecord?.sentAt ? new Date(pRecord.sentAt).toLocaleDateString('fr-FR') : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {pastPeriods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Aucun historique disponible.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Envoyer la période ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'envoyer{' '}
              <strong>{formatHours(currentPeriodTotal)}</strong> pour la période du{' '}
              <strong>{currentPeriod.label}</strong>. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleSendPeriod()}>
              Envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
