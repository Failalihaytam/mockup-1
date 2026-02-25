import React from 'react';
import { ConsultantTicketsPage } from '../shared/ConsultantTicketsPage';
import { Ticket } from '../../types/entities';

export const TechTickets: React.FC = () => (
  <ConsultantTicketsPage
    title="Mes Tickets"
    subtitle="Créer et gérer vos tickets"
    homePath="/consultant-tech/dashboard"
    filterFn={(tickets: Ticket[], userId: string) =>
      tickets.filter((t) => t.createdBy === userId || t.assignedTo === userId)
    }
  />
);
