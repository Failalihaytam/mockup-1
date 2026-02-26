// ============================================================================
// admin-service.cds – Full CRUD admin service
// ============================================================================
using { cap.perf as db } from '../db/schema';

service AdminService @(path: '/api/admin') {

  entity Users           as projection on db.Users excluding { password };

  // Login action — accepts email+password, returns the matching user or error
  action login(email : String, password : String) returns Users;
  entity UserSkills      as projection on db.UserSkills;
  entity Certifications  as projection on db.Certifications;
  entity Projects        as projection on db.Projects;
  entity ProjectKeywords as projection on db.ProjectKeywords;
  entity Objets          as projection on db.Objets;
  entity Documentations  as projection on db.Documentations;
  entity Tasks           as projection on db.Tasks;
  entity Timesheets      as projection on db.Timesheets;
  entity Evaluations     as projection on db.Evaluations;
  entity Deliverables    as projection on db.Deliverables;
  entity Tickets         as projection on db.Tickets;
  entity TicketEvents    as projection on db.TicketEvents;
  entity TicketMessages  as projection on db.TicketMessages;
  entity ActivityEvents  as projection on db.ActivityEvents;
  entity WorkSessions    as projection on db.WorkSessions;
  entity Notifications   as projection on db.Notifications;
  entity ReferenceData   as projection on db.ReferenceData;
  entity Allocations     as projection on db.Allocations;
  entity LeaveRequests   as projection on db.LeaveRequests;
  entity ImputationPeriods as projection on db.ImputationPeriods;
  entity Abaques         as projection on db.Abaques;
  entity AbaqueEntries   as projection on db.AbaqueEntries;
}
