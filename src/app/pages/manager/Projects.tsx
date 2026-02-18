// Projects management page for Manager

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { PageHeader } from '../../components/common/PageHeader';
import { ProjectsAPI } from '../../services/odataClient';
import { Project } from '../../types/entities';
import { Plus, Search, Filter, Eye, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { todayLocalDateKey } from '../../utils/date';

interface ProjectForm {
  name: string;
  description: string;
  priority: Project['priority'];
  status: Project['status'];
  startDate: string;
  endDate: string;
  budget: number;
}

const EMPTY_FORM: ProjectForm = {
  name: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PLANNED',
  startDate: todayLocalDateKey(),
  endDate: todayLocalDateKey(),
  budget: 0,
};

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Project['status'] | 'ALL'>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await ProjectsAPI.getAll();
      setProjects(data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-400 border border-green-500/20',
      PLANNED: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      ON_HOLD: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      COMPLETED: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      CRITICAL: 'bg-red-500/10 text-red-400 border border-red-500/20',
      HIGH: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
      MEDIUM: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      LOW: 'bg-green-500/10 text-green-400 border border-green-500/20',
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
  };

  const filteredProjects = projects.filter((project) => {
    const q = searchQuery.toLowerCase();
    const matchesName =
      project.name.toLowerCase().includes(q) || project.description.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesName && matchesStatus;
  });

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    if (form.endDate < form.startDate) {
      toast.error('End date cannot be before start date');
      return;
    }
    if (form.budget < 0) {
      toast.error('Budget cannot be negative');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await ProjectsAPI.create({
        name: form.name.trim(),
        description: form.description.trim(),
        managerId: 'u2',
        priority: form.priority,
        status: form.status,
        startDate: form.startDate,
        endDate: form.endDate,
        budget: form.budget || undefined,
        progress: form.status === 'COMPLETED' ? 100 : 0,
      });
      setProjects((prev) => [created, ...prev]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      toast.success('Project created');
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Projects"
        subtitle="Manage and monitor all projects"
        breadcrumbs={[
          { label: 'Home', path: '/manager/dashboard' },
          { label: 'Projects' },
        ]}
        actions={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-input-background border border-border text-foreground rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border border-border text-muted-foreground rounded-lg">
              <Filter className="w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as Project['status'] | 'ALL')}
                className="bg-transparent outline-none text-foreground"
              >
                <option value="ALL">All Status</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Project Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Budget
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    Loading projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No projects found
                  </td>
                </tr>
              ) : (
                filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    className="hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => navigate(`/manager/projects/${project.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-foreground">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {project.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                          project.status
                        )}`}
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(
                          project.priority
                        )}`}
                      >
                        {project.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-muted rounded-full h-2 mr-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div>{new Date(project.startDate).toLocaleDateString()}</div>
                      <div className="text-muted-foreground/70">
                        to {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      ${project.budget?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/manager/projects/${project.id}`);
                        }}
                        className="text-primary hover:text-primary/80"
                        aria-label={`Open ${project.name} details`}
                        title={`Open ${project.name} details`}
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Create Project</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close create project dialog"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={createProject} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Project Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, priority: e.target.value as Project['priority'] }))
                    }
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, status: e.target.value as Project['status'] }))
                    }
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  >
                    <option value="PLANNED">PLANNED</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ON_HOLD">ON_HOLD</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Budget</label>
                <input
                  type="number"
                  min={0}
                  value={form.budget}
                  onChange={(e) => setForm((prev) => ({ ...prev, budget: Number(e.target.value || 0) }))}
                  className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                />
              </div>
              <div className="flex justify-end gap-2 border-t border-border pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-border rounded hover:bg-accent text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
