// Mock data service for development and testing
// Data is persisted in localStorage so mutations survive page refreshes.

import {
  User,
  Project,
  Task,
  Timesheet,
  Evaluation,
  Deliverable,
  Ticket,
  Notification,
  ReferenceData,
  Allocation,
  KPI,
} from '../types/entities';

// ---------------------------------------------------------------------------
// localStorage-backed store helper
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'sap_mock_';

/**
 * Creates a mutable array that is automatically persisted to localStorage.
 * On first load it hydrates from localStorage; if nothing is stored it uses
 * the provided `defaults`. Every mutation (push, splice, index set, etc.)
 * triggers a write-back via a Proxy.
 */
function persistedArray<T>(key: string, defaults: T[]): T[] {
  const storageKey = `${STORAGE_PREFIX}${key}`;

  // Hydrate
  let data: T[];
  try {
    const raw = localStorage.getItem(storageKey);
    data = raw ? (JSON.parse(raw) as T[]) : [...defaults];
  } catch {
    data = [...defaults];
  }

  const persist = () => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // quota exceeded — degrade gracefully
    }
  };

  // Persist initially so the defaults are stored on first visit
  if (!localStorage.getItem(storageKey)) {
    persist();
  }

  // Return proxied array that auto-persists on mutation
  return new Proxy(data, {
    set(target, prop, value, receiver) {
      const result = Reflect.set(target, prop, value, receiver);
      persist();
      return result;
    },
    deleteProperty(target, prop) {
      const result = Reflect.deleteProperty(target, prop);
      persist();
      return result;
    },
  });
}

/** Clears all persisted mock data and reloads the page. */
export function resetMockData(): void {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}

// ---------------------------------------------------------------------------
// Mock Users
// ---------------------------------------------------------------------------

const _defaultUsers: User[] = [
  {
    id: 'u1',
    name: 'Jean Dupont',
    email: 'jean.dupont@company.com',
    role: 'ADMIN',
    active: true,
    skills: ['Administration', 'Security', 'Governance'],
    certifications: ['SAP Admin', 'ITIL'],
    availabilityPercent: 100,
    teamId: 't1',
  },
  {
    id: 'u2',
    name: 'Marie Martin',
    email: 'marie.martin@company.com',
    role: 'MANAGER',
    active: true,
    skills: ['Project Management', 'Team Leadership', 'SAP'],
    certifications: ['PMP', 'SAP PM'],
    availabilityPercent: 90,
    teamId: 't1',
  },
  {
    id: 'u3',
    name: 'Pierre Dubois',
    email: 'pierre.dubois@company.com',
    role: 'CONSULTANT_TECHNIQUE',
    active: true,
    skills: ['ABAP', 'Fiori', 'CAP', 'Node.js'],
    certifications: ['SAP Developer', 'AWS Solutions Architect'],
    availabilityPercent: 75,
    teamId: 't1',
  },
  {
    id: 'u4',
    name: 'Sophie Bernard',
    email: 'sophie.bernard@company.com',
    role: 'CONSULTANT_FONCTIONNEL',
    active: true,
    skills: ['Business Analysis', 'SAP MM', 'Requirements'],
    certifications: ['SAP MM Consultant', 'CBAP'],
    availabilityPercent: 80,
    teamId: 't1',
  },
  {
    id: 'u5',
    name: 'Luc Moreau',
    email: 'luc.moreau@company.com',
    role: 'CONSULTANT_TECHNIQUE',
    active: true,
    skills: ['Java', 'Integration', 'BTP'],
    certifications: ['SAP Integration', 'Java Certified'],
    availabilityPercent: 60,
    teamId: 't1',
  },
];

export const mockUsers: User[] = persistedArray('users', _defaultUsers);

// ---------------------------------------------------------------------------
// Mock Projects
// ---------------------------------------------------------------------------

const _defaultProjects: Project[] = [
  {
    id: 'p1',
    name: 'SAP S/4HANA Migration',
    managerId: 'u2',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    description: 'Migration from ECC to S/4HANA',
    progress: 45,
    budget: 500000,
  },
  {
    id: 'p2',
    name: 'Fiori Launchpad Deployment',
    managerId: 'u2',
    startDate: '2026-02-01',
    endDate: '2026-04-30',
    status: 'ACTIVE',
    priority: 'HIGH',
    description: 'Deploy Fiori Launchpad for all users',
    progress: 65,
    budget: 150000,
  },
  {
    id: 'p3',
    name: 'Analytics Dashboard Development',
    managerId: 'u2',
    startDate: '2026-01-15',
    endDate: '2026-03-15',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    description: 'Create custom analytics dashboards',
    progress: 80,
    budget: 80000,
  },
];

export const mockProjects: Project[] = persistedArray('projects', _defaultProjects);

// ---------------------------------------------------------------------------
// Mock Tasks
// ---------------------------------------------------------------------------

const _defaultTasks: Task[] = [
  {
    id: 't1',
    projectId: 'p1',
    title: 'System Architecture Design',
    description: 'Design new S/4HANA architecture',
    status: 'DONE',
    priority: 'CRITICAL',
    assigneeId: 'u3',
    plannedStart: '2026-01-01',
    plannedEnd: '2026-01-15',
    realStart: '2026-01-01',
    realEnd: '2026-01-14',
    progressPercent: 100,
    estimatedHours: 80,
    actualHours: 75,
    isCritical: true,
    riskLevel: 'NONE',
  },
  {
    id: 't2',
    projectId: 'p1',
    title: 'Data Migration Scripts',
    description: 'Develop data migration scripts',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'u3',
    plannedStart: '2026-01-15',
    plannedEnd: '2026-02-28',
    realStart: '2026-01-16',
    progressPercent: 60,
    estimatedHours: 120,
    actualHours: 80,
    isCritical: true,
    riskLevel: 'MEDIUM',
  },
  {
    id: 't3',
    projectId: 'p1',
    title: 'Testing & Validation',
    description: 'Complete UAT testing',
    status: 'BLOCKED',
    priority: 'CRITICAL',
    assigneeId: 'u5',
    plannedStart: '2026-02-01',
    plannedEnd: '2026-02-20',
    realStart: '2026-02-05',
    progressPercent: 30,
    estimatedHours: 100,
    actualHours: 50,
    isCritical: true,
    riskLevel: 'HIGH',
    comments: 'Waiting for test environment access',
  },
  {
    id: 't4',
    projectId: 'p2',
    title: 'Fiori App Configuration',
    description: 'Configure Fiori apps for launchpad',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assigneeId: 'u3',
    plannedStart: '2026-02-01',
    plannedEnd: '2026-02-28',
    realStart: '2026-02-01',
    progressPercent: 70,
    estimatedHours: 60,
    actualHours: 45,
    isCritical: false,
    riskLevel: 'LOW',
  },
  {
    id: 't5',
    projectId: 'p2',
    title: 'User Training Material',
    description: 'Create training documentation',
    status: 'TO_DO',
    priority: 'MEDIUM',
    assigneeId: 'u4',
    plannedStart: '2026-03-01',
    plannedEnd: '2026-03-15',
    progressPercent: 0,
    estimatedHours: 40,
    actualHours: 0,
    isCritical: false,
    riskLevel: 'NONE',
  },
  {
    id: 't6',
    projectId: 'p3',
    title: 'Dashboard UI Design',
    description: 'Design analytics dashboard UI',
    status: 'DONE',
    priority: 'HIGH',
    assigneeId: 'u3',
    plannedStart: '2026-01-15',
    plannedEnd: '2026-02-01',
    realStart: '2026-01-15',
    realEnd: '2026-01-30',
    progressPercent: 100,
    estimatedHours: 50,
    actualHours: 48,
    isCritical: false,
    riskLevel: 'NONE',
  },
];

export const mockTasks: Task[] = persistedArray('tasks', _defaultTasks);

// ---------------------------------------------------------------------------
// Mock Timesheets
// ---------------------------------------------------------------------------

const _defaultTimesheets: Timesheet[] = [
  {
    id: 'ts1',
    userId: 'u3',
    date: '2026-02-17',
    hours: 8,
    projectId: 'p1',
    taskId: 't2',
    comment: 'Working on migration scripts',
  },
  {
    id: 'ts2',
    userId: 'u3',
    date: '2026-02-16',
    hours: 7,
    projectId: 'p2',
    taskId: 't4',
    comment: 'Fiori configuration',
  },
];

export const mockTimesheets: Timesheet[] = persistedArray('timesheets', _defaultTimesheets);

// ---------------------------------------------------------------------------
// Mock Evaluations
// ---------------------------------------------------------------------------

const _defaultEvaluations: Evaluation[] = [
  {
    id: 'e1',
    userId: 'u3',
    evaluatorId: 'u2',
    projectId: 'p1',
    period: '2026-Q1',
    score: 4.2,
    qualitativeGrid: {
      productivity: 4,
      quality: 5,
      autonomy: 4,
      collaboration: 4,
      innovation: 4,
    },
    feedback: 'Excellent technical work on the migration project. Strong problem-solving skills.',
    createdAt: '2026-01-31T10:00:00Z',
  },
];

export const mockEvaluations: Evaluation[] = persistedArray('evaluations', _defaultEvaluations);

// ---------------------------------------------------------------------------
// Mock Deliverables
// ---------------------------------------------------------------------------

const _defaultDeliverables: Deliverable[] = [
  {
    id: 'd1',
    projectId: 'p1',
    taskId: 't1',
    type: 'Technical Specification',
    name: 'S/4HANA Architecture Document',
    url: '/deliverables/arch-doc.pdf',
    validationStatus: 'APPROVED',
    createdAt: '2026-01-14T15:30:00Z',
  },
  {
    id: 'd2',
    projectId: 'p2',
    taskId: 't5',
    type: 'Training Material',
    name: 'Fiori User Guide',
    validationStatus: 'PENDING',
    functionalComment: 'Please add more screenshots',
    createdAt: '2026-02-10T09:00:00Z',
  },
];

export const mockDeliverables: Deliverable[] = persistedArray('deliverables', _defaultDeliverables);

// ---------------------------------------------------------------------------
// Mock Tickets
// ---------------------------------------------------------------------------

const _defaultTickets: Ticket[] = [
  {
    id: 'tk1',
    projectId: 'p1',
    createdBy: 'u4',
    assignedTo: 'u3',
    status: 'OPEN',
    priority: 'HIGH',
    title: 'Clarification needed on data mapping',
    description: 'Need technical input on customer master data mapping rules',
    createdAt: '2026-02-15T14:20:00Z',
  },
  {
    id: 'tk2',
    projectId: 'p2',
    createdBy: 'u4',
    assignedTo: 'u5',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    title: 'Integration issue with backend',
    description: 'Fiori app not connecting to backend service',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-12T16:30:00Z',
  },
];

export const mockTickets: Ticket[] = persistedArray('tickets', _defaultTickets);

// ---------------------------------------------------------------------------
// Mock Notifications
// ---------------------------------------------------------------------------

const _defaultNotifications: Notification[] = [
  {
    id: 'n1',
    userId: 'u3',
    type: 'TASK_ASSIGNED',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Data Migration Scripts"',
    read: false,
    createdAt: '2026-02-17T09:00:00Z',
  },
  {
    id: 'n2',
    userId: 'u3',
    type: 'DEADLINE_APPROACHING',
    title: 'Deadline Approaching',
    message: 'Task "Fiori App Configuration" is due in 3 days',
    read: false,
    createdAt: '2026-02-17T08:00:00Z',
  },
  {
    id: 'n3',
    userId: 'u2',
    type: 'RISK_ALERT',
    title: 'High Risk Task',
    message: 'Task "Testing & Validation" is blocked',
    read: true,
    createdAt: '2026-02-16T15:00:00Z',
  },
];

export const mockNotifications: Notification[] = persistedArray('notifications', _defaultNotifications);

// ---------------------------------------------------------------------------
// Mock Reference Data
// ---------------------------------------------------------------------------

const _defaultReferenceData: ReferenceData[] = [
  {
    id: 'r1',
    type: 'SKILL',
    code: 'SAP_ABAP',
    label: 'SAP ABAP Development',
    active: true,
    order: 1,
  },
  {
    id: 'r2',
    type: 'SKILL',
    code: 'SAP_FIORI',
    label: 'SAP Fiori/UI5',
    active: true,
    order: 2,
  },
  {
    id: 'r3',
    type: 'PROJECT_TYPE',
    code: 'MIGRATION',
    label: 'System Migration',
    active: true,
    order: 1,
  },
];

export const mockReferenceData: ReferenceData[] = persistedArray('referenceData', _defaultReferenceData);

// ---------------------------------------------------------------------------
// Mock Allocations
// ---------------------------------------------------------------------------

const _defaultAllocations: Allocation[] = [
  {
    id: 'a1',
    userId: 'u3',
    projectId: 'p1',
    allocationPercent: 50,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
  },
  {
    id: 'a2',
    userId: 'u3',
    projectId: 'p2',
    allocationPercent: 25,
    startDate: '2026-02-01',
    endDate: '2026-04-30',
  },
  {
    id: 'a3',
    userId: 'u5',
    projectId: 'p1',
    allocationPercent: 60,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
  },
];

export const mockAllocations: Allocation[] = persistedArray('allocations', _defaultAllocations);

// ---------------------------------------------------------------------------
// Mock KPIs (static, not persisted)
// ---------------------------------------------------------------------------

export const mockKPI: KPI = {
  projectProgress: 63,
  tasksOnTrack: 3,
  tasksLate: 1,
  criticalTasks: 2,
  averageProductivity: 4.1,
  allocationRate: 72,
  activeRisks: 2,
};

// ---------------------------------------------------------------------------
// Chart data generators (static, not persisted)
// ---------------------------------------------------------------------------

export const getProjectProgressTrend = () => [
  { date: '2026-01', progress: 15 },
  { date: '2026-02', progress: 35 },
  { date: '2026-03', progress: 52 },
  { date: '2026-04', progress: 63 },
  { date: '2026-05', progress: 70 },
  { date: '2026-06', progress: 85 },
];

export const getTasksByStatus = () => [
  { status: 'To Do', count: 8 },
  { status: 'In Progress', count: 12 },
  { status: 'Blocked', count: 2 },
  { status: 'Done', count: 18 },
];

export const getConsultantWorkload = () => [
  { name: 'Pierre D.', planned: 120, actual: 105 },
  { name: 'Luc M.', planned: 100, actual: 95 },
  { name: 'Sophie B.', planned: 80, actual: 82 },
  { name: 'Marc L.', planned: 90, actual: 88 },
];

export const getAllocationByProject = () => [
  { project: 'S/4HANA Migration', allocation: 45 },
  { project: 'Fiori Launchpad', allocation: 25 },
  { project: 'Analytics Dashboard', allocation: 15 },
  { project: 'Other', allocation: 15 },
];
