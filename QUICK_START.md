# Quick Start Guide

Get the Performance Portal up and running in 5 minutes!

## Prerequisites

- Node.js 18+ or compatible version
- npm or pnpm package manager

## Installation

```bash
# Install dependencies
npm install
# or
pnpm install
```

## Running the Application

```bash
# Start development server
npm run dev
```

The application will open at `http://localhost:5173` (or the next available port).

## First Login

The application starts in **Mock Data Mode**, so no backend is required for testing.

### Quick Login Options

Click any of the quick login buttons on the login page:

1. **Admin** - Full system administration
   - Email: `jean.dupont@company.com`
   - View: Users management, reference data, system overview

2. **Manager** - Performance management dashboard
   - Email: `marie.martin@company.com`
   - View: KPI dashboard with charts, projects, team performance, allocations

3. **Technical Consultant** - Task and timesheet management
   - Email: `pierre.dubois@company.com`
   - View: Personal dashboard, Kanban board, timesheet

4. **Functional Consultant** - Deliverables and tickets
   - Email: `sophie.bernard@company.com`
   - View: Deliverables validation, tickets management

_Note: Any password works in demo mode_

## Key Features to Explore

### As Manager (Recommended First View)

1. **Performance Dashboard** (`/manager/dashboard`)
   - View KPI cards (project progress, tasks, critical items)
   - Explore 4 interactive charts:
     - Project Progress Trend (Area Chart)
     - Tasks by Status (Bar Chart)
     - Consultant Workload (Grouped Bar Chart)
     - Allocation by Project (Pie Chart)
   - Check recent alerts and activities

2. **Projects List** (`/manager/projects`)
   - Browse all projects with status, priority, and progress
   - Filter and search projects
   - Click a project to view details

### As Technical Consultant

1. **My Dashboard** (`/consultant-tech/dashboard`)
   - View personal KPIs (tasks, hours, performance)
   - See upcoming tasks
   - Check active projects

2. **My Tasks - Kanban Board** (`/consultant-tech/tasks`)
   - Drag tasks between columns: To Do → In Progress → Blocked → Done
   - Update task progress with slider
   - Add comments and flag blockers
   - Change task status with dropdown

3. **Timesheet** (`/consultant-tech/timesheet`)
   - Enter daily hours by project and task
   - View weekly totals
   - Save timesheets

### As Functional Consultant

1. **Deliverables** (`/consultant-func/deliverables`)
   - Review pending deliverables
   - Approve or request changes
   - Add functional comments

### As Admin

1. **Users Management** (`/admin/users`)
   - View all users with roles and skills
   - Filter by role
   - Toggle user active/inactive status
   - Edit user details

## Key UI Elements

### Top Bar
- **Search Bar**: Global search (projects, tasks, users)
- **Notifications Bell**: View unread notifications (red badge)
- **User Switcher**: Quick demo feature to switch between roles
- **User Menu**: Access profile and logout

### Left Sidebar
- **Role-based Navigation**: Only shows menu items for your role
- **Collapsible**: Click menu icon in top bar to collapse/expand

### Page Features
- **Breadcrumbs**: Navigate back through page hierarchy
- **Action Buttons**: Primary actions (e.g., "New Project", "Save")
- **Filters**: Search and filter data in tables
- **Empty States**: Friendly messages when no data exists

## Testing Different Scenarios

### Scenario 1: Update Task Progress

1. Login as Technical Consultant
2. Go to "My Tasks"
3. Click any task card in the Kanban board
4. Adjust the progress slider
5. Change status via dropdown
6. See the task move to the new column

### Scenario 2: Review Deliverables

1. Login as Functional Consultant
2. Go to "Deliverables"
3. Click "Review" on a pending deliverable
4. Add a comment
5. Click "Approve" or "Request Changes"
6. See the status badge update

### Scenario 3: View Performance KPIs

1. Login as Manager
2. View the Performance Dashboard
3. Observe KPI cards with progress bars
4. Hover over charts to see tooltips
5. Scroll down to see recent alerts

### Scenario 4: Manage Users

1. Login as Admin
2. Go to "Users Management"
3. Search for a user
4. Filter by role
5. Toggle user active/inactive status
6. Click edit icon to modify user

## Switching Between Roles

Use the **"Switch User (Demo)"** button in the top bar to quickly test different role experiences without logging out.

## Mock Data

The application includes realistic mock data:
- **5 Users** (one per role)
- **3 Projects** (S/4HANA Migration, Fiori Launchpad, BI Reporting Platform)
- **6 Tasks** with various statuses
- **Timesheets, Evaluations, Deliverables, Tickets**
- **Chart data** for dashboards

All data persists in memory during your session.

## Connecting to Real Backend

To connect to your SAP CAP backend:

1. Create `.env` file:
```env
VITE_ODATA_BASE_URL=http://localhost:4004/odata/v4/performance
```

2. Edit `src/app/services/odataClient.ts`:
```typescript
const USE_MOCK_DATA = false; // Change to false
```

3. Ensure your CAP backend is running:
```bash
cd your-cap-project
cds watch
```

See `CAP_INTEGRATION.md` for complete backend setup.

## Building for Production

```bash
# Create production build
npm run build

# Output will be in dist/ folder
```

## Troubleshooting

### Port Already in Use
If port 5173 is busy, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### Blank Screen
1. Check browser console for errors (F12)
2. Ensure all dependencies are installed (`npm install`)
3. Clear browser cache and reload

### Charts Not Showing
Charts require a minimum viewport width. Ensure your browser window is at least 1024px wide for optimal experience.

### Mock Data Not Loading
This shouldn't happen, but if it does:
1. Check browser console for errors
2. Verify `src/app/services/mockData.ts` exists
3. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

## Next Steps

1. **Explore All Roles**: Use the user switcher to test different perspectives
2. **Test CRUD Operations**: Create, edit, and delete items
3. **Review Code Structure**: Check `ARCHITECTURE.md` for details
4. **Plan Backend Integration**: See `CAP_INTEGRATION.md`
5. **Customize**: Modify colors, add features, extend functionality

## Key Keyboard Shortcuts

- `Ctrl/Cmd + K`: Focus search (coming soon)
- `Esc`: Close modals and drawers
- `Tab`: Navigate through form fields

## Support & Documentation

- **README.md**: Full feature documentation
- **ARCHITECTURE.md**: Technical architecture details
- **CAP_INTEGRATION.md**: Backend integration guide
- **Code Comments**: Inline documentation in source files

## Demo Credentials Summary

| Role | Email | Dashboard Features |
|------|-------|-------------------|
| **Admin** | jean.dupont@company.com | User management, System config |
| **Manager** | marie.martin@company.com | KPI charts, Projects, Team performance |
| **Technical** | pierre.dubois@company.com | Kanban board, Timesheet |
| **Functional** | sophie.bernard@company.com | Deliverables, Tickets |

_Password: Any value (demo mode)_

---

**Enjoy exploring the Performance Portal! 🚀**
