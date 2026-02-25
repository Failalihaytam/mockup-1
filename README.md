# Inetum Performance Portal

A modern, SAP Fiori-style enterprise performance management platform built with React, TypeScript, and UI5 Web Components. This application provides comprehensive tools for managing projects, tasks, team performance, and resources across different organizational roles.

## 🎯 Overview

This is a production-ready frontend application designed for SAP CAP (Cloud Application Programming) backends. It features role-based dashboards, KPI tracking, resource allocation, and performance evaluation tools.

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: React 18.3.1 + TypeScript
- **UI Components**: UI5 Web Components (SAP Fiori design)
- **Routing**: React Router v7 (Data mode)
- **Charts**: Recharts
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API
- **Icons**: Lucide React
- **Notifications**: Sonner

### Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── common/          # Reusable components (KPICard, PageHeader)
│   │   ├── layout/          # Layout components (Sidebar, TopBar, MainLayout)
│   │   └── ui/              # Base UI components
│   ├── context/
│   │   └── AuthContext.tsx  # Authentication & user context
│   ├── pages/
│   │   ├── admin/           # Admin role pages
│   │   ├── manager/         # Manager role pages
│   │   ├── consultant-tech/ # Technical consultant pages
│   │   ├── consultant-func/ # Functional consultant pages
│   │   └── Login.tsx        # Login page
│   ├── services/
│   │   ├── mockData.ts      # Mock data for development
│   │   └── odataClient.ts   # CAP OData v4 client
│   ├── types/
│   │   └── entities.ts      # TypeScript type definitions
│   ├── App.tsx              # Main app component
│   └── routes.tsx           # Route configuration
└── styles/                   # Global styles
```

## 👥 User Roles & Features

### 1. ADMIN (Administrator)
**Navigation:**
- Dashboard (system overview)
- Users Management (CRUD)
- Reference Data Management

**Features:**
- Create/update/delete user accounts
- Assign roles and permissions
- Toggle user active/inactive status
- Manage global catalogs (skills, project types, statuses)

### 2. MANAGER
**Navigation:**
- Performance Dashboard (global KPIs)
- Projects Management
- Team Performance
- Resource Allocation
- Risks & Critical Tasks
- Team Evaluations

**Features:**
- View comprehensive KPI dashboard with charts:
  - Overall project progress
  - Tasks performance (on track vs late)
  - Critical tasks alerts
  - Team productivity scores
  - Resource allocation rates
  - Active risks
- Project progress tracking with charts
- Task status distribution (To Do, In Progress, Blocked, Done)
- Consultant workload analysis (planned vs actual)
- Resource allocation by project
- Performance evaluations with qualitative grids
- Risk identification and mitigation

### 3. CONSULTANT_TECHNIQUE (Technical Consultant)
**Navigation:**
- My Dashboard
- My Projects
- My Tasks (Kanban Board)
- Timesheet
- My Performance

**Features:**
- Personal KPI dashboard:
  - Assigned tasks count
  - Overdue tasks
  - Hours worked this week
  - Active projects
  - Performance score
- Kanban board for task management (drag & drop between statuses)
- Update task status and progress percentage
- Add comments and flag blockers
- View project assignments
- Timesheet entry (daily/weekly)
- View personal evaluations and feedback

### 4. CONSULTANT_FONCTIONNEL (Functional Consultant)
**Navigation:**
- My Dashboard
- Projects
- Deliverables Validation
- Tickets
- Discussions (Teams integration placeholder)

**Features:**
- Deliverables review and validation:
  - Approve deliverables
  - Request changes with comments
  - Add functional feedback
- Create and manage tickets
- Upload functional specifications
- Exchange with technical consultants

## 🔐 Authentication

The application supports role-based authentication with automatic routing based on user roles.

### Quick Login (Demo Mode)

The login page provides quick access buttons for testing different roles:
- **Admin**: jean.dupont@company.com
- **Manager**: marie.martin@company.com
- **Technical Consultant**: pierre.dubois@company.com
- **Functional Consultant**: sophie.bernard@company.com

Any password works in demo mode.

## 📊 Data Model

### Core Entities

- **Users**: User accounts with roles, skills, certifications, and availability
- **Projects**: Project management with status, priority, progress, and budget
- **Tasks**: Task tracking with status, priority, progress, hours, and risk levels
- **Timesheets**: Time tracking per user, project, and task
- **Evaluations**: Performance evaluations with qualitative grids
- **Deliverables**: Document deliverables with validation workflow
- **Tickets**: Issue tracking between functional and technical consultants
- **Notifications**: User notifications for tasks, deadlines, and alerts
- **Allocations**: Resource allocation percentages across projects
- **ReferenceData**: Configurable catalogs (skills, statuses, priorities)

## 🔌 CAP OData Integration

### Backend Endpoints (Expected)

```
/odata/v4/performance/
├── Users
├── Projects
├── Tasks
├── Timesheets
├── Evaluations
├── Deliverables
├── Tickets
├── Notifications
├── Allocations
└── ReferenceData
```

### OData Client Features

- Full CRUD operations for all entities
- Filtering, sorting, and pagination support
- Optimistic UI updates
- Error handling with user-friendly toasts
- Mock mode for development (USE_MOCK_DATA flag)

### Configuration

Set the backend URL via environment variable:

```bash
VITE_ODATA_BASE_URL=/odata/v4/performance
```

To switch from mock mode to real backend, update `src/app/services/odataClient.ts`:

```typescript
const USE_MOCK_DATA = false; // Set to false when backend is ready
```

## 🎨 UI/UX Features

### SAP Fiori Design
- Clean, professional enterprise UI
- Consistent color scheme (SAP blues, whites, grays)
- Soft shadows and rounded corners
- Clear typography hierarchy
- Responsive design (desktop-first with tablet support)

### Components
- **KPI Cards**: Display metrics with icons, progress bars, and trends
- **Charts**: Line, bar, area, and pie charts with Recharts
- **Tables**: Sortable, filterable enterprise tables
- **Kanban Board**: Drag-and-drop task management
- **Forms**: Validated inputs with error messages
- **Modals/Drawers**: For editing and details views
- **Notifications**: Toast notifications and notification center

### Navigation
- Left sidebar with role-based menu items
- Top bar with:
  - Global search (projects, users, tasks)
  - Notifications bell with unread count
  - User menu with profile and logout
  - User switcher (for demo purposes)
- Breadcrumbs on all pages

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173` (or your configured port).

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 📝 Environment Variables

Create a `.env` file in the root directory:

```env
# OData backend URL
VITE_ODATA_BASE_URL=/odata/v4/performance
```

## 🔄 Mock Data Mode

The application includes comprehensive mock data for development and testing. All API calls are simulated with realistic delays to mimic network requests.

**Mock Data Includes:**
- 5 users (one per role)
- 3 projects (S/4HANA Migration, Fiori Launchpad, BI Reporting Platform)
- 6 tasks with various statuses and priorities
- Timesheets, evaluations, deliverables, tickets, and notifications
- Chart data for dashboards

## 📱 Responsive Design

The application is optimized for:
- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Responsive grid layouts
- **Mobile**: (Future enhancement)

## 🎯 Key Features Implemented

✅ **Role-Based Access Control**
✅ **Manager Performance Dashboard with 4 Charts**
✅ **KPI Cards with Progress Bars**
✅ **Kanban Board for Task Management**
✅ **User Management (CRUD)**
✅ **Project List with Filtering**
✅ **Deliverables Validation Workflow**
✅ **Notification Center**
✅ **User Switcher (Demo)**
✅ **Mock Data Layer**
✅ **OData Client with CAP Integration**
✅ **TypeScript Type Safety**
✅ **SAP Fiori-Style UI**

## 🔮 Future Enhancements

- **Resource Allocation Matrix**: Visual allocation editor
- **Evaluation Forms**: Complete qualitative grid forms
- **Timesheet Calendar**: Weekly/monthly timesheet view
- **Risk Management Dashboard**: Detailed risk tracking
- **Project Detail Tabs**: Full project view with tasks, team, KPIs
- **Ticket Management**: Full ticket lifecycle
- **Teams Integration**: Real Teams chat integration
- **Export to Excel/PDF**: Report generation
- **Dark Mode**: Theme switcher
- **Mobile Optimization**: Full mobile responsiveness

## 🛠️ Development Guidelines

### Adding New Pages

1. Create component in appropriate role folder: `src/app/pages/{role}/`
2. Add route in `src/app/routes.tsx`
3. Add navigation item in `src/app/components/layout/Sidebar.tsx`

### Adding New API Endpoints

1. Define types in `src/app/types/entities.ts`
2. Add mock data in `src/app/services/mockData.ts`
3. Create API methods in `src/app/services/odataClient.ts`

### Styling Guidelines

- Use Tailwind CSS classes
- Follow SAP Fiori color palette
- Use existing components from `components/common/`
- Maintain consistent spacing (padding: p-6, gap: gap-6)

## 📄 License

This is a demonstration project for SAP CAP integration.

## 🤝 Support

For questions or issues, refer to the SAP CAP documentation and UI5 Web Components documentation.

---

**Built with ❤️ using SAP Fiori design principles**