import React from 'react';
import { ConsultantTicketsPage } from '../shared/ConsultantTicketsPage';
import { Ticket } from '../../types/entities';

/**
 * Coordinateur Dev sees all tickets (team-wide view),
 * not just their own.
 */
export const CoordinateurTickets: React.FC = () => (
  <ConsultantTicketsPage
    title="Tickets Équipe"
    subtitle="Vue d'ensemble des tickets de l'équipe technique"
    homePath="/coordinateur/dashboard"
    filterFn={(tickets: Ticket[], _userId: string) => tickets}
  />
);
