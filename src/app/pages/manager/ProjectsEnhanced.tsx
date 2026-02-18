// Projects List - SAP Fiori AnalyticalTable with FilterBar Pattern
import React, { useEffect, useState } from 'react';
import {
  DynamicPage,
  DynamicPageTitle,
  DynamicPageHeader,
  FlexBox,
  FlexBoxDirection,
  FlexBoxJustifyContent,
  FlexBoxAlignItems,
  Button,
  FilterBar,
  FilterGroupItem,
  Input,
  Select,
  Option,
  Label,
  Title,
  AnalyticalTable,
  Tag,
  ProgressIndicator,
  ObjectStatus,
  Dialog,
  Form,
  FormGroup,
  FormItem,
  TextArea,
  DatePicker,
} from '@ui5/webcomponents-react';
import { ProjectsAPI } from '../../services/odataClient';
import { Project, ProjectStatus, Priority } from '../../types/entities';
import { toast } from 'sonner';

import '@ui5/webcomponents-icons/dist/add.js';
import '@ui5/webcomponents-icons/dist/edit.js';
import '@ui5/webcomponents-icons/dist/delete.js';
import '@ui5/webcomponents-icons/dist/refresh.js';
import '@ui5/webcomponents-icons/dist/excel-attachment.js';
import '@ui5/webcomponents-icons/dist/filter.js';

export const ProjectsEnhanced: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [projects, searchQuery, statusFilter, priorityFilter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await ProjectsAPI.getAll();
      setProjects(data);
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter((p) => p.priority === priorityFilter);
    }

    setFilteredProjects(filtered);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
  };

  const getStatusState = (status: ProjectStatus): string => {
    switch (status) {
      case 'ACTIVE':
        return 'Positive';
      case 'PLANNED':
        return 'Information';
      case 'ON_HOLD':
        return 'Critical';
      case 'COMPLETED':
        return 'Positive';
      case 'CANCELLED':
        return 'Negative';
      default:
        return 'None';
    }
  };

  const getPriorityColorScheme = (priority: Priority): string => {
    switch (priority) {
      case 'CRITICAL':
        return '1';
      case 'HIGH':
        return '2';
      case 'MEDIUM':
        return '6';
      case 'LOW':
        return '8';
      default:
        return '8';
    }
  };

  const formatStatus = (status: ProjectStatus): string => {
    return status.replace('_', ' ');
  };

  const handleDeleteProject = async (project: Project) => {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await ProjectsAPI.delete(project.id);
        toast.success('Project deleted successfully');
        await loadProjects();
      } catch (error) {
        toast.error('Failed to delete project');
      }
    }
  };

  const columns = [
    {
      Header: 'Project Name',
      accessor: 'name',
      width: 250,
      Cell: ({ row }: any) => (
        <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.25rem' }}>
          <span style={{ fontWeight: 600 }}>{row.original.name}</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--sapNeutralTextColor)' }}>
            ID: {row.original.id}
          </span>
        </FlexBox>
      ),
    },
    {
      Header: 'Status',
      accessor: 'status',
      width: 150,
      Cell: ({ value }: any) => (
        <ObjectStatus state={getStatusState(value) as any}>
          {formatStatus(value)}
        </ObjectStatus>
      ),
    },
    {
      Header: 'Priority',
      accessor: 'priority',
      width: 120,
      Cell: ({ value }: any) => (
        <Tag colorScheme={getPriorityColorScheme(value)}>
          {value}
        </Tag>
      ),
    },
    {
      Header: 'Progress',
      accessor: 'progress',
      width: 200,
      Cell: ({ value }: any) => (
        <FlexBox direction={FlexBoxDirection.Column} style={{ gap: '0.25rem', width: '100%' }}>
          <ProgressIndicator
            value={value || 0}
            valueState={value >= 75 ? 'Positive' : value >= 50 ? 'Information' : 'Critical'}
            displayValue={`${value || 0}%`}
          />
        </FlexBox>
      ),
    },
    {
      Header: 'Start Date',
      accessor: 'startDate',
      width: 120,
      Cell: ({ value }: any) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'End Date',
      accessor: 'endDate',
      width: 120,
      Cell: ({ value }: any) => new Date(value).toLocaleDateString(),
    },
    {
      Header: 'Budget',
      accessor: 'budget',
      width: 120,
      Cell: ({ value }: any) => (value ? `€${value.toLocaleString()}` : '-'),
    },
    {
      Header: 'Actions',
      accessor: 'id',
      width: 150,
      disableSortBy: true,
      Cell: ({ row }: any) => (
        <FlexBox style={{ gap: '0.5rem' }}>
          <Button
            icon="edit"
            design="Transparent"
            onClick={() => {
              setSelectedProject(row.original);
              setEditDialogOpen(true);
            }}
            tooltip="Edit Project"
          />
          <Button
            icon="delete"
            design="Transparent"
            onClick={() => handleDeleteProject(row.original)}
            tooltip="Delete Project"
          />
        </FlexBox>
      ),
    },
  ];

  return (
    <>
      <DynamicPage
        titleArea={
          <DynamicPageTitle
            heading={<Title>Projects</Title>}
            actionsBar={
              <FlexBox style={{ gap: '0.5rem' }}>
                <Button
                  icon="refresh"
                  design="Transparent"
                  onClick={loadProjects}
                  tooltip="Refresh"
                />
                <Button
                  icon="excel-attachment"
                  design="Transparent"
                  tooltip="Export to Excel"
                />
                <Button
                  icon="add"
                  design="Emphasized"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  Create Project
                </Button>
              </FlexBox>
            }
          />
        }
        headerArea={
          <DynamicPageHeader>
            <FilterBar
              onGo={applyFilters}
              onClear={handleClearFilters}
              showClearOnFB
              showGoOnFB
              showRestoreOnFB
              hideFilterConfiguration
            >
              <FilterGroupItem label="Search" filterKey="search">
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onInput={(e: any) => setSearchQuery(e.target.value)}
                  style={{ width: '300px' }}
                />
              </FilterGroupItem>
              <FilterGroupItem label="Status" filterKey="status">
                <Select
                  value={statusFilter}
                  onChange={(e: any) => setStatusFilter(e.detail.selectedOption.value)}
                >
                  <Option value="ALL">All Statuses</Option>
                  <Option value="PLANNED">Planned</Option>
                  <Option value="ACTIVE">Active</Option>
                  <Option value="ON_HOLD">On Hold</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </FilterGroupItem>
              <FilterGroupItem label="Priority" filterKey="priority">
                <Select
                  value={priorityFilter}
                  onChange={(e: any) => setPriorityFilter(e.detail.selectedOption.value)}
                >
                  <Option value="ALL">All Priorities</Option>
                  <Option value="LOW">Low</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HIGH">High</Option>
                  <Option value="CRITICAL">Critical</Option>
                </Select>
              </FilterGroupItem>
            </FilterBar>
          </DynamicPageHeader>
        }
        style={{ height: '100%' }}
      >
        <FlexBox direction={FlexBoxDirection.Column} style={{ padding: '1rem', height: '100%' }}>
          {filteredProjects.length === 0 && !loading ? (
            <FlexBox
              direction={FlexBoxDirection.Column}
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.Center}
              style={{ height: '400px', gap: '1rem' }}
            >
              <Title level="H3">No Projects Found</Title>
              <Label>Try adjusting your filters or create a new project</Label>
              <Button
                icon="add"
                design="Emphasized"
                onClick={() => setCreateDialogOpen(true)}
              >
                Create Project
              </Button>
            </FlexBox>
          ) : (
            <AnalyticalTable
              columns={columns}
              data={filteredProjects}
              loading={loading}
              sortable
              filterable
              groupable
              visibleRows={15}
              minRows={5}
              selectionMode="Single"
              onRowClick={(e: any) => {
                setSelectedProject(e.detail.row.original);
              }}
              style={{ width: '100%', height: 'calc(100vh - 300px)' }}
              className="animate-fade-in"
            />
          )}
        </FlexBox>
      </DynamicPage>

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        headerText="Create New Project"
        footer={
          <FlexBox justifyContent={FlexBoxJustifyContent.End} style={{ gap: '0.5rem', padding: '0.5rem' }}>
            <Button design="Transparent" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button design="Emphasized" onClick={() => {
              toast.success('Project created successfully');
              setCreateDialogOpen(false);
              loadProjects();
            }}>
              Create
            </Button>
          </FlexBox>
        }
      >
        <Form style={{ padding: '1rem' }}>
          <FormGroup headerText="Basic Information">
            <FormItem labelContent={<Label>Project Name</Label>}>
              <Input placeholder="Enter project name" required />
            </FormItem>
            <FormItem labelContent={<Label>Description</Label>}>
              <TextArea placeholder="Enter project description" rows={3} />
            </FormItem>
          </FormGroup>
          <FormGroup headerText="Schedule">
            <FormItem labelContent={<Label>Start Date</Label>}>
              <DatePicker />
            </FormItem>
            <FormItem labelContent={<Label>End Date</Label>}>
              <DatePicker />
            </FormItem>
          </FormGroup>
          <FormGroup headerText="Classification">
            <FormItem labelContent={<Label>Status</Label>}>
              <Select>
                <Option value="PLANNED">Planned</Option>
                <Option value="ACTIVE">Active</Option>
              </Select>
            </FormItem>
            <FormItem labelContent={<Label>Priority</Label>}>
              <Select>
                <Option value="LOW">Low</Option>
                <Option value="MEDIUM">Medium</Option>
                <Option value="HIGH">High</Option>
                <Option value="CRITICAL">Critical</Option>
              </Select>
            </FormItem>
          </FormGroup>
        </Form>
      </Dialog>
    </>
  );
};
