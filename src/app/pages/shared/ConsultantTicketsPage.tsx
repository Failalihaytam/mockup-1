import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  ObjetsAPI,
  ProjectsAPI,
  TicketsAPI,
  UsersAPI,
  WorkSessionsAPI,
} from '../../services/odataClient';
import { DevType, Objet, Project, Ticket, TicketEvent, TicketStatus, WorkSession, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { CalendarDays, CheckCircle2, Clock, FolderOpen, KanbanSquare, List, Plus, Send } from 'lucide-react';
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

const DEV_TYPES: DevType[] = ['Formulaire', 'Report', 'Enhancement', 'Programme'];

interface TicketForm {
  projectId: string;
  objetId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  devType: DevType;
  title: string;
  description: string;
  dueDate: string;
}

const EMPTY_FORM: TicketForm = {
  projectId: '',
  objetId: '',
  assignedTo: '',
  priority: 'MEDIUM',
  devType: 'Enhancement',
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

const devTypeColor: Record<DevType, string> = {
  Formulaire: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  Report: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  Enhancement: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Programme: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const formatHours = (h: number): string => {
  if (h >= 1) return `${h}h`;
  return `${Math.round(h * 60)}min`;
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConsultantTicketsPageProps {
  title: string;
  subtitle: string;
  homePath: string;
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
  const [objets, setObjets] = useState<Objet[]>([]);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [devTypeFilter, setDevTypeFilter] = useState<DevType | 'ALL'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Inline objet creation
  const [showNewObjet, setShowNewObjet] = useState(false);
  const [newObjetName, setNewObjetName] = useState('');
  const [newObjetDesc, setNewObjetDesc] = useState('');

  // Work session logging (in detail dialog)
  const [sessionsMap, setSessionsMap] = useState<Record<string, WorkSession[]>>({});
  const [ticketSessions, setTicketSessions] = useState<WorkSession[]>([]);
  const [showLogSession, setShowLogSession] = useState(false);
  const [sessionTicket, setSessionTicket] = useState<Ticket | null>(null);
  const [sessionHours, setSessionHours] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionDesc, setSessionDesc] = useState('');
  const [isSendingStraTIME, setIsSendingStraTIME] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectData, userData, ticketData, sessionData, objetData] = await Promise.all([
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
        WorkSessionsAPI.getAll(),
        ObjetsAPI.getAll(),
      ]);
      setProjects(projectData);
      setUsers(userData);
      setObjets(objetData);
      const filtered = filterFn(ticketData, currentUser!.id);
      setTickets(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const sMap: Record<string, WorkSession[]> = {};
      sessionData.forEach((ws) => {
        if (!sMap[ws.ticketId]) sMap[ws.ticketId] = [];
        sMap[ws.ticketId].push(ws);
      });
      setSessionsMap(sMap);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id?: string) => users.find((u) => u.id === id)?.name ?? '-';
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const objetName = (id?: string) => objets.find((o) => o.id === id)?.name ?? '';

  // Filtered list of objets for the selected project in the form
  const formObjets = useMemo(
    () => (form.projectId ? objets.filter((o) => o.projectId === form.projectId) : []),
    [objets, form.projectId],
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (devTypeFilter !== 'ALL' && t.devType !== devTypeFilter) return false;
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
  }, [tickets, statusFilter, devTypeFilter, searchQuery, projects]);

  // Check if a ticket has all sessions sent to StraTIME
  const isFullyImputed = (ticketId: string): boolean => {
    const sessions = sessionsMap[ticketId];
    return !!sessions && sessions.length > 0 && sessions.every((s) => s.sentToStraTIME);
  };

  // Total hours for a ticket
  const totalHours = (ticketId: string): number => {
    return (sessionsMap[ticketId] || []).reduce((s, ws) => s + ws.hours, 0);
  };

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
        objetId: form.objetId || undefined,
        createdBy: currentUser.id,
        assignedTo: form.assignedTo || undefined,
        priority: form.priority,
        devType: form.devType,
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
    try {
      const updated = await TicketsAPI.update(ticket.id, {
        status: newStatus,
        history: [...(ticket.history || []), event],
      });
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? updated : t)));
      if (selectedTicket?.id === ticket.id) setSelectedTicket(updated);
      toast.success(`Status → ${newStatus.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // Inline objet creation
  const createObjet = async () => {
    if (!form.projectId || !newObjetName.trim()) {
      toast.error('Project and objet name are required');
      return;
    }
    try {
      const created = await ObjetsAPI.create({
        projectId: form.projectId,
        name: newObjetName.trim(),
        description: newObjetDesc.trim() || undefined,
      });
      setObjets((prev) => [...prev, created]);
      setForm((prev) => ({ ...prev, objetId: created.id }));
      setShowNewObjet(false);
      setNewObjetName('');
      setNewObjetDesc('');
      toast.success('Objet créé');
    } catch {
      toast.error("Erreur lors de la création de l'objet");
    }
  };

  // ---------------------------------------------------------------------------
  // Work Session logging
  // ---------------------------------------------------------------------------

  const openLogSession = useCallback(async (ticket: Ticket) => {
    setSessionTicket(ticket);
    setSessionHours('1');
    setSessionDate(new Date().toISOString().slice(0, 10));
    setSessionDesc(`Travail sur: ${ticket.title}`);
    setShowLogSession(true);
    try {
      const sessions = await WorkSessionsAPI.getByTicket(ticket.id);
      setTicketSessions(sessions);
    } catch {
      setTicketSessions([]);
    }
  }, []);

  const submitSession = async () => {
    if (!sessionTicket || !currentUser) return;
    const hours = parseFloat(sessionHours);
    if (!hours || hours <= 0) {
      toast.error('Les heures doivent être positives');
      return;
    }
    try {
      setIsSendingStraTIME(true);
      const newSession = await WorkSessionsAPI.create({
        consultantId: currentUser.id,
        ticketId: sessionTicket.id,
        projectId: sessionTicket.projectId,
        date: sessionDate,
        hours,
        description: sessionDesc.trim(),
        sentToStraTIME: false,
      });
      // Immediately send to StraTIME
      const sent = await WorkSessionsAPI.sendToStraTIME(newSession.id);
      setSessionsMap((prev) => ({
        ...prev,
        [sessionTicket.id]: [...(prev[sessionTicket.id] || []), sent],
      }));
      setTicketSessions((prev) => [...prev, sent]);
      toast.success('Imputation envoyée à StraTIME');
      setShowLogSession(false);
    } catch {
      toast.error("Erreur d'envoi vers StraTIME");
    } finally {
      setIsSendingStraTIME(false);
    }
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
  // Kanban drag/drop
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
          <Select value={devTypeFilter} onValueChange={(v) => setDevTypeFilter(v as typeof devTypeFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Dev Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              {DEV_TYPES.map((dt) => (
                <SelectItem key={dt} value={dt}>{dt}</SelectItem>
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
                  <TableHead className="px-4">Objet</TableHead>
                  <TableHead className="px-4">Status</TableHead>
                  <TableHead className="px-4">Priority</TableHead>
                  <TableHead className="px-4">Type</TableHead>
                  <TableHead className="px-4">Hours</TableHead>
                  <TableHead className="px-4">Due</TableHead>
                  <TableHead className="px-4">Assigned</TableHead>
                  <TableHead className="px-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => {
                  const hrs = totalHours(ticket.id);
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
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">{objetName(ticket.objetId) || '—'}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={statusColor[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={priorityColor[ticket.priority]}>{ticket.priority}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {ticket.devType && <Badge className={devTypeColor[ticket.devType] + ' text-[10px]'}>{ticket.devType}</Badge>}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono">
                      {hrs > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatHours(hrs)}
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
                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
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
                          <div className="flex items-center gap-1">
                            <Badge className={priorityColor[ticket.priority] + ' text-[10px]'}>{ticket.priority}</Badge>
                            {ticket.devType && <Badge className={devTypeColor[ticket.devType] + ' text-[10px]'}>{ticket.devType}</Badge>}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{userName(ticket.assignedTo)}</span>
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void submitTicket(e)} className="space-y-4">
            <div>
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v, objetId: '' })}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objet selector + inline create */}
            {form.projectId && (
              <div>
                <Label className="flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5" /> Objet
                </Label>
                {!showNewObjet ? (
                  <div className="flex gap-2">
                    <Select value={form.objetId} onValueChange={(v) => setForm({ ...form, objetId: v })}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select objet (optional)" /></SelectTrigger>
                      <SelectContent>
                        {formObjets.map((o) => (
                          <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowNewObjet(true)}>
                      <Plus className="h-3 w-3 mr-0.5" /> Créer
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                    <Input placeholder="Nom de l'objet *" value={newObjetName} onChange={(e) => setNewObjetName(e.target.value)} />
                    <Input placeholder="Description (optionnel)" value={newObjetDesc} onChange={(e) => setNewObjetDesc(e.target.value)} />
                    <div className="flex gap-2 justify-end">
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowNewObjet(false)}>Annuler</Button>
                      <Button type="button" size="sm" onClick={() => void createObjet()}>Créer l'objet</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>

            {/* Dev Type segmented control */}
            <div>
              <Label>Development Type</Label>
              <div className="flex gap-1 mt-1 rounded-lg border border-border p-0.5">
                {DEV_TYPES.map((dt) => (
                  <Button
                    key={dt}
                    type="button"
                    size="sm"
                    variant={form.devType === dt ? 'default' : 'ghost'}
                    className={form.devType === dt ? '' : 'text-muted-foreground'}
                    onClick={() => setForm({ ...form, devType: dt })}
                  >
                    {dt}
                  </Button>
                ))}
              </div>
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
          {selectedTicket && (
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
                  {selectedTicket.devType && <Badge className={devTypeColor[selectedTicket.devType]}>{selectedTicket.devType}</Badge>}
                </div>
                <div className="text-sm text-muted-foreground">{selectedTicket.description}</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Project:</span> {projectName(selectedTicket.projectId)}</div>
                  <div><span className="text-muted-foreground">Objet:</span> {objetName(selectedTicket.objetId) || '—'}</div>
                  <div><span className="text-muted-foreground">Created by:</span> {userName(selectedTicket.createdBy)}</div>
                  <div><span className="text-muted-foreground">Assigned to:</span> {userName(selectedTicket.assignedTo)}</div>
                  <div><span className="text-muted-foreground">Due:</span> {selectedTicket.dueDate ?? '-'}</div>
                  <div><span className="text-muted-foreground">Hours logged:</span> {formatHours(totalHours(selectedTicket.id))}</div>
                </div>

                {/* Work Session Section */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Sessions de travail</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-950"
                      onClick={() => void openLogSession(selectedTicket)}
                    >
                      <Send className="h-3 w-3 mr-1" /> Logger & Imputer
                    </Button>
                  </div>
                  {(sessionsMap[selectedTicket.id] || []).length > 0 ? (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {(sessionsMap[selectedTicket.id] || []).map((ws) => (
                        <div key={ws.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                          <span>{ws.date} — {formatHours(ws.hours)}</span>
                          {ws.sentToStraTIME ? (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px]">Envoyé</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px]">Brouillon</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Aucune session enregistrée.</p>
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
          )}
        </DialogContent>
      </Dialog>

      {/* Log Work Session / StraTIME Imputation Modal */}
      <Dialog open={showLogSession} onOpenChange={setShowLogSession}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" /> Imputation StraTIME
            </DialogTitle>
          </DialogHeader>
          {sessionTicket && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">Ticket:</span> {sessionTicket.title}</div>
                <div><span className="text-muted-foreground">Projet:</span> {projectName(sessionTicket.projectId)}</div>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
              </div>
              <div>
                <Label>Heures</Label>
                <Input type="number" min={0.25} step={0.25} value={sessionHours} onChange={(e) => setSessionHours(e.target.value)} />
                {sessionHours && (
                  <p className="text-xs text-muted-foreground mt-1">
                    = {formatHours(parseFloat(sessionHours) || 0)}
                  </p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={sessionDesc} onChange={(e) => setSessionDesc(e.target.value)} rows={2} />
              </div>

              {ticketSessions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">Imputations précédentes</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ticketSessions.map((ws) => (
                      <div key={ws.id} className="flex items-center justify-between text-xs border rounded px-2 py-1">
                        <span>{ws.date} — {formatHours(ws.hours)}</span>
                        {ws.sentToStraTIME ? (
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
                <Button variant="outline" onClick={() => setShowLogSession(false)}>Annuler</Button>
                <Button
                  onClick={() => void submitSession()}
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
