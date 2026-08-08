'use client';

import React, { useState } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Eye,
  Edit2,
  Save
} from 'lucide-react';
import { Task, User, Project, TaskStatus, TaskPriority, TaskCategory, Subtask } from '../lib/types';

const STATUS_OPTIONS: TaskStatus[] = ['Todo', 'In Progress', 'Review', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['High', 'Medium', 'Low'];

interface NewSubtaskDraft {
  name: string;
  ownerId: string;
  assignedTo: string;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
}

const EMPTY_DRAFT: NewSubtaskDraft = { name: '', ownerId: '', assignedTo: '', priority: 'Medium', startDate: '', dueDate: '' };

interface TasksViewProps {
  tasks: Task[];
  users: User[];
  admins: User[];
  projects: Project[];
  userRole: 'Admin' | 'Team Leader' | 'Team Member';
  currentUserId?: string;
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
}

export default function TasksView({
  tasks,
  users,
  admins,
  projects,
  userRole,
  currentUserId,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateTaskStatus,
  onUpdateTaskAssignee,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  onReorderTasks,
  onReorderSubtasks
}: TasksViewProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TaskCategory>('daily');
  const canEditProgress = userRole === 'Admin' || userRole === 'Team Leader';

  // Subtasks: expand/collapse + inline "new subtask" draft per task
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskDrafts, setNewSubtaskDrafts] = useState<Record<string, NewSubtaskDraft>>({});

  const getDraft = (taskId: string): NewSubtaskDraft => newSubtaskDrafts[taskId] || EMPTY_DRAFT;

  const updateDraft = (taskId: string, updates: Partial<NewSubtaskDraft>) => {
    setNewSubtaskDrafts((prev) => ({ ...prev, [taskId]: { ...getDraft(taskId), ...updates } }));
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
    const draft = getDraft(taskId);
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
    setNewSubtaskDrafts((prev) => ({ ...prev, [taskId]: EMPTY_DRAFT }));
  };

  const handleTaskDrop = (targetTaskId: string) => {
    if (!draggedTaskId || draggedTaskId === targetTaskId) {
      setDraggedTaskId(null);
      setDragOverTaskId(null);
      return;
    }
    const ids = filteredByCategoryTasks.map((t) => t.id);
    const fromIndex = ids.indexOf(draggedTaskId);
    const toIndex = ids.indexOf(targetTaskId);
    if (fromIndex === -1 || toIndex === -1) return;
    const reordered = [...ids];
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

  // Form Fields
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [category, setCategory] = useState<TaskCategory>('daily');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [startDate, setStartDate] = useState('2026-07-08');
  const [startTime, setStartTime] = useState('09:00');
  const [dueDate, setDueDate] = useState('2026-07-15');
  const [dueTime, setDueTime] = useState('18:00');
  const [dueDays, setDueDays] = useState(7);

  // View (read-only) drawer
  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const viewingTask = tasks.find((t) => t.id === viewingTaskId) || null;

  const handleOpenAdd = () => {
    setEditingTaskId(null);
    setName('');
    setProjectId('');
    setCategory(activeCategory);
    setDescription('');
    setPriority('Medium');
    setStartDate('2026-07-08');
    setStartTime('09:00');
    setDueDate('2026-07-15');
    setDueTime('18:00');
    setDueDays(7);
    if (userRole === 'Team Member' && currentUserId) {
      setAssignedTo(currentUserId);
    } else {
      setAssignedTo('');
    }
    setIsAddOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setName(task.name);
    setProjectId(task.projectId);
    setCategory(task.category);
    setDescription(task.description);
    setPriority(task.priority);
    setAssignedTo(task.assignedTo);
    setStartDate(task.startDate || '2026-07-08');
    setStartTime(task.startTime || '09:00');
    setDueDate(task.dueDate);
    setDueTime(task.dueTime || '18:00');
    setDueDays(task.dueDays ?? 7);
    setIsAddOpen(true);
  };

  const handleDeleteTaskClick = (task: Task) => {
    if (window.confirm(`Delete task "${task.name}"? This cannot be undone.`)) {
      onDeleteTask(task.id);
    }
  };

  const handleSaveTaskClick = (task: Task) => {
    const assignee = users.find((u) => u.id === task.assignedTo);
    if (assignee) {
      alert(`Email notification sent to ${assignee.name} (${assignee.email}) about task: "${task.name}"`);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId || !assignedTo) return;

    const project = projects.find(p => p.id === projectId);

    if (editingTaskId) {
      onUpdateTask(editingTaskId, {
        name,
        projectId,
        departmentId: project?.departmentId || 'dept-webdev',
        category,
        description,
        priority,
        startDate,
        startTime,
        dueDate,
        dueTime,
        dueDays,
        assignedTo
      });
    } else {
      onAddTask({
        name,
        projectId,
        departmentId: project?.departmentId || 'dept-webdev',
        category,
        description,
        priority,
        status: 'Todo',
        progress: 0,
        startDate,
        startTime,
        dueDate,
        dueTime,
        dueDays,
        assignedTo
      });
    }

    const assignee = users.find((u) => u.id === assignedTo);
    if (assignee) {
      alert(`Email notification sent to ${assignee.name} (${assignee.email}) about task: "${name}"`);
    }

    setName('');
    setProjectId('');
    setDescription('');
    setAssignedTo('');
    setEditingTaskId(null);
    setIsAddOpen(false);
  };

  const handleStatusChange = (task: Task, nextStatus: TaskStatus) => {
    onUpdateTaskStatus(task.id, nextStatus, task.progress);
  };

  const handleProgressChange = (task: Task, nextProgress: number) => {
    const clamped = Math.max(0, Math.min(100, nextProgress));
    onUpdateTaskStatus(task.id, task.status, clamped);
  };

  const filteredByCategoryTasks = tasks.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-6 animate-fadeIn" id="tasks-board-layout">
      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Operations Tasks Hub
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Organize, allocate, and archive daily sprint requirements.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Add Task button (Now open to Team Members and Admin/Leaders) */}
          <button
            id="open-add-task-btn"
            onClick={handleOpenAdd}
            className="flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Category Tabs: Daily Tasks vs. Continuous Tasks */}
      <div className="flex border-b border-gray-200 dark:border-gray-800/80">
        <button
          onClick={() => setActiveCategory('daily')}
          className={`px-5 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'daily'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
          }`}
        >
          <Clock className="h-4 w-4" />
          Daily Tasks
          <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
            {tasks.filter(t => t.category === 'daily').length}
          </span>
        </button>
        <button
          onClick={() => setActiveCategory('continuous')}
          className={`px-5 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeCategory === 'continuous'
              ? 'border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 font-extrabold'
              : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-250'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Continuous Tasks
          <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
            {tasks.filter(t => t.category === 'continuous').length}
          </span>
        </button>
      </div>

      {/* Task Grid Table */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-500">
          <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
            <tr>
              <th className="py-2.5">Task Title</th>
              <th className="py-2.5">Portfolio Project</th>
              <th className="py-2.5">Priority</th>
              <th className="py-2.5">Current Status</th>
              <th className="py-2.5">Sprint Progress</th>
              <th className="py-2.5">Direct Assignee</th>
              <th className="py-2.5">Start Date</th>
              <th className="py-2.5">Due Date</th>
              <th className="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
            {filteredByCategoryTasks.map((task) => {
              const proj = projects.find((p) => p.id === task.projectId);
              const taskAssigneeOptions = users.filter(
                (u) => u.departmentId === task.departmentId && (u.role === 'Team Member' || u.role === 'Team Leader')
              );
              const subtasks = task.subtasks || [];
              const isExpanded = expandedTaskIds.has(task.id);
              const completedCount = subtasks.filter((s) => s.status === 'Completed').length;
              const subtaskOwnerOptions = Array.from(
                new Map(
                  [...admins, ...users.filter((u) => u.role === 'Team Leader' && u.departmentId === task.departmentId)]
                    .map((u) => [u.id, u])
                ).values()
              );
              const draft = getDraft(task.id);
              return (
                <React.Fragment key={task.id}>
                <tr
                  draggable
                  onDragStart={() => setDraggedTaskId(task.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedTaskId && draggedTaskId !== task.id) setDragOverTaskId(task.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    handleTaskDrop(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggedTaskId(null);
                    setDragOverTaskId(null);
                  }}
                  className={`hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors cursor-grab active:cursor-grabbing ${
                    dragOverTaskId === task.id ? 'border-t-2 border-blue-500' : ''
                  }`}
                >
                  <td className="py-3.5 font-bold text-gray-900 dark:text-gray-100">
                    <div className="flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700 shrink-0" />
                      <button
                        id={`task-expand-toggle-${task.id}`}
                        type="button"
                        onClick={() => toggleExpanded(task.id)}
                        className="rounded p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer shrink-0"
                      >
                        {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                      <span>{task.name}</span>
                      {subtasks.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded-full font-mono">
                          {completedCount}/{subtasks.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 text-indigo-600 dark:text-indigo-400 font-medium">{proj?.name}</td>
                  <td className="py-3.5">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                      task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="py-3.5">
                    <select
                      id={`task-status-select-${task.id}`}
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                      className="rounded bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 px-2 py-1 text-[10px] font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5">
                    {canEditProgress ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          id={`task-progress-input-${task.id}`}
                          type="number"
                          min={0}
                          max={100}
                          value={task.progress}
                          onChange={(e) => handleProgressChange(task, Number(e.target.value))}
                          className="w-14 rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[10px] font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="font-mono text-[9px] text-gray-500">%</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${task.progress}%` }}></div>
                        </div>
                        <span className="font-mono text-[9px] text-gray-500">{task.progress}%</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      id={`task-assignee-edit-select-${task.id}`}
                      value={task.assignedTo}
                      onChange={(e) => onUpdateTaskAssignee(task.id, e.target.value)}
                      className="rounded bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 px-2 py-1 text-[10px] font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                    >
                      {taskAssigneeOptions.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3.5 font-mono text-gray-400" title={task.dueDays !== undefined ? `Duration: ${task.dueDays} days` : undefined}>
                    {task.startDate || '—'}{task.startTime ? ` ${task.startTime}` : ''}
                  </td>
                  <td className="py-3.5 font-mono text-gray-400">
                    {task.dueDate}{task.dueTime ? ` ${task.dueTime}` : ''}
                  </td>
                  <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        id={`task-save-btn-${task.id}`}
                        onClick={() => handleSaveTaskClick(task)}
                        className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Save & notify assignee"
                      >
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`task-view-btn-${task.id}`}
                        onClick={() => setViewingTaskId(task.id)}
                        className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
                        title="View task"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`task-edit-btn-${task.id}`}
                        onClick={() => handleOpenEditTask(task)}
                        className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                        title="Edit task"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        id={`task-delete-btn-${task.id}`}
                        onClick={() => handleDeleteTaskClick(task)}
                        className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr id={`task-subtasks-panel-${task.id}`}>
                    <td colSpan={9} className="bg-gray-50/60 dark:bg-gray-900/20 py-3 px-0">
                      <div className="pl-9 pr-4 overflow-x-auto">
                        {subtasks.length === 0 ? (
                          <p className="text-[10px] text-gray-400 italic mb-2">No subtasks yet. Break this task down below.</p>
                        ) : (
                          <table className="w-full text-left border-collapse mb-2">
                            <thead>
                              <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-150 dark:border-gray-800">
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
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                              {subtasks.map((subtask) => (
                                <tr
                                  key={subtask.id}
                                  draggable
                                  onDragStart={() => setDraggedSubtask({ taskId: task.id, subtaskId: subtask.id })}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    if (draggedSubtask && draggedSubtask.taskId === task.id && draggedSubtask.subtaskId !== subtask.id) {
                                      setDragOverSubtaskId(subtask.id);
                                    }
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    handleSubtaskDrop(task.id, subtasks, subtask.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedSubtask(null);
                                    setDragOverSubtaskId(null);
                                  }}
                                  className={`bg-white dark:bg-gray-950 cursor-grab active:cursor-grabbing ${
                                    dragOverSubtaskId === subtask.id ? 'border-t-2 border-blue-500' : ''
                                  }`}
                                >
                                  <td className="py-1.5 pr-2 align-middle">
                                    <div className="flex items-center gap-1">
                                      <GripVertical className="h-3.5 w-3.5 text-gray-300 dark:text-gray-700 shrink-0" />
                                      <span className="font-mono text-[9px] text-gray-400 truncate max-w-[70px]">{subtask.id}</span>
                                    </div>
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <span className={`text-xs ${subtask.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {subtask.name}
                                    </span>
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <select
                                      id={`subtask-owner-select-${subtask.id}`}
                                      value={subtask.ownerId || ''}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { ownerId: e.target.value || undefined })}
                                      className="rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[9px] font-medium text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px]"
                                    >
                                      <option value="">Unassigned</option>
                                      {subtaskOwnerOptions.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <select
                                      id={`subtask-assignee-select-${subtask.id}`}
                                      value={subtask.assignedTo || ''}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { assignedTo: e.target.value || undefined })}
                                      className="rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[9px] font-medium text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px]"
                                    >
                                      <option value="">Unassigned</option>
                                      {taskAssigneeOptions.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <select
                                      id={`subtask-priority-select-${subtask.id}`}
                                      value={subtask.priority}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { priority: e.target.value as TaskPriority })}
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
                                      id={`subtask-status-select-${subtask.id}`}
                                      value={subtask.status}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { status: e.target.value as TaskStatus })}
                                      className="rounded bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 px-1.5 py-1 text-[9px] font-semibold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                    >
                                      {STATUS_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <input
                                      id={`subtask-startdate-input-${subtask.id}`}
                                      type="date"
                                      value={subtask.startDate || ''}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { startDate: e.target.value || undefined })}
                                      className="rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[104px]"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <input
                                      id={`subtask-duedate-input-${subtask.id}`}
                                      type="date"
                                      value={subtask.dueDate || ''}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { dueDate: e.target.value || undefined })}
                                      className="rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-gray-600 dark:text-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-[104px]"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <input
                                      id={`subtask-progress-input-${subtask.id}`}
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={subtask.progress}
                                      onChange={(e) => onUpdateSubtask(task.id, subtask.id, { progress: Math.max(0, Math.min(100, Number(e.target.value))) })}
                                      className="w-12 rounded border border-gray-200 dark:border-gray-800 bg-transparent px-1.5 py-1 text-[9px] font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="py-1.5 pr-2 align-middle">
                                    <button
                                      id={`subtask-delete-${subtask.id}`}
                                      type="button"
                                      onClick={() => onDeleteSubtask(task.id, subtask.id)}
                                      className="rounded p-1 text-gray-300 hover:text-red-500 cursor-pointer"
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
                            id={`new-subtask-input-${task.id}`}
                            type="text"
                            placeholder="Add a subtask..."
                            value={draft.name}
                            onChange={(e) => updateDraft(task.id, { name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubtask(task.id);
                              }
                            }}
                            className="flex-1 min-w-[140px] rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2.5 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <select
                            id={`new-subtask-owner-select-${task.id}`}
                            value={draft.ownerId}
                            onChange={(e) => updateDraft(task.id, { ownerId: e.target.value })}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">Owner</option>
                            {subtaskOwnerOptions.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                          <select
                            id={`new-subtask-assignee-select-${task.id}`}
                            value={draft.assignedTo}
                            onChange={(e) => updateDraft(task.id, { assignedTo: e.target.value })}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            <option value="">Assignee</option>
                            {taskAssigneeOptions.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                          <select
                            id={`new-subtask-priority-select-${task.id}`}
                            value={draft.priority}
                            onChange={(e) => updateDraft(task.id, { priority: e.target.value as TaskPriority })}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1.5 text-[10px] text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            {PRIORITY_OPTIONS.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                          <input
                            id={`new-subtask-startdate-input-${task.id}`}
                            type="date"
                            value={draft.startDate}
                            onChange={(e) => updateDraft(task.id, { startDate: e.target.value })}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1.5 text-[10px] font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            id={`new-subtask-duedate-input-${task.id}`}
                            type="date"
                            value={draft.dueDate}
                            onChange={(e) => updateDraft(task.id, { dueDate: e.target.value })}
                            className="rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent px-2 py-1.5 text-[10px] font-mono text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            id={`add-subtask-btn-${task.id}`}
                            type="button"
                            onClick={() => handleAddSubtask(task.id)}
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
          </tbody>
        </table>
      </div>

      {/* Task Creation Modal Drawer overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-2">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{editingTaskId ? 'Edit Board Task' : 'Create Board Task'}</h3>
                  <p className="text-[10px] text-gray-400">{editingTaskId ? 'Update this task\'s details.' : 'Allocate tasks to departmental staff directories.'}</p>
                </div>
                <button
                  id="close-add-task"
                  onClick={() => { setIsAddOpen(false); setEditingTaskId(null); }}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form elements */}
              <form id="add-task-form" onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Task Title</label>
                  <input
                    id="task-title-input"
                    type="text"
                    required
                    placeholder="E.g. Refactor Checkout payment interface..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Scope Category</label>
                    <select
                      id="task-category-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value as TaskCategory)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="daily">Daily Task</option>
                      <option value="continuous">Continuous Task</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Risk Priority</label>
                    <select
                      id="task-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Target Project</label>
                    <select
                      id="task-project-select"
                      required
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Staff Assignee</label>
                    <select
                      id="task-assignee-select"
                      required
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Staff</option>
                      {users.filter(u => u.role === 'Team Member' || u.role === 'Team Leader').map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                    <input
                      id="task-startdate-input"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Time</label>
                    <input
                      id="task-starttime-input"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                    <input
                      id="task-duedate-input"
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Time</label>
                    <input
                      id="task-duetime-input"
                      type="time"
                      required
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due In (Days)</label>
                  <input
                    id="task-duedays-input"
                    type="number"
                    min={0}
                    required
                    value={dueDays}
                    onChange={(e) => setDueDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 font-semibold">Scope Details</label>
                  <textarea
                    id="task-description-input"
                    placeholder="Provide specific guidelines, assets required, or goals..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full min-h-[80px] rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent p-2.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </form>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="cancel-create-task-btn"
                onClick={() => { setIsAddOpen(false); setEditingTaskId(null); }}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="submit-create-task-btn"
                onClick={handleCreateTask}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-md shadow-blue-500/10"
              >
                {editingTaskId ? 'Save Changes' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task View (Read-Only) Drawer */}
      {viewingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md h-full bg-white dark:bg-gray-950 p-6 shadow-2xl border-l border-gray-150 dark:border-gray-850 flex flex-col justify-between">
            <div className="space-y-5 overflow-y-auto pr-2">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{viewingTask.name}</h3>
                  <p className="text-[10px] text-gray-400">{projects.find((p) => p.id === viewingTask.projectId)?.name}</p>
                </div>
                <button
                  id="close-view-task"
                  onClick={() => setViewingTaskId(null)}
                  className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Priority</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingTask.priority}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Status</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingTask.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Assignee</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{users.find((u) => u.id === viewingTask.assignedTo)?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Progress</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingTask.progress}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Start Date</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingTask.startDate || '—'}{viewingTask.startTime ? ` ${viewingTask.startTime}` : ''}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Due Date</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{viewingTask.dueDate}{viewingTask.dueTime ? ` ${viewingTask.dueTime}` : ''}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scope Details</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {viewingTask.description || 'No description provided.'}
                </p>
              </div>

              {viewingTask.subtasks && viewingTask.subtasks.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Subtasks ({viewingTask.subtasks.filter((s) => s.status === 'Completed').length}/{viewingTask.subtasks.length})
                  </p>
                  <div className="space-y-1.5">
                    {viewingTask.subtasks.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900/60 px-2.5 py-1.5 text-[11px]">
                        <span className={s.status === 'Completed' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}>{s.name}</span>
                        <span className="text-gray-400 font-mono">{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Comments ({viewingTask.comments.length})
                </p>
                {viewingTask.comments.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic">No comments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {viewingTask.comments.map((c) => (
                      <div key={c.id} className="rounded-lg bg-gray-50 dark:bg-gray-900/60 px-2.5 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{c.userName}</span>
                          <span className="text-[9px] text-gray-400 font-mono">{c.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {viewingTask.submissions.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Submissions ({viewingTask.submissions.length})
                  </p>
                  <div className="space-y-2">
                    {viewingTask.submissions.map((s) => (
                      <div key={s.id} className="rounded-lg bg-gray-50 dark:bg-gray-900/60 px-2.5 py-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{s.userName}</span>
                          <span className="text-[9px] text-gray-400 font-mono">{s.status}</span>
                        </div>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">{s.workDone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
              <button
                id="close-view-task-btn"
                onClick={() => setViewingTaskId(null)}
                className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
              >
                Close
              </button>
              <button
                id="view-to-edit-btn"
                onClick={() => {
                  handleOpenEditTask(viewingTask);
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
    </div>
  );
}
