import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ProjectsAPI,
  TicketsAPI,
  TimeLogsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Project, Ticket, TicketEvent, TicketStatus, TimeLog, TimerState, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, CheckCircle2, Clock, KanbanSquare, List, Pause, Play, Plus, Send, Square } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
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
import { Textarea } from '../../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'calendar' | 'kanban';

interface TicketForm {
  projectId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  title: string;
  description: string;
  dueDate: string;
}

const EMPTY_FORM: TicketForm = {
  projectId: '',
  assignedTo: '',
  priority: 'MEDIUM',
  title: '',
  description: '',
  dueDate: '',
};

const STATUS_ORDER: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FEEDBACK', 'RESOLVED', 'CLOSED'];

const statusColor: Record<TicketStatus, string> = {
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

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatDurationShort = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}min`;
};

const getTimerSeconds = (timer?: TimerState): number => {
  if (!timer) return 0;
  if (timer.status === 'running' && timer.startedAt) {
    const elapsed = Math.floor((Date.now() - new Date(timer.startedAt).getTime()) / 1000);
    return timer.totalElapsedSeconds + elapsed;
  }
  return timer.totalElapsedSeconds;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsultantTicketsPageProps {
  /** Page title */
  title: string;
  /** Page subtitle */
  subtitle: string;
  /** Home breadcrumb path */
  homePath: string;
  /** Filter tickets to only those belonging to the current user */
  filterFn: (tickets: Ticket[], userId: string) => Ticket[];
}

// ---------------------------------------------------------------------------
// Shared Component
// ---------------------------------------------------------------------------

export const ConsultantTicketsPage: React.FC<ConsultantTicketsPageProps> = ({
  title,
  subtitle,
  homePath,
  filterFn,
}) => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Timer tick – re-renders every second when any ticket timer is running
  const [, setTimerTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // StraTIME imputation modal state
  const [showImputation, setShowImputation] = useState(false);
  const [imputationTicket, setImputationTicket] = useState<Ticket | null>(null);
  const [imputationDesc, setImputationDesc] = useState('');
  const [imputationDuration, setImputationDuration] = useState('');
  const [imputationDate, setImputationDate] = useState('');
  const [isSendingStraTIME, setIsSendingStraTIME] = useState(false);
  const [ticketTimeLogs, setTicketTimeLogs] = useState<TimeLog[]>([]);

  // Time logs for badges – keyed by ticketId
  const [timeLogsMap, setTimeLogsMap] = useState<Record<string, TimeLog[]>>({});

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  // Timer interval – tick every second when any ticket has a running timer
  useEffect(() => {
    const hasRunning = tickets.some((t) => t.timerState?.status === 'running');
    if (hasRunning) {
      timerRef.current = setInterval(() => setTimerTick((n) => n + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [tickets]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectData, userData, ticketData, timeLogData] = await Promise.all([
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
        TimeLogsAPI.getAll(),
      ]);
      setProjects(projectData);
      setUsers(userData);
      const filtered = filterFn(ticketData, currentUser!.id);
      setTickets(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      // Build time-logs map per ticket
      const logsMap: Record<string, TimeLog[]> = {};
      timeLogData.forEach((tl) => {
        if (!logsMap[tl.ticketId]) logsMap[tl.ticketId] = [];
        logsMap[tl.ticketId].push(tl);
      });
      setTimeLogsMap(logsMap);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id?: string) => users.find((u) => u.id === id)?.name ?? '-';
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          projectName(t.projectId).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, statusFilter, searchQuery, projects]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.projectId || !form.title.trim()) {
      toast.error('Project and title are required');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await TicketsAPI.create({
        projectId: form.projectId,
        createdBy: currentUser.id,
        assignedTo: form.assignedTo || undefined,
        priority: form.priority,
        status: 'OPEN',
        title: form.title.trim(),
        description: form.description.trim(),
        dueDate: form.dueDate || undefined,
        history: [
          {
            id: `te${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            action: 'CREATED',
            comment: 'Ticket created',
          },
        ],
      });
      setTickets((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setShowCreate(false);
      toast.success('Ticket created');
    } catch {
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (ticket: Ticket, newStatus: TicketStatus) => {
    if (!currentUser) return;
    const event: TicketEvent = {
      id: `te${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'STATUS_CHANGE',
      fromValue: ticket.status,
      toValue: newStatus,
    };

    // Auto-manage timer on status transitions
    let timerUpdate: Partial<Ticket> = {};
    const currentTimer = ticket.timerState ?? { status: 'idle' as const, totalElapsedSeconds: 0 };

    if (newStatus === 'IN_PROGRESS' && currentTimer.status !== 'running') {
      // Auto-start timer
      timerUpdate = {
        timerState: {
          status: 'running',
          startedAt: new Date().toISOString(),
          totalElapsedSeconds: currentTimer.totalElapsedSeconds,
        },
      };
    } else if ((newStatus === 'CLOSED' || newStatus === 'RESOLVED') && currentTimer.status === 'running') {
      // Auto-stop timer
      const extra = currentTimer.startedAt
        ? Math.floor((Date.now() - new Date(currentTimer.startedAt).getTime()) / 1000)
        : 0;
      timerUpdate = {
        timerState: {
          status: 'stopped',
          totalElapsedSeconds: currentTimer.totalElapsedSeconds + extra,
        },
      };
    } else if (newStatus === 'WAITING_FEEDBACK' && currentTimer.status === 'running') {
      // Auto-pause on waiting feedback
      const extra = currentTimer.startedAt
        ? Math.floor((Date.now() - new Date(currentTimer.startedAt).getTime()) / 1000)
        : 0;
      timerUpdate = {
        timerState: {
          status: 'paused',
          pausedAt: new Date().toISOString(),
          totalElapsedSeconds: currentTimer.totalElapsedSeconds + extra,
        },
      };
    }

    try {
      const updated = await TicketsAPI.update(ticket.id, {
        status: newStatus,
        history: [...(ticket.history || []), event],
        ...timerUpdate,
      });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      toast.success(`Status → ${newStatus.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ---------------------------------------------------------------------------
  // Timer controls
  // ---------------------------------------------------------------------------

  const toggleTimer = useCallback(async (ticket: Ticket) => {
    const current = ticket.timerState ?? { status: 'idle' as const, totalElapsedSeconds: 0 };
    let newTimer: TimerState;

    if (current.status === 'running') {
      // Pause
      const extra = current.startedAt
        ? Math.floor((Date.now() - new Date(current.startedAt).getTime()) / 1000)
        : 0;
      newTimer = { status: 'paused', pausedAt: new Date().toISOString(), totalElapsedSeconds: current.totalElapsedSeconds + extra };
    } else {
      // Start / Resume
      newTimer = { status: 'running', startedAt: new Date().toISOString(), totalElapsedSeconds: current.totalElapsedSeconds };
    }

    try {
      const updated = await TicketsAPI.update(ticket.id, { timerState: newTimer });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
    } catch {
      toast.error('Timer update failed');
    }
  }, [selectedTicket]);

  const stopTimer = useCallback(async (ticket: Ticket) => {
    const current = ticket.timerState ?? { status: 'idle' as const, totalElapsedSeconds: 0 };
    const extra = current.status === 'running' && current.startedAt
      ? Math.floor((Date.now() - new Date(current.startedAt).getTime()) / 1000)
      : 0;
    const newTimer: TimerState = { status: 'stopped', totalElapsedSeconds: current.totalElapsedSeconds + extra };

    try {
      const updated = await TicketsAPI.update(ticket.id, { timerState: newTimer });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
    } catch {
      toast.error('Timer stop failed');
    }
  }, [selectedTicket]);

  // ---------------------------------------------------------------------------
  // StraTIME Imputation
  // ---------------------------------------------------------------------------

  const openImputation = useCallback(async (ticket: Ticket) => {
    const secs = getTimerSeconds(ticket.timerState);
    const mins = Math.max(1, Math.round(secs / 60));
    setImputationTicket(ticket);
    setImputationDuration(String(mins));
    setImputationDate(new Date().toISOString().slice(0, 10));
    setImputationDesc(`Travail sur: ${ticket.title}`);
    setShowImputation(true);

    // Load ticket-specific time logs for the modal
    try {
      const logs = await TimeLogsAPI.getByTicket(ticket.id);
      setTicketTimeLogs(logs);
    } catch {
      setTicketTimeLogs([]);
    }
  }, []);

  const submitImputation = async () => {
    if (!imputationTicket || !currentUser) return;
    const duration = parseInt(imputationDuration, 10);
    if (!duration || duration <= 0) {
      toast.error('Duration must be positive');
      return;
    }
    try {
      setIsSendingStraTIME(true);
      const newLog = await TimeLogsAPI.create({
        consultantId: currentUser.id,
        ticketId: imputationTicket.id,
        projectId: imputationTicket.projectId,
        date: imputationDate,
        durationMinutes: duration,
        description: imputationDesc.trim(),
        sentToStraTIME: false,
      });
      // Immediately send to StraTIME (simulated)
      const sent = await TimeLogsAPI.sendToStraTIME(newLog.id);
      // Update local maps
      setTimeLogsMap((prev) => ({
        ...prev,
        [imputationTicket.id]: [...(prev[imputationTicket.id] || []), sent],
      }));
      setTicketTimeLogs((prev) => [...prev, sent]);
      toast.success('Imputation envoyée à StraTIME');
      setShowImputation(false);
    } catch {
      toast.error("Erreur d'envoi vers StraTIME");
    } finally {
      setIsSendingStraTIME(false);
    }
  };

  // Check if ticket has all time logs sent to StraTIME
  const isFullyImputed = (ticketId: string): boolean => {
    const logs = timeLogsMap[ticketId];
    return !!logs && logs.length > 0 && logs.every((l) => l.sentToStraTIME);
  };

  // ---------------------------------------------------------------------------
  // Calendar helpers
  // ---------------------------------------------------------------------------

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

    for (let i = -startOffset; i <= lastDay.getDate() + (6 - ((lastDay.getDay() + 6) % 7)); i++) {
      const d = new Date(y, m - 1, i + 1);
      days.push({
        date: d.toISOString().slice(0, 10),
        day: d.getDate(),
        isCurrentMonth: d.getMonth() === m - 1,
      });
    }
    return days;
  }, [calendarMonth]);

  const ticketsByDate = useMemo(() => {
    const map: Record<string, Ticket[]> = {};
    filteredTickets.forEach((t) => {
      const dateKey = t.dueDate || t.createdAt.slice(0, 10);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(t);
    });
    return map;
  }, [filteredTickets]);

  const prevMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };
  const nextMonth = () => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    setCalendarMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // ---------------------------------------------------------------------------
  // Kanban drag/drop (native HTML5)
  // ---------------------------------------------------------------------------

  const onDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData('text/plain', ticketId);
  };

  const onDrop = (e: React.DragEvent, targetStatus: TicketStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('text/plain');
    const ticket = tickets.find((t) => t.id === ticketId);
    if (ticket && ticket.status !== targetStatus) {
      void changeStatus(ticket, targetStatus);
    }
  };

  const onDragOver = (e: React.DragEvent) => e.preventDefault();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={title}
        subtitle={subtitle}
        breadcrumbs={[
          { label: 'Home', path: homePath },
          { label: 'Tickets' },
        ]}
      />

      <div className="p-6 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-60"
          />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {STATUS_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {([['list', List], ['calendar', CalendarDays], ['kanban', KanbanSquare]] as const).map(
              ([mode, Icon]) => (
                <Button
                  key={mode}
                  size="sm"
                  variant={viewMode === mode ? 'default' : 'ghost'}
                  onClick={() => setViewMode(mode as ViewMode)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            )}
          </div>

          <div className="flex-1" />
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Ticket
          </Button>
        </div>

        {/* Views */}
        {loading ? (
          <p className="text-muted-foreground">Loading tickets...</p>
        ) : viewMode === 'list' ? (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Title</TableHead>
                  <TableHead className="px-4">Project</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Priority</TableHead>
                  <TableHead className="px-4">Timer</TableHead>
                  <TableHead className="px-4">Due</TableHead>
                  <TableHead className="px-4">Assigned</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const secs = getTimerSeconds(ticket.timerState);
                  const isRunning = ticket.timerState?.status === 'running';
                  return (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setSelectedTicket(ticket)}>
                    <TableCell className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        {ticket.title}
                        {isFullyImputed(ticket.id) && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[10px]"><CheckCircle2 className="h-3 w-3 mr-0.5" />Imputé</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{projectName(ticket.projectId)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusColor[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono" onClick={(e) => e.stopPropagation()}>
                      {secs > 0 || isRunning ? (
                        <span className={`inline-flex items-center gap-1 ${isRunning ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                          <Clock className="h-3 w-3" />
                          {formatDuration(secs)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '-'}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{userName(ticket.assignedTo)}</TableCell>
                    <TableCell className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {ticket.status !== 'CLOSED' && (
                        <Button size="sm" variant="outline" onClick={() => void changeStatus(ticket, 'CLOSED')}>Close</Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
                {filteredTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-4">
              <Button size="sm" variant="outline" onClick={prevMonth}>← Prev</Button>
              <h3 className="text-lg font-semibold">{calendarMonth}</h3>
              <Button size="sm" variant="outline" onClick={nextMonth}>Next →</Button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-border rounded overflow-hidden">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
              ))}
              {calendarDays.map((cell) => {
                const dayTickets = ticketsByDate[cell.date] || [];
                return (
                  <div
                    key={cell.date}
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const ticketId = e.dataTransfer.getData('text/plain');
                      const ticket = tickets.find((t) => t.id === ticketId);
                      if (ticket) {
                        void TicketsAPI.update(ticket.id, { dueDate: cell.date }).then((upd) => {
                          setTickets((prev) => prev.map((t) => (t.id === upd.id ? upd : t)));
                          toast.success(`Due date → ${cell.date}`);
                        });
                      }
                    }}
                    className={`min-h-[80px] bg-card p-1.5 ${!cell.isCurrentMonth ? 'opacity-40' : ''}`}
                  >
                    <div className="text-xs font-medium text-muted-foreground mb-1">{cell.day}</div>
                    {dayTickets.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, t.id)}
                        onClick={() => setSelectedTicket(t)}
                        className="mb-0.5 cursor-grab truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {t.title}
                      </div>
                    ))}
                    {dayTickets.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{dayTickets.length - 3} more</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {STATUS_ORDER.map((status) => {
              const col = filteredTickets.filter((t) => t.status === status);
              return (
                <div
                  key={status}
                  className="min-w-[240px] flex-1 rounded-lg border bg-muted/30 p-3"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, status)}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Badge className={statusColor[status]}>{status.replace('_', ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">{col.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.map((ticket) => (
                      <div
                        key={ticket.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, ticket.id)}
                        onClick={() => setSelectedTicket(ticket)}
                        className="cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow transition"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium text-foreground">{ticket.title}</p>
                          {isFullyImputed(ticket.id) && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <Badge className={priorityColor[ticket.priority] + ' text-[10px]'}>{ticket.priority}</Badge>
                          <div className="flex items-center gap-2">
                            {(getTimerSeconds(ticket.timerState) > 0 || ticket.timerState?.status === 'running') && (
                              <span className={`text-[10px] font-mono flex items-center gap-0.5 ${ticket.timerState?.status === 'running' ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                <Clock className="h-2.5 w-2.5" />
                                {formatDurationShort(getTimerSeconds(ticket.timerState))}
                              </span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{userName(ticket.assignedTo)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void submitTicket(e)} className="space-y-4">
            <div>
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as Ticket['priority'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={form.assignedTo} onValueChange={(v) => setForm({ ...form, assignedTo: v })}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  {users.filter((u) => u.role !== 'ADMIN' && u.role !== 'MANAGER').map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail / History Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          {selectedTicket && (() => {
            const secs = getTimerSeconds(selectedTicket.timerState);
            const timerStatus = selectedTicket.timerState?.status ?? 'idle';
            const isRunning = timerStatus === 'running';
            const isPaused = timerStatus === 'paused';
            const canToggle = selectedTicket.status !== 'CLOSED' && selectedTicket.status !== 'RESOLVED';
            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTicket.title}
                  {isFullyImputed(selectedTicket.id) && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs"><CheckCircle2 className="h-3 w-3 mr-0.5" />Imputé</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColor[selectedTicket.status]}>{selectedTicket.status.replace('_', ' ')}</Badge>
                  <Badge className={priorityColor[selectedTicket.priority]}>{selectedTicket.priority}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{selectedTicket.description}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Project:</span> {projectName(selectedTicket.projectId)}</div>
                  <div><span className="text-muted-foreground">Created by:</span> {userName(selectedTicket.createdBy)}</div>
                  <div><span className="text-muted-foreground">Assigned to:</span> {userName(selectedTicket.assignedTo)}</div>
                  <div><span className="text-muted-foreground">Due:</span> {selectedTicket.dueDate ?? '-'}</div>
                </div>

                {/* Timer Section */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Timer</span>
                    </div>
                    <span className={`text-lg font-mono font-semibold ${isRunning ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {formatDuration(secs)}
                    </span>
                  </div>
                  {canToggle && (
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant={isRunning ? 'outline' : 'default'}
                        onClick={() => void toggleTimer(selectedTicket)}
                        className="flex-1"
                      >
                        {isRunning ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> {isPaused ? 'Resume' : 'Start'}</>}
                      </Button>
                      {(isRunning || isPaused) && (
                        <Button size="sm" variant="destructive" onClick={() => void stopTimer(selectedTicket)}>
                          <Square className="h-3 w-3 mr-1" /> Stop
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                        onClick={() => void openImputation(selectedTicket)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Imputer StraTIME
                      </Button>
                    </div>
                  )}
                  {!canToggle && secs > 0 && (
                    <div className="mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                        onClick={() => void openImputation(selectedTicket)}
                      >
                        <Send className="h-3 w-3 mr-1" /> Imputer StraTIME
                      </Button>
                    </div>
                  )}
                </div>

                {selectedTicket.status !== 'CLOSED' && (
                  <div className="flex gap-2 flex-wrap">
                    {STATUS_ORDER.filter((s) => s !== selectedTicket.status).map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => void changeStatus(selectedTicket, s)}>
                        → {s.replace('_', ' ')}
                      </Button>
                    ))}
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">History</h4>
                  <div className="space-y-2">
                    {(selectedTicket.history || []).map((evt) => (
                      <div key={evt.id} className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                        <div>
                          <span className="font-medium">{userName(evt.userId)}</span>
                          {evt.action === 'CREATED' && ' created this ticket'}
                          {evt.action === 'STATUS_CHANGE' && (
                            <> changed status from <Badge variant="outline" className="text-[10px] mx-0.5">{evt.fromValue}</Badge> to <Badge variant="outline" className="text-[10px] mx-0.5">{evt.toValue}</Badge></>
                          )}
                          {evt.action === 'ASSIGNED' && ` assigned to ${userName(evt.toValue)}`}
                          {evt.action === 'COMMENT' && `: ${evt.comment}`}
                          {evt.comment && evt.action !== 'COMMENT' && (
                            <span className="block text-muted-foreground mt-0.5">{evt.comment}</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(!selectedTicket.history || selectedTicket.history.length === 0) && (
                      <p className="text-xs text-muted-foreground">No history available.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* StraTIME Imputation Modal */}
      <Dialog open={showImputation} onOpenChange={setShowImputation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" /> Imputation StraTIME
            </DialogTitle>
          </DialogHeader>
          {imputationTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Ticket:</span> {imputationTicket.title}</div>
                <div><span className="text-muted-foreground">Projet:</span> {projectName(imputationTicket.projectId)}</div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={imputationDate} onChange={(e) => setImputationDate(e.target.value)} />
              </div>
              <div>
                <Label>Durée (minutes)</Label>
                <Input type="number" min={1} value={imputationDuration} onChange={(e) => setImputationDuration(e.target.value)} />
                {imputationDuration && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = {formatDurationShort(parseInt(imputationDuration, 10) * 60)}
                  </p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={imputationDesc} onChange={(e) => setImputationDesc(e.target.value)} rows={2} />
              </div>

              {/* Previous logs for this ticket */}
              {ticketTimeLogs.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Imputations précédentes</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ticketTimeLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                        <span>{log.date} — {log.durationMinutes}min</span>
                        {log.sentToStraTIME ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px]">Envoyé</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">Brouillon</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowImputation(false)}>Annuler</Button>
                <Button
                  onClick={() => void submitImputation()}
                  disabled={isSendingStraTIME}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSendingStraTIME ? (
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3 animate-spin" /> Envoi en cours...</span>
                  ) : (
                    <span className="flex items-center gap-1"><Send className="h-3 w-3" /> Envoyer à StraTIME</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
