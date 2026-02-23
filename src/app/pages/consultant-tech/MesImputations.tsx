import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectsAPI, TicketsAPI, WorkSessionsAPI } from '../../services/odataClient';
import { Project, Ticket, WorkSession } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle, CheckCircle2, Clock, Filter, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatHours = (h: number): string => {
  if (h >= 1) return `${h}h`;
  return `${Math.round(h * 60)}min`;
};

const startOfWeek = (): string => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
};

const startOfMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const MesImputations: React.FC = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'PENDING'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logData, projectData, ticketData] = await Promise.all([
        WorkSessionsAPI.getByConsultant(currentUser!.id),
        ProjectsAPI.getAll(),
        TicketsAPI.getAll(),
      ]);
      setSessions(logData.sort((a, b) => b.date.localeCompare(a.date)));
      setProjects(projectData);
      setTickets(ticketData);
    } finally {
      setLoading(false);
    }
  };

  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const ticketTitle = (id: string) => tickets.find((t) => t.id === id)?.title ?? id;

  const filteredLogs = useMemo(() => {
    return sessions.filter((tl) => {
      if (projectFilter !== 'ALL' && tl.projectId !== projectFilter) return false;
      if (statusFilter === 'SENT' && !tl.sentToStraTIME) return false;
      if (statusFilter === 'PENDING' && tl.sentToStraTIME) return false;
      if (dateFrom && tl.date < dateFrom) return false;
      if (dateTo && tl.date > dateTo) return false;
      return true;
    });
  }, [sessions, projectFilter, statusFilter, dateFrom, dateTo]);

  // Summary stats
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();

  const hoursThisWeek = useMemo(
    () => sessions.filter((tl) => tl.date >= weekStart).reduce((s, tl) => s + tl.hours, 0),
    [sessions, weekStart],
  );
  const hoursThisMonth = useMemo(
    () => sessions.filter((tl) => tl.date >= monthStart).reduce((s, tl) => s + tl.hours, 0),
    [sessions, monthStart],
  );
  const pendingCount = useMemo(
    () => sessions.filter((tl) => !tl.sentToStraTIME).length,
    [sessions],
  );
  const totalHours = useMemo(
    () => filteredLogs.reduce((s, tl) => s + tl.hours, 0),
    [filteredLogs],
  );

  const sendToStraTIME = async (log: WorkSession) => {
    try {
      setSendingId(log.id);
      const updated = await WorkSessionsAPI.sendToStraTIME(log.id);
      setSessions((prev) => prev.map((tl) => (tl.id === log.id ? updated : tl)));
      toast.success('Imputation envoyée à StraTIME');
    } catch {
      toast.error("Erreur d'envoi");
    } finally {
      setSendingId(null);
    }
  };

  // Unique projects in user's logs
  const logProjects = useMemo(() => {
    const ids = [...new Set(sessions.map((tl) => tl.projectId))];
    return ids.map((id) => ({ id, name: projectName(id) }));
  }, [sessions, projects]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Mes Imputations"
        subtitle="Historique et envoi de vos temps vers StraTIME"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-tech/dashboard' },
          { label: 'Imputations' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Cette semaine
            </div>
            <p className="text-2xl font-bold">{formatHours(hoursThisWeek)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Ce mois
            </div>
            <p className="text-2xl font-bold">{formatHours(hoursThisMonth)}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Total envoyé
            </div>
            <p className="text-2xl font-bold">
              {formatHours(sessions.filter((tl) => tl.sentToStraTIME).reduce((s, tl) => s + tl.hours, 0))}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {pendingCount > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              Non envoyées
            </div>
            <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {pendingCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Tous les projets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les projets</SelectItem>
              {logProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="SENT">Envoyées</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            className="w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="Du"
          />
          <Input
            type="date"
            className="w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="Au"
          />
          {(projectFilter !== 'ALL' || statusFilter !== 'ALL' || dateFrom || dateTo) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setProjectFilter('ALL');
                setStatusFilter('ALL');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Réinitialiser
            </Button>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="px-4">Date</TableHead>
                  <TableHead className="px-4">Projet</TableHead>
                  <TableHead className="px-4">Ticket</TableHead>
                  <TableHead className="px-4">Durée</TableHead>
                  <TableHead className="px-4">Description</TableHead>
                  <TableHead className="px-4">Statut</TableHead>
                  <TableHead className="px-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="px-4 py-3 text-sm">{log.date}</TableCell>
                    <TableCell className="px-4 py-3 text-sm">{projectName(log.projectId)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium">{ticketTitle(log.ticketId)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-mono">{formatHours(log.hours)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.description || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {log.sentToStraTIME ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                          <CheckCircle2 className="h-3 w-3 mr-0.5" /> Envoyé
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {!log.sentToStraTIME && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400"
                          disabled={sendingId === log.id}
                          onClick={() => void sendToStraTIME(log)}
                        >
                          {sendingId === log.id ? (
                            <Clock className="h-3 w-3 animate-spin" />
                          ) : (
                            <><Send className="h-3 w-3 mr-1" /> Envoyer</>
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Aucune imputation trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filteredLogs.length > 0 && (
              <div className="border-t px-4 py-2 text-sm text-muted-foreground flex justify-between">
                <span>{filteredLogs.length} imputation(s)</span>
                <span className="font-medium">Total: {formatHours(totalHours)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
