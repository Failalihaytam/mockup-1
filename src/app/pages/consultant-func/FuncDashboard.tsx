// Functional Consultant Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import { DeliverablesAPI, TicketsAPI } from '../../services/odataClient';
import { Deliverable, Ticket } from '../../types/entities';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router';

export const FuncDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const deliverablesData = await DeliverablesAPI.getAll();
      setDeliverables(deliverablesData);

      const ticketsData = await TicketsAPI.getAll();
      const myTickets = ticketsData.filter((t) => t.createdBy === currentUser.id);
      setTickets(myTickets);
    } finally {
      setLoading(false);
    }
  };

  const pendingDeliverables = deliverables.filter(
    (d) => d.validationStatus === 'PENDING'
  ).length;
  const approvedDeliverables = deliverables.filter(
    (d) => d.validationStatus === 'APPROVED'
  ).length;
  const openTickets = tickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  ).length;
  const resolvedTickets = tickets.filter((t) => t.status === 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title={`Welcome back, ${currentUser?.name.split(' ')[0]}!`}
        subtitle="Your functional consultant dashboard"
        breadcrumbs={[{ label: 'My Dashboard' }]}
      />

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Pending Deliverables"
            value={pendingDeliverables}
            icon="document"
            color="yellow"
          />
          <KPICard
            title="Approved Deliverables"
            value={approvedDeliverables}
            icon="accept"
            color="green"
          />
          <KPICard
            title="Open Tickets"
            value={openTickets}
            icon="incident"
            color="blue"
          />
          <KPICard
            title="Resolved Tickets"
            value={resolvedTickets}
            icon="history"
            color="purple"
          />
        </div>

        {/* Pending Deliverables */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Deliverables Awaiting Validation
            </h3>
            <button
              onClick={() => navigate('/consultant-func/deliverables')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All -&gt;
            </button>
          </div>

          <div className="space-y-3">
            {deliverables
              .filter((d) => d.validationStatus === 'PENDING')
              .slice(0, 5)
              .map((deliverable) => (
                <div
                  key={deliverable.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {deliverable.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">{deliverable.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/consultant-func/deliverables')}
                    className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-lg hover:bg-primary/90"
                  >
                    Review
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">My Recent Tickets</h3>
            <button
              onClick={() => navigate('/consultant-func/tickets')}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View All -&gt;
            </button>
          </div>

          <div className="space-y-3">
            {tickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground">{ticket.title}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded ${
                        ticket.status === 'RESOLVED'
                          ? 'bg-green-100 text-green-800'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {ticket.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

