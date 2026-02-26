// ============================================================================
// project-service.cds – Scoped project service with actions
// ============================================================================
using { cap.perf as db } from '../db/schema';

service ProjectService @(path: '/api/project') {

  // Read-write entities
  entity Tickets         as projection on db.Tickets;
  entity TicketEvents    as projection on db.TicketEvents;
  entity TicketMessages  as projection on db.TicketMessages;
  entity ActivityEvents  as projection on db.ActivityEvents;
  entity WorkSessions    as projection on db.WorkSessions;
  entity Notifications   as projection on db.Notifications;
  entity Documentations  as projection on db.Documentations;
  entity ImputationPeriods as projection on db.ImputationPeriods;

  // Read-only entities
  @readonly entity Users           as projection on db.Users excluding { password };
  @readonly entity Projects        as projection on db.Projects;
  @readonly entity Objets          as projection on db.Objets;
  @readonly entity Tasks           as projection on db.Tasks;
  @readonly entity Allocations     as projection on db.Allocations;
  @readonly entity LeaveRequests   as projection on db.LeaveRequests;
  @readonly entity Abaques         as projection on db.Abaques;
  @readonly entity AbaqueEntries   as projection on db.AbaqueEntries;
  @readonly entity Deliverables    as projection on db.Deliverables;
  @readonly entity ReferenceData   as projection on db.ReferenceData;

  // ---------------------------------------------------------------------------
  // Bound actions on Tickets
  // ---------------------------------------------------------------------------

  // Change ticket status with optional comment
  action changeTicketStatus(
    ticketId : String(36),
    newStatus : db.TicketStatus,
    comment : String(1000)
  ) returns Tickets;

  // Assign a ticket to a consultant
  action assignTicket(
    ticketId : String(36),
    assigneeId : String(36)
  ) returns Tickets;

  // Log a work session on a ticket
  action logWorkSession(
    ticketId : String(36),
    hours : Decimal(5,2),
    description : String(1000),
    date : Date
  ) returns WorkSessions;

  // Send work sessions to StraTIME
  action sendToStraTIME(
    sessionIds : array of String(36)
  ) returns array of WorkSessions;

  // ---------------------------------------------------------------------------
  // Functions (read-only)
  // ---------------------------------------------------------------------------

  // Get full activity feed for a ticket
  function getTicketActivity(
    ticketId : String(36)
  ) returns array of ActivityEvents;

  // Get project KPIs
  function getProjectKPIs(
    projectId : String(36)
  ) returns {
    totalTickets    : Integer;
    openTickets     : Integer;
    resolvedTickets : Integer;
    closedTickets   : Integer;
    totalHours      : Decimal(10,2);
    avgResolution   : Decimal(8,2);
  };
}
