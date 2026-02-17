// Deliverables Validation for Functional Consultant

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DeliverablesAPI } from '../../services/odataClient';
import { Deliverable, ValidationStatus } from '../../types/entities';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export const Deliverables: React.FC = () => {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(
    null
  );
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadDeliverables();
  }, []);

  const loadDeliverables = async () => {
    setLoading(true);
    try {
      const data = await DeliverablesAPI.getAll();
      setDeliverables(data);
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
      await DeliverablesAPI.update(id, {
        validationStatus: status,
        functionalComment,
      });
      setDeliverables(
        deliverables.map((d) =>
          d.id === id
            ? { ...d, validationStatus: status, functionalComment }
            : d
        )
      );
      toast.success('Deliverable status updated');
      setSelectedDeliverable(null);
      setComment('');
    } catch (error) {
      toast.error('Failed to update deliverable');
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
        subtitle="Review and validate project deliverables"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-func/dashboard' },
          { label: 'Deliverables' },
        ]}
      />

      <div className="p-6">
        {/* Deliverables Grid */}
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
                <p className="text-sm text-muted-foreground mb-4">{deliverable.type}</p>

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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() =>
                  updateValidationStatus(
                    selectedDeliverable.id,
                    'CHANGES_REQUESTED',
                    comment
                  )
                }
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Request Changes
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