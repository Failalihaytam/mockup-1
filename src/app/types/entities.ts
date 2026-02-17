// Entity types for SAP CAP Performance Management Platform

export type UserRole = 'ADMIN' | 'MANAGER' | 'CONSULTANT_TECHNIQUE' | 'CONSULTANT_FONCTIONNEL';

export type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ProjectStatus = 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type RiskLevel = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ValidationStatus = 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_FEEDBACK' | 'RESOLVED' | 'CLOSED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  skills: string[];
  certifications: string[];
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
  createdBy: string;
  assignedTo?: string;
  status: TicketStatus;
  priority: Priority;
  title: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
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

export interface KPI {
  projectProgress: number;
  tasksOnTrack: number;
  tasksLate: number;
  criticalTasks: number;
  averageProductivity: number;
  allocationRate: number;
  activeRisks: number;
}
