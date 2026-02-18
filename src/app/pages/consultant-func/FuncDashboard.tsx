// Functional Consultant Dashboard

import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { KPICard } from '../../components/common/KPICard';
import { useAuth } from '../../context/AuthContext';
import { DeliverablesAPI, TicketsAPI } from '../../services/odataClient';
import { Deliverable, Ticket } from '../../types/entities';
import { useNavigate } from 'react-router';
import {
  Card,
  CardHeader,
  AnalyticalTable,
  Button,
  List,
  ListItemStandard,
  Icon,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/table-view.js';
import '@ui5/webcomponents-icons/dist/document.js';
import '@ui5/webcomponents-icons/dist/incident.js';

const kpiColumns = [
  { Header: 'KPI', accessor: 'name', width: 200 },
  { Header: 'Formula', accessor: 'formula', width: 320 },
  { Header: 'Source', accessor: 'source', width: 150 },
  { Header: 'Refresh', accessor: 'refresh', width: 150 },
];

const kpiReferences = [
  {
    name: 'Pending Deliverables',
    formula: "count(deliverable.validationStatus = 'PENDING')",
    source: 'Deliverables',
    refresh: 'On dashboard load',
  },
  {
    name: 'Approved Deliverables',
    formula: "count(deliverable.validationStatus = 'APPROVED')",
    source: 'Deliverables',
    refresh: 'On dashboard load',
  },
  {
    name: 'Open Tickets',
    formula: "count(ticket.status in ['OPEN', 'IN_PROGRESS'])",
    source: 'Tickets',
    refresh: 'On dashboard load',
  },
  {
    name: 'Resolved Tickets',
    formula: "count(ticket.status = 'RESOLVED')",
    source: 'Tickets',
    refresh: 'On dashboard load',
  },
];

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

  const getTicketState = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'Positive';
      case 'IN_PROGRESS':
        return 'Information';
      case 'OPEN':
        return 'Critical';
      default:
        return 'None';
    }
  };

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

        {/* KPI Definitions */}
        <Card
          header={
            <CardHeader
              titleText="KPI Definitions"
              subtitleText="Formula / Source / Refresh"
              avatar={<Icon name="table-view" />}
            />
          }
        >
          <AnalyticalTable
            columns={kpiColumns}
            data={kpiReferences}
            minRows={4}
            visibleRows={4}
            scaleWidthMode="Smart"
            alternateRowColor
          />
        </Card>

        {/* Pending Deliverables */}
        <Card
          header={
            <CardHeader
              titleText="Deliverables Awaiting Validation"
              subtitleText={`${deliverables.filter((d) => d.validationStatus === 'PENDING').length} pending`}
              avatar={<Icon name="document" />}
              action={
                <Button design="Transparent" onClick={() => navigate('/consultant-func/deliverables')}>
                  View All
                </Button>
              }
            />
          }
        >
          <List>
            {deliverables
              .filter((d) => d.validationStatus === 'PENDING')
              .slice(0, 5)
              .map((deliverable) => (
                <ListItemStandard
                  key={deliverable.id}
                  description={deliverable.type}
                  additionalText="Pending"
                  additionalTextState="Critical"
                  onClick={() => navigate('/consultant-func/deliverables')}
                >
                  {deliverable.name}
                </ListItemStandard>
              ))}
          </List>
        </Card>

        {/* Recent Tickets */}
        <Card
          header={
            <CardHeader
              titleText="My Recent Tickets"
              subtitleText={`${tickets.length} total ticket${tickets.length !== 1 ? 's' : ''}`}
              avatar={<Icon name="incident" />}
              action={
                <Button design="Transparent" onClick={() => navigate('/consultant-func/tickets')}>
                  View All
                </Button>
              }
            />
          }
        >
          <List>
            {tickets.slice(0, 5).map((ticket) => (
              <ListItemStandard
                key={ticket.id}
                description={ticket.description}
                additionalText={ticket.status}
                additionalTextState={getTicketState(ticket.status)}
              >
                {ticket.title}
              </ListItemStandard>
            ))}
          </List>
        </Card>
      </div>
    </div>
  );
};
