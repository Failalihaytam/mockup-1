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
  LeaveRequest,
  WorkSession,
  Objet,
  SFD,
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
    certifications: [
      { id: 'c1', name: 'SAP Admin', issuingBody: 'SAP', dateObtained: '2023-03-15', expiryDate: '2027-03-15', status: 'VALID' },
      { id: 'c2', name: 'ITIL Foundation', issuingBody: 'Axelos', dateObtained: '2022-06-01', status: 'VALID' },
    ],
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
    certifications: [
      { id: 'c3', name: 'PMP', issuingBody: 'PMI', dateObtained: '2021-09-10', expiryDate: '2024-09-10', status: 'EXPIRED' },
      { id: 'c4', name: 'SAP PM Consultant', issuingBody: 'SAP', dateObtained: '2023-01-20', expiryDate: '2027-01-20', status: 'VALID' },
    ],
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
    certifications: [
      { id: 'c5', name: 'SAP Developer Associate', issuingBody: 'SAP', dateObtained: '2024-05-15', expiryDate: '2026-05-15', status: 'EXPIRING_SOON' },
      { id: 'c6', name: 'AWS Solutions Architect', issuingBody: 'AWS', dateObtained: '2024-01-10', expiryDate: '2027-01-10', status: 'VALID' },
    ],
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
    certifications: [
      { id: 'c7', name: 'SAP MM Consultant', issuingBody: 'SAP', dateObtained: '2023-11-01', expiryDate: '2026-11-01', status: 'VALID' },
      { id: 'c8', name: 'CBAP', issuingBody: 'IIBA', dateObtained: '2022-08-20', expiryDate: '2025-08-20', status: 'EXPIRED' },
    ],
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
    certifications: [
      { id: 'c9', name: 'SAP Integration Suite', issuingBody: 'SAP', dateObtained: '2025-02-01', expiryDate: '2028-02-01', status: 'VALID' },
      { id: 'c10', name: 'Java SE Certified', issuingBody: 'Oracle', dateObtained: '2024-06-15', status: 'VALID' },
    ],
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
    complexity: 'CRITICAL',
    techKeywords: ['S/4HANA', 'ABAP', 'Data Migration', 'HANA DB'],
    documentation: '## S/4HANA Migration\n\nThis project covers the full migration from SAP ECC to S/4HANA.\n\n### Scope\n- Data migration of all master data\n- Custom code remediation\n- Fiori app deployment\n\n### Key Decisions\n- Greenfield approach selected\n- Go-live target: June 2026',
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
    complexity: 'MEDIUM',
    techKeywords: ['SAP Fiori', 'UI5', 'Launchpad', 'OData'],
    documentation: '## Fiori Launchpad\n\nDeploy and configure the SAP Fiori Launchpad for the entire organization.\n\n### Apps\n- MM Purchase Orders\n- SD Sales Orders\n- FI Journal Entries',
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
    complexity: 'LOW',
    techKeywords: ['SAP Analytics Cloud', 'CDS Views', 'BW/4HANA'],
    documentation: '## Analytics Dashboard\n\nCustom dashboards for executive reporting.\n\n### Data Sources\n- CDS views on S/4HANA\n- BW/4HANA models',
  },
];

export const mockProjects: Project[] = persistedArray('projects', _defaultProjects);

// ---------------------------------------------------------------------------
// Mock Objets (grouping containers inside projects)
// ---------------------------------------------------------------------------

const _defaultObjets: Objet[] = [
  {
    id: 'obj1',
    projectId: 'p1',
    name: 'Gestion des données client',
    description: 'Migration et nettoyage des données client (KNA1, KNVV, etc.)',
    createdAt: '2026-01-05T09:00:00Z',
  },
  {
    id: 'obj2',
    projectId: 'p1',
    name: 'Scripts de migration batch',
    description: 'Jobs batch nocturnes pour la migration incrémentale',
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 'obj3',
    projectId: 'p2',
    name: 'Interface Fiori MM',
    description: 'Applications Fiori pour le module MM (Purchase Orders, Stock Overview)',
    createdAt: '2026-02-02T09:00:00Z',
  },
  {
    id: 'obj4',
    projectId: 'p2',
    name: 'Services de notification',
    description: 'Notifications push et alertes Fiori Launchpad',
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'obj5',
    projectId: 'p3',
    name: 'Reporting analytique',
    description: 'Tableaux de bord exécutifs et rapports CDS',
    createdAt: '2026-01-20T09:00:00Z',
  },
];

export const mockObjets: Objet[] = persistedArray('objets', _defaultObjets);

// ---------------------------------------------------------------------------
// Mock SFDs (Spécifications Fonctionnelles Détaillées)
// ---------------------------------------------------------------------------

const _defaultSFDs: SFD[] = [
  {
    id: 'sfd1',
    objetId: 'obj1',
    title: 'SFD – Migration données client KNA1',
    content: '## Objectif\n\nMigrer les fiches client (KNA1) vers S/4HANA BP.\n\n### Règles de mapping\n\n| Champ source | Champ cible | Règle |\n|---|---|---|\n| KUNNR | BP_NUMBER | Conversion 10→10 |\n| NAME1 | BP_NAME | Direct |\n| LAND1 | COUNTRY | Direct |\n\n### Cas particuliers\n- Clients archivés : exclus du périmètre\n- Doublons : fusion sur STCD1',
    version: 2,
    createdBy: 'u4',
    updatedBy: 'u2',
    createdAt: '2026-01-08T10:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
  },
  {
    id: 'sfd2',
    objetId: 'obj3',
    title: 'SFD – App Fiori Purchase Order',
    content: '## Description\n\nApplication Fiori basée sur UI5 pour la création et suivi des commandes d\'achat.\n\n### Fonctionnalités\n1. Liste des PO avec filtres avancés\n2. Création rapide de PO\n3. Workflow d\'approbation intégré\n\n### Services OData\n- `PurchaseOrderSet` (CRUD)\n- `SupplierSet` (read-only)',
    version: 1,
    createdBy: 'u4',
    createdAt: '2026-02-05T11:00:00Z',
  },
  {
    id: 'sfd3',
    objetId: 'obj5',
    title: 'SFD – Dashboard exécutif',
    content: '## Périmètre\n\nTableau de bord pour la direction générale.\n\n### KPIs\n- Chiffre d\'affaires mensuel\n- Marge brute\n- Nombre de commandes\n- Taux de service\n\n### Sources de données\n- CDS views `Z_CA_MONTHLY`, `Z_MARGIN`\n- BW/4HANA InfoProvider `ZSALES`',
    version: 1,
    createdBy: 'u4',
    createdAt: '2026-01-25T09:00:00Z',
  },
];

export const mockSFDs: SFD[] = persistedArray('sfds', _defaultSFDs);

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
    objetId: 'obj1',
    createdBy: 'u4',
    assignedTo: 'u3',
    status: 'OPEN',
    priority: 'HIGH',
    devType: 'Enhancement',
    title: 'Clarification needed on data mapping',
    description: 'Need technical input on customer master data mapping rules',
    dueDate: '2026-02-25',
    createdAt: '2026-02-15T14:20:00Z',
    history: [
      { id: 'te1', timestamp: '2026-02-15T14:20:00Z', userId: 'u4', action: 'CREATED', comment: 'Ticket created' },
      { id: 'te2', timestamp: '2026-02-15T14:25:00Z', userId: 'u4', action: 'ASSIGNED', toValue: 'u3', comment: 'Assigned to Pierre Dubois' },
    ],
  },
  {
    id: 'tk2',
    projectId: 'p2',
    objetId: 'obj3',
    createdBy: 'u4',
    assignedTo: 'u5',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    devType: 'Programme',
    title: 'Integration issue with backend',
    description: 'Fiori app not connecting to backend service',
    dueDate: '2026-02-28',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-02-12T16:30:00Z',
    history: [
      { id: 'te3', timestamp: '2026-02-10T11:00:00Z', userId: 'u4', action: 'CREATED', comment: 'Ticket created' },
      { id: 'te4', timestamp: '2026-02-12T16:30:00Z', userId: 'u2', action: 'STATUS_CHANGE', fromValue: 'OPEN', toValue: 'IN_PROGRESS', comment: 'Investigation started' },
    ],
  },
  {
    id: 'tk3',
    projectId: 'p1',
    objetId: 'obj2',
    createdBy: 'u2',
    assignedTo: 'u3',
    status: 'RESOLVED',
    priority: 'LOW',
    devType: 'Enhancement',
    title: 'Update migration script logging',
    description: 'Add detailed logging to data migration scripts for audit trail',
    dueDate: '2026-02-20',
    createdAt: '2026-02-05T09:00:00Z',
    updatedAt: '2026-02-18T10:00:00Z',
    history: [
      { id: 'te5', timestamp: '2026-02-05T09:00:00Z', userId: 'u2', action: 'CREATED', comment: 'Ticket created by manager' },
      { id: 'te6', timestamp: '2026-02-06T08:00:00Z', userId: 'u2', action: 'ASSIGNED', toValue: 'u3' },
      { id: 'te7', timestamp: '2026-02-10T11:00:00Z', userId: 'u3', action: 'STATUS_CHANGE', fromValue: 'OPEN', toValue: 'IN_PROGRESS' },
      { id: 'te8', timestamp: '2026-02-18T10:00:00Z', userId: 'u3', action: 'STATUS_CHANGE', fromValue: 'IN_PROGRESS', toValue: 'RESOLVED', comment: 'Logging added and tested' },
    ],
  },
  {
    id: 'tk4',
    projectId: 'p3',
    objetId: 'obj5',
    createdBy: 'u4',
    status: 'OPEN',
    priority: 'HIGH',
    devType: 'Report',
    title: 'Dashboard filters not working',
    description: 'Date range filter on the analytics dashboard returns empty results',
    dueDate: '2026-03-01',
    createdAt: '2026-02-19T08:00:00Z',
    history: [
      { id: 'te9', timestamp: '2026-02-19T08:00:00Z', userId: 'u4', action: 'CREATED', comment: 'Ticket created' },
    ],
  },
  {
    id: 'tk5',
    projectId: 'p1',
    objetId: 'obj2',
    createdBy: 'u2',
    assignedTo: 'u3',
    status: 'OPEN',
    priority: 'HIGH',
    devType: 'Programme',
    title: 'Implement batch job error handling',
    description: 'Add retry logic and error notifications to the nightly batch migration job',
    dueDate: '2026-03-05',
    createdAt: '2026-02-18T10:00:00Z',
    history: [
      { id: 'te10', timestamp: '2026-02-18T10:00:00Z', userId: 'u2', action: 'CREATED', comment: 'Ticket created by manager' },
      { id: 'te11', timestamp: '2026-02-18T10:05:00Z', userId: 'u2', action: 'ASSIGNED', toValue: 'u3', comment: 'Assigned to Pierre Dubois' },
    ],
  },
  {
    id: 'tk6',
    projectId: 'p2',
    objetId: 'obj4',
    createdBy: 'u2',
    assignedTo: 'u3',
    status: 'OPEN',
    priority: 'MEDIUM',
    devType: 'Formulaire',
    title: 'Configure Fiori notification service',
    description: 'Set up push notifications for task assignments and deadline reminders in Fiori Launchpad',
    dueDate: '2026-03-10',
    createdAt: '2026-02-19T07:30:00Z',
    history: [
      { id: 'te12', timestamp: '2026-02-19T07:30:00Z', userId: 'u2', action: 'CREATED', comment: 'Ticket created by manager' },
      { id: 'te13', timestamp: '2026-02-19T07:35:00Z', userId: 'u2', action: 'ASSIGNED', toValue: 'u3', comment: 'Assigned to Pierre Dubois' },
    ],
  },
  {
    id: 'tk7',
    projectId: 'p1',
    objetId: 'obj1',
    createdBy: 'u3',
    assignedTo: 'u3',
    status: 'OPEN',
    priority: 'CRITICAL',
    devType: 'Programme',
    title: 'Fix memory leak in data export module',
    description: 'The export of large datasets causes the Node process to run out of memory after ~500k rows',
    dueDate: '2026-02-25',
    createdAt: '2026-02-19T09:00:00Z',
    history: [
      { id: 'te14', timestamp: '2026-02-19T09:00:00Z', userId: 'u3', action: 'CREATED', comment: 'Ticket created' },
    ],
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
// Mock Leave Requests
// ---------------------------------------------------------------------------

const _defaultLeaveRequests: LeaveRequest[] = [
  {
    id: 'lr1',
    consultantId: 'u3',
    startDate: '2026-03-10',
    endDate: '2026-03-14',
    reason: 'Family vacation',
    status: 'APPROVED',
    managerId: 'u2',
    createdAt: '2026-02-10T09:00:00Z',
    reviewedAt: '2026-02-11T14:00:00Z',
  },
  {
    id: 'lr2',
    consultantId: 'u5',
    startDate: '2026-03-03',
    endDate: '2026-03-05',
    reason: 'Personal leave',
    status: 'PENDING',
    managerId: 'u2',
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'lr3',
    consultantId: 'u3',
    startDate: '2026-04-20',
    endDate: '2026-04-24',
    reason: 'Training conference',
    status: 'PENDING',
    managerId: 'u2',
    createdAt: '2026-02-19T08:30:00Z',
  },
  {
    id: 'lr4',
    consultantId: 'u5',
    startDate: '2026-01-20',
    endDate: '2026-01-22',
    status: 'REJECTED',
    managerId: 'u2',
    createdAt: '2026-01-10T09:00:00Z',
    reviewedAt: '2026-01-12T11:00:00Z',
  },
];

export const mockLeaveRequests: LeaveRequest[] = persistedArray('leaveRequests', _defaultLeaveRequests);

// ---------------------------------------------------------------------------
// Mock Work Sessions (manual hour logging – replaces TimeLogs)
// ---------------------------------------------------------------------------

const _defaultWorkSessions: WorkSession[] = [
  {
    id: 'ws1',
    consultantId: 'u3',
    ticketId: 'tk3',
    projectId: 'p1',
    date: '2026-02-10',
    hours: 2,
    description: 'Initial analysis and logging framework setup',
    sentToStraTIME: true,
    sentAt: '2026-02-10T18:00:00Z',
  },
  {
    id: 'ws2',
    consultantId: 'u3',
    ticketId: 'tk3',
    projectId: 'p1',
    date: '2026-02-14',
    hours: 1.5,
    description: 'Implementation of detailed audit trail logging',
    sentToStraTIME: true,
    sentAt: '2026-02-14T17:30:00Z',
  },
  {
    id: 'ws3',
    consultantId: 'u3',
    ticketId: 'tk3',
    projectId: 'p1',
    date: '2026-02-18',
    hours: 0.5,
    description: 'Final testing and validation',
    sentToStraTIME: false,
  },
  {
    id: 'ws4',
    consultantId: 'u5',
    ticketId: 'tk2',
    projectId: 'p2',
    date: '2026-02-12',
    hours: 3,
    description: 'Backend connection investigation & debugging',
    sentToStraTIME: true,
    sentAt: '2026-02-12T19:00:00Z',
  },
  {
    id: 'ws5',
    consultantId: 'u5',
    ticketId: 'tk2',
    projectId: 'p2',
    date: '2026-02-15',
    hours: 1,
    description: 'OData endpoint testing',
    sentToStraTIME: false,
  },
  {
    id: 'ws6',
    consultantId: 'u3',
    ticketId: 'tk1',
    projectId: 'p1',
    date: '2026-02-16',
    hours: 0.75,
    description: 'Data mapping analysis for customer master',
    sentToStraTIME: false,
  },
];

export const mockWorkSessions: WorkSession[] = persistedArray('workSessions', _defaultWorkSessions);

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
