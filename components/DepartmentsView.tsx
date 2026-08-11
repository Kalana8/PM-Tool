'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  Users,
  BarChart3,
  CheckSquare,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  X,
  FileText,
  AlertCircle,
  FolderDot,
  CheckCircle2,
  Clock,
  GripVertical,
  Trash2,
  Edit2,
  Eye,
  Mail
} from 'lucide-react';
import { Department, User, Project, MediaFile, Task, TaskStatus, TaskPriority, TaskCategory, Subtask, RoleBaseLevel } from '../lib/types';
import { hasAction } from '../lib/permissions';

interface DepartmentsViewProps {
  departments: Department[];
  users: User[];
  admins: User[];
  projects: Project[];
  media: MediaFile[];
  tasks: Task[];
  selectedDeptId: string | null;
  onDeptSelect: (id: string | null) => void;
  onNavigate: (view: string, id?: string) => void;
  userRole: RoleBaseLevel;
  currentUser: User;
  onAddDepartment: (dept: Omit<Department, 'id'>) => void;
  onUpdateDepartment: (deptId: string, updates: Omit<Department, 'id'>) => void;
  onUpdateDepartmentStatus: (deptId: string, status: 'Active' | 'Inactive') => void;
  onDeleteDepartment: (deptId: string) => void;
  currentUserId?: string;
  onAddProject: (project: Omit<Project, 'id' | 'progress' | 'members' | 'documents' | 'images' | 'videos' | 'notes'>) => void;
  onUpdateProject: (projectId: string, updates: Partial<Omit<Project, 'id'>>) => void;
  onDeleteProject: (projectId: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'comments' | 'submissions'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Omit<Task, 'id' | 'comments' | 'submissions'>>) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus, progress: number) => void;
  onUpdateTaskAssignee: (taskId: string, assignedTo: string) => void;
  onAddSubtask: (taskId: string, subtask: Omit<Subtask, 'id' | 'status' | 'progress'>) => void;
  onUpdateSubtask: (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onReorderTasks: (orderedTaskIds: string[]) => void;
  onReorderSubtasks: (taskId: string, orderedSubtaskIds: string[]) => void;
  onAddComment: (projectId: string, text: string) => void;
  onSendTaskSummaryEmail?: (userId: string) => Promise<boolean>;
}

const STATUS_OPTIONS: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed', 'Cancelled'];
const PROJECT_STATUS_OPTIONS: Project['status'][] = ['Planning', 'In Progress', 'In Review', 'Completed'];
const PRIORITY_OPTIONS: TaskPriority[] = ['High', 'Medium', 'Low'];

interface NewSubtaskDraft {
  name: string;
  ownerId: string;
  assignedTo: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
}

const EMPTY_SUBTASK_DRAFT: NewSubtaskDraft = { name: '', ownerId: '', assignedTo: '', priority: 'Medium', startDate: '', dueDate: '' };

export default function DepartmentsView({
  departments,
  users,
  admins,
  projects,
  media,
  tasks,
  selectedDeptId,
  onDeptSelect,
  onNavigate,
  userRole,
  currentUser,
  onAddDepartment,
  onUpdateDepartment,
  onUpdateDepartmentStatus,
  onDeleteDepartment,
  currentUserId,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onUpdateTaskAssignee,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderTasks,
  onReorderSubtasks,
  onAddComment,
  onSendTaskSummaryEmail
}: DepartmentsViewProps) {
  // Navigation states
  const [activeDeptDetail, setActiveDeptDetail] = useState<string | null>(selectedDeptId);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const canSendTaskEmail = userRole === 'admin' || userRole === 'team_leader';
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailUserId, setEmailUserId] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('daily');
  const isAdmin = hasAction(currentUser, 'departments.manage');

  // Add / Edit Department drawer state
  const [isDeptFormOpen, setIsDeptFormOpen] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptDescription, setDeptDescription] = useState('');

  const handleOpenAddDepartment = () => {
    setEditingDeptId(null);
    setDeptName('');
    setDeptCode('');
    setDeptDescription('');
    setIsDeptFormOpen(true);
  };

  const handleOpenEditDepartment = (dept: Department) => {
    setEditingDeptId(dept.id);
    setDeptName(dept.name);
    setDeptCode(dept.code);
    setDeptDescription(dept.description);
    setIsDeptFormOpen(true);
  };

  const handleDeptFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim() || !deptCode.trim()) return;

    if (editingDeptId) {
      const existing = departments.find((d) => d.id === editingDeptId);
      onUpdateDepartment(editingDeptId, {
        name: deptName,
        code: deptCode.toUpperCase(),
        description: deptDescription,
        icon: existing?.icon || 'Building2',
        status: existing?.status || 'Active'
      });
    } else {
      onAddDepartment({
        name: deptName,
        code: deptCode.toUpperCase(),
        description: deptDescription,
        icon: 'Building2',
        status: 'Active'
      });
    }

    setIsDeptFormOpen(false);
  };

  const handleDeleteDepartmentClick = (dept: Department) => {
    if (window.confirm(`Delete "${dept.name}"? This cannot be undone.`)) {
      onDeleteDepartment(dept.id);
    }
  };

  // Both Admin and Team Leader can create/edit/delete projects
  const canManageProjects = hasAction(currentUser, 'projects.manage');

  // Add / Edit Project drawer state
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projName, setProjName] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projStartDate, setProjStartDate] = useState('2026-07-08');
  const [projDeadline, setProjDeadline] = useState('2026-08-08');
  const [projStatus, setProjStatus] = useState<Project['status']>('Planning');
  const [projOwnerId, setProjOwnerId] = useState('');
  const [projAssigneeId, setProjAssigneeId] = useState('');

  const handleOpenAddProject = () => {
    setEditingProjectId(null);
    setProjName('');
    setProjDescription('');
    setProjStartDate('2026-07-08');
    setProjDeadline('2026-08-08');
    setProjStatus('Planning');
    setProjOwnerId(userRole === 'team_leader' && currentUserId ? currentUserId : '');
    setProjAssigneeId('');
    setIsProjectFormOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProjectId(proj.id);
    setProjName(proj.name);
    setProjDescription(proj.description);
    setProjStartDate(proj.startDate || '2026-07-08');
    setProjDeadline(proj.deadline);
    setProjStatus(proj.status);
    setProjOwnerId(proj.leaderId);
    setProjAssigneeId(proj.assigneeId || '');
    setIsProjectFormOpen(true);
  };

  const handleProjectFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projName.trim() || !activeDeptDetail || !projOwnerId) return;

    if (editingProjectId) {
      onUpdateProject(editingProjectId, {
        name: projName,
        description: projDescription,
        startDate: projStartDate,
        deadline: projDeadline,
        status: projStatus,
        leaderId: projOwnerId,
        assigneeId: projAssigneeId || undefined,
        departmentId: activeDeptDetail
      });
    } else {
      onAddProject({
        name: projName,
        departmentId: activeDeptDetail,
        description: projDescription,
        startDate: projStartDate,
        deadline: projDeadline,
        status: projStatus,
        leaderId: projOwnerId,
        assigneeId: projAssigneeId || undefined
      });
    }

    setIsProjectFormOpen(false);
  };

  const handleDeleteProjectClick = (proj: Project) => {
    if (window.confirm(`Delete project "${proj.name}"? This cannot be undone.`)) {
      onDeleteProject(proj.id);
      if (selectedProjectId === proj.id) setSelectedProjectId(null);
    }
  };

  // Search and view filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeLimit, setShowUpgradeLimit] = useState(true);

  // Local interactive states to allow instant additions and checklist actions
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskOwner, setNewTaskOwner] = useState('Unassigned');
  const [newTaskStartDate, setNewTaskStartDate] = useState('2026-07-08');
  const [newTaskStartTime, setNewTaskStartTime] = useState('09:00');
  const [newTaskDueDate, setNewTaskDueDate] = useState('2026-07-11');
  const [newTaskDueTime, setNewTaskDueTime] = useState('18:00');
  const [newTaskDueDays, setNewTaskDueDays] = useState(3);

  // Task View (read-only) drawer
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);

  // Synchronize local state with props during render to avoid useEffect set-state rule
  const [prevSelectedDeptId, setPrevSelectedDeptId] = useState<string | null>(selectedDeptId);
  if (selectedDeptId !== prevSelectedDeptId) {
    setActiveDeptDetail(selectedDeptId);
    setPrevSelectedDeptId(selectedDeptId);
    setSelectedProjectId(null);
    if (!selectedDeptId) {
      setActiveDeptDetail(null);
    }
  }

  const handleDeptSelect = (deptId: string) => {
    onDeptSelect(deptId);
    setActiveDeptDetail(deptId);
    setSelectedProjectId(null);
  };

  const handleBackToList = () => {
    setActiveDeptDetail(null);
    onDeptSelect(null);
    setSelectedProjectId(null);
  };

  const handleBackToProjectGrid = () => {
    setSelectedProjectId(null);
  };

  const canEditProgress = hasAction(currentUser, 'tasks.edit_progress');

  // Change a task's status via dropdown (progress is left untouched, no auto-fill)
  const handleTaskStatusChange = (taskId: string, nextStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    onUpdateTaskStatus(taskId, nextStatus, task?.progress ?? 0);
  };

  // Reassign a task's assignee via dropdown
  const handleTaskAssigneeChange = (taskId: string, nextAssignedTo: string) => {
    onUpdateTaskAssignee(taskId, nextAssignedTo);
  };

  // Directly type a task's progress percentage
  const handleTaskProgressChange = (taskId: string, nextProgress: number) => {
    const clamped = Math.max(0, Math.min(100, nextProgress));
    const task = tasks.find((t) => t.id === taskId);
    onUpdateTaskStatus(taskId, task?.status ?? 'Todo', clamped);
  };

  // Subtasks: expand/collapse + inline "new subtask" draft per task
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskDrafts, setNewSubtaskDrafts] = useState<Record<string, NewSubtaskDraft>>({});

  const getSubtaskDraft = (taskId: string): NewSubtaskDraft =>
    newSubtaskDrafts[taskId] || EMPTY_SUBTASK_DRAFT;

  const updateSubtaskDraft = (taskId: string, updates: Partial<NewSubtaskDraft>) => {
    setNewSubtaskDrafts((prev) => ({ ...prev, [taskId]: { ...getSubtaskDraft(taskId), ...updates } }));
  };

  // Drag-and-drop reordering state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [draggedSubtask, setDraggedSubtask] = useState<{ taskId: string; subtaskId: string } | null>(null);
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);

  const toggleExpanded = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleAddSubtask = (taskId: string) => {
    const draft = getSubtaskDraft(taskId);
    const text = draft.name.trim();
    if (!text) return;
    onAddSubtask(taskId, {
      name: text,
      ownerId: draft.ownerId || undefined,
      assignedTo: draft.assignedTo || undefined,
      startDate: draft.startDate || undefined,
      dueDate: draft.dueDate || undefined,
      priority: draft.priority
    });
    setNewSubtaskDrafts((prev) => ({ ...prev, [taskId]: EMPTY_SUBTASK_DRAFT }));
  };

  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => {
    onUpdateSubtask(taskId, subtaskId, updates);
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    onDeleteSubtask(taskId, subtaskId);
  };

  const handleTaskDrop = (visibleTaskIds: string[], targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }
    const fromIndex = visibleTaskIds.indexOf(draggedTaskId);
    const toIndex = visibleTaskIds.indexOf(targetTaskId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...visibleTaskIds];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedTaskId);
    onReorderTasks(reordered);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleSubtaskDrop = (taskId: string, subtasks: Task['subtasks'], targetSubtaskId: string) => {
    if (!draggedSubtask || draggedSubtask.taskId !== taskId || draggedSubtask.subtaskId === targetSubtaskId || !subtasks) {
      setDraggedSubtask(null);
      setDragOverSubtaskId(null);
      return;
    }
    const ids = subtasks.map((s) => s.id);
    const fromIndex = ids.indexOf(draggedSubtask.subtaskId);
    const toIndex = ids.indexOf(targetSubtaskId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...ids];
    reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, draggedSubtask.subtaskId);
    onReorderSubtasks(taskId, reordered);
    setDraggedSubtask(null);
    setDragOverSubtaskId(null);
  };

  // Add or update a task in the selected project
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim() || !selectedProjectId || !activeDeptDetail) return;

    const assignedUser = users.find((u) => u.id === newTaskOwner) || null;

    if (editingTaskId) {
      const original = tasks.find((t) => t.id === editingTaskId);
      onUpdateTask(editingTaskId, {
        name: newTaskName,
        startDate: newTaskStartDate,
        startTime: newTaskStartTime,
        dueDate: newTaskDueDate,
        dueTime: newTaskDueTime,
        dueDays: newTaskDueDays,
        assignedTo: assignedUser ? assignedUser.id : original?.assignedTo
      });
      setEditingTaskId(null);
      setNewTaskName('');
      return;
    }

    onAddTask({
      name: newTaskName,
      projectId: selectedProjectId,
      departmentId: activeDeptDetail,
      category: activeCategory,
      description: 'Quick task registered via project console',
      priority: 'Medium',
      status: 'Todo',
      progress: 0,
      startDate: newTaskStartDate,
      startTime: newTaskStartTime,
      dueDate: newTaskDueDate,
      dueTime: newTaskDueTime,
      dueDays: newTaskDueDays,
      assignedTo: assignedUser ? assignedUser.id : 'unassigned'
    });
    setNewTaskName('');
  };

  const handleOpenEditTaskLocal = (task: Task) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.name);
    setNewTaskOwner(task.assignedTo);
    setNewTaskStartDate(task.startDate || '2026-07-08');
    setNewTaskStartTime(task.startTime || '09:00');
    setNewTaskDueDate(task.dueDate);
    setNewTaskDueTime(task.dueTime || '18:00');
    setNewTaskDueDays(task.dueDays ?? 3);
  };

  const handleCancelEditTaskLocal = () => {
    setEditingTaskId(null);
    setNewTaskName('');
    setNewTaskOwner('Unassigned');
  };

  const handleDeleteTaskLocal = (task: Task) => {
    if (window.confirm(`Delete task "${task.name}"? This cannot be undone.`)) {
      onDeleteTask(task.id);
    }
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats calculation for departments
  const getDeptStats = (deptId: string) => {
    const deptTasks = tasks.filter((t) => t.departmentId === deptId);
    const total = deptTasks.length;
    const completed = deptTasks.filter((t) => t.status === 'Completed').length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      progress
    };
  };

  // If a department is activated, render either the full-page project grid
  // (no project chosen yet) or the project task detail split view (project chosen)
  if (activeDeptDetail) {
    const currentDept = departments.find((d) => d.id === activeDeptDetail) || departments[0];
    const deptProjects = projects.filter((p) => p.departmentId === activeDeptDetail);
    const activeProject = deptProjects.find((p) => p.id === selectedProjectId) || null;

    // Filter tasks for the selected project
    const allProjectTasks = activeProject
      ? tasks.filter((t) => t.projectId === activeProject.id)
      : [];
    const projectTasks = allProjectTasks.filter((t) => t.category === activeCategory);

    const totalProjTasks = allProjectTasks.length;
    const completedProjTasks = allProjectTasks.filter((t) => t.status === 'Completed').length;
    const projectProgress =
      totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 0;

    const viewingTask = tasks.find((t) => t.id === viewingTaskId) || null;

    // Preview only — the email itself is regenerated server-side from fresh
    // data when sent, this is just to show the admin/leader what's assigned
    // before they commit to sending it.
    const emailPreviewTasks = tasks.filter((t) => t.assignedTo === emailUserId);
    const emailPreviewTaskIds = new Set(emailPreviewTasks.map((t) => t.id));
    const emailPreviewExtraSubtasks = tasks.flatMap((t) =>
      !emailPreviewTaskIds.has(t.id)
        ? (t.subtasks ?? []).filter((s) => s.assignedTo === emailUserId).map((s) => ({ ...s, parentTaskName: t.name }))
        : []
    );

    const handleSendEmail = async () => {
      if (!emailUserId) return;
      setEmailSending(true);
      const ok = await onSendTaskSummaryEmail?.(emailUserId);
      setEmailSending(false);
      if (ok) {
        setIsEmailModalOpen(false);
        setEmailUserId('');
      }
    };

    return (
      <div className="flex flex-col h-[calc(100vh-80px)]" id="departments-split-view">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={activeProject ? handleBackToProjectGrid : handleBackToList}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors text-slate-500"
              title={activeProject ? 'Back to Projects' : 'Back to Department List'}
            >
              <ArrowLeft className="h-4.5 w-4.5" />
            </button>
            <span
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
              onClick={handleBackToList}
            >
              Departments
            </span>
            <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
            {activeProject ? (
              <span
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer transition-colors"
                onClick={handleBackToProjectGrid}
              >
                {currentDept.name}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{currentDept.name}</span>
            )}
            {activeProject && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{activeProject.name}</span>
              </>
            )}
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
            Department Code: {currentDept.code}
          </span>
        </div>

        {/* Single focused pane: project grid or task detail, no side panel */}
        <div className="flex flex-1 min-h-0">
          <div className="flex-1 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-900 rounded-xl flex flex-col min-h-0 shadow-sm">
            {!activeProject ? (
              /* No project selected yet: show project grid, no sub tasks */
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin" id="dept-projects-grid">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {currentDept.name} Projects
                  </h3>
                  {canManageProjects && (
                    <button
                      id="open-add-project-btn"
                      onClick={handleOpenAddProject}
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Project
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-5">Select a project to view its task roster.</p>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold">
                        <th className="p-3">Project Name</th>
                        <th className="p-3 w-40">Owner</th>
                        <th className="p-3 w-44">Assignee</th>
                        <th className="p-3 w-32">Start Date</th>
                        <th className="p-3 w-32">Status</th>
                        <th className="p-3 w-28 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                      {deptProjects.map((p) => {
                        const owner = users.find((u) => u.id === p.leaderId) || admins.find((u) => u.id === p.leaderId);
                        const deptAssigneeOptions = users.filter(
                          (u) => u.departmentId === p.departmentId && (u.baseLevel === 'team_leader' || u.baseLevel === 'team_member')
                        );
                        return (
                          <tr
                            key={p.id}
                            id={`dept-project-row-${p.id}`}
                            onClick={() => setSelectedProjectId(p.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                          >
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <FolderDot className="h-4.5 w-4.5 shrink-0 text-blue-500" />
                                <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {p.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-3">
                              {owner ? (
                                <div className="flex items-center gap-1.5">
                                  <img src={owner.avatar} alt={owner.name} className="h-5 w-5 rounded-full object-cover" />
                                  <span className="truncate max-w-[100px] font-medium text-slate-700 dark:text-slate-300">
                                    {owner.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 dark:text-slate-700 font-mono text-[10px]">Unassigned</span>
                              )}
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                id={`dept-project-assignee-select-${p.id}`}
                                value={p.assigneeId || ''}
                                disabled={!canManageProjects}
                                onChange={(e) => onUpdateProject(p.id, { assigneeId: e.target.value || undefined })}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="">Unassigned</option>
                                {deptAssigneeOptions.map((u) => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                              {p.startDate || '—'}
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <select
                                id={`dept-project-status-select-${p.id}`}
                                value={p.status}
                                disabled={!canManageProjects}
                                onChange={(e) => onUpdateProject(p.id, { status: e.target.value as Project['status'] })}
                                className={`rounded-xl px-2 py-0.5 text-[9px] font-bold border outline-none cursor-pointer disabled:cursor-not-allowed ${
                                  p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                  p.status === 'In Progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                  p.status === 'In Review' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                  'bg-slate-50 text-slate-500 border-slate-150'
                                }`}
                              >
                                {PROJECT_STATUS_OPTIONS.map((s) => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  id={`dept-project-view-btn-${p.id}`}
                                  onClick={() => setSelectedProjectId(p.id)}
                                  className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                  title="View project"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                                {canManageProjects && (
                                  <>
                                    <button
                                      id={`dept-project-edit-btn-${p.id}`}
                                      onClick={() => handleOpenEditProject(p)}
                                      className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                      title="Edit project"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      id={`dept-project-delete-btn-${p.id}`}
                                      onClick={() => handleDeleteProjectClick(p)}
                                      className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                                      title="Delete project"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {deptProjects.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-16 text-center text-slate-400 font-sans">
                            No active projects found for this department.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <>
                {/* Project Brief Info Card with Circular Progress (Screenshot 2) */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-900/5 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    {/* Circle Progress */}
                    <div className="relative h-11 w-11 shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-900">
                      <svg className="absolute inset-0 h-full w-full -rotate-90">
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          className="stroke-slate-200 dark:stroke-slate-800"
                          strokeWidth="3.5"
                          fill="transparent"
                        />
                        <circle
                          cx="22"
                          cy="22"
                          r="18"
                          className="stroke-blue-500 transition-all duration-500"
                          strokeWidth="3.5"
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 18}
                          strokeDashoffset={2 * Math.PI * 18 * (1 - projectProgress / 100)}
                        />
                      </svg>
                      <span className="text-[10px] font-extrabold font-mono text-slate-800 dark:text-slate-100">
                        {projectProgress}%
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {activeProject.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate max-w-lg mt-0.5">
                        {activeProject.description || 'Enterprise iteration deployment pipeline.'}
                      </p>
                    </div>
                  </div>

                  {canSendTaskEmail && (
                    <button
                      id="open-dept-email-task-summary-btn"
                      onClick={() => {
                        setEmailUserId('');
                        setIsEmailModalOpen(true);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                    >
                      <Mail className="h-4 w-4" />
                      Email Task Summary
                    </button>
                  )}
                </div>

                {/* Category Tabs: Daily Tasks vs. Continuous Tasks */}
                <div className="flex border-b border-slate-100 dark:border-slate-900 px-4">
                  <button
                    onClick={() => setActiveCategory('daily')}
                    className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeCategory === 'daily'
                        ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Daily Tasks
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
                      {allProjectTasks.filter(t => t.category === 'daily').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveCategory('continuous')}
                    className={`px-4 py-2 border-b-2 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      activeCategory === 'continuous'
                        ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Continuous Tasks
                    <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
                      {allProjectTasks.filter(t => t.category === 'continuous').length}
                    </span>
                  </button>
                </div>

                {/* Tasks */}
                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                  {(
                    <div className="p-4 space-y-4">
                      {/* Task quick adding form */}
                      <form onSubmit={handleAddTask} className="space-y-2 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Type new task name..."
                            value={newTaskName}
                            onChange={(e) => setNewTaskName(e.target.value)}
                            className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 font-sans"
                          />
                          <select
                            value={newTaskOwner}
                            onChange={(e) => setNewTaskOwner(e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 text-xs text-slate-600 dark:text-slate-300 outline-none focus:border-blue-500"
                          >
                            <option value="Unassigned">Assignee</option>
                            {users
                              .filter((u) => u.departmentId === activeDeptDetail && (u.baseLevel === 'team_member' || u.baseLevel === 'team_leader'))
                              .map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.roleName})
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Start</label>
                            <input
                              type="date"
                              value={newTaskStartDate}
                              onChange={(e) => setNewTaskStartDate(e.target.value)}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                            />
                            <input
                              type="time"
                              value={newTaskStartTime}
                              onChange={(e) => setNewTaskStartTime(e.target.value)}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Due</label>
                            <input
                              type="date"
                              value={newTaskDueDate}
                              onChange={(e) => setNewTaskDueDate(e.target.value)}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                            />
                            <input
                              type="time"
                              value={newTaskDueTime}
                              onChange={(e) => setNewTaskDueTime(e.target.value)}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase">Days</label>
                            <input
                              type="number"
                              min={0}
                              value={newTaskDueDays}
                              onChange={(e) => setNewTaskDueDays(Number(e.target.value))}
                              className="w-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300 outline-none focus:border-blue-500"
                            />
                          </div>

                          {editingTaskId && (
                            <button
                              type="button"
                              onClick={handleCancelEditTaskLocal}
                              className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            className={`${editingTaskId ? '' : 'ml-auto'} bg-blue-600 hover:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors`}
                          >
                            <Plus className="h-3.5 w-3.5" /> {editingTaskId ? 'Save Changes' : 'Save'}
                          </button>
                        </div>
                      </form>

                      {/* Spreadsheet-like interactive list (Screenshot 2 / 4) */}
                      <div className="overflow-x-auto rounded-xl border border-slate-150 dark:border-slate-900">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-900 text-slate-400 font-bold">
                              <th className="p-2.5 w-24">ID</th>
                              <th className="p-2.5">Task Name</th>
                              <th className="p-2.5 w-36">Assignee</th>
                              <th className="p-2.5 w-24">Priority</th>
                              <th className="p-2.5 w-32">Status</th>
                              <th className="p-2.5 w-28">Start Date</th>
                              <th className="p-2.5 w-28">Due Date</th>
                              <th className="p-2.5 w-24">%</th>
                              <th className="p-2.5 w-28 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 bg-white dark:bg-slate-950">
                            {projectTasks.map((t) => {
                              const isCompleted = t.status === 'Completed';
                              const subtasks = t.subtasks || [];
                              const isExpanded = expandedTaskIds.has(t.id);
                              const completedSubCount = subtasks.filter((s) => s.status === 'Completed').length;
                              const visibleTaskIds = projectTasks.map((pt) => pt.id);
                              const taskAssigneeOptions = users.filter(
                                (u) => u.departmentId === t.departmentId && (u.baseLevel === 'team_member' || u.baseLevel === 'team_leader')
                              );
                              const subtaskOwnerOptions = Array.from(
                                new Map(
                                  [...admins, ...users.filter((u) => u.baseLevel === 'team_leader' && u.departmentId === t.departmentId)]
                                    .map((u) => [u.id, u])
                                ).values()
                              );
                              const subtaskDraft = getSubtaskDraft(t.id);

                              return (
                                <React.Fragment key={t.id}>
                                <tr
                                  draggable
                                  onDragStart={() => setDraggedTaskId(t.id)}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (draggedTaskId && draggedTaskId !== t.id) setDragOverTaskId(t.id);
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleTaskDrop(visibleTaskIds, t.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedTaskId(null);
                                    setDragOverTaskId(null);
                                  }}
                                  className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/20 group transition-colors cursor-grab active:cursor-grabbing ${
                                    dragOverTaskId === t.id ? 'border-t-2 border-blue-500' : ''
                                  }`}
                                >
                                  {/* ID */}
                                  <td className="p-2.5 font-mono text-[11px] text-slate-400 font-semibold">
                                    {t.id}
                                  </td>
                                  {/* Task Name */}
                                  <td className="p-2.5 font-medium">
                                    <div className="flex items-center gap-1.5">
                                      <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                                      <button
                                        id={`dept-task-expand-toggle-${t.id}`}
                                        type="button"
                                        onClick={() => toggleExpanded(t.id)}
                                        className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer shrink-0"
                                      >
                                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                                      </button>
                                      <span
                                        className={`transition-all duration-150 ${
                                          isCompleted
                                            ? 'line-through text-slate-400 dark:text-slate-600'
                                            : 'text-slate-900 dark:text-slate-200 font-semibold'
                                        }`}
                                      >
                                        {t.name}
                                      </span>
                                      {subtasks.length > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
                                          {completedSubCount}/{subtasks.length}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  {/* Assignee */}
                                  <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                    <select
                                      id={`dept-task-assignee-select-${t.id}`}
                                      value={t.assignedTo}
                                      onChange={(e) => handleTaskAssigneeChange(t.id, e.target.value)}
                                      className="rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    >
                                      {taskAssigneeOptions.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* Priority */}
                                  <td className="p-2.5">
                                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                                      t.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                      t.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                      'bg-blue-50 text-blue-600 border-blue-100'
                                    }`}>
                                      {t.priority}
                                    </span>
                                  </td>
                                  {/* Status Dropdown */}
                                  <td className="p-2.5">
                                    <select
                                      id={`dept-task-status-select-${t.id}`}
                                      value={t.status}
                                      onChange={(e) => handleTaskStatusChange(t.id, e.target.value as TaskStatus)}
                                      className="rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 text-[10px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </td>
                                  {/* Start Date */}
                                  <td className="p-2.5 text-[11px] font-mono text-slate-500">
                                    {t.startDate || '—'}{t.startTime ? ` ${t.startTime}` : ''}
                                  </td>
                                  {/* Due Date */}
                                  <td
                                    className="p-2.5 text-[11px] font-mono text-slate-500"
                                    title={t.dueDays !== undefined ? `Duration: ${t.dueDays} days` : undefined}
                                  >
                                    {t.dueDate || '06-16-2026'}{t.dueTime ? ` ${t.dueTime}` : ''}
                                  </td>
                                  {/* Progress */}
                                  <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                                    {canEditProgress ? (
                                      <div className="flex items-center gap-1">
                                        <input
                                          id={`dept-task-progress-input-${t.id}`}
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={t.progress}
                                          onChange={(e) => handleTaskProgressChange(t.id, Number(e.target.value))}
                                          className="w-12 rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1 py-0.5 text-[11px] font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        <span>%</span>
                                      </div>
                                    ) : (
                                      `${t.progress}%`
                                    )}
                                  </td>
                                  {/* Actions */}
                                  <td className="p-2.5" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-end gap-1">
                                      <button
                                        id={`dept-task-view-btn-${t.id}`}
                                        onClick={() => setViewingTaskId(t.id)}
                                        className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                                        title="View task"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        id={`dept-task-edit-btn-${t.id}`}
                                        onClick={() => handleOpenEditTaskLocal(t)}
                                        className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                                        title="Edit task"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        id={`dept-task-delete-btn-${t.id}`}
                                        onClick={() => handleDeleteTaskLocal(t)}
                                        className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                                        title="Delete task"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr id={`dept-task-subtasks-panel-${t.id}`}>
                                    <td colSpan={9} className="bg-slate-50/60 dark:bg-slate-900/20 py-3 px-0">
                                      <div className="pl-10 pr-4 overflow-x-auto">
                                        {subtasks.length === 0 ? (
                                          <p className="text-[10px] text-slate-400 italic mb-2">No subtasks yet. Break this task down below.</p>
                                        ) : (
                                          <table className="w-full text-left border-collapse mb-2">
                                            <thead>
                                              <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-150 dark:border-slate-800">
                                                <th className="py-1.5 pr-2">ID</th>
                                                <th className="py-1.5 pr-2">Task Name</th>
                                                <th className="py-1.5 pr-2">Owner</th>
                                                <th className="py-1.5 pr-2">Assignee</th>
                                                <th className="py-1.5 pr-2">Priority</th>
                                                <th className="py-1.5 pr-2">Status</th>
                                                <th className="py-1.5 pr-2">Start Date</th>
                                                <th className="py-1.5 pr-2">Due Date</th>
                                                <th className="py-1.5 pr-2">%</th>
                                                <th className="py-1.5 pr-2"></th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                                              {subtasks.map((subtask) => (
                                                <tr
                                                  key={subtask.id}
                                                  draggable
                                                  onDragStart={() => setDraggedSubtask({ taskId: t.id, subtaskId: subtask.id })}
                                                  onDragOver={(e) => {
                                                    e.preventDefault();
                                                    if (draggedSubtask && draggedSubtask.taskId === t.id && draggedSubtask.subtaskId !== subtask.id) {
                                                      setDragOverSubtaskId(subtask.id);
                                                    }
                                                  }}
                                                  onDrop={(e) => {
                                                    e.preventDefault();
                                                    handleSubtaskDrop(t.id, subtasks, subtask.id);
                                                  }}
                                                  onDragEnd={() => {
                                                    setDraggedSubtask(null);
                                                    setDragOverSubtaskId(null);
                                                  }}
                                                  className={`bg-white dark:bg-slate-950 cursor-grab active:cursor-grabbing ${
                                                    dragOverSubtaskId === subtask.id ? 'border-t-2 border-blue-500' : ''
                                                  }`}
                                                >
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <div className="flex items-center gap-1">
                                                      <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
                                                      <span className="font-mono text-[9px] text-slate-400 truncate max-w-[70px]">{subtask.id}</span>
                                                    </div>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <span className={`text-xs ${subtask.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                      {subtask.name}
                                                    </span>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <select
                                                      id={`dept-subtask-owner-select-${subtask.id}`}
                                                      value={subtask.ownerId || ''}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { ownerId: e.target.value || undefined })}
                                                      className="rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1.5 py-1 text-[9px] font-medium text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px]"
                                                    >
                                                      <option value="">Unassigned</option>
                                                      {subtaskOwnerOptions.map((u) => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                      ))}
                                                    </select>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <select
                                                      id={`dept-subtask-assignee-select-${subtask.id}`}
                                                      value={subtask.assignedTo || ''}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { assignedTo: e.target.value || undefined })}
                                                      className="rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1.5 py-1 text-[9px] font-medium text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px]"
                                                    >
                                                      <option value="">Unassigned</option>
                                                      {taskAssigneeOptions.map((u) => (
                                                        <option key={u.id} value={u.id}>{u.name}</option>
                                                      ))}
                                                    </select>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <select
                                                      id={`dept-subtask-priority-select-${subtask.id}`}
                                                      value={subtask.priority}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { priority: e.target.value as TaskPriority })}
                                                      className={`rounded px-1.5 py-1 text-[9px] font-bold border cursor-pointer ${
                                                        subtask.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                                        subtask.priority === 'Low' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                      }`}
                                                    >
                                                      {PRIORITY_OPTIONS.map((p) => (
                                                        <option key={p} value={p}>{p}</option>
                                                      ))}
                                                    </select>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <select
                                                      id={`dept-subtask-status-select-${subtask.id}`}
                                                      value={subtask.status}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { status: e.target.value as TaskStatus })}
                                                      className="rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-1.5 py-1 text-[9px] font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                                    >
                                                      {STATUS_OPTIONS.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                      ))}
                                                    </select>
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <input
                                                      id={`dept-subtask-startdate-input-${subtask.id}`}
                                                      type="date"
                                                      value={subtask.startDate || ''}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { startDate: e.target.value || undefined })}
                                                      className="rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[104px]"
                                                    />
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <input
                                                      id={`dept-subtask-duedate-input-${subtask.id}`}
                                                      type="date"
                                                      value={subtask.dueDate || ''}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { dueDate: e.target.value || undefined })}
                                                      className="rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-slate-600 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[104px]"
                                                    />
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <input
                                                      id={`dept-subtask-progress-input-${subtask.id}`}
                                                      type="number"
                                                      min={0}
                                                      max={100}
                                                      value={subtask.progress}
                                                      onChange={(e) => handleUpdateSubtask(t.id, subtask.id, { progress: Math.max(0, Math.min(100, Number(e.target.value))) })}
                                                      className="w-12 rounded border border-slate-200 dark:border-slate-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                    />
                                                  </td>
                                                  <td className="py-1.5 pr-2 align-middle">
                                                    <button
                                                      id={`dept-subtask-delete-${subtask.id}`}
                                                      type="button"
                                                      onClick={() => handleDeleteSubtask(t.id, subtask.id)}
                                                      className="rounded p-1 text-slate-300 hover:text-red-500 cursor-pointer"
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        )}
                                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                                          <input
                                            id={`dept-new-subtask-input-${t.id}`}
                                            type="text"
                                            placeholder="Add a subtask..."
                                            value={subtaskDraft.name}
                                            onChange={(e) => updateSubtaskDraft(t.id, { name: e.target.value })}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSubtask(t.id);
                                              }
                                            }}
                                            className="flex-1 min-w-[140px] rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <select
                                            id={`dept-new-subtask-owner-select-${t.id}`}
                                            value={subtaskDraft.ownerId}
                                            onChange={(e) => updateSubtaskDraft(t.id, { ownerId: e.target.value })}
                                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                          >
                                            <option value="">Owner</option>
                                            {subtaskOwnerOptions.map((u) => (
                                              <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                          </select>
                                          <select
                                            id={`dept-new-subtask-assignee-select-${t.id}`}
                                            value={subtaskDraft.assignedTo}
                                            onChange={(e) => updateSubtaskDraft(t.id, { assignedTo: e.target.value })}
                                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                          >
                                            <option value="">Assignee</option>
                                            {taskAssigneeOptions.map((u) => (
                                              <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                          </select>
                                          <select
                                            id={`dept-new-subtask-priority-select-${t.id}`}
                                            value={subtaskDraft.priority}
                                            onChange={(e) => updateSubtaskDraft(t.id, { priority: e.target.value as TaskPriority })}
                                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-[10px] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                          >
                                            {PRIORITY_OPTIONS.map((p) => (
                                              <option key={p} value={p}>{p}</option>
                                            ))}
                                          </select>
                                          <input
                                            id={`dept-new-subtask-startdate-input-${t.id}`}
                                            type="date"
                                            value={subtaskDraft.startDate}
                                            onChange={(e) => updateSubtaskDraft(t.id, { startDate: e.target.value })}
                                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <input
                                            id={`dept-new-subtask-duedate-input-${t.id}`}
                                            type="date"
                                            value={subtaskDraft.dueDate}
                                            onChange={(e) => updateSubtaskDraft(t.id, { dueDate: e.target.value })}
                                            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          />
                                          <button
                                            id={`dept-add-subtask-btn-${t.id}`}
                                            type="button"
                                            onClick={() => handleAddSubtask(t.id)}
                                            className="flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 text-[10px] font-semibold cursor-pointer"
                                          >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add
                                          </button>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                                </React.Fragment>
                              );
                            })}

                            {projectTasks.length === 0 && (
                              <tr>
                                <td colSpan={9} className="py-8 text-center text-slate-400 font-sans">
                                  No tasks registered for this project yet. Use the prompt above to register one!
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Add / Edit Project Drawer Modal */}
        {isProjectFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-950 p-6 shadow-2xl border-l border-slate-150 dark:border-slate-850 flex flex-col justify-between">
              <div className="space-y-6 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {editingProjectId ? 'Edit Project' : 'Add Project'}
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {editingProjectId ? 'Update this initiative.' : `Register a new project under ${currentDept.name}.`}
                    </p>
                  </div>
                  <button
                    id="close-project-form"
                    onClick={() => setIsProjectFormOpen(false)}
                    className="rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <form id="project-form" onSubmit={handleProjectFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                    <input
                      id="project-name-input"
                      type="text"
                      required
                      placeholder="E.g. Mobile App Revamp..."
                      value={projName}
                      onChange={(e) => setProjName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project Owner</label>
                    <select
                      id="project-owner-select"
                      required
                      value={projOwnerId}
                      disabled={userRole === 'team_leader'}
                      onChange={(e) => setProjOwnerId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Owner</option>
                      {Array.from(
                        new Map(
                          [...admins, ...users.filter((u) => u.baseLevel === 'team_leader' && u.departmentId === activeDeptDetail)]
                            .map((u) => [u.id, u])
                        ).values()
                      ).map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                      ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">Only Admins or this department&apos;s Team Leader can own a project.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Assignee (Optional)</label>
                    <select
                      id="project-assignee-select"
                      value={projAssigneeId}
                      onChange={(e) => setProjAssigneeId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter((u) => u.departmentId === activeDeptDetail && (u.baseLevel === 'team_leader' || u.baseLevel === 'team_member'))
                        .map((u) => (
                          <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                        ))}
                    </select>
                    <p className="text-[9px] text-slate-400 mt-1">A Team Leader or Team Member can be assigned to drive this project.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</label>
                      <input
                        id="project-startdate-input"
                        type="date"
                        required
                        value={projStartDate}
                        onChange={(e) => setProjStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Deadline</label>
                      <input
                        id="project-deadline-input"
                        type="date"
                        required
                        value={projDeadline}
                        onChange={(e) => setProjDeadline(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                    <select
                      id="project-status-select"
                      value={projStatus}
                      onChange={(e) => setProjStatus(e.target.value as Project['status'])}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="In Review">In Review</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                    <textarea
                      id="project-description-input"
                      placeholder="Briefly describe this project's scope..."
                      value={projDescription}
                      onChange={(e) => setProjDescription(e.target.value)}
                      className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                <button
                  id="cancel-project-form-btn"
                  onClick={() => setIsProjectFormOpen(false)}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 px-4 py-2 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  id="submit-project-form-btn"
                  onClick={handleProjectFormSubmit}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
                >
                  {editingProjectId ? 'Save Changes' : 'Add Project'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task View (Read-Only) Drawer */}
        {viewingTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md h-full bg-white dark:bg-slate-950 p-6 shadow-2xl border-l border-slate-150 dark:border-slate-850 flex flex-col justify-between">
              <div className="space-y-5 overflow-y-auto pr-2">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{viewingTask.name}</h3>
                    <p className="text-[10px] text-slate-400">{viewingTask.id}</p>
                  </div>
                  <button
                    id="close-view-task"
                    onClick={() => setViewingTaskId(null)}
                    className="rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Priority</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingTask.priority}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Status</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingTask.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Assignee</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{users.find((u) => u.id === viewingTask.assignedTo)?.name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Progress</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingTask.progress}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Start Date</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingTask.startDate || '—'}{viewingTask.startTime ? ` ${viewingTask.startTime}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Due Date</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{viewingTask.dueDate}{viewingTask.dueTime ? ` ${viewingTask.dueTime}` : ''}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Scope Details</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {viewingTask.description || 'No description provided.'}
                  </p>
                </div>

                {viewingTask.subtasks && viewingTask.subtasks.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Subtasks ({viewingTask.subtasks.filter((s) => s.status === 'Completed').length}/{viewingTask.subtasks.length})
                    </p>
                    <div className="space-y-1.5">
                      {viewingTask.subtasks.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5 text-[11px]">
                          <span className={s.status === 'Completed' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}>{s.name}</span>
                          <span className="text-slate-400 font-mono">{s.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Comments ({viewingTask.comments.length})
                  </p>
                  {viewingTask.comments.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">No comments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {viewingTask.comments.map((c) => (
                        <div key={c.id} className="rounded-lg bg-slate-50 dark:bg-slate-900/60 px-2.5 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">{c.userName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{c.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-900 pt-4">
                <button
                  id="close-view-task-btn"
                  onClick={() => setViewingTaskId(null)}
                  className="rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 px-4 py-2 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  id="view-to-edit-task-btn"
                  onClick={() => {
                    handleOpenEditTaskLocal(viewingTask);
                    setViewingTaskId(null);
                  }}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-md shadow-blue-500/10"
                >
                  Edit Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Task Summary Modal */}
        {isEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-950 p-6 shadow-2xl border border-gray-100 dark:border-gray-900 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Email Task Summary</h3>
                  <p className="text-[10px] text-gray-400">Select a person to preview and email all their tasks and subtasks.</p>
                </div>
                <button
                  id="close-dept-email-summary-modal"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-650"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Person</label>
                  <select
                    id="dept-email-summary-user-select"
                    value={emailUserId}
                    onChange={(e) => setEmailUserId(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a person...</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.roleName})</option>
                    ))}
                  </select>
                </div>

                {emailUserId && (
                  emailPreviewTasks.length === 0 && emailPreviewExtraSubtasks.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">No tasks or subtasks assigned to this person.</p>
                  ) : (
                    <div className="space-y-3">
                      {emailPreviewTasks.map((t) => (
                        <div key={t.id} className="rounded-xl border border-gray-100 dark:border-gray-900 p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{t.name}</p>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">{t.status} • {t.progress}%</span>
                          </div>
                          {(t.subtasks ?? []).length > 0 && (
                            <ul className="mt-1.5 space-y-0.5 pl-3">
                              {(t.subtasks ?? []).map((s) => (
                                <li key={s.id} className="text-[10px] text-gray-500 dark:text-gray-400">
                                  ↳ {s.name} <span className="text-gray-400">— {s.status}, {s.progress}%</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                      {emailPreviewExtraSubtasks.length > 0 && (
                        <div className="rounded-xl border border-gray-100 dark:border-gray-900 p-3">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Additional Subtasks</p>
                          <ul className="space-y-0.5">
                            {emailPreviewExtraSubtasks.map((s) => (
                              <li key={s.id} className="text-[10px] text-gray-500 dark:text-gray-400">
                                {s.name} <span className="text-gray-400">(under &quot;{s.parentTaskName}&quot;) — {s.status}, {s.progress}%</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4 mt-4">
                <button
                  id="cancel-dept-email-summary-btn"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  id="send-dept-email-summary-btn"
                  onClick={handleSendEmail}
                  disabled={!emailUserId || emailSending}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10 disabled:opacity-60"
                >
                  {emailSending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn" id="departments-list-container">
      {/* View Title & Dynamic Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Departments
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor department efficiency metrics, task velocity, and project rosters.
          </p>
        </div>

        {/* Search + department management actions */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Custom Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-100 outline-none w-48 focus:border-blue-500"
            />
          </div>

          {isAdmin && (
            <button
              id="open-add-department-btn"
              onClick={handleOpenAddDepartment}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/10"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table View */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm relative">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-150 dark:border-slate-800/80 text-slate-500 dark:text-slate-400 font-bold">
              <th className="p-3 w-28">ID</th>
              <th className="p-3">Department Name</th>
              <th className="p-3 w-16 text-center">%</th>
              <th className="p-3 w-24">Status</th>
              <th className="p-3 w-56">Tasks</th>
              <th className="p-3 w-28">Projects</th>
              <th className="p-3 w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
            {filteredDepartments.map((dept, idx) => {
              const stats = getDeptStats(dept.id);
              const deptProjects = projects.filter((p) => p.departmentId === dept.id);

              const borderAccents = [
                'border-l-3 border-amber-500',
                'border-l-3 border-indigo-500',
                'border-l-3 border-rose-500',
                'border-l-3 border-emerald-500'
              ];
              const rowAccent = borderAccents[idx % borderAccents.length];

              return (
                <tr
                  key={dept.id}
                  id={`dept-row-${dept.id}`}
                  onClick={() => handleDeptSelect(dept.id)}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
                >
                  {/* ID */}
                  <td className={`p-3 font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 ${rowAccent}`}>
                    {dept.id.replace('dept-', 'DEPT-').toUpperCase()}
                  </td>

                  {/* Name */}
                  <td className="p-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {dept.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[200px] mt-0.5">
                        {dept.description}
                      </p>
                    </div>
                  </td>

                  {/* Efficiency % */}
                  <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                    {stats.progress > 0 ? `${stats.progress}%` : '0%'}
                  </td>

                  {/* Status */}
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      id={`dept-status-select-${dept.id}`}
                      value={dept.status}
                      disabled={!isAdmin}
                      onChange={(e) => onUpdateDepartmentStatus(dept.id, e.target.value as 'Active' | 'Inactive')}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold border-0 shadow-sm outline-none cursor-pointer disabled:cursor-not-allowed ${
                        dept.status === 'Active'
                          ? 'bg-emerald-500 text-white shadow-emerald-500/10'
                          : 'bg-slate-400 text-white shadow-slate-500/10'
                      }`}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Deactive</option>
                    </select>
                  </td>

                  {/* Tasks Visual: Completed [ === progress === ] Total */}
                  <td className="p-3">
                    <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                      <span>{stats.completed}</span>
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-900 rounded-sm overflow-hidden flex items-center p-[1px]">
                        <div
                          className="h-full bg-emerald-400 dark:bg-emerald-500 rounded-xs transition-all duration-500"
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 px-1 py-0.2 rounded font-mono">
                        {stats.progress}%
                      </span>
                      <span>{stats.total}</span>
                    </div>
                  </td>

                  {/* Projects */}
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    {deptProjects.length > 0 ? `${deptProjects.length} Projects` : 'No Projects'}
                  </td>

                  {/* Actions */}
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        id={`dept-view-btn-${dept.id}`}
                        onClick={() => handleDeptSelect(dept.id)}
                        className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        title="View department"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            id={`dept-edit-btn-${dept.id}`}
                            onClick={() => handleOpenEditDepartment(dept)}
                            className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                            title="Edit department"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            id={`dept-delete-btn-${dept.id}`}
                            onClick={() => handleDeleteDepartmentClick(dept)}
                            className="rounded-lg p-1.5 border border-slate-100 dark:border-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete department"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredDepartments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                  No Departments matched your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    
      {/* Add / Edit Department Drawer Modal */}
      {isDeptFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-slate-950 p-6 shadow-2xl border-l border-slate-150 dark:border-slate-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {editingDeptId ? 'Edit Department' : 'Add Department'}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {editingDeptId ? 'Update this Department.' : 'Register a new Department.'}
                  </p>
                </div>
                <button
                  id="close-dept-form"
                  onClick={() => setIsDeptFormOpen(false)}
                  className="rounded-lg p-1.5 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <form id="dept-form" onSubmit={handleDeptFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Name</label>
                  <input
                    id="dept-name-input"
                    type="text"
                    required
                    placeholder="E.g. Customer Success..."
                    value={deptName}
                    onChange={(e) => setDeptName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Department Code</label>
                  <input
                    id="dept-code-input"
                    type="text"
                    required
                    placeholder="E.g. CS..."
                    value={deptCode}
                    onChange={(e) => setDeptCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    id="dept-description-input"
                    placeholder="Briefly describe this department's mandate..."
                    value={deptDescription}
                    onChange={(e) => setDeptDescription(e.target.value)}
                    className="w-full min-h-[80px] rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-900 pt-4">
              <button
                id="cancel-dept-form-btn"
                onClick={() => setIsDeptFormOpen(false)}
                className="rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 text-slate-600 dark:text-slate-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-dept-form-btn"
                onClick={handleDeptFormSubmit}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-blue-500/10"
              >
                {editingDeptId ? 'Save Changes' : 'Add Department'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
