// Entity types for SAP CAP Performance Management Platform

export type UserRole = 'ADMIN' | 'MANAGER' | 'CONSULTANT_TECHNIQUE' | 'CONSULTANT_FONCTIONNEL' | 'CHEF_DE_PROJET' | 'COORDINATEUR_DEV';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ValidationStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FEEDBACK' | 'RESOLVED' | 'CLOSED';
export type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CertificationStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type DevType = 'Formulaire' | 'Report' | 'Enhancement' | 'Programme';

export type TicketComplexite = 'Simple' | 'Moyen' | 'Complexe' | 'Très Complexe';
export type TicketPriorite = 0 | 1 | 2 | 3;
export type ImputationPeriodStatus = 'draft' | 'sent' | 'pending' | 'validated' | 'rejected';

// ---------------------------------------------------------------------------
// Objet – Grouping container for tickets & documentations inside a project
// ---------------------------------------------------------------------------

export interface Objet {
  id: string;
  projectId: string;
  code: string;               // WRICEF code e.g. MM-001, SD-005
  name: string;
  description?: string;
  module?: string;             // SAP module e.g. MM, SD, FI, CO, PP
  devType?: DevType;
  complexite?: TicketComplexite;
  priorite?: TicketPriorite;
  createdAt: string;
  createdBy?: string;
}

export interface Documentation {
  id: string;
  objetId: string;
  title: string;
  content: string;          // Markdown
  version: number;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt?: string;
}

// ---------------------------------------------------------------------------
// WorkSession – Manual hour logging per ticket (replaces Timer / TimeLog)
// ---------------------------------------------------------------------------

export interface WorkSession {
  id: string;
  consultantId: string;
  ticketId: string;
  projectId: string;
  date: string;
  hours: number;            // e.g. 1.5
  description?: string;
  sentToStraTIME: boolean;
  sentAt?: string;
}

// ---------------------------------------------------------------------------
// Certification (structured, replaces string[] on User)
// ---------------------------------------------------------------------------
export interface Certification {
  id: string;
  name: string;
  issuingBody: string;
  dateObtained: string;
  expiryDate?: string;
  status: CertificationStatus;
}

// ---------------------------------------------------------------------------
// Ticket history event
// ---------------------------------------------------------------------------
export interface TicketEvent {
  id: string;
  timestamp: string;
  userId: string;
  action: 'CREATED' | 'STATUS_CHANGE' | 'ASSIGNED' | 'COMMENT' | 'PRIORITY_CHANGE';
  fromValue?: string;
  toValue?: string;
  comment?: string;
}

// ---------------------------------------------------------------------------
// Message – Chat message on a ticket
// ---------------------------------------------------------------------------

export interface Message {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// ActivityEvent – Chronological event on a ticket
// ---------------------------------------------------------------------------

export type ActivityEventType =
  | 'status_change'
  | 'assignee_change'
  | 'message_sent'
  | 'work_session_logged'
  | 'chiffrage_updated'
  | 'comment_added'
  | 'ticket_created'
  | 'priority_change'
  | 'straTIME_sent'
  | 'abaque_exceeded';

export interface ActivityEvent {
  id: string;
  ticketId: string;
  type: ActivityEventType;
  actorId: string;
  actorName: string;
  actorRole: string;
  description: string;
  metadata?: Record<string, unknown>;
  occurredAt: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Core entities
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  skills: string[];
  certifications: Certification[];
  availabilityPercent: number;
  teamId?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  code: string;                // Short project code for WRICEF generation e.g. SAPS, FIOR
  name: string;
  managerId: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  priority: Priority;
  description: string;
  progress?: number;
  budget?: number;
  complexity?: Complexity;
  techKeywords?: string[];
  documentation?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId?: string;
  plannedStart: string;
  plannedEnd: string;
  realStart?: string;
  realEnd?: string;
  progressPercent: number;
  estimatedHours: number;
  actualHours: number;
  isCritical: boolean;
  riskLevel: RiskLevel;
  comments?: string;
}

export interface Timesheet {
  id: string;
  userId: string;
  date: string;
  hours: number;
  projectId: string;
  taskId?: string;
  comment?: string;
}

export interface Evaluation {
  id: string;
  userId: string;
  evaluatorId: string;
  projectId: string;
  period: string;
  score: number;
  qualitativeGrid: {
    productivity: number;
    quality: number;
    autonomy: number;
    collaboration: number;
    innovation: number;
  };
  feedback: string;
  createdAt: string;
}

export interface Deliverable {
  id: string;
  projectId: string;
  taskId?: string;
  type: string;
  name: string;
  url?: string;
  fileRef?: string;
  validationStatus: ValidationStatus;
  functionalComment?: string;
  createdAt: string;
}

export interface Ticket {
  id: string;
  projectId: string;
  objetId?: string;
  createdBy: string;
  assignedTo?: string;
  status: TicketStatus;
  priority: Priority;
  devType?: DevType;
  title: string;
  description: string;
  dueDate?: string;
  createdAt: string;
  updatedAt?: string;
  history: TicketEvent[];
  workSessions?: WorkSession[];
  // Section 2 fields
  chiffrage?: number;           // Estimated hours
  complexite?: TicketComplexite;
  priorite?: TicketPriorite;    // 0=Critique, 1=Haute, 2=Moyenne, 3=Basse
  module?: string;              // SAP module (e.g. FI, CO, MM, SD, PP)
  wricef: string;               // Auto-generated WRICEF code: {ProjectCode}-{ObjetCode}-{Serial}
  chiffrageJustification?: string; // Required when chiffrage exceeds abaque maxDays
  messages?: Message[];
  activityFeed?: ActivityEvent[];
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ReferenceData {
  id: string;
  type: 'TASK_STATUS' | 'PRIORITY' | 'PROJECT_TYPE' | 'SKILL';
  code: string;
  label: string;
  active: boolean;
  order?: number;
}

export interface Allocation {
  id: string;
  userId: string;
  projectId: string;
  allocationPercent: number;
  startDate: string;
  endDate: string;
}

export interface LeaveRequest {
  id: string;
  consultantId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  managerId: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ImputationPeriod {
  id: string;
  userId: string;
  year: number;
  month: number;           // 1-12
  period: 1 | 2;           // 1 = 1st–15th, 2 = 16th–end
  totalHours: number;
  status: ImputationPeriodStatus;
  sentAt?: string;
  validatedBy?: string;
  validatedAt?: string;
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// Abaque – Reference estimation grid agreed with the client
// ---------------------------------------------------------------------------

export interface AbaqueEntry {
  id: string;
  devType: DevType;
  complexite: TicketComplexite;
  priorite: TicketPriorite;
  maxDays: number;
  standardDays: number;
  notes?: string;
}

export interface Abaque {
  id: string;
  projectId: string;
  title: string;
  version: string;
  createdAt: string;
  createdBy: string;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
  approvedByClient: boolean;
  approvedAt?: string;
  entries: AbaqueEntry[];
}

export interface KPI {
  projectProgress: number;
  tasksOnTrack: number;
  tasksLate: number;
  criticalTasks: number;
  averageProductivity: number;
  allocationRate: number;
  activeRisks: number;
}
