// My Tasks - Stunning Kanban Board with Drag & Drop
import React, { useEffect, useState } from 'react';
import {
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  FlexBox,
  FlexBoxDirection,
  FlexBoxWrap,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Button,
  Label,
  Title,
  Card,
  CardHeader,
  Tag,
  ProgressIndicator,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  Input,
  TextArea,
  Select,
  Option,
  Icon,
} from '@ui5/webcomponents-react';
import { TasksAPI, NotificationsAPI } from '../../services/odataClient';
import { Task, TaskStatus } from '../../types/entities';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/calendar.js';
import '@ui5/webcomponents-icons/dist/time-entry-request.js';
import '@ui5/webcomponents-icons/dist/alert.js';
import '@ui5/webcomponents-icons/dist/flag.js';
import '@ui5/webcomponents-icons/dist/refresh.js';

const TASK_COLUMNS = [
  { status: 'TO_DO' as TaskStatus, label: 'To Do', color: '#6a6d70', icon: 'task' },
  { status: 'IN_PROGRESS' as TaskStatus, label: 'In Progress', color: '#0854a0', icon: 'activate' },
  { status: 'BLOCKED' as TaskStatus, label: 'Blocked', color: '#b00', icon: 'alert' },
  { status: 'DONE' as TaskStatus, label: 'Done', color: '#107e3e', icon: 'accept' },
];

export const MyTasksEnhanced: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadTasks();
    }
  }, [currentUser]);

  const loadTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await TasksAPI.getByUser(currentUser.id);
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'CRITICAL':
        return '#b00';
      case 'HIGH':
        return '#e9730c';
      case 'MEDIUM':
        return '#0a6ed1';
      case 'LOW':
        return '#107e3e';
      default:
        return '#6a6d70';
    }
  };

  const isOverdue = (task: Task): boolean => {
    return task.status !== 'DONE' && new Date(task.plannedEnd) < new Date();
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await TasksAPI.update(task.id, { status: newStatus });
      await loadTasks();
      toast.success('Task status updated');
      
      // Create notification
      if (currentUser) {
        await NotificationsAPI.create({
          userId: currentUser.id,
          type: 'TASK_UPDATED',
          title: 'Task Status Changed',
          message: `${task.title} moved to ${newStatus}`,
          read: false,
        });
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleProgressChange = async (task: Task, progress: number) => {
    try {
      await TasksAPI.update(task.id, { progressPercent: progress });
      await loadTasks();
      toast.success('Progress updated');
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  return (
    <>
      <DynamicPage
        titleArea={
          <DynamicPageTitle
            heading={<Title>My Tasks</Title>}
            actionsBar={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button
                  icon="refresh"
                  design="Transparent"
                  onClick={loadTasks}
                  tooltip="Refresh"
                />
                <Button icon="add" design="Emphasized">
                  New Task
                </Button>
              </FlexBox>
            }
          />
        }
        headerArea={
          <DynamicPageHeader>
            <FlexBox wrap={FlexBoxWrap.Wrap} style={{ gap: '2rem' }}>
              <FlexBox direction={FlexBoxDirection.Column}>
                <Label>Total Tasks</Label>
                <Title level="H5">{tasks.length}</Title>
              </FlexBox>
              <FlexBox direction={FlexBoxDirection.Column}>
                <Label>In Progress</Label>
                <Title level="H5">{getTasksByStatus('IN_PROGRESS').length}</Title>
              </FlexBox>
              <FlexBox direction={FlexBoxDirection.Column}>
                <Label>Completed</Label>
                <Title level="H5">{getTasksByStatus('DONE').length}</Title>
              </FlexBox>
              <FlexBox direction={FlexBoxDirection.Column}>
                <Label>Blocked</Label>
                <Title level="H5" style={{ color: 'var(--sapNegativeColor)' }}>
                  {getTasksByStatus('BLOCKED').length}
                </Title>
              </FlexBox>
            </FlexBox>
          </DynamicPageHeader>
        }
        style={{ height: '100%' }}
      >
        <div style={{ padding: '1rem', height: 'calc(100vh - 250px)', overflowX: 'auto' }}>
          <FlexBox style={{ gap: '1rem', minWidth: 'fit-content' }} className="animate-fade-in">
            {TASK_COLUMNS.map((column) => {
              const columnTasks = getTasksByStatus(column.status);
              return (
                <div
                  key={column.status}
                  style={{
                    flex: '1 1 300px',
                    minWidth: '300px',
                    maxWidth: '400px',
                  }}
                >
                  {/* Column Header */}
                  <Card
                    style={{
                      marginBottom: '1rem',
                      background: `${column.color}10`,
                      borderTop: `3px solid ${column.color}`,
                    }}
                  >
                    <div style={{ padding: '1rem' }}>
                      <FlexBox
                        alignItems={FlexBoxAlignItems.Center}
                        justifyContent={FlexBoxJustifyContent.SpaceBetween}
                      >
                        <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.5rem' }}>
                          <Icon name={column.icon} style={{ color: column.color }} />
                          <Title level="H5">{column.label}</Title>
                        </FlexBox>
                        <Tag colorScheme="8">{columnTasks.length}</Tag>
                      </FlexBox>
                    </div>
                  </Card>

                  {/* Task Cards */}
                  <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '1rem' }}>
                    {columnTasks.length === 0 ? (
                      <Card style={{ opacity: 0.6 }}>
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          <Label>No tasks</Label>
                        </div>
                      </Card>
                    ) : (
                      columnTasks.map((task) => (
                        <Card
                          key={task.id}
                          style={{
                            cursor: 'pointer',
                            borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                          }}
                          className="hover-lift button-press stagger-item"
                          onClick={() => handleTaskClick(task)}
                        >
                          <div style={{ padding: '1rem' }}>
                            <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.75rem' }}>
                              {/* Task Title */}
                              <Title level="H6">{task.title}</Title>

                              {/* Priority Tag */}
                              <FlexBox style={{ gap: '0.5rem' }}>
                                <Tag colorScheme={task.priority === 'CRITICAL' ? '1' : task.priority === 'HIGH' ? '2' : '8'}>
                                  {task.priority}
                                </Tag>
                                {task.isCritical && (
                                  <Tag colorScheme="1">
                                    <Icon name="flag" style={{ fontSize: '0.75rem' }} /> Critical
                                  </Tag>
                                )}
                                {isOverdue(task) && (
                                  <Tag colorScheme="1">
                                    <Icon name="alert" style={{ fontSize: '0.75rem' }} /> Overdue
                                  </Tag>
                                )}
                              </FlexBox>

                              {/* Progress */}
                              <div>
                                <FlexBox
                                  justifyContent={FlexBoxJustifyContent.SpaceBetween}
                                  style={{ marginBottom: '0.25rem' }}
                                >
                                  <Label style={{ fontSize: '0.75rem' }}>Progress</Label>
                                  <Label style={{ fontSize: '0.75rem' }}>{task.progressPercent}%</Label>
                                </FlexBox>
                                <ProgressIndicator
                                  value={task.progressPercent}
                                  valueState={
                                    task.progressPercent >= 75
                                      ? 'Positive'
                                      : task.progressPercent >= 50
                                      ? 'Information'
                                      : 'Critical'
                                  }
                                  hideValue
                                />
                              </div>

                              {/* Metadata */}
                              <FlexBox
                                justifyContent={FlexBoxJustifyContent.SpaceBetween}
                                style={{ fontSize: '0.75rem', color: 'var(--sapNeutralTextColor)' }}
                              >
                                <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.25rem' }}>
                                  <Icon name="calendar" style={{ fontSize: '0.75rem' }} />
                                  <span>{new Date(task.plannedEnd).toLocaleDateString()}</span>
                                </FlexBox>
                                <FlexBox alignItems={FlexBoxAlignItems.Center} style={{ gap: '0.25rem' }}>
                                  <Icon name="time-entry-request" style={{ fontSize: '0.75rem' }} />
                                  <span>
                                    {task.actualHours}h / {task.estimatedHours}h
                                  </span>
                                </FlexBox>
                              </FlexBox>

                              {/* Quick Actions */}
                              {column.status !== 'DONE' && (
                                <FlexBox style={{ gap: '0.5rem', marginTop: '0.5rem' }}>
                                  {column.status === 'TO_DO' && (
                                    <Button
                                      design="Emphasized"
                                      style={{ flex: 1 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(task, 'IN_PROGRESS');
                                      }}
                                    >
                                      Start
                                    </Button>
                                  )}
                                  {column.status === 'IN_PROGRESS' && (
                                    <>
                                      <Button
                                        design="Emphasized"
                                        style={{ flex: 1 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusChange(task, 'DONE');
                                        }}
                                      >
                                        Complete
                                      </Button>
                                      <Button
                                        design="Negative"
                                        style={{ flex: 1 }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStatusChange(task, 'BLOCKED');
                                        }}
                                      >
                                        Block
                                      </Button>
                                    </>
                                  )}
                                  {column.status === 'BLOCKED' && (
                                    <Button
                                      design="Positive"
                                      style={{ flex: 1 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(task, 'IN_PROGRESS');
                                      }}
                                    >
                                      Unblock
                                    </Button>
                                  )}
                                </FlexBox>
                              )}
                            </FlexBox>
                          </div>
                        </Card>
                      ))
                    )}
                  </FlexBox>
                </div>
              );
            })}
          </FlexBox>
        </div>
      </DynamicPage>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedTask(null);
          }}
          headerText={selectedTask.title}
          style={{ width: '600px' }}
          footer={
            <FlexBox
              justifyContent={FlexBoxJustifyContent.End}
              style={{ gap: '0.5rem', padding: '0.5rem' }}
            >
              <Button design="Transparent" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              <Button design="Emphasized">Save Changes</Button>
            </FlexBox>
          }
        >
          <div style={{ padding: '1rem' }}>
            <Form>
              <FormGroup headerText="Task Information">
                <FormItem labelContent={<Label>Description</Label>}>
                  <Label>{selectedTask.description}</Label>
                </FormItem>
                <FormItem labelContent={<Label>Status</Label>}>
                  <Select value={selectedTask.status}>
                    <Option value="TO_DO">To Do</Option>
                    <Option value="IN_PROGRESS">In Progress</Option>
                    <Option value="BLOCKED">Blocked</Option>
                    <Option value="DONE">Done</Option>
                  </Select>
                </FormItem>
                <FormItem labelContent={<Label>Progress</Label>}>
                  <Input
                    type="Number"
                    value={selectedTask.progressPercent.toString()}
                    onChange={(e: any) => {
                      const value = parseInt(e.target.value);
                      if (value >= 0 && value <= 100) {
                        handleProgressChange(selectedTask, value);
                      }
                    }}
                  />
                </FormItem>
              </FormGroup>
              <FormGroup headerText="Comments">
                <FormItem>
                  <TextArea
                    value={selectedTask.comments || ''}
                    placeholder="Add comments or notes..."
                    rows={4}
                  />
                </FormItem>
              </FormGroup>
            </Form>
          </div>
        </Dialog>
      )}
    </>
  );
};
