import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import {
  TicketsAPI,
  ProjectsAPI,
  ObjetsAPI,
  UsersAPI,
  WorkSessionsAPI,
  AbaquesAPI,
} from '../../services/odataClient';
import type {
  Ticket,
  Project,
  Objet,
  User,
  WorkSession,
  Abaque,
  AbaqueEntry,
  TicketStatus,
  TicketEvent,
  ActivityEvent,
  DevType,
  UserRole,
} from '../../types/entities';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Textarea } from '../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Send,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Colors / Constants
// ---------------------------------------------------------------------------

const STATUS_ORDER: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_FEEDBACK', 'RESOLVED', 'CLOSED'];

const statusColor: Record<TicketStatus, string> = {
  OPEN: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  WAITING_FEEDBACK: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  CLOSED: 'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-300',
};

const statusLabel: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_FEEDBACK: 'Waiting Feedback',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
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

const ROLE_AVATAR_BG: Record<string, string> = {
  CONSULTANT_TECHNIQUE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  CONSULTANT_FONCTIONNEL: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  COORDINATEUR_DEV: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  CHEF_DE_PROJET: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
  ADMIN: 'bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300',
};

const EVENT_DOT: Record<string, string> = {
  status_change: 'bg-blue-500',
  assignee_change: 'bg-purple-500',
  message_sent: 'bg-gray-400',
  work_session_logged: 'bg-green-500',
  chiffrage_updated: 'bg-orange-500',
  abaque_exceeded: 'bg-orange-500',
  ticket_created: 'bg-yellow-500',
  priority_change: 'bg-yellow-500',
  straTIME_sent: 'bg-teal-500',
  comment_added: 'bg-gray-400',
};

const formatHours = (h: number): string => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm > 0 ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
};

const relativeTime = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days}j`;
  const months = Math.floor(days / 30);
  return `il y a ${months} mois`;
};

const initials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/** Get the role-aware base path for the current user */
const roleBasePath = (role: UserRole): string => {
  switch (role) {
    case 'MANAGER': return '/manager';
    case 'CONSULTANT_TECHNIQUE': return '/consultant-tech';
    case 'CONSULTANT_FONCTIONNEL': return '/consultant-func';
    case 'COORDINATEUR_DEV': return '/coordinateur';
    case 'CHEF_DE_PROJET': return '/chef-projet';
    case 'ADMIN': return '/admin';
    default: return '/';
  }
};

/** Roles that can change ticket status */
const canChangeStatus = (role: UserRole): boolean =>
  ['MANAGER', 'COORDINATEUR_DEV', 'CONSULTANT_TECHNIQUE'].includes(role);

/** Get allowed status transitions per role */
const allowedTransitions = (current: TicketStatus, role: UserRole): TicketStatus[] => {
  if (current === 'CLOSED') return [];
  if (role === 'CONSULTANT_TECHNIQUE') {
    // Tech can move to In Progress, Waiting Feedback, Resolved, or Blocked
    return STATUS_ORDER.filter((s) => s !== current && s !== 'CLOSED');
  }
  // Manager / Coordinateur can do anything
  return STATUS_ORDER.filter((s) => s !== current);
};

/** Roles that can reassign */
const canReassign = (role: UserRole): boolean =>
  ['MANAGER', 'COORDINATEUR_DEV'].includes(role);

/** Roles that can log work sessions */
const canLogWork = (role: UserRole): boolean =>
  ['CONSULTANT_TECHNIQUE', 'MANAGER', 'COORDINATEUR_DEV'].includes(role);

/** Roles that can edit title inline */
const canEditTitle = (role: UserRole): boolean =>
  ['MANAGER', 'COORDINATEUR_DEV'].includes(role);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const TicketDetailPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const role = currentUser?.role ?? 'CONSULTANT_TECHNIQUE';
  const basePath = roleBasePath(role);

  // Data
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [objet, setObjet] = useState<Objet | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [allAbaques, setAllAbaques] = useState<Abaque[]>([]);
  const [loading, setLoading] = useState(true);

  // Activity
  const [activityFeed, setActivityFeed] = useState<ActivityEvent[]>([]);
  const activityFeedRef = useRef<ActivityEvent[]>([]);

  // Work session form
  const [showLogForm, setShowLogForm] = useState(false);
  const [wsDate, setWsDate] = useState('');
  const [wsHours, setWsHours] = useState('');
  const [wsDesc, setWsDesc] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');

  // Status dropdown
  const [showStatusDrop, setShowStatusDrop] = useState(false);

  // ---------------------------------------------------------------------------
  // Load data
  // ---------------------------------------------------------------------------

  useEffect(() => {
    void loadData();
  }, [ticketId]);

  const loadData = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [allTickets, allProjects, allObjets, allUsers, allSessions, abaqueData] = await Promise.all([
        TicketsAPI.getAll(),
        ProjectsAPI.getAll(),
        ObjetsAPI.getAll(),
        UsersAPI.getAll(),
        WorkSessionsAPI.getAll(),
        AbaquesAPI.getAll(),
      ]);
      const found = allTickets.find((t) => t.id === ticketId);
      if (!found) {
        toast.error('Ticket introuvable');
        navigate(-1);
        return;
      }
      setTicket(found);
      setProject(allProjects.find((p) => p.id === found.projectId) ?? null);
      setObjet(allObjets.find((o) => o.id === found.objetId) ?? null);
      setUsers(allUsers);
      setAllAbaques(abaqueData);

      const ticketSessions = allSessions.filter((ws) => ws.ticketId === found.id);
      setSessions(ticketSessions);

      // Hydrate activity from ticket
      const hydratedFeed = found.activityFeed ?? [];
      setActivityFeed(hydratedFeed);
      activityFeedRef.current = hydratedFeed;
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const userName = useCallback(
    (id?: string) => users.find((u) => u.id === id)?.name ?? '—',
    [users],
  );
  const userRole = useCallback(
    (id?: string) => users.find((u) => u.id === id)?.role ?? '',
    [users],
  );

  const totalHours = useMemo(
    () => sessions.reduce((s, ws) => s + ws.hours, 0),
    [sessions],
  );

  // Abaque reference
  const abaqueRef = useMemo(() => {
    if (!ticket) return null;
    const approved = allAbaques.find(
      (a) => a.projectId === ticket.projectId && a.approvedByClient,
    );
    if (!approved) return null;
    const entry = approved.entries.find(
      (e: AbaqueEntry) =>
        e.devType === ticket.devType &&
        e.complexite === ticket.complexite &&
        e.priorite === ticket.priorite,
    );
    if (!entry) return null;
    const chiffrageDays = ticket.chiffrage ? ticket.chiffrage / 8 : 0;
    const chiffrageHours = ticket.chiffrage ?? 0;
    const progressPct =
      chiffrageHours > 0
        ? Math.min(Math.round((totalHours / chiffrageHours) * 100), 150)
        : 0;
    const zone: 'green' | 'orange' | 'red' =
      chiffrageDays <= entry.standardDays
        ? 'green'
        : chiffrageDays <= entry.maxDays
          ? 'orange'
          : 'red';
    const isClosed =
      ticket.status === 'CLOSED' || ticket.status === 'RESOLVED';
    const hoursLoggedDays = totalHours / 8;
    const finalDeviation = isClosed
      ? +(hoursLoggedDays - entry.standardDays).toFixed(1)
      : null;
    return {
      entry,
      approved,
      zone,
      chiffrageDays,
      progressPct,
      totalHours,
      finalDeviation,
      isClosed,
    };
  }, [ticket, allAbaques, totalHours]);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const addActivity = useCallback(
    (
      type: ActivityEvent['type'],
      description: string,
      metadata?: Record<string, unknown>,
    ) => {
      if (!currentUser || !ticket) return;
      const evt: ActivityEvent = {
        id: `ae${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        ticketId: ticket.id,
        type,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        description,
        metadata,
        occurredAt: new Date().toISOString(),
      };
      setActivityFeed((prev) => {
        const updated = [evt, ...prev];
        activityFeedRef.current = updated;
        return updated;
      });
      // Persist using ref (always has the latest feed, not stale closure)
      void TicketsAPI.update(ticket.id, { activityFeed: activityFeedRef.current });
    },
    [currentUser, ticket],
  );

  const changeStatus = async (newStatus: TicketStatus) => {
    if (!currentUser || !ticket) return;
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
      setTicket(updated);
      setShowStatusDrop(false);
      addActivity(
        'status_change',
        `${currentUser.name} a changé le statut de ${statusLabel[ticket.status]} → ${statusLabel[newStatus]}`,
        { from: ticket.status, to: newStatus },
      );
      toast.success(`Statut → ${statusLabel[newStatus]}`);
    } catch {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const reassign = async (userId: string) => {
    if (!currentUser || !ticket) return;
    const event: TicketEvent = {
      id: `te${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      action: 'ASSIGNED',
      fromValue: ticket.assignedTo,
      toValue: userId,
    };
    try {
      const updated = await TicketsAPI.update(ticket.id, {
        assignedTo: userId,
        history: [...(ticket.history || []), event],
      });
      setTicket(updated);
      const assigneeName = userName(userId);
      addActivity(
        'assignee_change',
        `${currentUser.name} a réassigné le ticket à ${assigneeName}`,
        { from: ticket.assignedTo, to: userId },
      );
      toast.success(`Assigné à ${assigneeName}`);
    } catch {
      toast.error('Erreur lors de la réassignation');
    }
  };

  const saveTitle = async () => {
    if (!ticket || !titleDraft.trim()) return;
    try {
      const updated = await TicketsAPI.update(ticket.id, {
        title: titleDraft.trim(),
      });
      setTicket(updated);
      setEditingTitle(false);
      toast.success('Titre mis à jour');
    } catch {
      toast.error('Erreur');
    }
  };

  const submitWorkSession = async () => {
    if (!currentUser || !ticket) return;
    if (!wsDate || !wsHours || parseFloat(wsHours) <= 0) {
      toast.error('Date et heures requises');
      return;
    }
    setIsSending(true);
    try {
      const wsData = {
        consultantId: currentUser.id,
        ticketId: ticket.id,
        projectId: ticket.projectId,
        date: wsDate,
        hours: parseFloat(wsHours),
        description: wsDesc.trim() || undefined,
        sentToStraTIME: true,
        sentAt: new Date().toISOString(),
      };
      const created = await WorkSessionsAPI.create(wsData);
      setSessions((prev) => [...prev, created]);
      setShowLogForm(false);
      setWsDate('');
      setWsHours('');
      setWsDesc('');

      addActivity(
        'work_session_logged',
        `${currentUser.name} a loggué ${formatHours(created.hours)} de travail`,
        { hours: created.hours, date: created.date },
      );
      addActivity(
        'straTIME_sent',
        `Imputations envoyées à StraTIME par ${currentUser.name} — ${formatHours(created.hours)}`,
        { hours: created.hours },
      );
      toast.success(`${formatHours(created.hours)} envoyées à StraTIME`);
    } catch {
      toast.error('Erreur');
    } finally {
      setIsSending(false);
    }
  };

  const copyWricef = () => {
    if (!ticket) return;
    void navigator.clipboard.writeText(ticket.wricef);
    toast.success('WRICEF copié');
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Ticket introuvable</h1>
        <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Retour
        </Button>
      </div>
    );
  }

  const isOverdue =
    ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED';
  const chiffrageProgress =
    ticket.chiffrage && ticket.chiffrage > 0
      ? Math.min(Math.round((totalHours / ticket.chiffrage) * 100), 150)
      : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Button>
        <div className="flex items-center gap-2 min-w-0">
          <code
            className="font-mono text-sm bg-muted px-2 py-0.5 rounded cursor-pointer shrink-0"
            onClick={copyWricef}
            title="Cliquer pour copier"
          >
            {ticket.wricef}
          </code>
          <Copy
            className="h-3.5 w-3.5 text-muted-foreground cursor-pointer shrink-0"
            onClick={copyWricef}
          />
        </div>
        {/* Status badge with dropdown */}
        <div className="relative ml-auto shrink-0">
          {canChangeStatus(role) && ticket.status !== 'CLOSED' ? (
            <>
              <Badge
                className={`${statusColor[ticket.status]} cursor-pointer`}
                onClick={() => setShowStatusDrop(!showStatusDrop)}
              >
                {statusLabel[ticket.status]} ▾
              </Badge>
              {showStatusDrop && (
                <div className="absolute right-0 top-full mt-1 z-50 rounded-lg border bg-popover p-1 shadow-lg min-w-[180px]">
                  {allowedTransitions(ticket.status, role).map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-3 py-1.5 rounded text-sm hover:bg-accent transition-colors"
                      onClick={() => void changeStatus(s)}
                    >
                      → {statusLabel[s]}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Badge className={statusColor[ticket.status]}>
              {statusLabel[ticket.status]}
            </Badge>
          )}
        </div>
      </div>

      {/* Two or three-column layout depending on role */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-0 overflow-hidden">
        {/* ================================================================
            LEFT COLUMN — Ticket Info
        ================================================================ */}
        <ScrollArea className="h-[calc(100vh-8rem)] border-r">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex gap-2">
                  <Input
                    className="text-xl font-bold"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void saveTitle();
                      if (e.key === 'Escape') setEditingTitle(false);
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => void saveTitle()}>
                    OK
                  </Button>
                </div>
              ) : (
                <h1
                  className={`text-xl font-bold ${canEditTitle(role) ? 'cursor-pointer hover:text-primary' : ''}`}
                  onClick={() => {
                    if (canEditTitle(role)) {
                      setTitleDraft(ticket.title);
                      setEditingTitle(true);
                    }
                  }}
                >
                  {ticket.title}
                </h1>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.description}
              </p>
            </div>

            {/* Badges row */}
            <div className="flex flex-wrap gap-2">
              <Badge className={priorityColor[ticket.priority]}>
                {ticket.priority}
              </Badge>
              {ticket.devType && (
                <Badge className={devTypeColor[ticket.devType]}>
                  {ticket.devType}
                </Badge>
              )}
              {ticket.complexite && (
                <Badge variant="outline">{ticket.complexite}</Badge>
              )}
              {ticket.priorite != null && (
                <Badge variant="outline">
                  P{ticket.priorite}
                </Badge>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <span className="text-muted-foreground text-xs">Projet</span>
                <p
                  className="font-medium text-primary cursor-pointer hover:underline"
                  onClick={() => {
                    if (project) navigate(`${basePath}/projects/${project.id}`);
                  }}
                >
                  {project?.name ?? ticket.projectId}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Objet</span>
                <p
                  className={`font-medium ${objet ? 'text-primary cursor-pointer hover:underline' : ''}`}
                  onClick={() => {
                    if (objet) navigate(`${basePath}/objets/${objet.id}`);
                  }}
                >
                  {objet?.name ?? '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Type de Dev
                </span>
                <p className="font-medium">{ticket.devType ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Complexité
                </span>
                <p className="font-medium">{ticket.complexite ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Priorité</span>
                <p className="font-medium">
                  {ticket.priorite != null
                    ? `P${ticket.priorite} — ${['Critique', 'Haute', 'Moyenne', 'Basse'][ticket.priorite]}`
                    : '—'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Module</span>
                <p className="font-medium">{ticket.module ?? '—'}</p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Chiffrage</span>
                <p className="font-medium">
                  {ticket.chiffrage != null ? `${ticket.chiffrage}h` : '—'}
                  {abaqueRef && (
                    <span
                      className={`ml-2 inline-block w-2 h-2 rounded-full ${
                        abaqueRef.zone === 'green'
                          ? 'bg-emerald-500'
                          : abaqueRef.zone === 'orange'
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                      }`}
                    />
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">
                  Date de création
                </span>
                <p className="font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Échéance</span>
                <p
                  className={`font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : ''}`}
                >
                  {ticket.dueDate
                    ? new Date(ticket.dueDate).toLocaleDateString('fr-FR')
                    : '—'}
                  {isOverdue && ' ⚠️'}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground text-xs">Assigné à</span>
                {canReassign(role) ? (
                  <Select
                    value={ticket.assignedTo ?? ''}
                    onValueChange={(v) => void reassign(v)}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Non assigné" />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(
                          (u) =>
                            u.role === 'CONSULTANT_TECHNIQUE' ||
                            u.role === 'COORDINATEUR_DEV',
                        )
                        .map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${ROLE_AVATAR_BG[userRole(ticket.assignedTo)] ?? 'bg-muted'}`}
                    >
                      {ticket.assignedTo
                        ? initials(userName(ticket.assignedTo))
                        : '?'}
                    </div>
                    <p className="font-medium">
                      {userName(ticket.assignedTo)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Abaque Reference Panel */}
            {abaqueRef && (
              <div
                className={`rounded-lg border p-4 ${
                  abaqueRef.zone === 'green'
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
                    : abaqueRef.zone === 'orange'
                      ? 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
                      : 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-semibold">
                    Référence Abaque
                  </span>
                  <Badge variant="outline" className="text-[10px]">
                    v{abaqueRef.approved.version}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Standard:</span>{' '}
                    <span className="font-medium">
                      {abaqueRef.entry.standardDays}j
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max:</span>{' '}
                    <span className="font-medium">
                      {abaqueRef.entry.maxDays}j
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Chiffré:</span>{' '}
                    <span
                      className={`font-medium ${
                        abaqueRef.zone === 'green'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : abaqueRef.zone === 'orange'
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {abaqueRef.chiffrageDays.toFixed(1)}j
                    </span>
                  </div>
                </div>
                {ticket.chiffrage && abaqueRef.progressPct > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Progression temps passé
                      </span>
                      <span className="font-medium">
                        {abaqueRef.progressPct}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(abaqueRef.progressPct, 100)}
                      className="h-2"
                    />
                  </div>
                )}
                {abaqueRef.isClosed && abaqueRef.finalDeviation !== null && (
                  <div className="mt-2 text-xs font-medium">
                    Écart final :{' '}
                    <span
                      className={
                        abaqueRef.finalDeviation > 0
                          ? 'text-red-600'
                          : 'text-emerald-600'
                      }
                    >
                      {abaqueRef.finalDeviation > 0 ? '+' : ''}
                      {abaqueRef.finalDeviation}j
                    </span>{' '}
                    vs standard
                  </div>
                )}
                {ticket.chiffrageJustification && (
                  <div className="mt-2 text-xs border-t pt-2">
                    <span className="text-muted-foreground">
                      Justification :
                    </span>{' '}
                    {ticket.chiffrageJustification}
                  </div>
                )}
              </div>
            )}

            {/* Work Sessions Section */}
            {canLogWork(role) && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">
                      Sessions de travail
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowLogForm(!showLogForm)}
                  >
                    <Send className="h-3 w-3 mr-1" /> Logger des heures
                  </Button>
                </div>

                {/* Progress bar */}
                {ticket.chiffrage && ticket.chiffrage > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {formatHours(totalHours)} / {ticket.chiffrage}h
                      </span>
                      <span className="font-medium">{chiffrageProgress}%</span>
                    </div>
                    <Progress
                      value={Math.min(chiffrageProgress, 100)}
                      className="h-2"
                    />
                  </div>
                )}

                {/* Log form */}
                {showLogForm && (
                  <div className="rounded-lg border bg-background p-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Date</Label>
                        <Input
                          type="date"
                          value={wsDate}
                          onChange={(e) => setWsDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Heures</Label>
                        <Input
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={wsHours}
                          onChange={(e) => setWsHours(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        rows={2}
                        value={wsDesc}
                        onChange={(e) => setWsDesc(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowLogForm(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => void submitWorkSession()}
                        disabled={isSending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSending ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 animate-spin" /> Envoi…
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Send className="h-3 w-3" /> Envoyer à StraTIME
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Session list */}
                {sessions.length > 0 ? (
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {sessions.map((ws) => (
                      <div
                        key={ws.id}
                        className="flex items-center justify-between text-xs border rounded px-2 py-1"
                      >
                        <span>
                          {ws.date} — {formatHours(ws.hours)}
                          {ws.description && (
                            <span className="text-muted-foreground ml-1">
                              ({ws.description})
                            </span>
                          )}
                        </span>
                        {ws.sentToStraTIME ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px]">
                            Envoyé
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">
                            Brouillon
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Aucune session enregistrée.
                  </p>
                )}
              </div>
            )}

            {/* Chiffrage Justification */}
            {ticket.chiffrageJustification && !abaqueRef && (
              <div className="rounded-lg border p-3">
                <span className="text-xs text-muted-foreground">
                  Justification du chiffrage :
                </span>
                <p className="text-sm mt-1">
                  {ticket.chiffrageJustification}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ================================================================
            RIGHT COLUMN — Fil d'Activité
        ================================================================ */}
        <div className="flex flex-col h-[calc(100vh-8rem)]">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Fil d'activité</span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {activityFeed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Aucune activité enregistrée.
                </p>
              )}
              {activityFeed.map((evt) => (
                <div key={evt.id} className="flex gap-3 group">
                  {/* Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${EVENT_DOT[evt.type] ?? 'bg-gray-400'}`}
                    />
                    <div className="w-px flex-1 bg-border group-last:hidden" />
                  </div>
                  {/* Content */}
                  <div className="pb-4 min-w-0">
                    <p className="text-xs leading-relaxed">
                      {evt.description}
                    </p>
                    <p
                      className="text-[10px] text-muted-foreground mt-0.5"
                      title={new Date(evt.occurredAt).toLocaleString('fr-FR')}
                    >
                      {relativeTime(evt.occurredAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
