# SAP CAP OData Integration Guide

This document explains how to integrate this frontend application with your SAP CAP backend.

## Overview

This frontend is designed to consume SAP CAP OData v4 services. The application includes a complete OData client layer with mock data mode for development.

## Backend Requirements

### CAP Service Endpoints

Your CAP backend should expose the following OData v4 service:

**Base URL**: `/odata/v4/performance`

### Required Entities

#### 1. Users Service

```cds
entity Users {
  key id: String;
  name: String;
  email: String;
  role: String; // ADMIN, MANAGER, CONSULTANT_TECHNIQUE, CONSULTANT_FONCTIONNEL
  active: Boolean;
  skills: array of String;
  certifications: array of String;
  availabilityPercent: Integer;
  teamId: String;
  avatarUrl: String;
}
```

**Operations**: Read, Create, Update, Delete

#### 2. Projects Service

```cds
entity Projects {
  key id: String;
  name: String;
  managerId: String;
  startDate: Date;
  endDate: Date;
  status: String; // PLANNED, ACTIVE, ON_HOLD, COMPLETED, CANCELLED
  priority: String; // LOW, MEDIUM, HIGH, CRITICAL
  description: String;
  progress: Integer;
  budget: Decimal;
}
```

**Operations**: Read, Create, Update, Delete

#### 3. Tasks Service

```cds
entity Tasks {
  key id: String;
  projectId: String;
  title: String;
  description: String;
  status: String; // TO_DO, IN_PROGRESS, BLOCKED, DONE, CANCELLED
  priority: String; // LOW, MEDIUM, HIGH, CRITICAL
  assigneeId: String;
  plannedStart: Date;
  plannedEnd: Date;
  realStart: Date;
  realEnd: Date;
  progressPercent: Integer;
  estimatedHours: Decimal;
  actualHours: Decimal;
  isCritical: Boolean;
  riskLevel: String; // NONE, LOW, MEDIUM, HIGH, CRITICAL
  comments: String;
}
```

**Operations**: Read, Create, Update
**Filters**: By projectId, by assigneeId

#### 4. Timesheets Service

```cds
entity Timesheets {
  key id: String;
  userId: String;
  date: Date;
  hours: Decimal;
  projectId: String;
  taskId: String;
  comment: String;
}
```

**Operations**: Read, Create, Update
**Filters**: By userId

#### 5. Evaluations Service

```cds
entity Evaluations {
  key id: String;
  userId: String;
  evaluatorId: String;
  projectId: String;
  period: String;
  score: Decimal;
  qualitativeGrid: {
    productivity: Integer;
    quality: Integer;
    autonomy: Integer;
    collaboration: Integer;
    innovation: Integer;
  };
  feedback: String;
  createdAt: DateTime;
}
```

**Operations**: Read, Create
**Filters**: By userId

#### 6. Deliverables Service

```cds
entity Deliverables {
  key id: String;
  projectId: String;
  taskId: String;
  type: String;
  name: String;
  url: String;
  fileRef: String;
  validationStatus: String; // PENDING, APPROVED, CHANGES_REQUESTED
  functionalComment: String;
  createdAt: DateTime;
}
```

**Operations**: Read, Update (for validation status)

#### 7. Tickets Service

```cds
entity Tickets {
  key id: String;
  projectId: String;
  createdBy: String;
  assignedTo: String;
  status: String; // OPEN, IN_PROGRESS, WAITING_FEEDBACK, RESOLVED, CLOSED
  priority: String; // LOW, MEDIUM, HIGH, CRITICAL
  title: String;
  description: String;
  createdAt: DateTime;
  updatedAt: DateTime;
}
```

**Operations**: Read, Create, Update

#### 8. Notifications Service

```cds
entity Notifications {
  key id: String;
  userId: String;
  type: String;
  title: String;
  message: String;
  read: Boolean;
  createdAt: DateTime;
}
```

**Operations**: Read, Update (mark as read)
**Filters**: By userId

#### 9. Allocations Service

```cds
entity Allocations {
  key id: String;
  userId: String;
  projectId: String;
  allocationPercent: Integer;
  startDate: Date;
  endDate: Date;
}
```

**Operations**: Read, Create, Update, Delete

#### 10. ReferenceData Service

```cds
entity ReferenceData {
  key id: String;
  type: String; // TASK_STATUS, PRIORITY, PROJECT_TYPE, SKILL
  code: String;
  label: String;
  active: Boolean;
  order: Integer;
}
```

**Operations**: Read, Create, Update, Delete

## CAP Service Definition Example

```cds
using { performance } from '../db/schema';

service PerformanceService @(path: '/odata/v4/performance') {
  @odata.draft.enabled
  entity Users as projection on performance.Users;
  
  @odata.draft.enabled
  entity Projects as projection on performance.Projects;
  
  entity Tasks as projection on performance.Tasks;
  entity Timesheets as projection on performance.Timesheets;
  entity Evaluations as projection on performance.Evaluations;
  entity Deliverables as projection on performance.Deliverables;
  entity Tickets as projection on performance.Tickets;
  entity Notifications as projection on performance.Notifications;
  entity Allocations as projection on performance.Allocations;
  entity ReferenceData as projection on performance.ReferenceData;
}
```

## Frontend Configuration

### 1. Environment Setup

Create a `.env` file:

```env
VITE_ODATA_BASE_URL=/odata/v4/performance
```

### 2. Enable Backend Mode

Edit `src/app/services/odataClient.ts`:

```typescript
const USE_MOCK_DATA = false; // Change to false
```

### 3. Authentication

The frontend expects authentication to be handled by the backend. Implement CAP authentication/authorization:

```javascript
// In your CAP srv/server.js
cds.on('bootstrap', app => {
  const passport = require('passport');
  // Configure passport with your auth strategy
  app.use(passport.initialize());
  app.use(passport.session());
});
```

## CORS Configuration

If running frontend and backend on different ports during development:

```javascript
// In your CAP srv/server.js
cds.on('bootstrap', app => {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
  });
});
```

## OData Query Examples

The frontend uses these OData query patterns:

### Get all users
```
GET /odata/v4/performance/Users
```

### Get user by ID
```
GET /odata/v4/performance/Users('u1')
```

### Filter tasks by user
```
GET /odata/v4/performance/Tasks?$filter=assigneeId eq 'u3'
```

### Filter tasks by project
```
GET /odata/v4/performance/Tasks?$filter=projectId eq 'p1'
```

### Create a new task
```
POST /odata/v4/performance/Tasks
Content-Type: application/json

{
  "projectId": "p1",
  "title": "New Task",
  "description": "Task description",
  "status": "TO_DO",
  "priority": "MEDIUM",
  "assigneeId": "u3",
  "plannedStart": "2026-03-01",
  "plannedEnd": "2026-03-15",
  "progressPercent": 0,
  "estimatedHours": 40,
  "actualHours": 0,
  "isCritical": false,
  "riskLevel": "NONE"
}
```

### Update task status
```
PATCH /odata/v4/performance/Tasks('t1')
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "progressPercent": 30
}
```

## Authorization Rules

Implement these authorization rules in your CAP service:

### Admin Role
- Full access to Users, ReferenceData
- Read access to all entities

### Manager Role
- Full access to Projects, Tasks, Evaluations, Allocations
- Read access to Users, Timesheets
- Create/Update for own projects

### Consultant Technique Role
- Read access to Projects (where assigned)
- Full access to own Tasks
- Full access to own Timesheets
- Read access to own Evaluations

### Consultant Fonctionnel Role
- Read access to Projects
- Update access to Deliverables (validation)
- Full access to Tickets (created by self)

Example CAP authorization:

```cds
annotate PerformanceService.Tasks with @restrict: [
  { grant: 'READ', to: 'authenticated-user' },
  { grant: 'WRITE', to: 'Manager', where: 'project.managerId = $user.id' },
  { grant: 'UPDATE', to: 'ConsultantTechnique', where: 'assigneeId = $user.id' }
];
```

## Testing the Integration

### 1. Start Backend
```bash
cd your-cap-project
cds watch
```

### 2. Start Frontend
```bash
cd frontend-project
npm run dev
```

### 3. Test Endpoints

Use tools like Postman or curl to verify OData endpoints:

```bash
# Test Users endpoint
curl http://localhost:4004/odata/v4/performance/Users

# Test with authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:4004/odata/v4/performance/Users
```

## Production Deployment

### Backend Deployment (SAP BTP)

1. Build CAP project:
```bash
cds build --production
```

2. Deploy to Cloud Foundry:
```bash
cf push
```

### Frontend Deployment

1. Update `.env` with production backend URL:
```env
VITE_ODATA_BASE_URL=https://your-app.cfapps.eu10.hana.ondemand.com/odata/v4/performance
```

2. Build frontend:
```bash
npm run build
```

3. Deploy static files to CDN or serve via CAP:

Add to CAP `app` folder, then CAP will serve it automatically.

## Troubleshooting

### Issue: CORS errors
**Solution**: Configure CORS headers in CAP server.js

### Issue: 401 Unauthorized
**Solution**: Ensure authentication headers are included in requests

### Issue: 404 Not Found
**Solution**: Verify OData service path and entity names match

### Issue: Data not loading
**Solution**: Check browser console for errors, verify backend is running

## Support

For CAP-specific issues:
- [SAP CAP Documentation](https://cap.cloud.sap/docs/)
- [SAP Community](https://community.sap.com/)

For frontend issues:
- Check browser console logs
- Verify network requests in DevTools
- Test OData endpoints directly
