// ============================================================================
// schema.cds – Types, enums, and entity definitions for cap.perf
// ============================================================================
namespace cap.perf;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

type UserRole : String(30) enum {
  ADMIN;
  MANAGER;
  CONSULTANT_TECHNIQUE;
  CONSULTANT_FONCTIONNEL;
  CHEF_DE_PROJET;
  COORDINATEUR_DEV;
}

type TaskStatus : String(20) enum {
  TO_DO;
  IN_PROGRESS;
  BLOCKED;
  DONE;
  CANCELLED;
}

type Priority : String(10) enum {
  LOW;
  MEDIUM;
  HIGH;
  CRITICAL;
}

type ProjectStatus : String(15) enum {
  PLANNED;
  ACTIVE;
  ON_HOLD;
  COMPLETED;
  CANCELLED;
}

type RiskLevel : String(10) enum {
  NONE;
  LOW;
  MEDIUM;
  HIGH;
  CRITICAL;
}

type ValidationStatus : String(20) enum {
  PENDING;
  APPROVED;
  CHANGES_REQUESTED;
}

type TicketStatus : String(20) enum {
  OPEN;
  IN_PROGRESS;
  WAITING_FEEDBACK;
  RESOLVED;
  CLOSED;
}

type Complexity : String(10) enum {
  LOW;
  MEDIUM;
  HIGH;
  CRITICAL;
}

type CertificationStatus : String(15) enum {
  VALID;
  EXPIRING_SOON;
  EXPIRED;
}

type LeaveStatus : String(10) enum {
  PENDING;
  APPROVED;
  REJECTED;
}

type DevType : String(15) enum {
  Formulaire;
  Report;
  Enhancement;
  Programme;
}

type TicketComplexite : String(20) enum {
  Simple;
  Moyen;
  Complexe;
  ![Très Complexe];
}

type TicketPriorite : Integer enum {
  Critique  = 0;
  Haute     = 1;
  Moyenne   = 2;
  Basse     = 3;
}

type ImputationPeriodStatus : String(15) enum {
  draft;
  sent;
  pending;
  validated;
  rejected;
}

type ActivityEventType : String(25) enum {
  status_change;
  assignee_change;
  message_sent;
  work_session_logged;
  chiffrage_updated;
  comment_added;
  ticket_created;
  priority_change;
  straTIME_sent;
  abaque_exceeded;
}

type TicketEventAction : String(20) enum {
  CREATED;
  STATUS_CHANGE;
  ASSIGNED;
  COMMENT;
  PRIORITY_CHANGE;
}

// ---------------------------------------------------------------------------
// Structured types
// ---------------------------------------------------------------------------

type QualitativeGrid {
  productivity  : Integer;
  quality       : Integer;
  autonomy      : Integer;
  collaboration : Integer;
  innovation    : Integer;
}

// ---------------------------------------------------------------------------
// Users & related compositions
// ---------------------------------------------------------------------------

entity Users {
  key id                 : String(36);
      name               : String(100);
      email              : String(150);
      password           : String(255);
      role               : UserRole;
      active             : Boolean default true;
      availabilityPercent : Integer default 100;
      teamId             : String(36);
      avatarUrl          : String(500);
      skills             : Composition of many UserSkills on skills.user = $self;
      certifications     : Composition of many Certifications on certifications.user = $self;
}

entity UserSkills {
  key id    : String(50);
      user  : Association to Users;
      skill : String(100);
}

entity Certifications {
  key id           : String(36);
      user         : Association to Users;
      name         : String(200);
      issuingBody  : String(100);
      dateObtained : Date;
      expiryDate   : Date;
      status       : CertificationStatus;
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

entity Projects {
  key id            : String(36);
      code          : String(10);
      name          : String(200);
      manager       : Association to Users;
      startDate     : Date;
      endDate       : Date;
      status        : ProjectStatus;
      priority      : Priority;
      description   : String(2000);
      progress      : Integer;
      budget        : Decimal(15,2);
      complexity    : Complexity;
      documentation : String(5000);
      techKeywords  : Composition of many ProjectKeywords on techKeywords.project = $self;
}

entity ProjectKeywords {
  key id      : String(50);
      project : Association to Projects;
      keyword : String(50);
}

// ---------------------------------------------------------------------------
// Objets
// ---------------------------------------------------------------------------

entity Objets {
  key id          : String(36);
      project     : Association to Projects;
      code        : String(20);
      name        : String(200);
      description : String(2000);
      module      : String(10);
      devType     : DevType;
      complexite  : TicketComplexite;
      priorite    : TicketPriorite;
      createdAt   : Timestamp;
      createdBy   : Association to Users;
}

// ---------------------------------------------------------------------------
// Documentations
// ---------------------------------------------------------------------------

entity Documentations {
  key id        : String(36);
      objet     : Association to Objets;
      title     : String(200);
      content   : LargeString;
      version   : Integer default 1;
      createdBy : Association to Users;
      updatedBy : Association to Users;
      createdAt : Timestamp;
      updatedAt : Timestamp;
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

entity Tasks {
  key id              : String(36);
      project         : Association to Projects;
      title           : String(200);
      description     : String(2000);
      status          : TaskStatus;
      priority        : Priority;
      assignee        : Association to Users;
      plannedStart    : Date;
      plannedEnd      : Date;
      realStart       : Date;
      realEnd         : Date;
      progressPercent : Integer default 0;
      estimatedHours  : Decimal(8,2);
      actualHours     : Decimal(8,2);
      isCritical      : Boolean default false;
      riskLevel       : RiskLevel;
      comments        : String(2000);
}

// ---------------------------------------------------------------------------
// Timesheets
// ---------------------------------------------------------------------------

entity Timesheets {
  key id      : String(36);
      user    : Association to Users;
      date    : Date;
      hours   : Decimal(5,2);
      project : Association to Projects;
      task    : Association to Tasks;
      comment : String(500);
}

// ---------------------------------------------------------------------------
// Evaluations
// ---------------------------------------------------------------------------

entity Evaluations {
  key id              : String(36);
      user            : Association to Users;
      evaluator       : Association to Users;
      project         : Association to Projects;
      period          : String(20);
      score           : Decimal(4,2);
      qualitativeGrid : QualitativeGrid;
      feedback        : String(2000);
      createdAt       : Timestamp;
}

// ---------------------------------------------------------------------------
// Deliverables
// ---------------------------------------------------------------------------

entity Deliverables {
  key id                : String(36);
      project           : Association to Projects;
      task              : Association to Tasks;
      type              : String(50);
      name              : String(200);
      url               : String(500);
      fileRef           : String(500);
      validationStatus  : ValidationStatus;
      functionalComment : String(1000);
      createdAt         : Timestamp;
}

// ---------------------------------------------------------------------------
// Tickets & related compositions
// ---------------------------------------------------------------------------

entity Tickets {
  key id                     : String(36);
      project                : Association to Projects;
      objet                  : Association to Objets;
      createdBy              : Association to Users;
      assignedTo             : Association to Users;
      status                 : TicketStatus;
      priority               : Priority;
      devType                : DevType;
      title                  : String(300);
      description            : String(5000);
      dueDate                : Date;
      createdAt              : Timestamp;
      updatedAt              : Timestamp;
      chiffrage              : Decimal(8,2);
      complexite             : TicketComplexite;
      priorite               : TicketPriorite;
      module                 : String(10);
      wricef                 : String(30);
      chiffrageJustification : String(1000);
      history                : Composition of many TicketEvents on history.ticket = $self;
      messages               : Composition of many TicketMessages on messages.ticket = $self;
      activityFeed           : Composition of many ActivityEvents on activityFeed.ticket = $self;
}

entity TicketEvents {
  key id        : String(50);
      ticket    : Association to Tickets;
      timestamp : Timestamp;
      user      : Association to Users;
      action    : TicketEventAction;
      fromValue : String(200);
      toValue   : String(200);
      comment   : String(1000);
}

entity TicketMessages {
  key id         : String(50);
      ticket     : Association to Tickets;
      sender     : Association to Users;
      senderName : String(100);
      senderRole : String(50);
      content    : String(2000);
      sentAt     : Timestamp;
}

entity ActivityEvents {
  key id          : String(50);
      ticket      : Association to Tickets;
      type        : ActivityEventType;
      actor       : Association to Users;
      actorName   : String(100);
      actorRole   : String(50);
      description : String(1000);
      metadata    : LargeString;
      occurredAt  : Timestamp;
}

// ---------------------------------------------------------------------------
// Work Sessions
// ---------------------------------------------------------------------------

entity WorkSessions {
  key id             : String(36);
      consultant     : Association to Users;
      ticket         : Association to Tickets;
      project        : Association to Projects;
      date           : Date;
      hours          : Decimal(5,2);
      description    : String(1000);
      sentToStraTIME : Boolean default false;
      sentAt         : Timestamp;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

entity Notifications {
  key id        : String(36);
      user      : Association to Users;
      type      : String(50);
      title     : String(200);
      message   : String(1000);
      read      : Boolean default false;
      createdAt : Timestamp;
}

// ---------------------------------------------------------------------------
// Reference Data
// ---------------------------------------------------------------------------

entity ReferenceData {
  key id         : String(36);
      type       : String(30);
      code       : String(30);
      label      : String(100);
      active     : Boolean default true;
      orderIndex : Integer;
}

// ---------------------------------------------------------------------------
// Allocations
// ---------------------------------------------------------------------------

entity Allocations {
  key id                : String(36);
      user              : Association to Users;
      project           : Association to Projects;
      allocationPercent : Integer;
      startDate         : Date;
      endDate           : Date;
}

// ---------------------------------------------------------------------------
// Leave Requests
// ---------------------------------------------------------------------------

entity LeaveRequests {
  key id         : String(36);
      consultant : Association to Users;
      startDate  : Date;
      endDate    : Date;
      reason     : String(500);
      status     : LeaveStatus;
      manager    : Association to Users;
      createdAt  : Timestamp;
      reviewedAt : Timestamp;
}

// ---------------------------------------------------------------------------
// Imputation Periods
// ---------------------------------------------------------------------------

entity ImputationPeriods {
  key id              : String(36);
      user            : Association to Users;
      year            : Integer;
      month           : Integer;
      period          : Integer;
      totalHours      : Decimal(6,2);
      status          : ImputationPeriodStatus;
      sentAt          : Timestamp;
      validatedBy     : Association to Users;
      validatedAt     : Timestamp;
      rejectionReason : String(500);
}

// ---------------------------------------------------------------------------
// Abaques – Estimation reference grids
// ---------------------------------------------------------------------------

entity Abaques {
  key id               : String(36);
      project          : Association to Projects;
      title            : String(200);
      version          : String(10);
      createdAt        : Timestamp;
      createdBy        : Association to Users;
      lastUpdatedAt    : Timestamp;
      lastUpdatedBy    : Association to Users;
      approvedByClient : Boolean default false;
      approvedAt       : Timestamp;
      entries          : Composition of many AbaqueEntries on entries.abaque = $self;
}

entity AbaqueEntries {
  key id           : String(50);
      abaque       : Association to Abaques;
      devType      : DevType;
      complexite   : TicketComplexite;
      priorite     : TicketPriorite;
      standardDays : Integer;
      maxDays      : Integer;
      notes        : String(500);
}
