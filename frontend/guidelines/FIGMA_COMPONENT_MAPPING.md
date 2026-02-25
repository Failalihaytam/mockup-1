# Figma Handoff Mapping (Frontend-First, UI5-Fiori-Compatible)

## Goal
Rebuild this app in Figma using:
1. Existing frontend components first (exact parity).
2. UI5/Fiori components as fallback when parity is not possible.

## Non-Negotiable Rules
- Do not invent new base components if an equivalent exists in `src/app/components`.
- Keep the same screen structure and role-based routes from `src/app/routes.tsx`.
- Use the token values from `src/styles/theme.css` for light and dark modes.
- Keep interaction states for every component: default, hover, focus, active, disabled, loading, empty.

## Route-to-Frame Checklist
- `/login` -> `Login`
- `/admin/dashboard` -> `Admin Dashboard`
- `/admin/users` -> `Users Management`
- `/admin/reference-data` -> `Reference Data`
- `/manager/dashboard` -> `Manager Dashboard`
- `/manager/projects` -> `Manager Projects`
- `/manager/projects/:id` -> `Project Details`
- `/manager/team` -> `Team Performance`
- `/manager/allocations` -> `Resource Allocation`
- `/manager/risks` -> `Risks & Critical Tasks`
- `/manager/evaluations` -> `Team Evaluations`
- `/consultant-tech/dashboard` -> `Tech Dashboard`
- `/consultant-tech/projects` -> `My Projects`
- `/consultant-tech/tasks` -> `My Tasks`
- `/consultant-tech/timesheet` -> `Timesheet`
- `/consultant-tech/performance` -> `My Performance`
- `/consultant-func/dashboard` -> `Func Dashboard`
- `/consultant-func/projects` -> `Func Projects`
- `/consultant-func/deliverables` -> `Deliverables`
- `/consultant-func/tickets` -> `Tickets`
- `/profile` -> `Profile`
- `/settings` -> `Settings`

## Component Inventory to Rebuild in Figma

### Layout
- `MainLayout` (`src/app/components/layout/MainLayout.tsx`)
- `Sidebar` (`src/app/components/layout/Sidebar.tsx`)
- `TopBar` (`src/app/components/layout/TopBar.tsx`)

### Shared App Components
- `PageHeader` (`src/app/components/common/PageHeader.tsx`)
- `KPICard` (`src/app/components/common/KPICard.tsx`)

### Feature Components by Page
- Admin:
  - User table rows, user modal, role badges (`src/app/pages/admin/UsersManagement.tsx`)
  - Reference data table + form (`src/app/pages/admin/ReferenceData.tsx`)
- Manager:
  - KPI dashboard cards/charts (`src/app/pages/manager/ManagerDashboard.tsx`)
  - Projects table + create modal (`src/app/pages/manager/Projects.tsx`)
  - Project tabbed detail layout (`src/app/pages/manager/ProjectDetails.tsx`)
  - Allocation matrix, risk register, evaluation form/table
- Consultant Tech:
  - Kanban board + drawer (`src/app/pages/consultant-tech/MyTasks.tsx`)
  - Timesheet editable grid (`src/app/pages/consultant-tech/Timesheet.tsx`)
  - Personal KPI and profile blocks
- Consultant Func:
  - Deliverable validation cards/modal (`src/app/pages/consultant-func/Deliverables.tsx`)
  - Tickets create form + table (`src/app/pages/consultant-func/Tickets.tsx`)

### UI Primitives Already in Codebase
Use these as Figma base components before creating any new atom:
- `button.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `table.tsx`, `tabs.tsx`
- `dialog.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `badge.tsx`
- `card.tsx`, `progress.tsx`, `switch.tsx`, `checkbox.tsx`, `radio-group.tsx`
- Full list in `src/app/components/ui/`

## UI5/Fiori Equivalents (Fallback Mapping)
If you want SAP-native naming/behavior in Figma, map as:
- App shell/top header -> `ShellBar`
- Left nav -> `SideNavigation` + `SideNavigationItem`
- Page scaffold -> `DynamicPage` (title + content)
- Card blocks -> `Card`
- Data tables -> `Table` / `AnalyticalTable`
- Dialogs/modals -> `Dialog`
- Popovers/menus -> `Popover` / `Menu`
- KPI/progress -> `ProgressIndicator`
- Badges/status -> `Tag` / status `ObjectStatus`
- Forms -> `Input`, `TextArea`, `Select`, `DatePicker`, `MultiInput`
- Notifications -> `MessageStrip`, `Toast`

## Figma Library Structure
- `Foundations/Color` (light + dark variable collections)
- `Foundations/Typography`
- `Foundations/Spacing Radius Border`
- `Components/Layout` (Sidebar, TopBar, PageHeader)
- `Components/Data Display` (KPICard, Table, Badge, Progress)
- `Components/Inputs`
- `Components/Feedback` (Dialog, Toast, Alert states)
- `Templates/Role Screens`

## Naming Convention in Figma
- Components: `App/{Category}/{Name}`
- Variants:
  - `Theme=Light|Dark`
  - `State=Default|Hover|Focus|Disabled|Loading`
  - `Size=Sm|Md|Lg`
- Example: `App/Input/TextField` with `State` and `Theme` variants.

## Definition of Done for Handoff
- Every route above has a desktop frame.
- `Sidebar`, `TopBar`, `PageHeader`, `KPICard`, `Table`, `Modal`, `Form Row` are reusable components.
- Light and dark tokens are configured from `src/styles/theme.css`.
- Major page interactions are prototyped:
  - Login flow
  - Role navigation
  - Task status/progress update
  - Timesheet save
  - Deliverable review
  - Ticket creation
