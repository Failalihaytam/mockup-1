# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Application                     │
│                  (React + TypeScript + UI5)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Admin      │  │   Manager    │  │ Consultant   │      │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Layout Components                          │    │
│  │  • Sidebar Navigation (Role-based)                  │    │
│  │  • Top Bar (Search, Notifications, User Menu)       │    │
│  │  • Page Headers with Breadcrumbs                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Shared Components                          │    │
│  │  • KPI Cards                                        │    │
│  │  • Charts (Recharts)                                │    │
│  │  • Tables with Filters                              │    │
│  │  • Forms with Validation                            │    │
│  │  • Modal Dialogs                                    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           Context & State Management                 │    │
│  │  • AuthContext (User, Role, Session)                │    │
│  │  • React Context API                                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           OData Client Layer                         │    │
│  │  • API Clients for each entity                      │    │
│  │  • Mock Data Mode (development)                     │    │
│  │  • Error Handling & Toast Notifications             │    │
│  │  • Optimistic Updates                               │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP/HTTPS
                        │ OData v4
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    SAP CAP Backend                           │
│                   (Node.js + CDS)                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        OData v4 Service Layer                        │    │
│  │        /odata/v4/performance                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Business Logic (Custom Handlers)              │    │
│  │  • Validation Rules                                 │    │
│  │  • Authorization Checks                             │    │
│  │  • Calculations (KPIs, Workload)                    │    │
│  │  • Notifications Generation                         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │        Data Model (CDS Schema)                       │    │
│  │  • Users, Projects, Tasks                           │    │
│  │  • Timesheets, Evaluations                          │    │
│  │  • Deliverables, Tickets                            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ SQL
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    SAP HANA Database                         │
│              (or PostgreSQL/SQLite for dev)                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Page Components Hierarchy

```
App.tsx
├── AuthProvider
│   └── RouterProvider
│       ├── Login
│       └── MainLayout
│           ├── Sidebar (role-based navigation)
│           ├── TopBar (search, notifications, user menu)
│           └── Outlet (page content)
│               ├── Admin Routes
│               │   ├── AdminDashboard
│               │   └── UsersManagement
│               ├── Manager Routes
│               │   ├── ManagerDashboard
│               │   ├── Projects
│               │   ├── TeamPerformance
│               │   ├── Allocations
│               │   └── Evaluations
│               ├── Tech Consultant Routes
│               │   ├── TechDashboard
│               │   ├── MyTasks (Kanban)
│               │   ├── Timesheet
│               │   └── MyPerformance
│               └── Func Consultant Routes
│                   ├── FuncDashboard
│                   ├── Deliverables
│                   └── Tickets
```

## Data Flow

### 1. User Authentication Flow

```
Login Page
  ↓
  User enters credentials
  ↓
  AuthContext.login(email, password)
  ↓
  UsersAPI.getAll() → Find user by email
  ↓
  Store user in localStorage & context
  ↓
  Navigate to role-specific dashboard
```

### 2. Data Fetching Flow

```
Page Component
  ↓
  useEffect(() => loadData())
  ↓
  Call API (e.g., TasksAPI.getByUser(userId))
  ↓
  Check USE_MOCK_DATA flag
  ↓
  ┌─ Mock Mode ──────┐  ┌─ Backend Mode ─────┐
  │ Return mock data │  │ fetch() to OData   │
  │ with delay       │  │ /Tasks?$filter=... │
  └──────────────────┘  └────────────────────┘
  ↓
  Parse response
  ↓
  Update component state
  ↓
  Render UI
```

### 3. CRUD Operations Flow

```
User Action (e.g., Update Task Status)
  ↓
  UI Event Handler
  ↓
  Optimistic UI Update (immediate feedback)
  ↓
  Call API (e.g., TasksAPI.update(id, data))
  ↓
  ┌─ Mock Mode ──────┐  ┌─ Backend Mode ─────┐
  │ Update mockData  │  │ PATCH /Tasks('id') │
  │ array            │  │ with JSON body     │
  └──────────────────┘  └────────────────────┘
  ↓
  Success/Error Response
  ↓
  Toast Notification
  ↓
  Reload data if needed
```

## Routing Strategy

### React Router Data Mode

```typescript
// Route definition with nested structure
{
  path: '/',
  element: <MainLayout />,
  children: [
    {
      path: 'manager',
      children: [
        { path: 'dashboard', element: <ManagerDashboard /> },
        { path: 'projects', element: <Projects /> },
        // ... more routes
      ]
    }
  ]
}
```

### Navigation Structure

```
/login                          → Login Page
/                               → Redirect to /dashboard
/dashboard                      → Redirect to role dashboard

/admin/dashboard                → Admin Dashboard
/admin/users                    → Users Management
/admin/reference-data           → Reference Data CRUD

/manager/dashboard              → Manager Dashboard (KPIs + Charts)
/manager/projects               → Projects List
/manager/projects/:id           → Project Details
/manager/team                   → Team Performance
/manager/allocations            → Resource Allocation
/manager/risks                  → Risks & Critical Tasks
/manager/evaluations            → Team Evaluations

/consultant-tech/dashboard      → Tech Consultant Dashboard
/consultant-tech/projects       → My Projects
/consultant-tech/tasks          → My Tasks (Kanban)
/consultant-tech/timesheet      → Timesheet Entry
/consultant-tech/performance    → My Performance

/consultant-func/dashboard      → Func Consultant Dashboard
/consultant-func/projects       → Projects
/consultant-func/deliverables   → Deliverables Validation
/consultant-func/tickets        → Tickets Management
```

## State Management

### Context-based State

```typescript
// AuthContext manages:
- currentUser: User | null
- isAuthenticated: boolean
- login(email, password)
- logout()
- switchUser(userId) // for demo

// Local component state for:
- Form inputs
- Loading states
- Modal visibility
- Filtered/sorted data
```

## Styling Architecture

### Tailwind CSS Utility-First

```
Base Layer (theme.css)
  ↓
Component Layer (UI components)
  ↓
Utility Layer (Tailwind classes)
```

### SAP Fiori Color Palette

```
Primary Blue: #0854a0, #1b90ff
Success: #10b981 (green-500)
Warning: #f59e0b (yellow-500)
Error: #ef4444 (red-500)
Background: #f9fafb (gray-50)
Text: #111827 (gray-900)
```

## Performance Optimizations

1. **Code Splitting**: React Router automatically splits by route
2. **Lazy Loading**: Import pages dynamically
3. **Optimistic Updates**: Update UI before API confirmation
4. **Memoization**: Use React.memo for expensive components
5. **Debouncing**: Search inputs debounced
6. **Pagination**: Tables support pagination (ready for backend)

## Security Considerations

1. **Role-Based Access**: Navigation items filtered by role
2. **Auth Context**: Protected routes check authentication
3. **CSRF Protection**: Ready for backend CSRF tokens
4. **XSS Prevention**: React auto-escapes content
5. **Input Validation**: Form validation before submission

## Deployment Architecture

### Development
```
localhost:5173 (Vite dev server)
    ↓
Mock Data Mode
```

### Production
```
CDN / Static Server (Frontend)
    ↓ HTTPS
CAP Server on SAP BTP
    ↓
SAP HANA Cloud Database
```

## Technology Stack Summary

| Layer | Technology |
|-------|-----------|
| **UI Framework** | React 18.3.1 |
| **Language** | TypeScript |
| **UI Components** | UI5 Web Components (Fiori) |
| **Routing** | React Router v7 |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS v4 |
| **Icons** | Lucide React |
| **Forms** | react-hook-form |
| **Notifications** | Sonner |
| **Build Tool** | Vite |
| **Backend** | SAP CAP (Node.js) |
| **Database** | SAP HANA / PostgreSQL |
| **API Protocol** | OData v4 |

## Extension Points

### Adding New Features

1. **New Entity**: 
   - Add type in `types/entities.ts`
   - Add mock data in `services/mockData.ts`
   - Create API client in `services/odataClient.ts`

2. **New Page**:
   - Create component in `pages/{role}/`
   - Add route in `routes.tsx`
   - Add navigation in `Sidebar.tsx`

3. **New Role**:
   - Add role type in `types/entities.ts`
   - Create role-specific pages
   - Add navigation items with role filter
   - Update AuthContext if needed

4. **New Chart/Widget**:
   - Create component in `components/common/`
   - Use Recharts for data visualization
   - Follow SAP Fiori color scheme
