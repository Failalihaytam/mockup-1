import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  EvaluationsAPI,
  NotificationsAPI,
  ProjectsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Evaluation, Project, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

interface EvaluationForm {
  userId: string;
  projectId: string;
  period: string;
  productivity: number;
  quality: number;
  autonomy: number;
  collaboration: number;
  innovation: number;
  feedback: string;
}

const EMPTY_FORM: EvaluationForm = {
  userId: '',
  projectId: '',
  period: new Date().toISOString().slice(0, 7),
  productivity: 3,
  quality: 3,
  autonomy: 3,
  collaboration: 3,
  innovation: 3,
  feedback: '',
};

export const TeamEvaluations: React.FC = () => {
  const { currentUser } = useAuth();
  const [consultants, setConsultants] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<EvaluationForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, projectData, evalData] = await Promise.all([
        UsersAPI.getAll(),
        ProjectsAPI.getAll(),
        EvaluationsAPI.getAll(),
      ]);
      setConsultants(
        userData.filter(
          (user) =>
            user.role === 'CONSULTANT_TECHNIQUE' ||
            user.role === 'CONSULTANT_FONCTIONNEL'
        )
      );
      setProjects(projectData);
      setEvaluations(
        [...evalData].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    } finally {
      setLoading(false);
    }
  };

  const score = useMemo(() => {
    const values = [
      form.productivity,
      form.quality,
      form.autonomy,
      form.collaboration,
      form.innovation,
    ];
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [form]);

  const submitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !form.userId || !form.projectId) {
      toast.error('Consultant and project are required');
      return;
    }
    if (form.feedback.trim().length < 10) {
      toast.error('Feedback must contain at least 10 characters');
      return;
    }
    const duplicate = evaluations.find(
      (evaluation) =>
        evaluation.userId === form.userId &&
        evaluation.projectId === form.projectId &&
        evaluation.period === form.period
    );
    if (duplicate) {
      toast.error('An evaluation already exists for this consultant/project/period');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await EvaluationsAPI.create({
        userId: form.userId,
        evaluatorId: currentUser.id,
        projectId: form.projectId,
        period: form.period,
        score,
        qualitativeGrid: {
          productivity: form.productivity,
          quality: form.quality,
          autonomy: form.autonomy,
          collaboration: form.collaboration,
          innovation: form.innovation,
        },
        feedback: form.feedback.trim(),
        createdAt: new Date().toISOString(),
      });

      setEvaluations((prev) => [created, ...prev]);
      await NotificationsAPI.create({
        userId: form.userId,
        type: 'EVALUATION_PUBLISHED',
        title: 'New Evaluation Published',
        message: `A new ${form.period} evaluation has been submitted.`,
        read: false,
      });
      setForm(EMPTY_FORM);
      toast.success('Evaluation submitted');
    } catch (error) {
      toast.error('Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Team Evaluations"
        subtitle="Monthly qualitative evaluation grid for consultants"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Evaluations' },
        ]}
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 xl:col-span-1 h-fit">
          <h3 className="text-lg font-semibold text-foreground mb-4">New Monthly Evaluation</h3>
          <form onSubmit={submitEvaluation} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Consultant</label>
              <select
                value={form.userId}
                onChange={(e) => setForm((prev) => ({ ...prev, userId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Select consultant</option>
                {consultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Project</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Period (month)</label>
              <input
                type="month"
                value={form.period}
                onChange={(e) => setForm((prev) => ({ ...prev, period: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              />
            </div>

            {(
              [
                ['productivity', 'Productivity'],
                ['quality', 'Quality'],
                ['autonomy', 'Autonomy'],
                ['collaboration', 'Collaboration'],
                ['innovation', 'Innovation'],
              ] as const
            ).map(([field, label]) => (
              <div key={field}>
                <div className="flex justify-between text-sm mb-1">
                  <label className="text-muted-foreground">{label}</label>
                  <span className="text-foreground">{form[field]}/5</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={form[field]}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, [field]: Number(e.target.value) }))
                  }
                  className="w-full"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm text-muted-foreground mb-1">Feedback</label>
              <textarea
                value={form.feedback}
                onChange={(e) => setForm((prev) => ({ ...prev, feedback: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                placeholder="Qualitative assessment and improvement actions..."
              />
            </div>

            <div className="p-3 rounded bg-muted text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Calculated score</span>
              <span className="font-semibold text-foreground">{score.toFixed(2)} / 5</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving...' : 'Save Evaluation'}
            </button>
          </form>
        </div>

        <div className="bg-card border border-border rounded-lg xl:col-span-2 overflow-x-auto">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Evaluation History</h3>
          </div>
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Consultant
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading evaluations...
                  </td>
                </tr>
              ) : (
                evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-accent/40 align-top">
                    <td className="px-4 py-3 text-sm text-foreground">
                      {consultants.find((user) => user.id === evaluation.userId)?.name ??
                        evaluation.userId}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {projects.find((project) => project.id === evaluation.projectId)?.name ??
                        evaluation.projectId}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{evaluation.period}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-foreground">
                      {evaluation.score.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {evaluation.feedback}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
