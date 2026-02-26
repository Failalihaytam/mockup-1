const cds = require('@sap/cds');

module.exports = class ProjectService extends cds.ApplicationService {

  async init() {
    const {
      Tickets, TicketEvents, ActivityEvents, WorkSessions,
    } = this.entities;

    // ─────────────────────────────────────────────────────────────────────────
    // changeTicketStatus
    // ─────────────────────────────────────────────────────────────────────────
    this.on('changeTicketStatus', async (req) => {
      const { ticketId, newStatus, comment } = req.data;
      const tx = cds.tx(req);

      const ticket = await tx.read(Tickets).where({ id: ticketId });
      if (!ticket.length) return req.error(404, `Ticket ${ticketId} not found`);
      const old = ticket[0];

      // Update ticket
      await tx.update(Tickets).set({
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }).where({ id: ticketId });

      // Create history event
      const eventId = `h-${ticketId}-${Date.now()}`;
      await tx.create(TicketEvents).entries({
        id: eventId,
        ticket_id: ticketId,
        timestamp: new Date().toISOString(),
        user_id: req.user?.id || 'anonymous',
        action: 'STATUS_CHANGE',
        fromValue: old.status,
        toValue: newStatus,
        comment: comment || null,
      });

      // Create activity event
      await tx.create(ActivityEvents).entries({
        id: `ae-${Date.now()}`,
        ticket_id: ticketId,
        type: 'status_change',
        actor_id: req.user?.id || 'anonymous',
        actorName: req.user?.id || 'System',
        actorRole: '',
        description: `Statut changé : ${old.status} → ${newStatus}`,
        metadata: JSON.stringify({ from: old.status, to: newStatus }),
        occurredAt: new Date().toISOString(),
      });

      return tx.read(Tickets).where({ id: ticketId });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // assignTicket
    // ─────────────────────────────────────────────────────────────────────────
    this.on('assignTicket', async (req) => {
      const { ticketId, assigneeId } = req.data;
      const tx = cds.tx(req);

      const ticket = await tx.read(Tickets).where({ id: ticketId });
      if (!ticket.length) return req.error(404, `Ticket ${ticketId} not found`);
      const old = ticket[0];

      await tx.update(Tickets).set({
        assignedTo_id: assigneeId,
        updatedAt: new Date().toISOString(),
      }).where({ id: ticketId });

      // History
      await tx.create(TicketEvents).entries({
        id: `h-${ticketId}-${Date.now()}`,
        ticket_id: ticketId,
        timestamp: new Date().toISOString(),
        user_id: req.user?.id || 'anonymous',
        action: 'ASSIGNED',
        fromValue: old.assignedTo_id || '',
        toValue: assigneeId,
      });

      // Activity
      await tx.create(ActivityEvents).entries({
        id: `ae-${Date.now()}`,
        ticket_id: ticketId,
        type: 'assignee_change',
        actor_id: req.user?.id || 'anonymous',
        actorName: req.user?.id || 'System',
        actorRole: '',
        description: `Assigné à ${assigneeId}`,
        metadata: JSON.stringify({ from: old.assignedTo_id, to: assigneeId }),
        occurredAt: new Date().toISOString(),
      });

      return tx.read(Tickets).where({ id: ticketId });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // logWorkSession
    // ─────────────────────────────────────────────────────────────────────────
    this.on('logWorkSession', async (req) => {
      const { ticketId, hours, description, date } = req.data;
      const tx = cds.tx(req);

      const ticket = await tx.read(Tickets).where({ id: ticketId });
      if (!ticket.length) return req.error(404, `Ticket ${ticketId} not found`);

      const wsId = `ws-${Date.now()}`;
      const session = {
        id: wsId,
        consultant_id: req.user?.id || 'anonymous',
        ticket_id: ticketId,
        project_id: ticket[0].project_id,
        date: date || new Date().toISOString().slice(0, 10),
        hours,
        description: description || '',
        sentToStraTIME: false,
      };

      await tx.create(WorkSessions).entries(session);

      // Activity
      await tx.create(ActivityEvents).entries({
        id: `ae-${Date.now()}`,
        ticket_id: ticketId,
        type: 'work_session_logged',
        actor_id: req.user?.id || 'anonymous',
        actorName: req.user?.id || 'System',
        actorRole: '',
        description: `Session de travail : ${hours}h`,
        metadata: JSON.stringify({ hours, sessionId: wsId }),
        occurredAt: new Date().toISOString(),
      });

      return tx.read(WorkSessions).where({ id: wsId });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // sendToStraTIME
    // ─────────────────────────────────────────────────────────────────────────
    this.on('sendToStraTIME', async (req) => {
      const { sessionIds } = req.data;
      const tx = cds.tx(req);
      const now = new Date().toISOString();

      for (const sid of sessionIds) {
        await tx.update(WorkSessions).set({
          sentToStraTIME: true,
          sentAt: now,
        }).where({ id: sid });
      }

      // Activity for each session's ticket
      const sessions = await tx.read(WorkSessions).where({ id: { in: sessionIds } });
      const ticketIds = [...new Set(sessions.map(s => s.ticket_id))];
      for (const tkId of ticketIds) {
        await tx.create(ActivityEvents).entries({
          id: `ae-${Date.now()}-${tkId}`,
          ticket_id: tkId,
          type: 'straTIME_sent',
          actor_id: req.user?.id || 'anonymous',
          actorName: req.user?.id || 'System',
          actorRole: '',
          description: 'Sessions envoyées à StraTIME',
          metadata: JSON.stringify({ sessionIds }),
          occurredAt: now,
        });
      }

      return tx.read(WorkSessions).where({ id: { in: sessionIds } });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // getTicketActivity (function)
    // ─────────────────────────────────────────────────────────────────────────
    this.on('getTicketActivity', async (req) => {
      const { ticketId } = req.data;
      return cds.tx(req).read(ActivityEvents)
        .where({ ticket_id: ticketId })
        .orderBy('occurredAt desc');
    });

    // ─────────────────────────────────────────────────────────────────────────
    // getProjectKPIs (function)
    // ─────────────────────────────────────────────────────────────────────────
    this.on('getProjectKPIs', async (req) => {
      const { projectId } = req.data;
      const tx = cds.tx(req);

      const tickets = await tx.read(Tickets).where({ project_id: projectId });
      const sessions = await tx.read(WorkSessions).where({ project_id: projectId });

      const totalTickets = tickets.length;
      const openTickets = tickets.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'WAITING_FEEDBACK').length;
      const resolvedTickets = tickets.filter(t => t.status === 'RESOLVED').length;
      const closedTickets = tickets.filter(t => t.status === 'CLOSED').length;
      const totalHours = sessions.reduce((sum, s) => sum + (Number(s.hours) || 0), 0);

      // Average resolution time (days) for resolved/closed tickets
      const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED');
      let avgResolution = 0;
      if (resolved.length > 0) {
        const totalDays = resolved.reduce((sum, t) => {
          if (t.createdAt && t.updatedAt) {
            return sum + (new Date(t.updatedAt) - new Date(t.createdAt)) / 86400000;
          }
          return sum;
        }, 0);
        avgResolution = Math.round((totalDays / resolved.length) * 100) / 100;
      }

      return {
        totalTickets,
        openTickets,
        resolvedTickets,
        closedTickets,
        totalHours,
        avgResolution,
      };
    });

    await super.init();
  }
};
