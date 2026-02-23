// Entity types for SAP CAP Performance Management Platform

export type UserRole = 'ADMIN' | 'MANAGER' | 'CONSULTANT_TECHNIQUE' | 'CONSULTANT_FONCTIONNEL';

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

// ---------------------------------------------------------------------------
// Objet – Grouping container for tickets, docs & SFDs inside a project
// ---------------------------------------------------------------------------

export interface Objet {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface SFD {
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

export interface KPI {
  projectProgress: number;
  tasksOnTrack: number;
  tasksLate: number;
  criticalTasks: number;
  averageProductivity: number;
  allocationRate: number;
  activeRisks: number;
}
