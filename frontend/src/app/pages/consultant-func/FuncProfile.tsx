import React, { useEffect, useState } from 'react';
import {
  UserRound,
  FolderKanban,
  FileText,
  Award,
  Mail,
  Shield,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import {
  ProjectsAPI,
  ObjetsAPI,
  DocumentationsAPI,
  DeliverablesAPI,
} from '../../services/odataClient';
import { Project, Objet, Documentation, Deliverable } from '../../types/entities';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export const FuncProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [docs, setDocs] = useState<Documentation[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);

  const initials = currentUser?.name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, d, del] = await Promise.all([
        ProjectsAPI.getAll(),
        DocumentationsAPI.getAll(),
        DeliverablesAPI.getAll(),
      ]);
      setProjects(p);
      setDocs(d);
      setDeliverables(del);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  const mySFDs = docs.filter((d) => d.createdBy === currentUser.id);
  const myDocs = deliverables.length; // deliverables visible to func consultant

  return (
    <div className="min-h-screen bg-transparent">
      <PageHeader
        title="Mon Profil"
        subtitle="Informations personnelles et activité"
        breadcrumbs={[
          { label: 'Tableau de Bord', path: '/consultant-func/dashboard' },
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <FolderKanban className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : projects.filter((p) => p.status === 'ACTIVE').length}
              </p>
              <p className="text-xs text-muted-foreground">Projets assignés</p>
            </CardContent>
          </Card>
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : mySFDs.length}
              </p>
              <p className="text-xs text-muted-foreground">SFDs rédigés</p>
            </CardContent>
          </Card>
          <Card className="bg-card/92">
            <CardContent className="p-5 text-center">
              <FileText className="mx-auto mb-2 h-6 w-6 text-primary" />
              <p className="text-2xl font-bold text-foreground">
                {loading ? '…' : myDocs}
              </p>
              <p className="text-xs text-muted-foreground">Documents soumis</p>
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
