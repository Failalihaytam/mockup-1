// CAP OData v4 Client Layer
// Supports two modes via VITE_API_MODE env var:
//   "mock"    (default) – uses localStorage-persisted arrays from mockData.ts
//   "backend" – talks to the real CAP OData backend
//
// All exports are identical in both modes so NO page changes are required.

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
  LeaveRequest,
  WorkSession,
  Objet,
  Documentation,
  ImputationPeriod,
  Abaque,
  AbaqueEntry,
  TicketEvent,
  ActivityEvent,
  Certification,
} from '../types/entities';

import {
  mockUsers,
  mockProjects,
  mockTasks,
  mockTimesheets,
  mockEvaluations,
  mockDeliverables,
  mockTickets,
  mockNotifications,
  mockReferenceData,
  mockAllocations,
  mockLeaveRequests,
  mockWorkSessions,
  mockObjets,
  mockDocumentations,
  mockImputationPeriods,
  mockAbaques,
} from './mockData';

// ============================================================================
// Configuration
// ============================================================================

/** Set VITE_API_MODE=backend in .env to use real CAP backend */
const USE_MOCK_DATA = import.meta.env.VITE_API_MODE !== 'backend';

// CDS service base URLs – must match @(path: ...) in *.cds files
const ADMIN = '/api/admin';
const PROJECT = '/api/project';

// ============================================================================
// OData v4 Types
// ============================================================================

export interface ODataQueryOptions {
  $filter?: string;
  $select?: string;
  $expand?: string;
  $orderby?: string;
  $top?: number;
  $skip?: number;
  $count?: boolean;
  $search?: string;
}

export interface ODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

export interface ODataSingleResponse<T> {
  '@odata.context'?: string;
  '@odata.etag'?: string;
  value?: T;
}

export interface ODataError {
  error: {
    code: string;
    message: string;
    target?: string;
    details?: Array<{
      code: string;
      message: string;
      target?: string;
    }>;
    innererror?: {
      errordetails?: Array<{
        code: string;
        message: string;
        severity?: string;
      }>;
    };
  };
}

// ============================================================================
// OData Helpers
// ============================================================================

function buildQueryString(options?: ODataQueryOptions): string {
  if (!options) return '';
  const params = new URLSearchParams();
  if (options.$filter) params.append('$filter', options.$filter);
  if (options.$select) params.append('$select', options.$select);
  if (options.$expand) params.append('$expand', options.$expand);
  if (options.$orderby) params.append('$orderby', options.$orderby);
  if (options.$top !== undefined) params.append('$top', options.$top.toString());
  if (options.$skip !== undefined) params.append('$skip', options.$skip.toString());
  if (options.$count) params.append('$count', 'true');
  if (options.$search) params.append('$search', options.$search);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Generic OData fetch.
 * @param base  One of ADMIN or PROJECT
 * @param endpoint  Path starting with '/' e.g. "/Users" or "/Users('u1')"
 */
async function odataFetch<T>(
  base: string,
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const response = await fetch(`${base}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorData: ODataError | null = null;
      try {
        errorData = (await response.json()) as ODataError;
      } catch {
        throw new Error(`OData request failed: ${response.statusText}`);
      }
      const errorMessage = errorData?.error?.message || response.statusText;
      const errorCode = errorData?.error?.code || response.status.toString();
      throw new Error(`[${errorCode}] ${errorMessage}`);
    }

    // 204 No Content (DELETE)
    if (response.status === 204) return undefined as T;

    return await response.json();
  } catch (error) {
    console.error('OData fetch error:', error);
    throw error;
  }
}

const mockDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// ============================================================================
// Field Mapping:  Frontend camelCase  ⇆  Backend CDS _id columns
// ============================================================================
// CDS Associations generate FK columns: <assocName>_<targetKey>.
// Since every target entity's key is `id`, the pattern is <assocName>_id.
// Additionally, `order` → `orderIndex` (SQL reserved word rename).

const F2B: Record<string, string> = {
  // frontend field      → backend column
  projectId:              'project_id',
  managerId:              'manager_id',
  assigneeId:             'assignee_id',
  consultantId:           'consultant_id',
  userId:                 'user_id',
  objetId:                'objet_id',
  taskId:                 'task_id',
  evaluatorId:            'evaluator_id',
  senderId:               'sender_id',
  actorId:                'actor_id',
  ticketId:               'ticket_id',
  // Associations whose frontend name has no "Id" suffix
  createdBy:              'createdBy_id',
  assignedTo:             'assignedTo_id',
  updatedBy:              'updatedBy_id',
  validatedBy:            'validatedBy_id',
  lastUpdatedBy:          'lastUpdatedBy_id',
  // Renamed fields
  order:                  'orderIndex',
};

const B2F: Record<string, string> = Object.fromEntries(
  Object.entries(F2B).map(([k, v]) => [v, k]),
);

/** Map a plain object's keys from frontend → backend naming */
function toBackend(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[F2B[k] ?? k] = v;
  }
  return out;
}

/** Map a plain object's keys from backend → frontend naming */
function toFrontend<T = any>(obj: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('@odata')) continue; // strip OData metadata props
    out[B2F[k] ?? k] = v;
  }
  return out as T;
}

// ---------------------------------------------------------------------------
// Entity-specific mappers (handle compositions & special fields)
// ---------------------------------------------------------------------------

function mapUser(b: any): User {
  const u = toFrontend<any>(b);
  // skills: Composition of UserSkills → string[]
  u.skills = Array.isArray(b.skills)
    ? b.skills.map((s: any) => s.skill)
    : u.skills ?? [];
  // certifications: Composition of Certifications → Certification[]
  u.certifications = Array.isArray(b.certifications)
    ? b.certifications.map(
        (c: any): Certification => ({
          id: c.id,
          name: c.name,
          issuingBody: c.issuingBody,
          dateObtained: c.dateObtained,
          expiryDate: c.expiryDate ?? undefined,
          status: c.status,
        }),
      )
    : u.certifications ?? [];
  return u as User;
}

function mapProject(b: any): Project {
  const p = toFrontend<any>(b);
  // techKeywords: Composition of ProjectKeywords → string[]
  p.techKeywords = Array.isArray(b.techKeywords)
    ? b.techKeywords.map((k: any) => k.keyword)
    : p.techKeywords ?? [];
  return p as Project;
}

function mapTicket(b: any): Ticket {
  const t = toFrontend<any>(b);
  // history is required in the interface – default to [] when not expanded
  t.history = Array.isArray(b.history)
    ? b.history.map((h: any) => toFrontend<TicketEvent>(h))
    : [];
  // optional compositions
  if (Array.isArray(b.messages)) {
    t.messages = b.messages.map((m: any) => toFrontend<any>(m));
  }
  if (Array.isArray(b.activityFeed)) {
    t.activityFeed = b.activityFeed.map((a: any) => {
      const mapped = toFrontend<any>(a);
      // metadata is LargeString (JSON) in CDS → parse to object
      if (typeof a.metadata === 'string' && a.metadata) {
        try {
          mapped.metadata = JSON.parse(a.metadata);
        } catch {
          /* keep as string */
        }
      }
      return mapped as ActivityEvent;
    });
  }
  return t as Ticket;
}

function mapAbaque(b: any): Abaque {
  const a = toFrontend<any>(b);
  a.entries = Array.isArray(b.entries)
    ? b.entries.map((e: any) => toFrontend<AbaqueEntry>(e))
    : a.entries ?? [];
  return a as Abaque;
}

function mapEvaluation(b: any): Evaluation {
  const e = toFrontend<any>(b);
  // CDS flattens structured types in OData JSON: qualitativeGrid_productivity etc.
  // Reconstruct the nested object expected by the frontend interface.
  if (!e.qualitativeGrid || typeof e.qualitativeGrid !== 'object') {
    e.qualitativeGrid = {
      productivity: b.qualitativeGrid_productivity ?? 0,
      quality: b.qualitativeGrid_quality ?? 0,
      autonomy: b.qualitativeGrid_autonomy ?? 0,
      collaboration: b.qualitativeGrid_collaboration ?? 0,
      innovation: b.qualitativeGrid_innovation ?? 0,
    };
  }
  // Clean up flattened keys passed through by toFrontend
  delete e.qualitativeGrid_productivity;
  delete e.qualitativeGrid_quality;
  delete e.qualitativeGrid_autonomy;
  delete e.qualitativeGrid_collaboration;
  delete e.qualitativeGrid_innovation;
  return e as Evaluation;
}

// ---------------------------------------------------------------------------
// toBackend wrappers for entities with compositions
// ---------------------------------------------------------------------------

function userToBackend(u: Record<string, any>): any {
  const b = toBackend(u);
  // skills: string[] → [{ skill: 'x' }]
  if (Array.isArray(u.skills)) {
    b.skills = u.skills.map((s: string) => ({ skill: s }));
  }
  return b;
}

function projectToBackend(p: Record<string, any>): any {
  const b = toBackend(p);
  // techKeywords: string[] → [{ keyword: 'x' }]
  if (Array.isArray(p.techKeywords)) {
    b.techKeywords = p.techKeywords.map((kw: string) => ({ keyword: kw }));
  }
  return b;
}

function ticketToBackend(t: Record<string, any>): any {
  const b = toBackend(t);
  // Convert composition arrays to backend format for deep updates
  if (Array.isArray(t.history)) {
    b.history = t.history.map((h: any) => toBackend(h));
  }
  if (Array.isArray(t.messages)) {
    b.messages = t.messages.map((m: any) => toBackend(m));
  }
  if (Array.isArray(t.activityFeed)) {
    b.activityFeed = t.activityFeed.map((a: any) => {
      const mapped = toBackend(a);
      // metadata must be stored as JSON string in CDS LargeString
      if (mapped.metadata && typeof mapped.metadata === 'object') {
        mapped.metadata = JSON.stringify(mapped.metadata);
      }
      return mapped;
    });
  }
  // workSessions is not a Ticket composition – strip it
  delete b.workSessions;
  return b;
}

function abaqueToBackend(a: Record<string, any>): any {
  const b = toBackend(a);
  if (Array.isArray(a.entries)) {
    b.entries = a.entries.map((e: any) => toBackend(e));
  }
  return b;
}

// ============================================================================
// API Exports
// ============================================================================

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------

export const UsersAPI = {
  async getAll(): Promise<User[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockUsers];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/Users?$expand=skills,certifications',
    );
    return res.value.map(mapUser);
  },

  async getById(id: string): Promise<User | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockUsers.find((u) => u.id === id) || null;
    }
    try {
      const b = await odataFetch<any>(
        ADMIN,
        `/Users('${id}')?$expand=skills,certifications`,
      );
      return mapUser(b);
    } catch {
      return null;
    }
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newUser: User = { ...user, id: `u${Date.now()}` };
      mockUsers.push(newUser);
      return newUser;
    }
    const b = await odataFetch<any>(ADMIN, '/Users', {
      method: 'POST',
      body: JSON.stringify(userToBackend(user as Record<string, any>)),
    });
    return mapUser(b);
  },

  async update(id: string, user: Partial<User>): Promise<User> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...user };
        return mockUsers[index];
      }
      throw new Error('User not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Users('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(userToBackend(user as Record<string, any>)),
    });
    return mapUser(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index !== -1) mockUsers.splice(index, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/Users('${id}')`, { method: 'DELETE' });
  },

  /** Call the backend login action — returns the authenticated user or throws */
  async login(email: string, password: string): Promise<User> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const localPart = email.split('@')[0].toLowerCase();
      const user =
        mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase()) ??
        mockUsers.find((u) => u.email.split('@')[0].toLowerCase() === localPart);
      if (!user) throw new Error('Invalid credentials');
      return user;
    }
    const b = await odataFetch<any>(ADMIN, '/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return mapUser(b);
  },
};

// ---------------------------------------------------------------------------
// Projects API
// ---------------------------------------------------------------------------

export const ProjectsAPI = {
  async getAll(): Promise<Project[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockProjects];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/Projects?$expand=techKeywords',
    );
    return res.value.map(mapProject);
  },

  async getById(id: string): Promise<Project | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockProjects.find((p) => p.id === id) || null;
    }
    try {
      const b = await odataFetch<any>(
        ADMIN,
        `/Projects('${id}')?$expand=techKeywords`,
      );
      return mapProject(b);
    } catch {
      return null;
    }
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const np: Project = { ...project, id: `p${Date.now()}` };
      mockProjects.push(np);
      return np;
    }
    const b = await odataFetch<any>(ADMIN, '/Projects', {
      method: 'POST',
      body: JSON.stringify(projectToBackend(project as Record<string, any>)),
    });
    return mapProject(b);
  },

  async update(id: string, project: Partial<Project>): Promise<Project> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockProjects.findIndex((p) => p.id === id);
      if (i !== -1) {
        mockProjects[i] = { ...mockProjects[i], ...project };
        return mockProjects[i];
      }
      throw new Error('Project not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Projects('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(projectToBackend(project as Record<string, any>)),
    });
    return mapProject(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockProjects.findIndex((p) => p.id === id);
      if (i !== -1) mockProjects.splice(i, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/Projects('${id}')`, { method: 'DELETE' });
  },
};

// ---------------------------------------------------------------------------
// Tasks API
// ---------------------------------------------------------------------------

export const TasksAPI = {
  async getAll(): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockTasks];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/Tasks');
    return res.value.map((t: any) => toFrontend<Task>(t));
  },

  async getByProject(projectId: string): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTasks.filter((t) => t.projectId === projectId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Tasks?$filter=project_id eq '${projectId}'`,
    );
    return res.value.map((t: any) => toFrontend<Task>(t));
  },

  async getByUser(userId: string): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTasks.filter((t) => t.assigneeId === userId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Tasks?$filter=assignee_id eq '${userId}'`,
    );
    return res.value.map((t: any) => toFrontend<Task>(t));
  },

  async update(id: string, task: Partial<Task>): Promise<Task> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockTasks.findIndex((t) => t.id === id);
      if (i !== -1) {
        mockTasks[i] = { ...mockTasks[i], ...task };
        return mockTasks[i];
      }
      throw new Error('Task not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Tasks('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(task as Record<string, any>)),
    });
    return toFrontend<Task>(b);
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nt: Task = { ...task, id: `t${Date.now()}` };
      mockTasks.push(nt);
      return nt;
    }
    const b = await odataFetch<any>(ADMIN, '/Tasks', {
      method: 'POST',
      body: JSON.stringify(toBackend(task as Record<string, any>)),
    });
    return toFrontend<Task>(b);
  },
};

// ---------------------------------------------------------------------------
// Timesheets API
// ---------------------------------------------------------------------------

export const TimesheetsAPI = {
  async getByUser(userId: string): Promise<Timesheet[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTimesheets.filter((t) => t.userId === userId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Timesheets?$filter=user_id eq '${userId}'`,
    );
    return res.value.map((t: any) => toFrontend<Timesheet>(t));
  },

  async create(timesheet: Omit<Timesheet, 'id'>): Promise<Timesheet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nt: Timesheet = { ...timesheet, id: `ts${Date.now()}` };
      mockTimesheets.push(nt);
      return nt;
    }
    const b = await odataFetch<any>(ADMIN, '/Timesheets', {
      method: 'POST',
      body: JSON.stringify(toBackend(timesheet as Record<string, any>)),
    });
    return toFrontend<Timesheet>(b);
  },

  async update(id: string, timesheet: Partial<Timesheet>): Promise<Timesheet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockTimesheets.findIndex((t) => t.id === id);
      if (i !== -1) {
        mockTimesheets[i] = { ...mockTimesheets[i], ...timesheet };
        return mockTimesheets[i];
      }
      throw new Error('Timesheet not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Timesheets('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(timesheet as Record<string, any>)),
    });
    return toFrontend<Timesheet>(b);
  },
};

// ---------------------------------------------------------------------------
// Evaluations API
// ---------------------------------------------------------------------------

export const EvaluationsAPI = {
  async getAll(): Promise<Evaluation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockEvaluations];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/Evaluations');
    return res.value.map(mapEvaluation);
  },

  async getByUser(userId: string): Promise<Evaluation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockEvaluations.filter((e) => e.userId === userId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Evaluations?$filter=user_id eq '${userId}'`,
    );
    return res.value.map(mapEvaluation);
  },

  async create(evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const ne: Evaluation = {
        ...evaluation,
        id: `e${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockEvaluations.push(ne);
      return ne;
    }
    const b = await odataFetch<any>(ADMIN, '/Evaluations', {
      method: 'POST',
      body: JSON.stringify(toBackend(evaluation as Record<string, any>)),
    });
    return mapEvaluation(b);
  },
};

// ---------------------------------------------------------------------------
// Deliverables API
// ---------------------------------------------------------------------------

export const DeliverablesAPI = {
  async getAll(): Promise<Deliverable[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockDeliverables];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/Deliverables');
    return res.value.map((d: any) => toFrontend<Deliverable>(d));
  },

  async create(
    deliverable: Omit<Deliverable, 'id' | 'createdAt'>,
  ): Promise<Deliverable> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nd: Deliverable = {
        ...deliverable,
        id: `d${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockDeliverables.unshift(nd);
      return nd;
    }
    const b = await odataFetch<any>(ADMIN, '/Deliverables', {
      method: 'POST',
      body: JSON.stringify(toBackend(deliverable as Record<string, any>)),
    });
    return toFrontend<Deliverable>(b);
  },

  async update(
    id: string,
    deliverable: Partial<Deliverable>,
  ): Promise<Deliverable> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockDeliverables.findIndex((d) => d.id === id);
      if (i !== -1) {
        mockDeliverables[i] = { ...mockDeliverables[i], ...deliverable };
        return mockDeliverables[i];
      }
      throw new Error('Deliverable not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Deliverables('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(deliverable as Record<string, any>)),
    });
    return toFrontend<Deliverable>(b);
  },
};

// ---------------------------------------------------------------------------
// Tickets API
// ---------------------------------------------------------------------------

export const TicketsAPI = {
  async getAll(): Promise<Ticket[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockTickets];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/Tickets?$expand=history,messages,activityFeed',
    );
    return res.value.map(mapTicket);
  },

  async getById(id: string): Promise<Ticket | undefined> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTickets.find((t) => t.id === id);
    }
    try {
      const b = await odataFetch<any>(
        ADMIN,
        `/Tickets('${id}')?$expand=history,messages,activityFeed`,
      );
      return mapTicket(b);
    } catch {
      return undefined;
    }
  },

  async create(ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nt: Ticket = {
        ...ticket,
        id: `tk${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockTickets.push(nt);
      return nt;
    }
    const b = await odataFetch<any>(ADMIN, '/Tickets', {
      method: 'POST',
      body: JSON.stringify(ticketToBackend(ticket as Record<string, any>)),
    });
    return mapTicket(b);
  },

  async update(id: string, ticket: Partial<Ticket>): Promise<Ticket> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockTickets.findIndex((t) => t.id === id);
      if (i !== -1) {
        mockTickets[i] = {
          ...mockTickets[i],
          ...ticket,
          updatedAt: new Date().toISOString(),
        };
        return mockTickets[i];
      }
      throw new Error('Ticket not found');
    }
    await odataFetch<any>(ADMIN, `/Tickets('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(ticketToBackend(ticket as Record<string, any>)),
    });
    // Re-fetch with $expand to get the full ticket including compositions
    const full = await odataFetch<any>(
      ADMIN,
      `/Tickets('${id}')?$expand=history,messages,activityFeed`,
    );
    return mapTicket(full);
  },
};

// ---------------------------------------------------------------------------
// Notifications API
// ---------------------------------------------------------------------------

export const NotificationsAPI = {
  async getByUser(userId: string): Promise<Notification[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockNotifications.filter((n) => n.userId === userId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Notifications?$filter=user_id eq '${userId}'`,
    );
    return res.value.map((n: any) => toFrontend<Notification>(n));
  },

  async markAsRead(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const n = mockNotifications.find((n) => n.id === id);
      if (n) n.read = true;
      return;
    }
    await odataFetch<void>(ADMIN, `/Notifications('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  },

  async create(
    notification: Omit<Notification, 'id' | 'createdAt'> & {
      createdAt?: string;
    },
  ): Promise<Notification> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nn: Notification = {
        ...notification,
        id: `n${Date.now()}`,
        createdAt: notification.createdAt ?? new Date().toISOString(),
      };
      mockNotifications.unshift(nn);
      return nn;
    }
    const b = await odataFetch<any>(ADMIN, '/Notifications', {
      method: 'POST',
      body: JSON.stringify(toBackend(notification as Record<string, any>)),
    });
    return toFrontend<Notification>(b);
  },
};

// ---------------------------------------------------------------------------
// Reference Data API
// ---------------------------------------------------------------------------

export const ReferenceDataAPI = {
  async getAll(): Promise<ReferenceData[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockReferenceData];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/ReferenceData');
    return res.value.map((r: any) => toFrontend<ReferenceData>(r));
  },

  async create(data: Omit<ReferenceData, 'id'>): Promise<ReferenceData> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nr: ReferenceData = { ...data, id: `r${Date.now()}` };
      mockReferenceData.push(nr);
      return nr;
    }
    const b = await odataFetch<any>(ADMIN, '/ReferenceData', {
      method: 'POST',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<ReferenceData>(b);
  },

  async update(
    id: string,
    data: Partial<ReferenceData>,
  ): Promise<ReferenceData> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockReferenceData.findIndex((r) => r.id === id);
      if (i !== -1) {
        mockReferenceData[i] = { ...mockReferenceData[i], ...data };
        return mockReferenceData[i];
      }
      throw new Error('Reference data not found');
    }
    const b = await odataFetch<any>(ADMIN, `/ReferenceData('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<ReferenceData>(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockReferenceData.findIndex((r) => r.id === id);
      if (i !== -1) mockReferenceData.splice(i, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/ReferenceData('${id}')`, {
      method: 'DELETE',
    });
  },
};

// ---------------------------------------------------------------------------
// Allocations API
// ---------------------------------------------------------------------------

export const AllocationsAPI = {
  async getAll(): Promise<Allocation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockAllocations];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/Allocations');
    return res.value.map((a: any) => toFrontend<Allocation>(a));
  },

  async update(
    id: string,
    allocation: Partial<Allocation>,
  ): Promise<Allocation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockAllocations.findIndex((a) => a.id === id);
      if (i !== -1) {
        mockAllocations[i] = { ...mockAllocations[i], ...allocation };
        return mockAllocations[i];
      }
      throw new Error('Allocation not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Allocations('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(allocation as Record<string, any>)),
    });
    return toFrontend<Allocation>(b);
  },

  async create(allocation: Omit<Allocation, 'id'>): Promise<Allocation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const na: Allocation = { ...allocation, id: `a${Date.now()}` };
      mockAllocations.push(na);
      return na;
    }
    const b = await odataFetch<any>(ADMIN, '/Allocations', {
      method: 'POST',
      body: JSON.stringify(toBackend(allocation as Record<string, any>)),
    });
    return toFrontend<Allocation>(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockAllocations.findIndex((a) => a.id === id);
      if (i !== -1) mockAllocations.splice(i, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/Allocations('${id}')`, {
      method: 'DELETE',
    });
  },
};

// ---------------------------------------------------------------------------
// Leave Requests API
// ---------------------------------------------------------------------------

export const LeaveRequestsAPI = {
  async getAll(): Promise<LeaveRequest[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockLeaveRequests];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/LeaveRequests');
    return res.value.map((lr: any) => toFrontend<LeaveRequest>(lr));
  },

  async getByConsultant(consultantId: string): Promise<LeaveRequest[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockLeaveRequests.filter(
        (lr) => lr.consultantId === consultantId,
      );
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/LeaveRequests?$filter=consultant_id eq '${consultantId}'`,
    );
    return res.value.map((lr: any) => toFrontend<LeaveRequest>(lr));
  },

  async create(
    leaveRequest: Omit<LeaveRequest, 'id' | 'createdAt'>,
  ): Promise<LeaveRequest> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nlr: LeaveRequest = {
        ...leaveRequest,
        id: `lr${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockLeaveRequests.push(nlr);
      return nlr;
    }
    const b = await odataFetch<any>(ADMIN, '/LeaveRequests', {
      method: 'POST',
      body: JSON.stringify(toBackend(leaveRequest as Record<string, any>)),
    });
    return toFrontend<LeaveRequest>(b);
  },

  async update(
    id: string,
    data: Partial<LeaveRequest>,
  ): Promise<LeaveRequest> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockLeaveRequests.findIndex((lr) => lr.id === id);
      if (i !== -1) {
        mockLeaveRequests[i] = { ...mockLeaveRequests[i], ...data };
        return mockLeaveRequests[i];
      }
      throw new Error('Leave request not found');
    }
    const b = await odataFetch<any>(ADMIN, `/LeaveRequests('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<LeaveRequest>(b);
  },
};

// ---------------------------------------------------------------------------
// Work Sessions API
// ---------------------------------------------------------------------------

export const WorkSessionsAPI = {
  async getAll(): Promise<WorkSession[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockWorkSessions];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/WorkSessions');
    return res.value.map((ws: any) => toFrontend<WorkSession>(ws));
  },

  async getByConsultant(consultantId: string): Promise<WorkSession[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockWorkSessions.filter(
        (ws) => ws.consultantId === consultantId,
      );
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/WorkSessions?$filter=consultant_id eq '${consultantId}'`,
    );
    return res.value.map((ws: any) => toFrontend<WorkSession>(ws));
  },

  async getByTicket(ticketId: string): Promise<WorkSession[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockWorkSessions.filter((ws) => ws.ticketId === ticketId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/WorkSessions?$filter=ticket_id eq '${ticketId}'`,
    );
    return res.value.map((ws: any) => toFrontend<WorkSession>(ws));
  },

  async create(session: Omit<WorkSession, 'id'>): Promise<WorkSession> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const ns: WorkSession = { ...session, id: `ws${Date.now()}` };
      mockWorkSessions.push(ns);
      return ns;
    }
    const b = await odataFetch<any>(ADMIN, '/WorkSessions', {
      method: 'POST',
      body: JSON.stringify(toBackend(session as Record<string, any>)),
    });
    return toFrontend<WorkSession>(b);
  },

  async update(
    id: string,
    data: Partial<WorkSession>,
  ): Promise<WorkSession> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockWorkSessions.findIndex((ws) => ws.id === id);
      if (i !== -1) {
        mockWorkSessions[i] = { ...mockWorkSessions[i], ...data };
        return mockWorkSessions[i];
      }
      throw new Error('Work session not found');
    }
    const b = await odataFetch<any>(ADMIN, `/WorkSessions('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<WorkSession>(b);
  },

  async sendToStraTIME(id: string): Promise<WorkSession> {
    if (USE_MOCK_DATA) {
      await mockDelay(1500);
      const i = mockWorkSessions.findIndex((ws) => ws.id === id);
      if (i !== -1) {
        mockWorkSessions[i] = {
          ...mockWorkSessions[i],
          sentToStraTIME: true,
          sentAt: new Date().toISOString(),
        };
        return mockWorkSessions[i];
      }
      throw new Error('Work session not found');
    }
    // Use ProjectService action
    const b = await odataFetch<any>(PROJECT, '/sendToStraTIME', {
      method: 'POST',
      body: JSON.stringify({ sessionIds: [id] }),
    });
    const sessions = Array.isArray(b) ? b : b.value ?? [b];
    return toFrontend<WorkSession>(sessions[0]);
  },

  async sendBatchToStraTIME(ids: string[]): Promise<WorkSession[]> {
    if (USE_MOCK_DATA) {
      await mockDelay(1500);
      const results: WorkSession[] = [];
      for (const id of ids) {
        const i = mockWorkSessions.findIndex((ws) => ws.id === id);
        if (i !== -1) {
          mockWorkSessions[i] = {
            ...mockWorkSessions[i],
            sentToStraTIME: true,
            sentAt: new Date().toISOString(),
          };
          results.push(mockWorkSessions[i]);
        }
      }
      return results;
    }
    const b = await odataFetch<any>(PROJECT, '/sendToStraTIME', {
      method: 'POST',
      body: JSON.stringify({ sessionIds: ids }),
    });
    const arr = Array.isArray(b) ? b : b.value ?? [];
    return arr.map((ws: any) => toFrontend<WorkSession>(ws));
  },
};

// ---------------------------------------------------------------------------
// Objets API
// ---------------------------------------------------------------------------

export const ObjetsAPI = {
  async getAll(): Promise<Objet[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockObjets];
    }
    const res = await odataFetch<ODataResponse<any>>(ADMIN, '/Objets');
    return res.value.map((o: any) => toFrontend<Objet>(o));
  },

  async getByProject(projectId: string): Promise<Objet[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockObjets.filter((o) => o.projectId === projectId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Objets?$filter=project_id eq '${projectId}'`,
    );
    return res.value.map((o: any) => toFrontend<Objet>(o));
  },

  async getById(id: string): Promise<Objet | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockObjets.find((o) => o.id === id) || null;
    }
    try {
      const b = await odataFetch<any>(ADMIN, `/Objets('${id}')`);
      return toFrontend<Objet>(b);
    } catch {
      return null;
    }
  },

  async create(objet: Omit<Objet, 'id'>): Promise<Objet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const no: Objet = {
        ...objet,
        id: `obj${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };
      mockObjets.push(no);
      return no;
    }
    const b = await odataFetch<any>(ADMIN, '/Objets', {
      method: 'POST',
      body: JSON.stringify(toBackend(objet as Record<string, any>)),
    });
    return toFrontend<Objet>(b);
  },

  async update(id: string, data: Partial<Objet>): Promise<Objet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockObjets.findIndex((o) => o.id === id);
      if (i !== -1) {
        mockObjets[i] = { ...mockObjets[i], ...data };
        return mockObjets[i];
      }
      throw new Error('Objet not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Objets('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<Objet>(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockObjets.findIndex((o) => o.id === id);
      if (i !== -1) mockObjets.splice(i, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/Objets('${id}')`, { method: 'DELETE' });
  },
};

// ---------------------------------------------------------------------------
// Documentations API
// ---------------------------------------------------------------------------

export const DocumentationsAPI = {
  async getAll(): Promise<Documentation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockDocumentations];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/Documentations',
    );
    return res.value.map((d: any) => toFrontend<Documentation>(d));
  },

  async getByObjet(objetId: string): Promise<Documentation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockDocumentations.filter((d) => d.objetId === objetId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Documentations?$filter=objet_id eq '${objetId}'`,
    );
    return res.value.map((d: any) => toFrontend<Documentation>(d));
  },

  async create(
    doc: Omit<Documentation, 'id' | 'createdAt'>,
  ): Promise<Documentation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const nd: Documentation = {
        ...doc,
        id: `doc${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockDocumentations.push(nd);
      return nd;
    }
    const b = await odataFetch<any>(ADMIN, '/Documentations', {
      method: 'POST',
      body: JSON.stringify(toBackend(doc as Record<string, any>)),
    });
    return toFrontend<Documentation>(b);
  },

  async update(
    id: string,
    data: Partial<Documentation>,
  ): Promise<Documentation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockDocumentations.findIndex((d) => d.id === id);
      if (i !== -1) {
        mockDocumentations[i] = {
          ...mockDocumentations[i],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        return mockDocumentations[i];
      }
      throw new Error('Documentation not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Documentations('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(toBackend(data as Record<string, any>)),
    });
    return toFrontend<Documentation>(b);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockDocumentations.findIndex((d) => d.id === id);
      if (i !== -1) mockDocumentations.splice(i, 1);
      return;
    }
    await odataFetch<void>(ADMIN, `/Documentations('${id}')`, {
      method: 'DELETE',
    });
  },
};

// ---------------------------------------------------------------------------
// Imputation Periods API
// ---------------------------------------------------------------------------

export const ImputationPeriodsAPI = {
  async getAll(): Promise<ImputationPeriod[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockImputationPeriods];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/ImputationPeriods',
    );
    return res.value.map((ip: any) => toFrontend<ImputationPeriod>(ip));
  },

  async getByUser(userId: string): Promise<ImputationPeriod[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockImputationPeriods.filter((ip) => ip.userId === userId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/ImputationPeriods?$filter=user_id eq '${userId}'`,
    );
    return res.value.map((ip: any) => toFrontend<ImputationPeriod>(ip));
  },

  async create(
    ip: Omit<ImputationPeriod, 'id'>,
  ): Promise<ImputationPeriod> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const created: ImputationPeriod = { ...ip, id: `ip${Date.now()}` };
      mockImputationPeriods.push(created);
      return created;
    }
    const b = await odataFetch<any>(ADMIN, '/ImputationPeriods', {
      method: 'POST',
      body: JSON.stringify(toBackend(ip as Record<string, any>)),
    });
    return toFrontend<ImputationPeriod>(b);
  },

  async update(
    id: string,
    data: Partial<ImputationPeriod>,
  ): Promise<ImputationPeriod> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockImputationPeriods.findIndex((ip) => ip.id === id);
      if (i !== -1) {
        mockImputationPeriods[i] = {
          ...mockImputationPeriods[i],
          ...data,
        };
        return mockImputationPeriods[i];
      }
      throw new Error('Imputation period not found');
    }
    const b = await odataFetch<any>(
      ADMIN,
      `/ImputationPeriods('${id}')`,
      {
        method: 'PATCH',
        body: JSON.stringify(toBackend(data as Record<string, any>)),
      },
    );
    return toFrontend<ImputationPeriod>(b);
  },
};

// ---------------------------------------------------------------------------
// Abaques API
// ---------------------------------------------------------------------------

export const AbaquesAPI = {
  async getAll(): Promise<Abaque[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockAbaques];
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      '/Abaques?$expand=entries',
    );
    return res.value.map(mapAbaque);
  },

  async getByProject(projectId: string): Promise<Abaque[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAbaques.filter((a) => a.projectId === projectId);
    }
    const res = await odataFetch<ODataResponse<any>>(
      ADMIN,
      `/Abaques?$filter=project_id eq '${projectId}'&$expand=entries`,
    );
    return res.value.map(mapAbaque);
  },

  async getById(id: string): Promise<Abaque | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockAbaques.find((a) => a.id === id) ?? null;
    }
    try {
      const b = await odataFetch<any>(
        ADMIN,
        `/Abaques('${id}')?$expand=entries`,
      );
      return mapAbaque(b);
    } catch {
      return null;
    }
  },

  async create(abaque: Omit<Abaque, 'id'>): Promise<Abaque> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const na: Abaque = { ...abaque, id: `abq${Date.now()}` };
      mockAbaques.push(na);
      return na;
    }
    const b = await odataFetch<any>(ADMIN, '/Abaques', {
      method: 'POST',
      body: JSON.stringify(abaqueToBackend(abaque as Record<string, any>)),
    });
    return mapAbaque(b);
  },

  async update(id: string, data: Partial<Abaque>): Promise<Abaque> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const i = mockAbaques.findIndex((a) => a.id === id);
      if (i !== -1) {
        mockAbaques[i] = {
          ...mockAbaques[i],
          ...data,
          lastUpdatedAt: new Date().toISOString(),
        };
        return mockAbaques[i];
      }
      throw new Error('Abaque not found');
    }
    const b = await odataFetch<any>(ADMIN, `/Abaques('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(abaqueToBackend(data as Record<string, any>)),
    });
    return mapAbaque(b);
  },
};
