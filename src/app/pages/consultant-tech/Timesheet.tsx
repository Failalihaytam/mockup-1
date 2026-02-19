// Timesheet Entry for Technical Consultant

import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { TimesheetsAPI, ProjectsAPI, TasksAPI } from '../../services/odataClient';
import { Timesheet, Project, Task } from '../../types/entities';
import { Plus, Calendar, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  getISOWeekInputValue,
  getMondayOfWeek,
  parseISOWeekInputValue,
  toLocalDateKey,
} from '../../utils/date';

interface TimesheetEntry {
  id?: string;
  date: string;
  projectId: string;
  taskId: string;
  hours: number;
  comment: string;
}

const getWeekDates = (date: Date): Date[] => {
  const week: Date[] = [];
  const current = getMondayOfWeek(date);
  for (let i = 0; i < 5; i += 1) {
    const next = new Date(current);
    next.setDate(current.getDate() + i);
    week.push(next);
  }
  return week;
};

export const TimesheetPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);

  useEffect(() => {
    if (currentUser) {
      void loadData(currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    setEntries(buildEntriesForWeek(selectedWeek, timesheets));
  }, [selectedWeek, timesheets]);

  const loadData = async (userId: string) => {
    setLoading(true);
    try {
      const [timesheetsData, projectsData, tasksData] = await Promise.all([
        TimesheetsAPI.getByUser(userId),
        ProjectsAPI.getAll(),
        TasksAPI.getByUser(userId),
      ]);

      setTimesheets(timesheetsData);
      setProjects(projectsData);
      setTasks(tasksData);
    } finally {
      setLoading(false);
    }
  };

  const buildEntriesForWeek = (weekDate: Date, source: Timesheet[]): TimesheetEntry[] => {
    const weekDates = getWeekDates(weekDate);
    const minDate = toLocalDateKey(weekDates[0]);
    const maxDate = toLocalDateKey(weekDates[weekDates.length - 1]);

    const existing = source
      .filter((entry) => entry.date >= minDate && entry.date <= maxDate)
      .map((entry) => ({
        id: entry.id,
        date: entry.date,
        projectId: entry.projectId,
        taskId: entry.taskId ?? '',
        hours: entry.hours,
        comment: entry.comment ?? '',
      }));

    const byDateCount = new Map<string, number>();
    existing.forEach((entry) => {
      byDateCount.set(entry.date, (byDateCount.get(entry.date) ?? 0) + 1);
    });

    const fillers: TimesheetEntry[] = weekDates
      .map((date) => toLocalDateKey(date))
      .filter((key) => !byDateCount.get(key))
      .map((key) => ({
        date: key,
        projectId: '',
        taskId: '',
        hours: 0,
        comment: '',
      }));

    return [...existing, ...fillers].sort((a, b) => a.date.localeCompare(b.date));
  };

  const addEntry = () => {
    const weekDates = getWeekDates(selectedWeek);
    setEntries((prev) => [
      ...prev,
      {
        date: toLocalDateKey(weekDates[0]),
        projectId: '',
        taskId: '',
        hours: 0,
        comment: '',
      },
    ]);
  };

  const updateEntry = (index: number, field: keyof TimesheetEntry, value: string | number) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'projectId') {
        next[index].taskId = '';
      }
      return next;
    });
  };

  const saveTimesheets = async () => {
    if (!currentUser) return;

    const dailyTotals = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.hours) continue;
      dailyTotals.set(entry.date, (dailyTotals.get(entry.date) ?? 0) + entry.hours);
    }
    const invalidDay = Array.from(dailyTotals.entries()).find(([, total]) => total > 24);
    if (invalidDay) {
      toast.error(`Daily total cannot exceed 24h (${invalidDay[0]} has ${invalidDay[1]}h)`);
      return;
    }

    try {
      const validEntries = entries.filter((entry) => entry.projectId && entry.hours > 0);
      for (const entry of validEntries) {
        if (entry.id) {
          await TimesheetsAPI.update(entry.id, {
            date: entry.date,
            projectId: entry.projectId,
            taskId: entry.taskId || undefined,
            hours: entry.hours,
            comment: entry.comment,
          });
        } else {
          await TimesheetsAPI.create({
            userId: currentUser.id,
            date: entry.date,
            projectId: entry.projectId,
            taskId: entry.taskId || undefined,
            hours: entry.hours,
            comment: entry.comment,
          });
        }
      }

      toast.success('Timesheets saved successfully');
      await loadData(currentUser.id);
    } catch (error) {
      toast.error('Failed to save timesheets');
    }
  };

  const getTotalHours = () => entries.reduce((sum, entry) => sum + (entry.hours || 0), 0);

  const weekDates = getWeekDates(selectedWeek);

  const weekEntryCount = useMemo(() => {
    return entries.filter((entry) => entry.projectId && entry.hours > 0).length;
  }, [entries]);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Timesheet"
        subtitle="Track your daily work hours"
        breadcrumbs={[
          { label: 'Home', path: '/consultant-tech/dashboard' },
          { label: 'Timesheet' },
        ]}
        actions={
          <Button type="button" onClick={saveTimesheets}>
            <Save className="w-4 h-4" />
            Save Timesheets
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <Label htmlFor="timesheet-week" className="mb-1 block text-sm font-medium text-muted-foreground">
                  Week
                </Label>
                <Input
                  id="timesheet-week"
                  type="week"
                  value={getISOWeekInputValue(selectedWeek)}
                  onChange={(e) => setSelectedWeek(parseISOWeekInputValue(e.target.value))}
                  className="w-auto px-3 py-2"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {toLocalDateKey(weekDates[0])} to {toLocalDateKey(weekDates[weekDates.length - 1])}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Hours This Week</div>
              <div className="text-2xl font-semibold text-foreground">{getTotalHours()}h</div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px]">
              <thead className="bg-muted border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                    Comment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {entries.map((entry, index) => (
                  <tr key={`${entry.id ?? 'new'}-${index}`} className="hover:bg-accent">
                    <td className="px-6 py-4">
                      <Input
                        aria-label={`Entry ${index + 1} date`}
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateEntry(index, 'date', e.target.value)}
                        className="w-auto px-3 py-2"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={entry.projectId || 'UNSELECTED'}
                        onValueChange={(value) =>
                          updateEntry(index, 'projectId', value === 'UNSELECTED' ? '' : value)
                        }
                      >
                        <SelectTrigger aria-label={`Entry ${index + 1} project`}>
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNSELECTED">Select Project</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Select
                        value={entry.taskId || 'UNSELECTED'}
                        onValueChange={(value) =>
                          updateEntry(index, 'taskId', value === 'UNSELECTED' ? '' : value)
                        }
                        disabled={!entry.projectId}
                      >
                        <SelectTrigger aria-label={`Entry ${index + 1} task`}>
                          <SelectValue placeholder="Select Task (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNSELECTED">Select Task (Optional)</SelectItem>
                          {tasks
                            .filter((task) => task.projectId === entry.projectId)
                            .map((task) => (
                              <SelectItem key={task.id} value={task.id}>
                                {task.title}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        aria-label={`Entry ${index + 1} hours`}
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={entry.hours}
                        onChange={(e) => updateEntry(index, 'hours', Number(e.target.value || 0))}
                        className="w-20 px-3 py-2"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <Input
                        aria-label={`Entry ${index + 1} comment`}
                        type="text"
                        value={entry.comment}
                        onChange={(e) => updateEntry(index, 'comment', e.target.value)}
                        placeholder="Optional comment"
                        className="w-full px-3 py-2"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-border bg-muted">
            <Button type="button" variant="ghost" onClick={addEntry}>
              <Plus className="w-4 h-4" />
              Add Entry
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="text-sm text-muted-foreground mb-1">This Week</div>
            <div className="text-2xl font-semibold text-foreground">{getTotalHours()}h</div>
          </div>
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Average Daily</div>
            <div className="text-2xl font-semibold text-foreground">
              {(getTotalHours() / 5).toFixed(1)}h
            </div>
          </div>
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="text-sm text-muted-foreground mb-1">Filled Entries</div>
            <div className="text-2xl font-semibold text-foreground">{weekEntryCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
