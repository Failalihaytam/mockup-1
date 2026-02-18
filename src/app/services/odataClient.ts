// CAP OData v4 Client Layer - Strict OData v4 Compliance
// This service provides a typed interface to the CAP OData backend
// Follows SAP CAP and OData v4 conventions strictly

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
} from './mockData';

// Configuration
const USE_MOCK_DATA = true; // Set to false when backend is available
const ODATA_BASE_URL = import.meta.env.VITE_ODATA_BASE_URL || '/odata/v4/performance';

// OData v4 Query Options
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

// Generic OData response wrapper (OData v4 standard)
export interface ODataResponse<T> {
  '@odata.context'?: string;
  '@odata.count'?: number;
  '@odata.nextLink'?: string;
  value: T[];
}

// OData v4 Single Entity Response
export interface ODataSingleResponse<T> {
  '@odata.context'?: string;
  '@odata.etag'?: string;
  value?: T;
}

// OData v4 Error Response (SAP standard)
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

// Build OData query string from options
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
  
  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

// Generic fetch wrapper with OData v4 error handling
async function odataFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${ODATA_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      // Parse OData error response
      let errorData: ODataError | null = null;
      try {
        errorData = await response.json() as ODataError;
      } catch {
        // If JSON parsing fails, throw generic error
        throw new Error(`OData request failed: ${response.statusText}`);
      }

      // Extract error message from OData error structure
      const errorMessage = errorData?.error?.message || response.statusText;
      const errorCode = errorData?.error?.code || response.status.toString();
      
      throw new Error(`[${errorCode}] ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error('OData fetch error:', error);
    throw error;
  }
}

// Mock delay to simulate network
const mockDelay = (ms: number = 300) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Users API
export const UsersAPI = {
  async getAll(): Promise<User[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockUsers];
    }
    const response = await odataFetch<ODataResponse<User>>('/Users');
    return response.value;
  },

  async getById(id: string): Promise<User | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockUsers.find((u) => u.id === id) || null;
    }
    return await odataFetch<User>(`/Users('${id}')`);
  },

  async create(user: Omit<User, 'id'>): Promise<User> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newUser: User = { ...user, id: `u${Date.now()}` };
      mockUsers.push(newUser);
      return newUser;
    }
    return await odataFetch<User>('/Users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
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
    return await odataFetch<User>(`/Users('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(user),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockUsers.findIndex((u) => u.id === id);
      if (index !== -1) {
        mockUsers.splice(index, 1);
      }
      return;
    }
    await odataFetch<void>(`/Users('${id}')`, {
      method: 'DELETE',
    });
  },
};

// Projects API
export const ProjectsAPI = {
  async getAll(): Promise<Project[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockProjects];
    }
    const response = await odataFetch<ODataResponse<Project>>('/Projects');
    return response.value;
  },

  async getById(id: string): Promise<Project | null> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockProjects.find((p) => p.id === id) || null;
    }
    return await odataFetch<Project>(`/Projects('${id}')`);
  },

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newProject: Project = { ...project, id: `p${Date.now()}` };
      mockProjects.push(newProject);
      return newProject;
    }
    return await odataFetch<Project>('/Projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  async update(id: string, project: Partial<Project>): Promise<Project> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProjects[index] = { ...mockProjects[index], ...project };
        return mockProjects[index];
      }
      throw new Error('Project not found');
    }
    return await odataFetch<Project>(`/Projects('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockProjects.findIndex((p) => p.id === id);
      if (index !== -1) {
        mockProjects.splice(index, 1);
      }
      return;
    }
    await odataFetch<void>(`/Projects('${id}')`, {
      method: 'DELETE',
    });
  },
};

// Tasks API
export const TasksAPI = {
  async getAll(): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockTasks];
    }
    const response = await odataFetch<ODataResponse<Task>>('/Tasks');
    return response.value;
  },

  async getByProject(projectId: string): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTasks.filter((t) => t.projectId === projectId);
    }
    const response = await odataFetch<ODataResponse<Task>>(
      `/Tasks?$filter=projectId eq '${projectId}'`
    );
    return response.value;
  },

  async getByUser(userId: string): Promise<Task[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTasks.filter((t) => t.assigneeId === userId);
    }
    const response = await odataFetch<ODataResponse<Task>>(
      `/Tasks?$filter=assigneeId eq '${userId}'`
    );
    return response.value;
  },

  async update(id: string, task: Partial<Task>): Promise<Task> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockTasks.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTasks[index] = { ...mockTasks[index], ...task };
        return mockTasks[index];
      }
      throw new Error('Task not found');
    }
    return await odataFetch<Task>(`/Tasks('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(task),
    });
  },

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newTask: Task = { ...task, id: `t${Date.now()}` };
      mockTasks.push(newTask);
      return newTask;
    }
    return await odataFetch<Task>('/Tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },
};

// Timesheets API
export const TimesheetsAPI = {
  async getByUser(userId: string): Promise<Timesheet[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockTimesheets.filter((t) => t.userId === userId);
    }
    const response = await odataFetch<ODataResponse<Timesheet>>(
      `/Timesheets?$filter=userId eq '${userId}'`
    );
    return response.value;
  },

  async create(timesheet: Omit<Timesheet, 'id'>): Promise<Timesheet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newTimesheet: Timesheet = { ...timesheet, id: `ts${Date.now()}` };
      mockTimesheets.push(newTimesheet);
      return newTimesheet;
    }
    return await odataFetch<Timesheet>('/Timesheets', {
      method: 'POST',
      body: JSON.stringify(timesheet),
    });
  },

  async update(id: string, timesheet: Partial<Timesheet>): Promise<Timesheet> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockTimesheets.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTimesheets[index] = { ...mockTimesheets[index], ...timesheet };
        return mockTimesheets[index];
      }
      throw new Error('Timesheet not found');
    }
    return await odataFetch<Timesheet>(`/Timesheets('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(timesheet),
    });
  },
};

// Evaluations API
export const EvaluationsAPI = {
  async getAll(): Promise<Evaluation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockEvaluations];
    }
    const response = await odataFetch<ODataResponse<Evaluation>>('/Evaluations');
    return response.value;
  },

  async getByUser(userId: string): Promise<Evaluation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockEvaluations.filter((e) => e.userId === userId);
    }
    const response = await odataFetch<ODataResponse<Evaluation>>(
      `/Evaluations?$filter=userId eq '${userId}'`
    );
    return response.value;
  },

  async create(evaluation: Omit<Evaluation, 'id'>): Promise<Evaluation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newEvaluation: Evaluation = {
        ...evaluation,
        id: `e${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockEvaluations.push(newEvaluation);
      return newEvaluation;
    }
    return await odataFetch<Evaluation>('/Evaluations', {
      method: 'POST',
      body: JSON.stringify(evaluation),
    });
  },
};

// Deliverables API
export const DeliverablesAPI = {
  async getAll(): Promise<Deliverable[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockDeliverables];
    }
    const response = await odataFetch<ODataResponse<Deliverable>>('/Deliverables');
    return response.value;
  },

  async create(deliverable: Omit<Deliverable, 'id' | 'createdAt'>): Promise<Deliverable> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newDeliverable: Deliverable = {
        ...deliverable,
        id: `d${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockDeliverables.unshift(newDeliverable);
      return newDeliverable;
    }
    return await odataFetch<Deliverable>('/Deliverables', {
      method: 'POST',
      body: JSON.stringify(deliverable),
    });
  },

  async update(id: string, deliverable: Partial<Deliverable>): Promise<Deliverable> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockDeliverables.findIndex((d) => d.id === id);
      if (index !== -1) {
        mockDeliverables[index] = { ...mockDeliverables[index], ...deliverable };
        return mockDeliverables[index];
      }
      throw new Error('Deliverable not found');
    }
    return await odataFetch<Deliverable>(`/Deliverables('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(deliverable),
    });
  },
};

// Tickets API
export const TicketsAPI = {
  async getAll(): Promise<Ticket[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockTickets];
    }
    const response = await odataFetch<ODataResponse<Ticket>>('/Tickets');
    return response.value;
  },

  async create(ticket: Omit<Ticket, 'id' | 'createdAt'>): Promise<Ticket> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newTicket: Ticket = {
        ...ticket,
        id: `tk${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      mockTickets.push(newTicket);
      return newTicket;
    }
    return await odataFetch<Ticket>('/Tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  },

  async update(id: string, ticket: Partial<Ticket>): Promise<Ticket> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockTickets.findIndex((t) => t.id === id);
      if (index !== -1) {
        mockTickets[index] = {
          ...mockTickets[index],
          ...ticket,
          updatedAt: new Date().toISOString(),
        };
        return mockTickets[index];
      }
      throw new Error('Ticket not found');
    }
    return await odataFetch<Ticket>(`/Tickets('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(ticket),
    });
  },
};

// Notifications API
export const NotificationsAPI = {
  async getByUser(userId: string): Promise<Notification[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return mockNotifications.filter((n) => n.userId === userId);
    }
    const response = await odataFetch<ODataResponse<Notification>>(
      `/Notifications?$filter=userId eq '${userId}'`
    );
    return response.value;
  },

  async markAsRead(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const notification = mockNotifications.find((n) => n.id === id);
      if (notification) {
        notification.read = true;
      }
      return;
    }
    await odataFetch<void>(`/Notifications('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  },

  async create(
    notification: Omit<Notification, 'id' | 'createdAt'> & { createdAt?: string }
  ): Promise<Notification> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newNotification: Notification = {
        ...notification,
        id: `n${Date.now()}`,
        createdAt: notification.createdAt ?? new Date().toISOString(),
      };
      mockNotifications.unshift(newNotification);
      return newNotification;
    }
    return await odataFetch<Notification>('/Notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  },
};

// Reference Data API
export const ReferenceDataAPI = {
  async getAll(): Promise<ReferenceData[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockReferenceData];
    }
    const response = await odataFetch<ODataResponse<ReferenceData>>('/ReferenceData');
    return response.value;
  },

  async create(data: Omit<ReferenceData, 'id'>): Promise<ReferenceData> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newData: ReferenceData = { ...data, id: `r${Date.now()}` };
      mockReferenceData.push(newData);
      return newData;
    }
    return await odataFetch<ReferenceData>('/ReferenceData', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<ReferenceData>): Promise<ReferenceData> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockReferenceData.findIndex((r) => r.id === id);
      if (index !== -1) {
        mockReferenceData[index] = { ...mockReferenceData[index], ...data };
        return mockReferenceData[index];
      }
      throw new Error('Reference data not found');
    }
    return await odataFetch<ReferenceData>(`/ReferenceData('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockReferenceData.findIndex((r) => r.id === id);
      if (index !== -1) {
        mockReferenceData.splice(index, 1);
      }
      return;
    }
    await odataFetch<void>(`/ReferenceData('${id}')`, {
      method: 'DELETE',
    });
  },
};

// Allocations API
export const AllocationsAPI = {
  async getAll(): Promise<Allocation[]> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      return [...mockAllocations];
    }
    const response = await odataFetch<ODataResponse<Allocation>>('/Allocations');
    return response.value;
  },

  async update(id: string, allocation: Partial<Allocation>): Promise<Allocation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockAllocations.findIndex((a) => a.id === id);
      if (index !== -1) {
        mockAllocations[index] = { ...mockAllocations[index], ...allocation };
        return mockAllocations[index];
      }
      throw new Error('Allocation not found');
    }
    return await odataFetch<Allocation>(`/Allocations('${id}')`, {
      method: 'PATCH',
      body: JSON.stringify(allocation),
    });
  },

  async create(allocation: Omit<Allocation, 'id'>): Promise<Allocation> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const newAllocation: Allocation = { ...allocation, id: `a${Date.now()}` };
      mockAllocations.push(newAllocation);
      return newAllocation;
    }
    return await odataFetch<Allocation>('/Allocations', {
      method: 'POST',
      body: JSON.stringify(allocation),
    });
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCK_DATA) {
      await mockDelay();
      const index = mockAllocations.findIndex((a) => a.id === id);
      if (index !== -1) {
        mockAllocations.splice(index, 1);
      }
      return;
    }
    await odataFetch<void>(`/Allocations('${id}')`, {
      method: 'DELETE',
    });
  },
};
