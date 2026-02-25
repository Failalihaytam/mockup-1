import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { AbaquesAPI, ImputationPeriodsAPI, ProjectsAPI, TicketsAPI, UsersAPI, WorkSessionsAPI } from '../../services/odataClient';
import { Abaque, ImputationPeriod, Project, Ticket, User, WorkSession } from '../../types/entities';
import { CheckCircle2, Clock, FileWarning, Send, Users as UsersIcon } from 'lucide-react';
import { Badge } from '../../components/ui/badge';

export const ChefProjetDashboard: React.FC = () => {
  const [periods, setPeriods] = useState<ImputationPeriod[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [allAbaques, setAllAbaques] = useState<Abaque[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, uData, prData, sData, tData, aData] = await Promise.all([
        ImputationPeriodsAPI.getAll(),
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        WorkSessionsAPI.getAll(),
        TicketsAPI.getAll(),
        AbaquesAPI.getAll(),
      ]);
      setPeriods(pData);
      setUsers(uData);
      setProjects(prData);
      setSessions(sData);
      setAllTickets(tData);
      setAllAbaques(aData);
    } finally {
      setLoading(false);
    }
  };

  const consultants = useMemo(
    () => users.filter((u) => ['CONSULTANT_TECHNIQUE', 'CONSULTANT_FONCTIONNEL', 'COORDINATEUR_DEV'].includes(u.role)),
    [users],
  );

  const pendingValidation = useMemo(
    () => periods.filter((p) => p.status === 'sent' || p.status === 'pending'),
    [periods],
  );

  const validated = useMemo(
    () => periods.filter((p) => p.status === 'validated'),
    [periods],
  );

  const totalHoursThisMonth = useMemo(() => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return sessions
      .filter((s) => s.date.startsWith(month))
      .reduce((sum, s) => sum + s.hours, 0);
  }, [sessions]);

  const userName = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  // Abaque conformity & deviation metrics
  const abaqueMetrics = useMemo(() => {
    let conformes = 0;
    let depassements = 0;
    let total = 0;
    let totalDeviation = 0;

    allTickets.forEach((ticket) => {
      if (!ticket.chiffrage || !ticket.devType || !ticket.complexite) return;
      const approved = allAbaques.find((a) => a.projectId === ticket.projectId && a.approvedByClient);
      if (!approved) return;
      const entry = approved.entries.find(
        (e) => e.devType === ticket.devType && e.complexite === ticket.complexite && e.priorite === ticket.priorite,
      );
      if (!entry) return;
      total++;
      const days = ticket.chiffrage / 8;
      totalDeviation += Math.abs(days - entry.standardDays);
      if (days <= entry.standardDays) conformes++;
      if (days > entry.maxDays) depassements++;
    });

    const rate = total > 0 ? Math.round((conformes / total) * 100) : 100;
    const avgDeviation = total > 0 ? +(totalDeviation / total).toFixed(1) : 0;
    return { rate, conformes, total, depassements, avgDeviation };
  }, [allTickets, allAbaques]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Tableau de Bord — Chef de Projet"
        subtitle="Vue d'ensemble des imputations et validations"
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <p className="text-muted-foreground">Chargement...</p>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <KPICard
                title="Périodes à valider"
                value={pendingValidation.length}
                icon={<FileWarning className="h-5 w-5" />}
                color={pendingValidation.length > 0 ? 'warning' : 'success'}
              />
              <KPICard
                title="Périodes validées"
                value={validated.length}
                icon={<CheckCircle2 className="h-5 w-5" />}
                color="success"
              />
              <KPICard
                title="Consultants"
                value={consultants.length}
                icon={<UsersIcon className="h-5 w-5" />}
                color="info"
              />
              <KPICard
                title="Heures ce mois"
                value={`${totalHoursThisMonth.toFixed(0)}h`}
                icon={<Clock className="h-5 w-5" />}
                color="default"
              />
              <KPICard
                title="Conformité Abaque"
                value={`${abaqueMetrics.rate}%`}
                subtitle={`${abaqueMetrics.conformes}/${abaqueMetrics.total} conformes`}
                icon={<CheckCircle2 className="h-5 w-5" />}
                color={abaqueMetrics.rate >= 80 ? 'success' : abaqueMetrics.rate >= 60 ? 'warning' : 'error'}
              />
              <KPICard
                title="Écart moyen Chiffrage"
                value={`${abaqueMetrics.avgDeviation}j`}
                subtitle={`${abaqueMetrics.depassements} dépassements critiques`}
                icon={<FileWarning className="h-5 w-5" />}
                color={abaqueMetrics.depassements === 0 ? 'success' : 'warning'}
              />
            </div>

            {/* Pending validation list */}
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 border-b font-semibold flex items-center gap-2">
                <Send className="h-4 w-4" /> Périodes en attente de validation
              </div>
              {pendingValidation.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400 mb-2" />
                  Aucune période en attente.
                </div>
              ) : (
                <div className="divide-y">
                  {pendingValidation.map((p) => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{userName(p.userId)}</p>
                        <p className="text-xs text-muted-foreground">
                          P{p.period} — {p.month}/{p.year} — {p.totalHours}h
                        </p>
                      </div>
                      <Badge
                        className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      >
                        En attente
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent validated */}
            <div className="rounded-lg border bg-card">
              <div className="px-4 py-3 border-b font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Dernières validations
              </div>
              {validated.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Aucune validation enregistrée.
                </div>
              ) : (
                <div className="divide-y">
                  {validated.slice(0, 8).map((p) => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{userName(p.userId)}</p>
                        <p className="text-xs text-muted-foreground">
                          P{p.period} — {p.month}/{p.year} — {p.totalHours}h
                        </p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        Validée
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
