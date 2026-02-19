import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectsAPI, TicketsAPI, TimeLogsAPI, UsersAPI } from '../../services/odataClient';
import { Project, Ticket, TimeLog, User } from '../../types/entities';
import { AlertTriangle, CheckCircle2, Clock, Filter, Users as UsersIcon } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
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
import { Button } from '../../components/ui/button';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatMin = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}min`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ImputationsEquipe: React.FC = () => {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [consultantFilter, setConsultantFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logData, userData, projectData, ticketData] = await Promise.all([
        TimeLogsAPI.getAll(),
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        TicketsAPI.getAll(),
      ]);
      setTimeLogs(logData.sort((a, b) => b.date.localeCompare(a.date)));
      setUsers(userData);
      setProjects(projectData);
      setTickets(ticketData);
    } finally {
      setLoading(false);
    }
  };

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;
  const ticketTitle = (id: string) => tickets.find((t) => t.id === id)?.title ?? id;

  const consultants = useMemo(() => {
    const ids = [...new Set(timeLogs.map((tl) => tl.consultantId))];
    return ids.map((id) => ({ id, name: userName(id) }));
  }, [timeLogs, users]);

  const logProjects = useMemo(() => {
    const ids = [...new Set(timeLogs.map((tl) => tl.projectId))];
    return ids.map((id) => ({ id, name: projectName(id) }));
  }, [timeLogs, projects]);

  const filteredLogs = useMemo(() => {
    return timeLogs.filter((tl) => {
      if (consultantFilter !== 'ALL' && tl.consultantId !== consultantFilter) return false;
      if (projectFilter !== 'ALL' && tl.projectId !== projectFilter) return false;
      if (dateFrom && tl.date < dateFrom) return false;
      if (dateTo && tl.date > dateTo) return false;
      return true;
    });
  }, [timeLogs, consultantFilter, projectFilter, dateFrom, dateTo]);

  // Summary per consultant
  const consultantSummary = useMemo(() => {
    const map: Record<string, { total: number; sent: number; pending: number }> = {};
    timeLogs.forEach((tl) => {
      if (!map[tl.consultantId]) map[tl.consultantId] = { total: 0, sent: 0, pending: 0 };
      map[tl.consultantId].total += tl.durationMinutes;
      if (tl.sentToStraTIME) map[tl.consultantId].sent += tl.durationMinutes;
      else map[tl.consultantId].pending += tl.durationMinutes;
    });
    return Object.entries(map).map(([id, stats]) => ({
      id, name: userName(id), ...stats,
    }));
  }, [timeLogs, users]);

  // Summary per project
  const projectSummary = useMemo(() => {
    const map: Record<string, { total: number; sent: number }> = {};
    filteredLogs.forEach((tl) => {
      if (!map[tl.projectId]) map[tl.projectId] = { total: 0, sent: 0 };
      map[tl.projectId].total += tl.durationMinutes;
      if (tl.sentToStraTIME) map[tl.projectId].sent += tl.durationMinutes;
    });
    return Object.entries(map)
      .map(([id, stats]) => ({ id, name: projectName(id), ...stats }))
      .sort((a, b) => b.total - a.total);
  }, [filteredLogs, projects]);

  const totalFiltered = useMemo(
    () => filteredLogs.reduce((s, tl) => s + tl.durationMinutes, 0),
    [filteredLogs],
  );
  const pendingTotal = useMemo(
    () => timeLogs.filter((tl) => !tl.sentToStraTIME).reduce((s, tl) => s + tl.durationMinutes, 0),
    [timeLogs],
  );

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Imputations Équipe"
        subtitle="Vue d'ensemble des temps imputés par l'équipe dans StraTIME"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Imputations Équipe' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Top-level summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <UsersIcon className="h-4 w-4" /> Consultants
            </div>
            <p className="text-2xl font-bold">{consultantSummary.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Total imputé
            </div>
            <p className="text-2xl font-bold">
              {formatMin(timeLogs.reduce((s, tl) => s + tl.durationMinutes, 0))}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Envoyé StraTIME
            </div>
            <p className="text-2xl font-bold">
              {formatMin(timeLogs.filter((tl) => tl.sentToStraTIME).reduce((s, tl) => s + tl.durationMinutes, 0))}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              {pendingTotal > 0 ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              Non envoyé
            </div>
            <p className={`text-2xl font-bold ${pendingTotal > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {formatMin(pendingTotal)}
            </p>
          </div>
        </div>

        {/* Consultant breakdown */}
        <div className="rounded-lg border bg-card">
          <div className="px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Récapitulatif par consultant</h3>
          </div>
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="px-4">Consultant</TableHead>
                <TableHead className="px-4">Total</TableHead>
                <TableHead className="px-4">Envoyé</TableHead>
                <TableHead className="px-4">En attente</TableHead>
                <TableHead className="px-4">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consultantSummary.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="px-4 py-3 font-medium">{c.name}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm">{formatMin(c.total)}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm text-emerald-600 dark:text-emerald-400">{formatMin(c.sent)}</TableCell>
                  <TableCell className="px-4 py-3 font-mono text-sm">
                    {c.pending > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400">{formatMin(c.pending)}</span>
                    ) : (
                      <span className="text-muted-foreground">0min</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    {c.pending > 0 ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-300 dark:text-amber-400">
                        <AlertTriangle className="h-3 w-3 mr-0.5" /> Incomplet
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3 mr-0.5" /> Complet
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {consultantSummary.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-16 text-center text-muted-foreground">Aucune données.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Breakdown by project */}
        {projectSummary.length > 0 && (
          <div className="rounded-lg border bg-card">
            <div className="px-4 py-3 border-b">
              <h3 className="text-sm font-semibold">Répartition par projet</h3>
            </div>
            <div className="p-4 space-y-2">
              {projectSummary.map((p) => {
                const pct = p.total > 0 ? Math.round((p.sent / p.total) * 100) : 0;
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-sm w-48 truncate font-medium">{p.name}</span>
                    <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right">{formatMin(p.total)}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 w-12 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed logs with filters */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Détail des imputations</h3>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={consultantFilter} onValueChange={setConsultantFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les consultants" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les consultants</SelectItem>
                {consultants.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les projets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les projets</SelectItem>
                {logProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            {(consultantFilter !== 'ALL' || projectFilter !== 'ALL' || dateFrom || dateTo) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setConsultantFilter('ALL'); setProjectFilter('ALL'); setDateFrom(''); setDateTo(''); }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <div className="rounded-lg border bg-card overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="px-4">Date</TableHead>
                    <TableHead className="px-4">Consultant</TableHead>
                    <TableHead className="px-4">Projet</TableHead>
                    <TableHead className="px-4">Ticket</TableHead>
                    <TableHead className="px-4">Durée</TableHead>
                    <TableHead className="px-4">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="px-4 py-3 text-sm">{log.date}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-medium">{userName(log.consultantId)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{projectName(log.projectId)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{ticketTitle(log.ticketId)}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-mono">{formatMin(log.durationMinutes)}</TableCell>
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
                    </TableRow>
                  ))}
                  {filteredLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Aucune imputation trouvée.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredLogs.length > 0 && (
                <div className="border-t px-4 py-2 text-sm text-muted-foreground flex justify-between">
                  <span>{filteredLogs.length} imputation(s)</span>
                  <span className="font-medium">Total: {formatMin(totalFiltered)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
