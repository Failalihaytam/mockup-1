import React, { useEffect, useState } from 'react';
import {
  UserRound,
  FolderKanban,
  Clock,
  Award,
  Mail,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  ProjectsAPI,
  TasksAPI,
  TimesheetsAPI,
  EvaluationsAPI,
} from '../../services/odataClient';
import { Project, Task, Timesheet, Evaluation } from '../../types/entities';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const TechProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = currentUser?.name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    if (!currentUser) return;
    void loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [p, t, ts, ev] = await Promise.all([
        ProjectsAPI.getAll(),
        TasksAPI.getByUser(currentUser.id),
        TimesheetsAPI.getByUser(currentUser.id),
        EvaluationsAPI.getByUser(currentUser.id),
      ]);
      const myProjectIds = new Set(t.map((tk) => tk.projectId));
      setProjects(p.filter((pr) => myProjectIds.has(pr.id)));
      setTasks(t);
      setTimesheets(ts);
      setEvaluations(ev);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
  const totalHours = timesheets.reduce((s, ts) => s + ts.hours, 0);
  const avgScore =
    evaluations.length > 0
      ? evaluations.reduce((s, e) => s + e.score, 0) / evaluations.length
      : 0;

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Mon Profil"
        subtitle="Informations personnelles et activité technique"
        breadcrumbs={[
          { label: 'Tableau de Bord', path: '/consultant-tech/dashboard' },
          { label: 'Mon Profil' },
        ]}
      />

      <div className="mx-auto grid max-w-4xl gap-6 p-6 lg:p-8">
        {/* Identity Card */}
        <Card className="bg-card/92">
          <CardContent className="p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="h-20 w-20 border-2 border-border/70">
                <AvatarFallback className="bg-primary/12 text-xl font-semibold text-primary">
                  {initials || <UserRound className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h2 className="text-2xl font-bold text-foreground">{currentUser.name}</h2>
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {currentUser.email}
                  </span>
                  <Badge className="bg-primary/12 text-primary">
                    <Shield className="mr-1 h-3 w-3" />
                    {currentUser.role.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <FolderKanban className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : projects.filter((p) => p.status === 'ACTIVE').length}
              </p>
              <p className="text-xs text-muted-foreground">Projets actifs</p>
            </CardContent>
          </Card>
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : completedTasks}
              </p>
              <p className="text-xs text-muted-foreground">Tâches terminées</p>
            </CardContent>
          </Card>
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : totalHours}
              </p>
              <p className="text-xs text-muted-foreground">Heures imputées</p>
            </CardContent>
          </Card>
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <Award className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : avgScore.toFixed(1)}
              </p>
              <p className="text-xs text-muted-foreground">Score qualité /5</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects assigned */}
        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-lg">
              <FolderKanban className="h-4 w-4 text-primary" />
              Projets assignés
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun projet assigné.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded border border-border p-3"
                  >
                    <div>
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.code}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        p.status === 'ACTIVE'
                          ? 'border-green-300 text-green-700 dark:text-green-300'
                          : ''
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="text-lg">Compétences</CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser.skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune compétence renseignée.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentUser.skills.map((skill) => (
                  <Badge key={skill} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card className="bg-card/92">
          <CardHeader>
            <CardTitle className="inline-flex items-center gap-2 text-lg">
              <Award className="h-4 w-4 text-primary" />
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentUser.certifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune certification.</p>
            ) : (
              <div className="space-y-2">
                {currentUser.certifications.map((cert) => (
                  <div
                    key={typeof cert === 'string' ? cert : cert.id}
                    className="flex items-center justify-between rounded border border-border p-3"
                  >
                    {typeof cert === 'string' ? (
                      <p className="font-medium text-foreground">{cert}</p>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">{cert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cert.issuingBody} — {new Date(cert.dateObtained).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}
                    {typeof cert !== 'string' && (
                      <Badge
                        variant="outline"
                        className={
                          cert.status === 'VALID'
                            ? 'border-green-300 text-green-700 dark:text-green-300'
                            : cert.status === 'EXPIRING_SOON'
                            ? 'border-amber-300 text-amber-700 dark:text-amber-300'
                            : 'border-red-300 text-red-700 dark:text-red-300'
                        }
                      >
                        {cert.status}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
