import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import {
  NotificationsAPI,
  ProjectsAPI,
  TicketsAPI,
  UsersAPI,
} from '../../services/odataClient';
import { Project, Ticket, User } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';

interface TicketForm {
  projectId: string;
  assignedTo: string;
  priority: Ticket['priority'];
  title: string;
  description: string;
}

const EMPTY_FORM: TicketForm = {
  projectId: '',
  assignedTo: '',
  priority: 'MEDIUM',
  title: '',
  description: '',
};

export const FuncTickets: React.FC = () => {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<TicketForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Ticket['status'] | 'ALL'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    void loadData(currentUser.id);
  }, [currentUser]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [projectData, userData, ticketData] = await Promise.all([
        ProjectsAPI.getAll(),
        UsersAPI.getAll(),
        TicketsAPI.getAll(),
      ]);
      setProjects(projectData);
      setUsers(userData.filter((user) => user.role === 'CONSULTANT_TECHNIQUE'));
      setTickets(
        ticketData
          .filter((ticket) => ticket.createdBy === userId || ticket.assignedTo === userId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    } finally {
      setLoading(false);
    }
  };

  const submitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!form.projectId || !form.title.trim() || !form.description.trim()) {
      toast.error('Project, title and description are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await TicketsAPI.create({
        projectId: form.projectId,
        createdBy: currentUser.id,
        assignedTo: form.assignedTo || undefined,
        priority: form.priority,
        status: 'OPEN',
        title: form.title.trim(),
        description: form.description.trim(),
      });
      setTickets((prev) => [created, ...prev]);
      if (created.assignedTo) {
        await NotificationsAPI.create({
          userId: created.assignedTo,
          type: 'TICKET_ASSIGNED',
          title: 'New Ticket Assigned',
          message: `${created.title} (${created.priority})`,
          read: false,
        });
      }
      setForm(EMPTY_FORM);
      toast.success('Ticket created');
    } catch (error) {
      toast.error('Failed to create ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (ticket: Ticket, status: Ticket['status']) => {
    try {
      const updated = await TicketsAPI.update(ticket.id, { status });
      setTickets((prev) => prev.map((entry) => (entry.id === ticket.id ? updated : entry)));
    } catch (error) {
      toast.error('Failed to update ticket');
    }
  };

  const grouped = useMemo(() => {
    return {
      open: tickets.filter((ticket) => ticket.status === 'OPEN').length,
      inProgress: tickets.filter((ticket) => ticket.status === 'IN_PROGRESS').length,
      resolved: tickets.filter((ticket) => ticket.status === 'RESOLVED').length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      const matchesQuery =
        !q ||
        ticket.title.toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [tickets, searchQuery, statusFilter]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Tickets"
        subtitle="Create anomalies, track resolution and collaborate with technical consultants"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-func/dashboard' },
          { label: 'Tickets' },
        ]}
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-lg p-5 h-fit">
          <h3 className="text-lg font-semibold text-foreground mb-4">Create Ticket</h3>
          <form onSubmit={submitTicket} className="space-y-3">
            <div>
              <Label htmlFor="ticket-project" className="mb-1 block text-sm text-muted-foreground">Project</Label>
              <select
                id="ticket-project"
                value={form.projectId}
                onChange={(e) => setForm((prev) => ({ ...prev, projectId: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="ticket-assignee" className="mb-1 block text-sm text-muted-foreground">Assign to</Label>
              <select
                id="ticket-assignee"
                value={form.assignedTo}
                onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="ticket-priority" className="mb-1 block text-sm text-muted-foreground">Priority</Label>
              <select
                id="ticket-priority"
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as Ticket['priority'],
                  }))
                }
                className="w-full px-3 py-2 border border-border rounded bg-card text-foreground"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <Label htmlFor="ticket-title" className="mb-1 block text-sm text-muted-foreground">Title</Label>
              <Input
                id="ticket-title"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Brief ticket title"
              />
            </div>

            <div>
              <Label htmlFor="ticket-description" className="mb-1 block text-sm text-muted-foreground">Description</Label>
              <Textarea
                id="ticket-description"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={4}
                placeholder="Detailed functional issue..."
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Creating...' : 'Create Ticket'}
            </Button>
          </form>
        </div>

        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-xl font-semibold text-primary">{grouped.open}</div>
              <div className="text-xs text-muted-foreground">Open</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-xl font-semibold text-accent-foreground">{grouped.inProgress}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-xl font-semibold text-primary">{grouped.resolved}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-3 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-1">
              <Label htmlFor="ticket-search" className="sr-only">Search tickets</Label>
              <Input
                id="ticket-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title or description..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ticket-status-filter" className="sr-only">Filter by status</Label>
            <select
              id="ticket-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Ticket['status'] | 'ALL')}
              className="px-3 py-2 border border-border rounded bg-card text-foreground"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="WAITING_FEEDBACK">WAITING_FEEDBACK</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="CLOSED">CLOSED</option>
            </select>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Project
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Assigned To
                  </th>
                  <th className="px-4 py-3 text-left text-xs uppercase text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Loading tickets...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      No tickets match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="font-medium">{ticket.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {projects.find((project) => project.id === ticket.projectId)?.name ??
                          ticket.projectId}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{ticket.priority}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {users.find((user) => user.id === ticket.assignedTo)?.name ?? 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={ticket.status}
                          onChange={(e) =>
                            void updateStatus(ticket, e.target.value as Ticket['status'])
                          }
                          className="px-2 py-1 border border-border rounded bg-card text-sm text-foreground"
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="WAITING_FEEDBACK">WAITING_FEEDBACK</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
