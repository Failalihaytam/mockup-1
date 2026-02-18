# SAP Fiori Horizon Refactoring Plan

## Executive Summary
Complete refactoring of the Performance Management Dashboard to achieve 100% SAP Fiori Horizon Design System compliance. This is a FRONTEND-ONLY application using mock data - no backend integration required.

## Phase 1: Core Infrastructure ✅ IN PROGRESS

### 1.1 Mock Data Service (Frontend Only)
- ✅ Keep mock data approach
- ✅ Simulate OData-like filtering/sorting in memory
- ✅ No backend calls - all data in mockData.ts

### 1.2 Layout Components Refactoring
- Replace MainLayout with ShellBar + SideNavigation
- Remove all Tailwind flex/grid containers
- Use FlexBox and Grid exclusively

### 1.3 RBAC Implementation
- Implement proper authorization checks
- Role-based data filtering at OData level
- UI element visibility based on permissions

## Phase 2: Dashboard Refactoring

### 2.1 Manager Dashboard (Overview Page Pattern)
- Replace custom KPICard with AnalyticalCard + NumericContent
- Use proper OVP layout with GridContainer
- Implement FilterBar for dashboard filters
- Use @ui5/webcomponents-react-charts exclusively

### 2.2 Admin Dashboard
- Implement AnalyticalTable for users management
- Add FilterBar with search/filter capabilities
- Use ObjectPage for user details

### 2.3 Consultant Dashboards
- Tech: Replace Kanban with proper Board component or ObjectPage
- Func: Implement proper list views with AnalyticalTable

## Phase 3: List Views

### 3.1 Projects List
- Replace custom table with AnalyticalTable
- Add FilterBar (search, status, priority filters)
- Implement column sorting and grouping
- Add export functionality

### 3.2 Tasks List
- AnalyticalTable with inline editing
- FilterBar integration
- Status workflow visualization

### 3.3 Other Lists
- Timesheets, Deliverables, Tickets
- Consistent AnalyticalTable pattern

## Phase 4: Detail Views (ObjectPage Pattern)

### 4.1 Project Details
- ObjectPage with Header (title, status, KPIs)
- Sections: Overview, Tasks, Team, Timeline, Documents
- SubSections for detailed content
- Action buttons in header

### 4.2 User Details
- ObjectPage for user profile
- Sections: Personal Info, Skills, Projects, Performance
- Editable forms with Form/FormGroup/FormItem

### 4.3 Task Details
- ObjectPage or Dialog with proper form layout
- Status workflow visualization
- Comments section

## Phase 5: Forms Refactoring

### 5.1 All Input Forms
- Replace custom inputs with UI5 Input, TextArea, Select
- Use Form, FormGroup, FormItem layout
- Implement proper validation with MessageStrip
- DatePicker for date fields
- MultiInput for tags/skills

### 5.2 Dialogs and Popovers
- Replace custom modals with Dialog component
- Use Popover for contextual actions
- ResponsivePopover for mobile support

## Phase 6: Charts and Visualizations

### 6.1 Dashboard Charts
- Ensure all charts use @ui5/webcomponents-react-charts
- Proper theming integration
- Responsive sizing
- Accessibility compliance

## Phase 7: Navigation and Shell

### 7.1 ShellBar Implementation
- Replace TopBar with ShellBar
- Integrate search, notifications, user menu
- Product logo and title

### 7.2 SideNavigation
- Replace Sidebar with SideNavigation
- Hierarchical navigation items
- Role-based filtering
- Collapsible groups

## Phase 8: RBAC and Security

### 8.1 Authorization Matrix
```
ADMIN:
- Full CRUD on Users, ReferenceData
- Read all entities

MANAGER:
- Full CRUD on Projects (where managerId = currentUser.id)
- Full CRUD on Tasks (for own projects)
- Read Users, Timesheets
- Create/Read Evaluations

CONSULTANT_TECHNIQUE:
- Read Projects (where assigned)
- Update own Tasks
- Full CRUD on own Timesheets
- Read own Evaluations

CONSULTANT_FONCTIONNEL:
- Read Projects
- Update Deliverables (validation)
- Full CRUD on Tickets (created by self)
```

### 8.2 Implementation
- OData $filter with user context
- UI element visibility checks
- Action button enablement based on permissions

## Phase 9: Mock Data Enhancements (Frontend Only)

### 9.1 In-Memory Query Support
- Implement filtering in mockData service
- Support sorting and pagination
- Simulate OData-like queries for demo purposes

### 9.2 Local State Management
- All CRUD operations update mock arrays
- No network calls
- Instant updates

### 9.3 Error Simulation
- Simulate validation errors for demo
- Display errors with MessageBox or MessageStrip
- Show loading states

## Phase 10: Testing and Validation

### 10.1 Component Testing
- Verify all components are UI5
- No custom CSS layout containers
- Proper theming support

### 10.2 Mock Data Testing
- Verify all CRUD operations work with mock data
- Test filtering and sorting
- Validate RBAC filters in UI

### 10.3 Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Color contrast

## Implementation Priority

### HIGH PRIORITY (Week 1)
1. ✅ Mock data service cleanup (keep frontend-only)
2. ShellBar + SideNavigation implementation
3. Manager Dashboard with AnalyticalCard + NumericContent
4. Projects list with AnalyticalTable + FilterBar

### MEDIUM PRIORITY (Week 2)
5. ObjectPage for Project Details
6. Form refactoring for all input screens
7. RBAC implementation
8. Admin user management with AnalyticalTable

### LOW PRIORITY (Week 3)
9. Remaining list views
10. Chart optimizations
11. Mobile responsiveness
12. Performance optimizations

## Success Criteria

✅ Zero custom CSS layout containers (div, flex, grid)
✅ All components from @ui5/webcomponents-react
✅ All data operations use mock data service
✅ RBAC implemented and tested
✅ ObjectPage pattern for all detail views
✅ AnalyticalTable for all list views
✅ Form/FormGroup/FormItem for all forms
✅ ShellBar + SideNavigation for navigation
✅ Proper theming support (Horizon theme)
✅ Accessibility compliant

## Files to Refactor

### Core Services
- [x] src/app/services/odataClient.ts - Mock data service (frontend-only)
- [ ] src/app/services/authService.ts - NEW: RBAC logic (UI-level)

### Layout
- [ ] src/app/components/layout/MainLayout.tsx - ShellBar integration
- [ ] src/app/components/layout/Sidebar.tsx - Replace with SideNavigation
- [ ] src/app/components/layout/TopBar.tsx - Replace with ShellBar

### Common Components
- [ ] src/app/components/common/KPICard.tsx - Replace with AnalyticalCard
- [ ] src/app/components/common/PageHeader.tsx - Use DynamicPageTitle

### Pages - Manager
- [ ] src/app/pages/manager/ManagerDashboard.tsx - OVP pattern
- [ ] src/app/pages/manager/Projects.tsx - AnalyticalTable
- [ ] src/app/pages/manager/ProjectDetails.tsx - ObjectPage
- [ ] src/app/pages/manager/TeamPerformance.tsx - NEW
- [ ] src/app/pages/manager/ResourceAllocation.tsx - NEW
- [ ] src/app/pages/manager/RisksAndCriticalTasks.tsx - NEW
- [ ] src/app/pages/manager/TeamEvaluations.tsx - NEW

### Pages - Admin
- [ ] src/app/pages/admin/AdminDashboard.tsx - OVP pattern
- [ ] src/app/pages/admin/UsersManagement.tsx - AnalyticalTable
- [ ] src/app/pages/admin/ReferenceData.tsx - AnalyticalTable

### Pages - Consultant Tech
- [ ] src/app/pages/consultant-tech/TechDashboard.tsx - OVP pattern
- [ ] src/app/pages/consultant-tech/MyTasks.tsx - Board or ObjectPage
- [ ] src/app/pages/consultant-tech/Timesheet.tsx - Form pattern
- [ ] src/app/pages/consultant-tech/MyProjects.tsx - AnalyticalTable
- [ ] src/app/pages/consultant-tech/MyPerformance.tsx - Charts

### Pages - Consultant Func
- [ ] src/app/pages/consultant-func/FuncDashboard.tsx - OVP pattern
- [ ] src/app/pages/consultant-func/Deliverables.tsx - AnalyticalTable
- [ ] src/app/pages/consultant-func/Tickets.tsx - AnalyticalTable
- [ ] src/app/pages/consultant-func/Projects.tsx - AnalyticalTable

### Shared
- [ ] src/app/pages/shared/Profile.tsx - ObjectPage
- [ ] src/app/pages/shared/Settings.tsx - Form pattern

## Notes

- Maintain backward compatibility during transition
- Test each component after refactoring
- Update documentation as we go
- Keep mock data mode functional
- Ensure dark mode support throughout
