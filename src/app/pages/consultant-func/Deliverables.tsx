// Deliverables Validation for Functional Consultant

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  DeliverablesAPI,
  NotificationsAPI,
  ProjectsAPI,
} from '../../services/odataClient';
import { Deliverable, Project, ValidationStatus } from '../../types/entities';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

interface UploadForm {
  projectId: string;
  type: string;
  name: string;
  fileRef: string;
}

const EMPTY_UPLOAD_FORM: UploadForm = {
  projectId: '',
  type: 'Functional Specification',
  name: '',
  fileRef: '',
};

export const Deliverables: React.FC = () => {
  const { currentUser } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(
    null
  );
  const [comment, setComment] = useState('');
  const [uploadForm, setUploadForm] = useState<UploadForm>(EMPTY_UPLOAD_FORM);
  const [isUploading, setIsUploading] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  useEffect(() => {
    void loadDeliverables();
  }, []);

  const loadDeliverables = async () => {
    setLoading(true);
    try {
      const [data, projectData] = await Promise.all([
        DeliverablesAPI.getAll(),
        ProjectsAPI.getAll(),
      ]);
      setDeliverables(data);
      setProjects(projectData);
    } finally {
      setLoading(false);
    }
  };

  const updateValidationStatus = async (
    id: string,
    status: ValidationStatus,
    functionalComment?: string
  ) => {
    try {
      setIsReviewSubmitting(true);
      const updated = await DeliverablesAPI.update(id, {
        validationStatus: status,
        functionalComment,
      });
      setDeliverables((prev) =>
        prev.map((entry) => (entry.id === id ? updated : entry))
      );
      const project = projects.find((entry) => entry.id === updated.projectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_REVIEWED',
          title: 'Deliverable Reviewed',
          message: `"${updated.name}" moved to ${status}.`,
          read: false,
        });
      }
      toast.success('Deliverable status updated');
      setSelectedDeliverable(null);
      setComment('');
    } catch (error) {
      toast.error('Failed to update deliverable');
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const createSpecification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!uploadForm.projectId || !uploadForm.name.trim() || !uploadForm.type.trim()) {
      toast.error('Project, name and type are required');
      return;
    }

    try {
      setIsUploading(true);
      const created = await DeliverablesAPI.create({
        projectId: uploadForm.projectId,
        type: uploadForm.type.trim(),
        name: uploadForm.name.trim(),
        fileRef: uploadForm.fileRef.trim() || undefined,
        validationStatus: 'PENDING',
        functionalComment: '',
      });
      setDeliverables((prev) => [created, ...prev]);

      const project = projects.find((entry) => entry.id === uploadForm.projectId);
      if (project) {
        await NotificationsAPI.create({
          userId: project.managerId,
          type: 'DELIVERABLE_SUBMITTED',
          title: 'New Functional Specification',
          message: `${currentUser.name} submitted "${created.name}" for review.`,
          read: false,
        });
      }

      setUploadForm(EMPTY_UPLOAD_FORM);
      toast.success('Specification submitted for validation');
    } catch (error) {
      toast.error('Failed to submit specification');
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case 'APPROVED':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle };
      case 'CHANGES_REQUESTED':
        return { color: 'bg-red-100 text-red-800', icon: XCircle };
      case 'PENDING':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Deliverables Validation"
        subtitle="Deposit functional specifications and validate project deliverables"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-func/dashboard' },
          { label: 'Deliverables' },
        ]}
      />

      <div className="p-6 space-y-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Deposit Functional Specification (Mock)
          </h3>
          <form onSubmit={createSpecification} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Project</label>
              <select
                value={uploadForm.projectId}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, projectId: e.target.value }))
                }
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
              <label className="block text-sm text-muted-foreground mb-1">Type</label>
              <input
                value={uploadForm.type}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">Document Name</label>
              <input
                value={uploadForm.name}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                placeholder="Functional scope definition v1"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-1">
                File Reference (optional)
              </label>
              <input
                value={uploadForm.fileRef}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, fileRef: e.target.value }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
                placeholder="SharePoint/Teams link or file code"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {isUploading ? 'Submitting...' : 'Submit for Validation'}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <div className="bg-card rounded-lg border border-border p-10 text-center text-muted-foreground">
            Loading deliverables...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliverables.map((deliverable) => {
              const badge = getStatusBadge(deliverable.validationStatus);
              const StatusIcon = badge.icon;

              return (
                <div
                  key={deliverable.id}
                  className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {deliverable.validationStatus}
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2">
                    {deliverable.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{deliverable.type}</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Project:{' '}
                    {projects.find((project) => project.id === deliverable.projectId)?.name ??
                      deliverable.projectId}
                  </p>

                  {deliverable.functionalComment && (
                    <div className="mb-4 p-3 bg-muted rounded text-sm">
                      <p className="text-muted-foreground">{deliverable.functionalComment}</p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mb-4">
                    Created: {new Date(deliverable.createdAt).toLocaleDateString()}
                  </div>

                  {deliverable.validationStatus === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedDeliverable(deliverable);
                        setComment(deliverable.functionalComment || '');
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Review
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {deliverables.length === 0 && !loading && (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No deliverables
            </h3>
            <p className="text-muted-foreground">No deliverables to review at the moment.</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedDeliverable && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedDeliverable(null)}
        >
          <div
            className="bg-card rounded-lg shadow-xl max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              Review Deliverable
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Name
                </label>
                <p className="text-foreground">{selectedDeliverable.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Type
                </label>
                <p className="text-foreground">{selectedDeliverable.type}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Functional Comments
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-card text-foreground"
                  placeholder="Add your comments or feedback..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() =>
                  updateValidationStatus(
                    selectedDeliverable.id,
                    'APPROVED',
                    comment
                  )
                }
                disabled={isReviewSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isReviewSubmitting ? 'Saving...' : 'Approve'}
              </button>
              <button
                onClick={() =>
                  updateValidationStatus(
                    selectedDeliverable.id,
                    'CHANGES_REQUESTED',
                    comment
                  )
                }
                disabled={isReviewSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {isReviewSubmitting ? 'Saving...' : 'Request Changes'}
              </button>
              <button
                onClick={() => setSelectedDeliverable(null)}
                className="px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
