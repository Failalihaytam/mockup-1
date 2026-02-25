import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import {
  AbaquesAPI,
  NotificationsAPI,
  ObjetsAPI,
  ProjectsAPI,
  TicketsAPI,
  UsersAPI,
  WorkSessionsAPI,
} from '../../services/odataClient';
import { Abaque, AbaqueEntry, DevType, Objet, Project, Ticket, TicketEvent, TicketStatus, TicketComplexite, TicketPriorite, User, WorkSession } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { ArrowDown, ArrowUp, ArrowUpDown, CalendarDays, Clock, Copy, FolderOpen, KanbanSquare, List, Plus, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Checkbox } from '../../components/ui/checkbox';
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
// Types
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'calendar' | 'kanban';

const DEV_TYPES: DevType[] = ['Formulaire', 'Report', 'Enhancement', 'Programme'];
const COMPLEXITE_OPTIONS: TicketComplexite[] = ['Simple', 'Moyen', 'Complexe', 'Très Complexe'];
const PRIORITE_OPTIONS: { value: TicketPriorite; label: string }[] = [
  { value: 0, label: 'P0 — Critique' },
  { value: 1, label: 'P1 — Haute' },
  { value: 2, label: 'P2 — Moyenne' },
  { value: 3, label: 'P3 — Basse' },
];
const SAP_MODULES = ['FI', 'CO', 'MM', 'SD', 'PP', 'PM', 'QM', 'HR', 'BC', 'ABAP', 'Fiori', 'BW', 'CRM', 'SRM'];

type SortKey = 'wricef' | 'title' | 'objet' | 'devType' | 'module' | 'complexite' | 'priorite' | 'chiffrage' | 'tempsPassé' | 'status' | 'assignedTo' | 'createdAt' | 'dueDate' | 'project';
type SortDir = 'asc' | 'desc';

const COLUMN_DEFS: { key: SortKey; label: string; defaultVisible: boolean }[] = [
  { key: 'wricef', label: 'WRICEF', defaultVisible: true },
  { key: 'title', label: 'Titre', defaultVisible: true },
  { key: 'project', label: 'Projet', defaultVisible: true },
  { key: 'objet', label: 'Objet', defaultVisible: true },
  { key: 'devType', label: 'Type de Dev', defaultVisible: true },
  { key: 'module', label: 'Module', defaultVisible: true },
  { key: 'complexite', label: 'Complexité', defaultVisible: false },
  { key: 'priorite', label: 'Priorité', defaultVisible: false },
  { key: 'chiffrage', label: 'Chiffrage', defaultVisible: false },
  { key: 'tempsPassé', label: 'Temps passé', defaultVisible: true },
  { key: 'status', label: 'Statut', defaultVisible: true },
  { key: 'assignedTo', label: 'Assigné à', defaultVisible: true },
  { key: 'createdAt', label: 'Date création', defaultVisible: false },
  { key: 'dueDate', label: 'Échéance', defaultVisible: true },
];

const DEFAULT_VISIBLE = new Set(COLUMN_DEFS.filter((c) => c.defaultVisible).map((c) => c.key));

const formatHours = (h: number): string => {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm > 0 ? `${hh}h${String(mm).padStart(2, '0')}` : `${hh}h`;
};

interface TicketForm {
  projectId: string;
  objetId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  devType: DevType;
  title: string;
  description: string;
  dueDate: string;
  chiffrage: string;
  complexite: TicketComplexite;
  priorite: TicketPriorite;
  module: string;
  chiffrageJustification: string;
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
  chiffrage: '',
  complexite: 'Moyen',
  priorite: 0,
  module: '',
  chiffrageJustification: '',
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ManagerTickets: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [objets, setObjets] = useState<Objet[]>([]);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [devTypeFilter, setDevTypeFilter] = useState<DevType | 'ALL'>('ALL');
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [complexiteFilter, setComplexiteFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [showNewObjet, setShowNewObjet] = useState(false);
  const [newObjetName, setNewObjetName] = useState('');
  const [newObjetDesc, setNewObjetDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sessionsMap, setSessionsMap] = useState<Record<string, WorkSession[]>>({});
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [visibleCols, setVisibleCols] = useState<Set<SortKey>>(() => new Set(DEFAULT_VISIBLE));
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [abaques, setAbaques] = useState<Abaque[]>([]);
  const [allAbaques, setAllAbaques] = useState<Abaque[]>([]);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projectData, userData, ticketData, objetData, sessionData, abaqueData] = await Promise.all([
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
        ObjetsAPI.getAll(),
        WorkSessionsAPI.getAll(),
        AbaquesAPI.getAll(),
      ]);
      setProjects(projectData);
      setUsers(userData);
      setObjets(objetData);
      setTickets(ticketData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setAllAbaques(abaqueData);
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

  const formObjets = useMemo(
    () => (form.projectId ? objets.filter((o) => o.projectId === form.projectId) : []),
    [objets, form.projectId],
  );

  // Load abaques for the selected project
  useEffect(() => {
    if (!form.projectId) { setAbaques([]); return; }
    AbaquesAPI.getByProject(form.projectId).then(setAbaques);
  }, [form.projectId]);

  // Abaque validation for chiffrage
  const abaqueValidation = useMemo<{ zone: 'green' | 'orange' | 'red' | 'none' | 'no-entry'; message: string; entry?: AbaqueEntry }>(() => {
    if (!form.chiffrage || !form.devType || !form.complexite) return { zone: 'none', message: '' };
    const approved = abaques.find((a) => a.approvedByClient);
    if (!approved) return { zone: 'none', message: '' };
    const entry = approved.entries.find(
      (e) => e.devType === form.devType && e.complexite === form.complexite && e.priorite === form.priorite,
    );
    if (!entry) return { zone: 'no-entry', message: 'Aucune entrée abaque pour cette combinaison' };
    const days = Number(form.chiffrage) / 8;
    if (days <= entry.standardDays) return { zone: 'green', message: `✓ Conforme (≤ ${entry.standardDays}j standard)`, entry };
    if (days <= entry.maxDays) return { zone: 'orange', message: `⚠ Supérieur au standard (${entry.standardDays}j) mais ≤ max (${entry.maxDays}j)`, entry };
    return { zone: 'red', message: `✗ Dépasse le maximum abaque (${entry.maxDays}j). Justification requise.`, entry };
  }, [form.chiffrage, form.devType, form.complexite, form.priorite, abaques]);

  // WRICEF auto-generation helper
  const generateProjectCode = (projectId: string): string => {
    const p = projects.find((pr) => pr.id === projectId);
    if (!p) return '';
    return p.code;
  };

  const getObjetCode = (objetId: string): string => {
    const o = objets.find((ob) => ob.id === objetId);
    if (!o) return '';
    return o.code;
  };

  const computeWricefSerial = (objetId: string): string => {
    const count = tickets.filter((t) => t.objetId === objetId).length;
    return String(count + 1).padStart(3, '0');
  };

  const generatedWricef = useMemo(() => {
    if (!form.projectId || !form.objetId) return '';
    const projCode = generateProjectCode(form.projectId);
    const objCode = getObjetCode(form.objetId);
    const serial = computeWricefSerial(form.objetId);
    if (!projCode || !objCode) return '';
    return `${projCode}-${objCode}-${serial}`;
  }, [form.projectId, form.objetId, projects, objets, tickets]);

  const copyWricef = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success('WRICEF copié');
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (devTypeFilter !== 'ALL' && t.devType !== devTypeFilter) return false;
      if (projectFilter !== 'ALL' && t.projectId !== projectFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (complexiteFilter !== 'ALL' && (t.complexite ?? '') !== complexiteFilter) return false;
      if (moduleFilter !== 'ALL' && (t.module ?? '') !== moduleFilter) return false;
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
  }, [tickets, statusFilter, devTypeFilter, projectFilter, priorityFilter, complexiteFilter, moduleFilter, searchQuery, projects]);

  const totalHours = useCallback((ticketId: string): number => {
    return (sessionsMap[ticketId] || []).reduce((s, ws) => s + ws.hours, 0);
  }, [sessionsMap]);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        return key;
      }
      setSortDir('asc');
      return key;
    });
  }, []);

  const toggleCol = useCallback((key: SortKey) => {
    setVisibleCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const sortedTickets = useMemo(() => {
    if (!sortKey) return filteredTickets;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filteredTickets].sort((a, b) => {
      let va: string | number = '';
      let vb: string | number = '';
      switch (sortKey) {
        case 'wricef': va = a.wricef; vb = b.wricef; break;
        case 'title': va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break;
        case 'project': va = projectName(a.projectId).toLowerCase(); vb = projectName(b.projectId).toLowerCase(); break;
        case 'objet': va = objetName(a.objetId).toLowerCase(); vb = objetName(b.objetId).toLowerCase(); break;
        case 'devType': va = a.devType ?? ''; vb = b.devType ?? ''; break;
        case 'module': va = a.module ?? ''; vb = b.module ?? ''; break;
        case 'complexite': { const ord = ['Simple', 'Moyen', 'Complexe', 'Très Complexe']; va = ord.indexOf(a.complexite ?? ''); vb = ord.indexOf(b.complexite ?? ''); break; }
        case 'priorite': va = a.priorite ?? 0; vb = b.priorite ?? 0; break;
        case 'chiffrage': va = a.chiffrage ?? 0; vb = b.chiffrage ?? 0; break;
        case 'tempsPassé': va = totalHours(a.id); vb = totalHours(b.id); break;
        case 'status': { const so = STATUS_ORDER; va = so.indexOf(a.status); vb = so.indexOf(b.status); break; }
        case 'assignedTo': va = userName(a.assignedTo).toLowerCase(); vb = userName(b.assignedTo).toLowerCase(); break;
        case 'createdAt': va = a.createdAt; vb = b.createdAt; break;
        case 'dueDate': va = a.dueDate ?? ''; vb = b.dueDate ?? ''; break;
      }
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return 0;
    });
  }, [filteredTickets, sortKey, sortDir, totalHours]);

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
    if (abaqueValidation?.zone === 'red' && !form.chiffrageJustification.trim()) {
      toast.error('Justification requise : le chiffrage dépasse le maximum de l\'abaque');
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
        chiffrage: form.chiffrage ? Number(form.chiffrage) : undefined,
        complexite: form.complexite,
        priorite: form.priorite,
        module: form.module || undefined,
        wricef: generatedWricef || `TICKET-${Date.now()}`,
        chiffrageJustification: form.chiffrageJustification.trim() || undefined,
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
      toast.success(`Status → ${newStatus.replace('_', ' ')}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  // ---------------------------------------------------------------------------
  // Calendar helpers
  // ---------------------------------------------------------------------------

  const calendarDays = useMemo(() => {
    const [y, m] = calendarMonth.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday-based
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
        title="Tickets Management"
        subtitle="View, create, and manage all tickets across projects"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
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
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Priorities</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="CRITICAL">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={complexiteFilter} onValueChange={setComplexiteFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Complexité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toute complexité</SelectItem>
              {COMPLEXITE_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={moduleFilter} onValueChange={setModuleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Module" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Modules</SelectItem>
              {SAP_MODULES.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
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

          <Popover>
            <PopoverTrigger asChild>
              <Button size="sm" variant="outline"><SlidersHorizontal className="h-4 w-4 mr-1" />Colonnes</Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <p className="text-sm font-medium mb-2">Colonnes visibles</p>
              <div className="space-y-2">
                {COLUMN_DEFS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={visibleCols.has(col.key)} onCheckedChange={() => toggleCol(col.key)} />
                    {col.label}
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex-1" />
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Ticket
          </Button>
        </div>

        {/* Views */}
        {loading ? (
          <p className="text-muted-foreground">Loading tickets...</p>
        ) : viewMode === 'list' ? (
          /* ---- LIST VIEW ---- */
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {COLUMN_DEFS.filter((c) => visibleCols.has(c.key)).map((col) => (
                    <TableHead key={col.key} className="px-3 cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(col.key)}>
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="px-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTickets.map((ticket) => {
                  const hrs = totalHours(ticket.id);
                  return (
                  <TableRow key={ticket.id} className="cursor-pointer hover:bg-accent/40" onClick={() => navigate(`/manager/tickets/${ticket.id}`)}>
                    {visibleCols.has('wricef') && (
                      <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded cursor-pointer" onClick={() => { void navigator.clipboard.writeText(ticket.wricef); toast.success('WRICEF copié'); }}>{ticket.wricef || '—'}</code>
                      </TableCell>
                    )}
                    {visibleCols.has('title') && <TableCell className="px-3 py-2 font-medium max-w-[200px] truncate">{ticket.title}</TableCell>}
                    {visibleCols.has('project') && <TableCell className="px-3 py-2 text-sm text-muted-foreground">{projectName(ticket.projectId)}</TableCell>}
                    {visibleCols.has('objet') && <TableCell className="px-3 py-2 text-xs text-muted-foreground">{objetName(ticket.objetId) || '—'}</TableCell>}
                    {visibleCols.has('devType') && (
                      <TableCell className="px-3 py-2">
                        {ticket.devType ? <Badge className={devTypeColor[ticket.devType] + ' text-[10px]'}>{ticket.devType}</Badge> : '—'}
                      </TableCell>
                    )}
                    {visibleCols.has('module') && <TableCell className="px-3 py-2 text-sm">{ticket.module || '—'}</TableCell>}
                    {visibleCols.has('complexite') && <TableCell className="px-3 py-2 text-sm">{ticket.complexite || '—'}</TableCell>}
                    {visibleCols.has('priorite') && <TableCell className="px-3 py-2 text-sm">{ticket.priorite != null ? PRIORITE_OPTIONS.find((p) => p.value === ticket.priorite)?.label ?? ticket.priorite : '—'}</TableCell>}
                    {visibleCols.has('chiffrage') && <TableCell className="px-3 py-2 text-sm font-mono">{ticket.chiffrage != null ? `${ticket.chiffrage}h` : '—'}</TableCell>}
                    {visibleCols.has('tempsPassé') && (
                      <TableCell className="px-3 py-2 text-sm font-mono">
                        {hrs > 0 ? <span className="inline-flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{formatHours(hrs)}</span> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    )}
                    {visibleCols.has('status') && (
                      <TableCell className="px-3 py-2">
                        <Badge className={statusColor[ticket.status]}>{ticket.status.replace('_', ' ')}</Badge>
                      </TableCell>
                    )}
                    {visibleCols.has('assignedTo') && <TableCell className="px-3 py-2 text-sm">{userName(ticket.assignedTo)}</TableCell>}
                    {visibleCols.has('createdAt') && <TableCell className="px-3 py-2 text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>}
                    {visibleCols.has('dueDate') && <TableCell className="px-3 py-2 text-sm">{ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : '—'}</TableCell>}
                    <TableCell className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                      {ticket.status !== 'CLOSED' && (
                        <Button size="sm" variant="outline" onClick={() => void changeStatus(ticket, 'CLOSED')}>Close</Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
                {sortedTickets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMN_DEFS.filter((c) => visibleCols.has(c.key)).length + 1} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : viewMode === 'calendar' ? (
          /* ---- CALENDAR VIEW ---- */
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
                        onClick={() => navigate(`/manager/tickets/${t.id}`)}
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
          /* ---- KANBAN VIEW ---- */
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
                        onClick={() => navigate(`/manager/tickets/${ticket.id}`)}
                        className="cursor-grab rounded-lg border bg-card p-3 shadow-sm hover:shadow transition"
                      >
                        <p className="text-sm font-medium text-foreground">{ticket.title}</p>
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

      {/* ---- Create Ticket Dialog ---- */}
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
            {/* Objet selector */}
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
                      <Button type="button" size="sm" onClick={async () => {
                        if (!form.projectId || !newObjetName.trim()) { toast.error('Project and name required'); return; }
                        try {
                          const created = await ObjetsAPI.create({ projectId: form.projectId, name: newObjetName.trim(), description: newObjetDesc.trim() || undefined });
                          setObjets((prev) => [...prev, created]);
                          setForm((prev) => ({ ...prev, objetId: created.id }));
                          setShowNewObjet(false); setNewObjetName(''); setNewObjetDesc('');
                          toast.success('Objet créé');
                        } catch { toast.error('Erreur'); }
                      }}>Créer l'objet</Button>
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

            {/* Section 2 — New fields */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Chiffrage (heures)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="0"
                  value={form.chiffrage}
                  onChange={(e) => setForm({ ...form, chiffrage: e.target.value })}
                />
                {abaqueValidation && abaqueValidation.zone !== 'none' && (
                  <p className={`text-xs mt-1 font-medium ${
                    abaqueValidation.zone === 'green' ? 'text-emerald-600' :
                    abaqueValidation.zone === 'orange' ? 'text-amber-600' :
                    abaqueValidation.zone === 'red' ? 'text-red-600' :
                    'text-muted-foreground'
                  }`}>
                    {abaqueValidation.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Complexité</Label>
                <Select value={form.complexite} onValueChange={(v) => setForm({ ...form, complexite: v as TicketComplexite })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMPLEXITE_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priorité (0–3)</Label>
                <Select value={String(form.priorite)} onValueChange={(v) => setForm({ ...form, priorite: Number(v) as TicketPriorite })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={String(p.value)}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Module SAP</Label>
                <Select value={form.module} onValueChange={(v) => setForm({ ...form, module: v })}>
                  <SelectTrigger><SelectValue placeholder="— Sélectionner —" /></SelectTrigger>
                  <SelectContent>
                    {SAP_MODULES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Justification for red-zone abaque deviation */}
            {abaqueValidation?.zone === 'red' && (
              <div>
                <Label className="text-red-600">Justification du dépassement *</Label>
                <Textarea
                  placeholder="Ce chiffrage dépasse le maximum de l'abaque. Veuillez justifier..."
                  value={form.chiffrageJustification}
                  onChange={(e) => setForm({ ...form, chiffrageJustification: e.target.value })}
                  className="border-red-300 focus:border-red-500"
                  rows={2}
                />
              </div>
            )}
            <div>
              <Label>WRICEF (auto-generated)</Label>
              <div className="flex items-center gap-2 mt-1 rounded-lg border border-border p-2 bg-muted/30">
                <code className="font-mono text-sm flex-1 truncate">{generatedWricef || 'Select project & objet'}</code>
                {generatedWricef && (
                  <Button type="button" size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={copyWricef}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
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
                  {users.filter((u) => u.role !== 'ADMIN').map((u) => (
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
    </div>
  );
};
