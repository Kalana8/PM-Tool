'use client';

import React, { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import { Task, User, Project, TaskCategory, TaskPriority } from '../lib/types';

interface CalendarViewProps {
  tasks: Task[];
  users: User[];
  projects: Project[];
  userRole: 'Admin' | 'Team Leader' | 'Team Member';
  currentUserId?: string;
  onAddTask: (task: Omit<Task, 'id' | 'comments' | 'submissions'>) => void;
}

type ViewMode = 'month' | 'week';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Week view: 24-hour time grid (Teams/Outlook-style), one row per hour
const ROW_HEIGHT = 48; // px per hour
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;
const parseTimeToMinutes = (time?: string): number | null => {
  if (!time) return null;
  const [h, m] = time.split(':').map(Number);
  if (Number.isNaN(h)) return null;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
};

export default function CalendarView({ tasks, users, projects, userRole, currentUserId, onAddTask }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [modalDateStr, setModalDateStr] = useState<string | null>(null);

  // Quick "Add Task" modal, pre-filled with the date whose corner icon was clicked
  const [addTaskDateStr, setAddTaskDateStr] = useState<string | null>(null);
  const [quickName, setQuickName] = useState('');
  const [quickProjectId, setQuickProjectId] = useState('');
  const [quickCategory, setQuickCategory] = useState<TaskCategory>('daily');
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('Medium');
  const [quickAssignedTo, setQuickAssignedTo] = useState('');
  const [quickStartDate, setQuickStartDate] = useState('');
  const [quickStartTime, setQuickStartTime] = useState('09:00');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickDueTime, setQuickDueTime] = useState('10:00');
  const [quickAllDay, setQuickAllDay] = useState(false);

  const handleOpenQuickAdd = (e: React.MouseEvent, dateStr: string) => {
    e.stopPropagation();
    setAddTaskDateStr(dateStr);
    setQuickName('');
    setQuickProjectId('');
    setQuickCategory('daily');
    setQuickPriority('Medium');
    setQuickAssignedTo(userRole === 'Team Member' && currentUserId ? currentUserId : '');
    setQuickStartDate(dateStr);
    setQuickStartTime('09:00');
    setQuickDueDate(dateStr);
    setQuickDueTime('10:00');
    setQuickAllDay(false);
  };

  const handleCloseQuickAdd = () => setAddTaskDateStr(null);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || !quickProjectId || !quickAssignedTo || !addTaskDateStr) return;

    const project = projects.find((p) => p.id === quickProjectId);
    onAddTask({
      name: quickName,
      projectId: quickProjectId,
      departmentId: project?.departmentId || 'dept-webdev',
      category: quickCategory,
      description: '',
      priority: quickPriority,
      status: 'Todo',
      progress: 0,
      startDate: quickStartDate || addTaskDateStr,
      startTime: quickAllDay ? undefined : quickStartTime,
      dueDate: quickDueDate || addTaskDateStr,
      dueTime: quickAllDay ? undefined : quickDueTime,
      assignedTo: quickAssignedTo
    });

    setAddTaskDateStr(null);
  };

  // Calendar parameters for July 2026
  // July 2026 starts on a Wednesday (offset: 3 days of previous month June: 28, 29, 30)
  const monthName = 'July 2026';
  const totalDays = 31;
  const startOffset = 3; // Sun: 0, Mon: 1, Tue: 2, Wed: 3

  // Create grid cells (42 cells / 6 weeks)
  const cells: Array<{ dayNum: number; isCurrentMonth: boolean; dateStr: string }> = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = 30 - i;
    cells.push({ dayNum: day, isCurrentMonth: false, dateStr: `2026-06-${day}` });
  }

  for (let i = 1; i <= totalDays; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    cells.push({ dayNum: i, isCurrentMonth: true, dateStr: `2026-07-${dayStr}` });
  }

  const totalCells = 42;
  const nextMonthDaysNeeded = totalCells - cells.length;
  for (let i = 1; i <= nextMonthDaysNeeded; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`;
    cells.push({ dayNum: i, isCurrentMonth: false, dateStr: `2026-08-${dayStr}` });
  }

  // Single source of truth for "currently focused" date: an index into `cells`
  const [anchorIdx, setAnchorIdx] = useState<number>(startOffset + 6); // July 7th

  const anchorCell = cells[anchorIdx];
  const weekStartIdx = anchorIdx - (anchorIdx % 7);
  const weekCells = cells.slice(weekStartIdx, weekStartIdx + 7);

  const getTasksForDate = (dateStr: string) => tasks.filter((t) => t.dueDate === dateStr);

  // Week grid: tasks with a due time are placed on the hourly grid; the rest show as "all-day"
  const getTimedTasksForDate = (dateStr: string) =>
    getTasksForDate(dateStr).filter((t) => parseTimeToMinutes(t.dueTime) !== null);

  const getAllDayTasksForDate = (dateStr: string) =>
    getTasksForDate(dateStr).filter((t) => parseTimeToMinutes(t.dueTime) === null);

  const getMembersWithTasks = (dateStr: string) => {
    const dateTasks = getTasksForDate(dateStr);
    const map = new Map<string, Task[]>();
    dateTasks.forEach((t) => {
      const key = t.assignedTo || 'unassigned';
      const arr = map.get(key) || [];
      arr.push(t);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([userId, userTasks]) => ({
      user: users.find((u) => u.id === userId),
      tasks: userTasks
    }));
  };

  const handlePrev = () => {
    if (viewMode === 'week') {
      if (weekStartIdx - 7 < 0) {
        alert('Prototype constraint: Navigation locked to current sprint (July 2026).');
        return;
      }
      setAnchorIdx(anchorIdx - 7);
    } else {
      alert('Prototype constraint: Navigation locked to current sprint (July 2026).');
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      if (weekStartIdx + 7 > totalCells - 7) {
        alert('Prototype constraint: Navigation locked to current sprint (July 2026).');
        return;
      }
      setAnchorIdx(anchorIdx + 7);
    } else {
      alert('Prototype constraint: Navigation locked to current sprint (July 2026).');
    }
  };

  const handleOpenModal = (dateStr: string) => setModalDateStr(dateStr);
  const handleCloseModal = () => setModalDateStr(null);

  const modalMembers = modalDateStr ? getMembersWithTasks(modalDateStr) : [];

  const statusPillClasses = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'In Progress':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'Review':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-150';
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn h-[calc(100vh-120px)]" id="calendar-view-container">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            SBU Sprint Calendar
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Monitor direct project checkpoints, task deadlines, and team daily work.
          </p>
        </div>

        {/* Month/Week toggle */}
        <div className="flex rounded-xl bg-gray-50 dark:bg-gray-900 p-1 border border-gray-100 dark:border-gray-900 text-xs font-bold self-start sm:self-auto">
          <button
            id="cal-view-month"
            onClick={() => setViewMode('month')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              viewMode === 'month'
                ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Month
          </button>
          <button
            id="cal-view-week"
            onClick={() => setViewMode('week')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              viewMode === 'week'
                ? 'bg-white dark:bg-gray-950 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Calendar card, full width & full height */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm flex-1 flex flex-col min-h-0">
        {/* Calendar header bar */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-4 mb-4 shrink-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            {viewMode === 'month'
              ? monthName
              : `Week of ${weekCells[0]?.dateStr} – ${weekCells[6]?.dateStr}`}
          </h3>
          <div className="flex items-center gap-1">
            <button
              id="cal-prev"
              onClick={handlePrev}
              className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              id="cal-next"
              onClick={handleNext}
              className="rounded-lg p-1.5 border border-gray-100 dark:border-gray-900 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {viewMode === 'month' ? (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Weekday labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 shrink-0">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* 42-cell Grid, big and full page */}
            <div className="grid grid-cols-7 grid-rows-6 gap-2 flex-1 min-h-0">
              {cells.map((cell, idx) => {
                const dateTasks = getTasksForDate(cell.dateStr);
                const isSelected = cell.dateStr === anchorCell?.dateStr;

                return (
                  <div
                    key={idx}
                    id={`calendar-cell-${cell.dateStr}`}
                    role={cell.isCurrentMonth ? 'button' : undefined}
                    tabIndex={cell.isCurrentMonth ? 0 : undefined}
                    onClick={() => {
                      if (!cell.isCurrentMonth) return;
                      setAnchorIdx(idx);
                      handleOpenModal(cell.dateStr);
                    }}
                    className={`relative rounded-xl border p-2 flex flex-col justify-between text-left transition-all ${
                      !cell.isCurrentMonth
                        ? 'bg-gray-50/20 dark:bg-gray-900/10 border-gray-100 dark:border-gray-900 opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-500 text-blue-600 cursor-pointer'
                        : 'bg-white dark:bg-gray-950 border-gray-100 dark:border-gray-900 hover:border-blue-200 dark:hover:border-blue-900 cursor-pointer'
                    }`}
                  >
                    {cell.isCurrentMonth && (
                      <button
                        id={`calendar-quick-add-${cell.dateStr}`}
                        type="button"
                        title="Add task on this date"
                        onClick={(e) => handleOpenQuickAdd(e, cell.dateStr)}
                        className="absolute top-1 right-1 rounded-md p-0.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:text-gray-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    )}

                    <span className={`text-xs font-bold ${
                      isSelected ? 'text-blue-600 font-extrabold' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {cell.dayNum}
                    </span>

                    <div className="space-y-1 w-full mt-1.5">
                      {dateTasks.slice(0, 3).map((t) => (
                        <div
                          key={t.id}
                          className={`h-1.5 w-full rounded-sm ${t.priority === 'High' ? 'bg-rose-500' : 'bg-amber-500'} opacity-80`}
                          title={t.name}
                        ></div>
                      ))}
                      {dateTasks.length > 3 && (
                        <div className="text-[8px] text-gray-400 font-mono text-center">
                          +{dateTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week view: MS Teams-style 24-hour time grid, one column per day */
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Day header row: date + all-day (no due time) tasks */}
            <div className="flex border-b border-gray-100 dark:border-gray-900 shrink-0">
              <div className="w-14 shrink-0" />
              {weekCells.map((cell) => {
                const isSelected = cell.dateStr === anchorCell?.dateStr;
                const allDayTasks = cell.isCurrentMonth ? getAllDayTasksForDate(cell.dateStr) : [];

                return (
                  <div
                    key={cell.dateStr}
                    id={`week-day-column-${cell.dateStr}`}
                    role={cell.isCurrentMonth ? 'button' : undefined}
                    title={cell.isCurrentMonth ? `View daily works for ${cell.dateStr}` : undefined}
                    onClick={() => {
                      if (!cell.isCurrentMonth) return;
                      setAnchorIdx(weekStartIdx + weekCells.indexOf(cell));
                      handleOpenModal(cell.dateStr);
                    }}
                    className={`relative flex-1 min-w-0 px-2 py-2 border-l border-gray-100 dark:border-gray-900 transition-colors ${
                      !cell.isCurrentMonth
                        ? 'opacity-40'
                        : isSelected
                        ? 'bg-blue-50/30 dark:bg-blue-950/10 cursor-pointer'
                        : 'cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-900/30'
                    }`}
                  >
                    {cell.isCurrentMonth && (
                      <button
                        id={`week-quick-add-${cell.dateStr}`}
                        type="button"
                        title="Add task on this date"
                        onClick={(e) => handleOpenQuickAdd(e, cell.dateStr)}
                        className="absolute top-1 right-1 rounded-md p-0.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:text-gray-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {WEEKDAY_LABELS[weekCells.indexOf(cell)]}
                    </p>
                    <p className={`text-sm font-extrabold ${isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-gray-100'}`}>
                      {cell.dayNum}
                    </p>

                    {allDayTasks.length > 0 && (
                      <div className="mt-1.5 space-y-1">
                        {allDayTasks.slice(0, 2).map((t) => (
                          <div
                            key={t.id}
                            title={t.name}
                            className={`text-[8px] font-semibold truncate rounded px-1 py-0.5 border ${
                              t.priority === 'High'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-amber-50 text-amber-600 border-amber-100'
                            }`}
                          >
                            {t.name}
                          </div>
                        ))}
                        {allDayTasks.length > 2 && (
                          <div className="text-[8px] text-gray-400 font-mono">+{allDayTasks.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Scrollable 24-hour time grid (00:00 - 23:00), matching Teams-style layout */}
            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin">
              <div className="flex">
                {/* Hour gutter */}
                <div className="w-14 shrink-0">
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      style={{ height: ROW_HEIGHT }}
                      className="text-[9px] text-gray-400 font-mono text-right pr-2 -translate-y-1.5"
                    >
                      {formatHour(h)}
                    </div>
                  ))}
                </div>

                {/* One column per day, tasks positioned by due time */}
                {weekCells.map((cell) => {
                  const timedTasks = cell.isCurrentMonth ? getTimedTasksForDate(cell.dateStr) : [];

                  return (
                    <div
                      key={cell.dateStr}
                      className={`relative flex-1 min-w-0 border-l border-gray-100 dark:border-gray-900 ${
                        !cell.isCurrentMonth ? 'opacity-40' : ''
                      }`}
                      style={{ height: ROW_HEIGHT * 24 }}
                    >
                      {HOURS.map((h) => (
                        <div key={h} style={{ height: ROW_HEIGHT }} className="border-t border-gray-100 dark:border-gray-900/70" />
                      ))}

                      {timedTasks.map((t) => {
                        const minutes = parseTimeToMinutes(t.dueTime) ?? 0;
                        const top = (minutes / 60) * ROW_HEIGHT;
                        const blockHeight = Math.max((40 / 60) * ROW_HEIGHT, 20);
                        const assignee = users.find((u) => u.id === t.assignedTo);

                        return (
                          <div
                            key={t.id}
                            id={`week-task-block-${t.id}`}
                            title={`${t.dueTime} · ${t.name} · ${assignee?.name || 'Unassigned'}`}
                            style={{ top, height: blockHeight, left: 3, right: 3 }}
                            className={`absolute rounded-md px-1.5 py-0.5 text-[9px] font-semibold text-white overflow-hidden shadow-sm cursor-pointer transition-transform hover:scale-[1.02] ${
                              t.priority === 'High' ? 'bg-rose-500' : t.priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnchorIdx(weekStartIdx + weekCells.indexOf(cell));
                              handleOpenModal(cell.dateStr);
                            }}
                          >
                            <span className="block truncate leading-tight">{t.dueTime} {t.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal popup: relevant members' daily works for the clicked date */}
      {modalDateStr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 shadow-2xl p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Members&apos; Daily Works</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">{modalDateStr}</p>
              </div>
              <button
                id="close-daily-works-modal"
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="space-y-3">
              {modalMembers.length === 0 ? (
                <div className="py-10 text-center text-xs text-gray-400">
                  No member tasks scheduled for this date.
                </div>
              ) : (
                modalMembers.map(({ user, tasks: userTasks }) => (
                  <div key={user?.id || 'unassigned'} className="rounded-xl border border-gray-100 dark:border-gray-900 p-3.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      {user ? (
                        <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                      ) : (
                        <span className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center" />
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{user?.name || 'Unassigned'}</p>
                        {user?.title && <p className="text-[9px] text-gray-400">{user.title}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {userTasks.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-2 text-[11px] bg-gray-50 dark:bg-gray-900/40 rounded-lg px-2.5 py-1.5"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300 truncate">{t.name}</span>
                          <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusPillClasses(t.status)}`}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick "Add Task" modal, opened via the small + icon on a date cell */}
      {addTaskDateStr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={handleCloseQuickAdd}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-900 shadow-2xl p-6 mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-900 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Add Task</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {quickStartDate}{!quickAllDay ? ` ${quickStartTime}` : ''} → {quickDueDate}{!quickAllDay ? ` ${quickDueTime}` : ''}
                </p>
              </div>
              <button
                id="close-quick-add-task"
                onClick={handleCloseQuickAdd}
                className="rounded-lg p-1.5 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form id="quick-add-task-form" onSubmit={handleQuickAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Task Title</label>
                <input
                  id="quick-task-title-input"
                  type="text"
                  required
                  placeholder="E.g. Prepare sprint retro notes..."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Target Project</label>
                <select
                  id="quick-task-project-select"
                  required
                  value={quickProjectId}
                  onChange={(e) => setQuickProjectId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Staff Assignee</label>
                <select
                  id="quick-task-assignee-select"
                  required
                  value={quickAssignedTo}
                  onChange={(e) => setQuickAssignedTo(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select Staff</option>
                  {users.filter((u) => u.role === 'Team Member' || u.role === 'Team Leader').map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Teams-style start/due date & time scheduling */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Date</label>
                  <input
                    id="quick-task-startdate-input"
                    type="date"
                    required
                    value={quickStartDate}
                    onChange={(e) => setQuickStartDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Start Time</label>
                  <input
                    id="quick-task-starttime-input"
                    type="time"
                    disabled={quickAllDay}
                    value={quickStartTime}
                    onChange={(e) => setQuickStartTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Date</label>
                  <input
                    id="quick-task-duedate-input"
                    type="date"
                    required
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Due Time</label>
                  <input
                    id="quick-task-duetime-input"
                    type="time"
                    disabled={quickAllDay}
                    value={quickDueTime}
                    onChange={(e) => setQuickDueTime(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  id="quick-task-allday-toggle"
                  type="button"
                  role="switch"
                  aria-checked={quickAllDay}
                  onClick={() => setQuickAllDay((prev) => !prev)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
                    quickAllDay ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      quickAllDay ? 'translate-x-4.5' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">All day</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Category</label>
                  <select
                    id="quick-task-category-select"
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value as TaskCategory)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="daily">Daily Task</option>
                    <option value="continuous">Continuous Task</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</label>
                  <select
                    id="quick-task-priority-select"
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-900 pt-4">
                <button
                  id="cancel-quick-add-task-btn"
                  type="button"
                  onClick={handleCloseQuickAdd}
                  className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-4 py-2 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  id="submit-quick-add-task-btn"
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-md shadow-blue-500/10"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
