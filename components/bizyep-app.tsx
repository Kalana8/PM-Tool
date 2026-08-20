'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchAllData, AppData } from '@/lib/supabase/mappers';
import {
  dbInsertDepartment,
  dbUpdateDepartment,
  dbDeleteDepartment,
  dbInsertUser,
  dbUpdateUser,
  dbDeclineUser,
  dbDeleteUser,
  dbInsertProject,
  dbUpdateProject,
  dbDeleteProject,
  dbInsertTask,
  dbUpdateTask,
  dbDeleteTask,
  dbReorderTasks,
  dbInsertSubtask,
  dbUpdateSubtask,
  dbDeleteSubtask,
  dbReorderSubtasks,
  dbInsertTaskComment,
  dbInsertTaskSubmission,
  dbUpdateTaskSubmission,
  dbInsertMediaFile,
  dbInsertAttendance,
  dbUpdateAttendance,
  dbInsertNotification,
  dbMarkAllNotificationsRead,
  dbInsertWorklog,
  dbInsertRole,
  dbUpdateRole,
  dbDeleteRole,
  dbGetUserCredentials,
  dbUpdateBusinessName
} from '@/lib/supabase/mutations';
import {
  User,
  Role,
  Department,
  Project,
  Task,
  Attendance,
  DailyWorkLog,
  MediaFile,
  Notification,
  TaskStatus,
  TaskComment,
  Subtask
} from '@/lib/types';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandPalette from './CommandPalette';
import AdminDashboard from './AdminDashboard';
import TeamLeaderDashboard from './TeamLeaderDashboard';
import TeamMemberDashboard from './TeamMemberDashboard';
import DepartmentsView from './DepartmentsView';
import ProjectsView from './ProjectsView';
import TasksView from './TasksView';
import CalendarView from './CalendarView';
import ReportsView from './ReportsView';
import UsersView from './UsersView';
import RolesView from './RolesView';
import FilesView from './FilesView';
import { Loader2, Copy, Check } from 'lucide-react';
import { todayISODate } from '@/lib/date';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

function FullScreenMessage({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
      <div className="text-center space-y-3">
        {icon}
        <p className="text-xs font-semibold tracking-wide">{title}</p>
      </div>
    </div>
  );
}

/**
 * The ported BizYep app, minus everything that used to be its own
 * session/login/pending-approval machinery — the host's server component
 * (app/page.tsx) resolves the signed-in user's pm.users profile via
 * getCurrentProfile() and only mounts this once profile.role_id is non-null.
 */
export function BizYepApp({
  initialProfile,
  businessId,
  businessSlug,
  businessName
}: {
  initialProfile: User;
  businessId: string;
  businessSlug: string | null;
  businessName: string | null;
}) {
  const [currentUser] = useState<User>(initialProfile);
  const [data, setData] = useState<AppData | null>(null);
  const [loginLinkCopied, setLoginLinkCopied] = useState(false);
  const [isEditingBusinessName, setIsEditingBusinessName] = useState(false);
  const [businessNameDraft, setBusinessNameDraft] = useState('');
  const [savingBusinessName, setSavingBusinessName] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Layout states
  const [currentView, setCurrentView] = useState<string>('Dashboard');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const appData = await fetchAllData();
        if (!cancelled) setData(appData);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load workspace data.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyboard listener for Ctrl + K command palette + initial theme detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateData = (newData: AppData) => {
    setData(newData);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = 'https://www.bizyep.com.au/login';
  };

  if (loadError) {
    return <FullScreenMessage icon={<Loader2 className="h-8 w-8 text-red-500 mx-auto" />} title={loadError} />;
  }

  if (!data) {
    return (
      <FullScreenMessage
        icon={<Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />}
        title="Bootstrapping Enterprise Workspace..."
      />
    );
  }

  const userRole = currentUser.baseLevel;

  // Actions
  const handleCheckIn = async () => {
    const today = todayISODate();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const existing = data.attendance.find((a) => a.userId === currentUser.id && a.date === today);
    if (existing) {
      alert('You are already checked in for today.');
      return;
    }

    const newRow: Attendance = {
      id: `att-new-${Date.now()}`,
      userId: currentUser.id,
      date: today,
      checkInTime: timeStr,
      status: now.getHours() >= 9 && now.getMinutes() > 30 ? 'Late' : 'Present'
    };

    const newNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: 'all',
      title: 'Employee Check-In stamp',
      message: `${currentUser.name} Checked in today at ${timeStr}.`,
      type: 'attendance',
      time: 'Just now',
      read: false
    };

    try {
      await dbInsertAttendance(newRow, businessId);
      await dbInsertNotification(newNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check in.');
      return;
    }

    updateData({
      ...data,
      attendance: [...data.attendance, newRow],
      notifications: [newNotif, ...data.notifications]
    });
  };

  const handleCheckOut = async () => {
    const today = todayISODate();
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const target = data.attendance.find((a) => a.userId === currentUser.id && a.date === today && !a.checkOutTime);
    if (!target) return;

    const [inH, inM, inS] = target.checkInTime.split(':').map(Number);
    const [outH, outM, outS] = timeStr.split(':').map(Number);
    const diffHrs = outH - inH + (outM - inM) / 60 + (outS - inS) / 3600;
    const workingHours = Math.max(diffHrs, 0.1);

    const newNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: 'all',
      title: 'Employee Check-Out stamp',
      message: `${currentUser.name} Checked out today at ${timeStr}.`,
      type: 'attendance',
      time: 'Just now',
      read: false
    };

    try {
      await dbUpdateAttendance(target.id, { checkOutTime: timeStr, workingHours });
      await dbInsertNotification(newNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to check out.');
      return;
    }

    const updated = data.attendance.map((a) =>
      a.id === target.id ? { ...a, checkOutTime: timeStr, workingHours } : a
    );

    updateData({
      ...data,
      attendance: updated,
      notifications: [newNotif, ...data.notifications]
    });
  };

  const handleSubmitDailyLog = async (log: Omit<DailyWorkLog, 'id' | 'userId' | 'userName' | 'date'>) => {
    const newLog: DailyWorkLog = {
      ...log,
      id: `log-new-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: todayISODate()
    };

    try {
      await dbInsertWorklog(newLog, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit daily log.');
      return;
    }

    updateData({
      ...data,
      worklogs: [...data.worklogs, newLog]
    });
  };

  const handleSubmitTaskWork = async (taskId: string, workDone: string, notes: string, attachments: MediaFile[]) => {
    const task = data.tasks.find((t) => t.id === taskId);
    const attachmentsWithProject = attachments.map((f) => ({ ...f, projectId: task?.projectId }));

    const submission = {
      id: `sub-new-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      workDone,
      notes,
      status: 'Pending' as const,
      attachments: attachmentsWithProject
    };

    const leaderNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: 'user-leader-web',
      title: 'Work Deliverable Pushed',
      message: `${currentUser.name} pushed deliverable code for review on: "${task?.name}"`,
      type: 'task_completed',
      time: 'Just now',
      read: false
    };

    try {
      for (const file of attachmentsWithProject) {
        await dbInsertMediaFile(file, businessId);
      }
      await dbInsertTaskSubmission(taskId, submission, businessId);
      await dbUpdateTask(taskId, { status: 'Review' });
      await dbInsertNotification(leaderNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit task work.');
      return;
    }

    const updatedTasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, status: 'Review' as TaskStatus, submissions: [...t.submissions, submission] } : t
    );

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [leaderNotif, ...data.notifications],
      media: [...data.media, ...attachmentsWithProject]
    });
  };

  const handleApproveSubmission = async (taskId: string, submissionId: string, feedback: string) => {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const userNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: task.assignedTo,
      title: 'Task Completion Approved!',
      message: `Your supervisor approved completion of task: "${task.name}"`,
      type: 'task_approved',
      time: 'Just now',
      read: false
    };

    try {
      await dbUpdateTaskSubmission(submissionId, { status: 'Approved', feedback });
      await dbUpdateTask(taskId, { status: 'Completed', progress: 100 });
      await dbInsertNotification(userNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to approve submission.');
      return;
    }

    const updatedTasks = data.tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: 'Completed' as TaskStatus,
        progress: 100,
        submissions: t.submissions.map((sub) => (sub.id === submissionId ? { ...sub, status: 'Approved' as const, feedback } : sub))
      };
    });

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleRejectSubmission = async (taskId: string, submissionId: string, feedback: string) => {
    const task = data.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newComment: TaskComment = {
      id: `c-new-${Date.now()}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: `Revision Requested: ${feedback}`,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    const userNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: task.assignedTo,
      title: 'Revision Iteration Requested',
      message: `Your supervisor requested details on: "${task.name}"`,
      type: 'task_rejected',
      time: 'Just now',
      read: false
    };

    try {
      await dbUpdateTaskSubmission(submissionId, { status: 'Changes Requested', feedback });
      await dbUpdateTask(taskId, { status: 'In Progress', progress: 50 });
      await dbInsertTaskComment(taskId, newComment, businessId);
      await dbInsertNotification(userNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to request revision.');
      return;
    }

    const updatedTasks = data.tasks.map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status: 'In Progress' as TaskStatus,
        progress: 50,
        submissions: t.submissions.map((sub) =>
          sub.id === submissionId ? { ...sub, status: 'Changes Requested' as const, feedback } : sub
        ),
        comments: [...t.comments, newComment]
      };
    });

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleAddComment = async (projectId: string, text: string) => {
    const newComment: TaskComment = {
      id: `comment-new-${Date.now()}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      timestamp: 'Just now'
    };

    const targetTask = data.tasks.find((t) => t.projectId === projectId);
    if (!targetTask) return;

    try {
      await dbInsertTaskComment(targetTask.id, newComment, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment.');
      return;
    }

    const updatedTasks = data.tasks.map((t) =>
      t.projectId === projectId ? { ...t, comments: [newComment, ...t.comments] } : t
    );

    updateData({
      ...data,
      tasks: updatedTasks
    });
  };

  // Builds and inserts an in-app notification for a task/subtask change,
  // skipping unassigned placeholders and self-notifications (no point
  // telling someone about a change they made themselves).
  const notifyAssignee = async (
    recipientId: string | undefined | null,
    type: 'task_assigned' | 'task_updated',
    title: string,
    message: string
  ): Promise<Notification | null> => {
    if (!recipientId || recipientId === 'unassigned' || recipientId === currentUser.id) return null;
    const notif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: recipientId,
      title,
      message,
      type,
      time: 'Just now',
      read: false
    };
    await dbInsertNotification(notif, businessId);
    return notif;
  };

  const handleAddTask = async (task: Omit<Task, 'id' | 'comments' | 'submissions'>) => {
    const newTask: Task = {
      ...task,
      id: `task-new-${Date.now()}`,
      comments: [],
      submissions: []
    };

    const userNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: task.assignedTo,
      title: 'New Sprint Task Assigned',
      message: `${currentUser.name} allocated: "${task.name}" to your board.`,
      type: 'task_assigned',
      time: 'Just now',
      read: false
    };

    try {
      await dbInsertTask(newTask, data.tasks.length, businessId);
      await dbInsertNotification(userNotif, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add task.');
      return;
    }

    updateData({
      ...data,
      tasks: [...data.tasks, newTask],
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Omit<Task, 'id' | 'comments' | 'submissions'>>) => {
    const prevTask = data.tasks.find((t) => t.id === taskId);
    const reassigned = updates.assignedTo !== undefined && updates.assignedTo !== prevTask?.assignedTo;
    const otherFieldsChanged = Object.entries(updates).some(
      ([key, value]) => key !== 'assignedTo' && value !== (prevTask as Record<string, unknown> | undefined)?.[key]
    );

    let notif: Notification | null = null;
    try {
      await dbUpdateTask(taskId, updates);
      if (reassigned) {
        notif = await notifyAssignee(
          updates.assignedTo,
          'task_assigned',
          'Task Reassigned to You',
          `${currentUser.name} reassigned "${prevTask?.name ?? updates.name ?? 'a task'}" to you.`
        );
      } else if (otherFieldsChanged) {
        notif = await notifyAssignee(
          prevTask?.assignedTo,
          'task_updated',
          'Task Updated',
          `${currentUser.name} updated task "${prevTask?.name ?? updates.name ?? ''}".`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t)),
      notifications: notif ? [notif, ...data.notifications] : data.notifications
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await dbDeleteTask(taskId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete task.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.filter((t) => t.id !== taskId)
    });
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus, progress: number) => {
    const prevTask = data.tasks.find((t) => t.id === taskId);
    let notif: Notification | null = null;
    try {
      await dbUpdateTask(taskId, { status, progress });
      if (prevTask && prevTask.status !== status) {
        notif = await notifyAssignee(
          prevTask.assignedTo,
          'task_updated',
          'Task Status Updated',
          `${currentUser.name} changed "${prevTask.name}" status to ${status}.`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update task status.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, status, progress } : t)),
      notifications: notif ? [notif, ...data.notifications] : data.notifications
    });
  };

  const handleUpdateTaskAssignee = async (taskId: string, assignedTo: string) => {
    const prevTask = data.tasks.find((t) => t.id === taskId);
    let notif: Notification | null = null;
    try {
      await dbUpdateTask(taskId, { assignedTo });
      if (prevTask && prevTask.assignedTo !== assignedTo) {
        notif = await notifyAssignee(
          assignedTo,
          'task_assigned',
          'Task Reassigned to You',
          `${currentUser.name} reassigned "${prevTask.name}" to you.`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reassign task.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, assignedTo } : t)),
      notifications: notif ? [notif, ...data.notifications] : data.notifications
    });
  };

  const handleAddSubtask = async (taskId: string, subtask: Omit<Subtask, 'id' | 'status' | 'progress'>) => {
    const task = data.tasks.find((t) => t.id === taskId);
    const newSubtask: Subtask = { id: `subtask-${Date.now()}`, status: 'Todo', progress: 0, ...subtask };

    let notif: Notification | null = null;
    try {
      await dbInsertSubtask(taskId, newSubtask, task?.subtasks?.length ?? 0, businessId);
      notif = await notifyAssignee(
        newSubtask.assignedTo,
        'task_assigned',
        'New Subtask Assigned',
        `${currentUser.name} assigned you a subtask: "${newSubtask.name}" (under "${task?.name ?? 'a task'}").`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add subtask.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) => (t.id === taskId ? { ...t, subtasks: [...(t.subtasks || []), newSubtask] } : t)),
      notifications: notif ? [notif, ...data.notifications] : data.notifications
    });
  };

  const handleUpdateSubtask = async (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => {
    const parentTask = data.tasks.find((t) => t.id === taskId);
    const prevSubtask = parentTask?.subtasks?.find((s) => s.id === subtaskId);
    const reassigned = updates.assignedTo !== undefined && updates.assignedTo !== prevSubtask?.assignedTo;
    const otherFieldsChanged = Object.entries(updates).some(
      ([key, value]) => key !== 'assignedTo' && value !== (prevSubtask as Record<string, unknown> | undefined)?.[key]
    );

    let notif: Notification | null = null;
    try {
      await dbUpdateSubtask(subtaskId, updates);
      if (reassigned) {
        notif = await notifyAssignee(
          updates.assignedTo,
          'task_assigned',
          'Subtask Reassigned to You',
          `${currentUser.name} reassigned subtask "${prevSubtask?.name ?? updates.name ?? 'a subtask'}" to you (under "${parentTask?.name ?? 'a task'}").`
        );
      } else if (otherFieldsChanged) {
        notif = await notifyAssignee(
          prevSubtask?.assignedTo,
          'task_updated',
          'Subtask Updated',
          `${currentUser.name} updated subtask "${prevSubtask?.name ?? updates.name ?? ''}" (under "${parentTask?.name ?? 'a task'}").`
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update subtask.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: (t.subtasks || []).map((s) => (s.id === subtaskId ? { ...s, ...updates } : s)) }
          : t
      ),
      notifications: notif ? [notif, ...data.notifications] : data.notifications
    });
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await dbDeleteSubtask(subtaskId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete subtask.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === taskId ? { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) } : t
      )
    });
  };

  // Reorders only the tasks named in orderedIds, keeping their relative
  // slot positions among the full task list (other tasks stay put).
  const handleReorderTasks = async (orderedIds: string[]) => {
    const orderedIdSet = new Set(orderedIds);
    const slotIndices = data.tasks
      .map((t, index) => (orderedIdSet.has(t.id) ? index : -1))
      .filter((index) => index !== -1);

    const updatedTasks = [...data.tasks];
    slotIndices.forEach((slotIndex, i) => {
      const task = data.tasks.find((t) => t.id === orderedIds[i]);
      if (task) updatedTasks[slotIndex] = task;
    });

    try {
      await dbReorderTasks(updatedTasks.map((t) => t.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reorder tasks.');
      return;
    }

    updateData({ ...data, tasks: updatedTasks });
  };

  const handleReorderSubtasks = async (taskId: string, orderedSubtaskIds: string[]) => {
    try {
      await dbReorderSubtasks(orderedSubtaskIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reorder subtasks.');
      return;
    }

    updateData({
      ...data,
      tasks: data.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtaskById = new Map((t.subtasks || []).map((s) => [s.id, s]));
        return { ...t, subtasks: orderedSubtaskIds.map((id) => subtaskById.get(id)!).filter(Boolean) };
      })
    });
  };

  const handleAddUser = async (user: Omit<User, 'id' | 'performanceScore' | 'roleName' | 'baseLevel' | 'permissions'>) => {
    const role = data.roles.find((r) => r.id === user.roleId);
    const newUser: User = {
      ...user,
      id: `user-new-${Date.now()}`,
      performanceScore: 85,
      roleName: role?.name ?? '',
      baseLevel: role?.baseLevel ?? 'team_member',
      permissions: role?.permissions ?? { pages: [], actions: [] }
    };

    try {
      await dbInsertUser(newUser, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add employee.');
      return;
    }

    updateData({
      ...data,
      users: [...data.users, newUser]
    });
  };

  // Creates a real Supabase Auth login (server-side, via the service-role
  // key) plus the business_members/pm.users/pm.user_credentials rows that
  // link it into this business — see app/api/admin/create-employee/route.ts.
  const handleAddUserWithPassword = async (
    user: Omit<User, 'id' | 'performanceScore' | 'roleName' | 'baseLevel' | 'permissions'>,
    password: string
  ) => {
    let created: { id: string; authId: string };
    try {
      const res = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          password,
          departmentId: user.departmentId,
          title: user.title,
          phone: user.phone,
          roleId: user.roleId,
          teamLeaderId: user.teamLeaderId
        })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to create employee login.');
      created = body;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create employee login.');
      return;
    }

    const role = data.roles.find((r) => r.id === user.roleId);
    const newUser: User = {
      ...user,
      id: created.id,
      performanceScore: 85,
      roleName: role?.name ?? '',
      baseLevel: role?.baseLevel ?? 'team_member',
      permissions: role?.permissions ?? { pages: [], actions: [] }
    };

    updateData({
      ...data,
      users: [...data.users, newUser],
      credentialUserIds: [...data.credentialUserIds, created.id]
    });
  };

  const handleViewCredentials = async (userId: string): Promise<{ email: string; password: string } | null> => {
    const target = data.users.find((u) => u.id === userId);
    if (!target) return null;
    try {
      const password = await dbGetUserCredentials(userId);
      return { email: target.email, password };
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to load credentials.');
      return null;
    }
  };

  // Sets a new temp password for an existing employee via
  // app/api/admin/reset-employee-password — marks their account as needing
  // a forced password change on next login (see ChangePasswordGate) and
  // adds them back to credentialUserIds so the key icon reappears.
  const handleResetPassword = async (userId: string, newPassword: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/reset-employee-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to reset password.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password.');
      return false;
    }

    updateData({
      ...data,
      credentialUserIds: data.credentialUserIds.includes(userId)
        ? data.credentialUserIds
        : [...data.credentialUserIds, userId]
    });
    alert('Password reset. The employee must set a new password on their next login.');
    return true;
  };

  // Business name/slug live in public.businesses, outside pm's own tables —
  // RLS only lets an actual business_members owner/admin write it (separate
  // from this tool's own pm.roles), so this can fail with an authorization
  // error even for a pm-tool Admin who isn't also a business owner/admin.
  // The slug is regenerated from the name on every save, so the login link
  // always matches the current name — a previously shared link stops
  // working once the name changes again.
  const handleSaveBusinessName = async (name: string) => {
    try {
      await dbUpdateBusinessName(businessId, name);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update business name.');
      return false;
    }
    window.location.reload();
    return true;
  };

  // Emails an employee every task and subtask assigned to them, regenerated
  // server-side from fresh data (see app/api/admin/send-task-summary-email)
  // rather than trusting whatever the client last had loaded.
  const handleSendTaskSummaryEmail = async (userId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin/send-task-summary-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Failed to send email.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send email.');
      return false;
    }
    alert('Task summary email sent.');
    return true;
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await dbDeleteUser(userId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete this account.');
      return;
    }

    updateData({
      ...data,
      users: data.users.filter((u) => u.id !== userId)
    });
  };

  const handleToggleUserStatus = async (userId: string) => {
    const target = data.users.find((u) => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? ('Inactive' as const) : ('Active' as const);

    try {
      await dbUpdateUser(userId, { status: nextStatus });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update employee status.');
      return;
    }

    updateData({
      ...data,
      users: data.users.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    });
  };

  const handleCategorizeUser = async (
    pendingUserId: string,
    updates: { roleId: string; departmentId: string; title: string; teamLeaderId?: string }
  ) => {
    try {
      await dbUpdateUser(pendingUserId, {
        roleId: updates.roleId,
        departmentId: updates.departmentId,
        title: updates.title,
        teamLeaderId: updates.teamLeaderId,
        status: 'Active'
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to categorize this account.');
      return;
    }

    const pending = data.pendingUsers.find((p) => p.id === pendingUserId);
    if (!pending) return;
    const role = data.roles.find((r) => r.id === updates.roleId);

    const newUser: User = {
      id: pending.id,
      name: pending.name,
      email: pending.email,
      roleId: updates.roleId,
      roleName: role?.name ?? '',
      baseLevel: role?.baseLevel ?? 'team_member',
      permissions: role?.permissions ?? { pages: [], actions: [] },
      departmentId: updates.departmentId,
      status: 'Active',
      avatar: pending.avatar,
      title: updates.title,
      performanceScore: 0,
      teamLeaderId: updates.teamLeaderId
    };

    updateData({
      ...data,
      users: [...data.users, newUser],
      pendingUsers: data.pendingUsers.filter((p) => p.id !== pendingUserId)
    });
  };

  const handleDeclineUser = async (pendingUserId: string) => {
    try {
      await dbDeclineUser(pendingUserId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to decline this account.');
      return;
    }

    updateData({
      ...data,
      pendingUsers: data.pendingUsers.filter((p) => p.id !== pendingUserId)
    });
  };

  const handleEditUser = async (
    userId: string,
    updates: { name: string; title: string; roleId: string; departmentId: string; teamLeaderId?: string }
  ) => {
    const role = data.roles.find((r) => r.id === updates.roleId);
    try {
      await dbUpdateUser(userId, {
        name: updates.name,
        title: updates.title,
        roleId: updates.roleId,
        departmentId: updates.departmentId,
        teamLeaderId: role?.baseLevel === 'team_member' ? updates.teamLeaderId : ''
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update this account.');
      return;
    }

    updateData({
      ...data,
      users: data.users.map((u) =>
        u.id === userId
          ? {
              ...u,
              name: updates.name,
              title: updates.title,
              roleId: updates.roleId,
              roleName: role?.name ?? u.roleName,
              baseLevel: role?.baseLevel ?? u.baseLevel,
              permissions: role?.permissions ?? u.permissions,
              departmentId: updates.departmentId,
              teamLeaderId: role?.baseLevel === 'team_member' ? updates.teamLeaderId : undefined
            }
          : u
      )
    });
  };

  // Uses the standard Supabase Auth SDK call directly (same category as the
  // guide's own getUser() snippet) rather than a custom reset-password page —
  // flagged in the port notes as worth confirming with the lead, since the
  // guide's Rule 1 lists "no password reset" among things not to build.
  const handleSendPasswordReset = async (email: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin
      });
      if (error) throw error;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send password reset email.');
      return;
    }
    alert(`Password reset email sent to: ${email}`);
  };

  // Role management is Admin-only (base_level, not a delegable permission —
  // see supabase/migrations/0004_pm_roles_and_permissions.sql), enforced by
  // both these handlers only being reachable from the Roles page (which
  // Sidebar/render-guard hide from non-admins) and by RLS server-side.
  const handleAddRole = async (role: Omit<Role, 'id' | 'isSystem'>) => {
    const newRole: Role = { ...role, id: `role-${Date.now()}`, isSystem: false };

    try {
      await dbInsertRole(newRole, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add role.');
      return;
    }

    updateData({ ...data, roles: [...data.roles, newRole] });
  };

  const handleUpdateRole = async (roleId: string, updates: { name: string; permissions: Role['permissions'] }) => {
    try {
      await dbUpdateRole(roleId, updates);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update role.');
      return;
    }

    updateData({
      ...data,
      roles: data.roles.map((r) => (r.id === roleId ? { ...r, ...updates } : r)),
      users: data.users.map((u) => (u.roleId === roleId ? { ...u, roleName: updates.name, permissions: updates.permissions } : u))
    });
  };

  const handleDeleteRole = async (roleId: string) => {
    if (data.users.some((u) => u.roleId === roleId)) {
      alert('Cannot delete a role that is still assigned to one or more users.');
      return;
    }

    try {
      await dbDeleteRole(roleId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete role.');
      return;
    }

    updateData({ ...data, roles: data.roles.filter((r) => r.id !== roleId) });
  };

  const handleAddDepartment = async (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-new-${Date.now()}`
    };

    try {
      await dbInsertDepartment(newDept, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add department.');
      return;
    }

    updateData({
      ...data,
      departments: [...data.departments, newDept]
    });
  };

  const handleUpdateDepartment = async (deptId: string, updates: Omit<Department, 'id'>) => {
    try {
      await dbUpdateDepartment(deptId, updates);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update department.');
      return;
    }

    updateData({
      ...data,
      departments: data.departments.map((d) => (d.id === deptId ? { ...d, ...updates } : d))
    });
  };

  const handleUpdateDepartmentStatus = async (deptId: string, status: 'Active' | 'Inactive') => {
    try {
      await dbUpdateDepartment(deptId, { status });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update department status.');
      return;
    }

    updateData({
      ...data,
      departments: data.departments.map((d) => (d.id === deptId ? { ...d, status } : d))
    });
  };

  const handleDeleteDepartment = async (deptId: string) => {
    try {
      await dbDeleteDepartment(deptId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete department.');
      return;
    }

    updateData({
      ...data,
      departments: data.departments.filter((d) => d.id !== deptId)
    });
  };

  const handleAddProject = async (
    project: Omit<Project, 'id' | 'progress' | 'members' | 'documents' | 'images' | 'videos' | 'notes'>
  ) => {
    const newProject: Project = {
      ...project,
      id: `proj-new-${Date.now()}`,
      progress: 0,
      members: [],
      documents: [],
      images: [],
      videos: [],
      notes: []
    };

    try {
      await dbInsertProject(newProject, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add project.');
      return;
    }

    updateData({
      ...data,
      projects: [...data.projects, newProject]
    });
  };

  const handleUpdateProject = async (projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
    try {
      await dbUpdateProject(projectId, updates, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update project.');
      return;
    }

    updateData({
      ...data,
      projects: data.projects.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
    });
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await dbDeleteProject(projectId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project.');
      return;
    }

    updateData({
      ...data,
      projects: data.projects.filter((p) => p.id !== projectId)
    });
  };

  const handleUpdateProjectStatus = (projectId: string, status: Project['status']) => {
    handleUpdateProject(projectId, { status });
  };

  const handleUpdateProjectAssignee = (projectId: string, assigneeId: string | undefined) => {
    handleUpdateProject(projectId, { assigneeId });
  };

  const handleAddMedia = async (file: Omit<MediaFile, 'id' | 'dateAdded'>) => {
    const newFile: MediaFile = {
      ...file,
      id: `media-new-${Date.now()}`,
      dateAdded: todayISODate()
    };

    try {
      await dbInsertMediaFile(newFile, businessId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to upload media.');
      return;
    }

    updateData({
      ...data,
      media: [...data.media, newFile]
    });
  };

  const handleMarkNotificationsRead = async () => {
    const unreadIds = data.notifications.filter((n) => !n.read).map((n) => n.id);

    try {
      await dbMarkAllNotificationsRead(unreadIds);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to mark notifications as read.');
      return;
    }

    updateData({
      ...data,
      notifications: data.notifications.map((n) => ({ ...n, read: true }))
    });
  };

  const handleToggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleSearchNavigate = (view: string, id?: string) => {
    setCurrentView(view);
    if (view === 'Projects' && id) {
      setSelectedProjectId(id);
    }
  };

  // Isolate datasets for "Team Member" role to enforce "display only his/her details only"
  const isTeamMember = userRole === 'team_member';
  // Isolate datasets for "Team Leader" role: only their own department & their own team members
  const isTeamLeader = userRole === 'team_leader';
  const isDeptScoped = isTeamMember || isTeamLeader;

  // IDs of the Team Members directly supervised by this Team Leader
  const ownTeamMemberIds = isTeamLeader
    ? data.users.filter((u) => u.teamLeaderId === currentUser.id).map((u) => u.id)
    : [];

  // Filter departments: Team Members and Team Leaders only see their own department
  const visibleDepartments = isDeptScoped
    ? data.departments.filter((d) => d.id === currentUser.departmentId)
    : data.departments;

  // Filter projects: only show projects in the user's department
  const visibleProjects = isDeptScoped
    ? data.projects.filter((p) => p.departmentId === currentUser.departmentId)
    : data.projects;

  // Filter tasks: a Team Member sees only their own tasks; a Team Leader sees every
  // task in their own department (their team's tasks, plus any others logged against
  // that department) in addition to anything assigned to themselves
  const visibleTasks = isTeamMember
    ? data.tasks.filter((t) => t.assignedTo === currentUser.id)
    : isTeamLeader
    ? data.tasks.filter(
        (t) =>
          t.departmentId === currentUser.departmentId ||
          ownTeamMemberIds.includes(t.assignedTo) ||
          t.assignedTo === currentUser.id
      )
    : data.tasks;

  // Filter attendance: strictly the current user's check-ins
  const visibleAttendance = isTeamMember
    ? data.attendance.filter((a) => a.userId === currentUser.id)
    : data.attendance;

  // Filter media files: only media from the user's department
  const visibleMedia = isDeptScoped
    ? data.media.filter((m) => m.departmentId === currentUser.departmentId)
    : data.media;

  // Filter users: Team Members and Team Leaders only see teammates in their own department
  const visibleUsers = isDeptScoped
    ? data.users.filter((u) => u.departmentId === currentUser.departmentId)
    : data.users;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex transition-all duration-300 font-sans">
      {/* Search overlay command palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        projects={visibleProjects}
        tasks={visibleTasks}
        departments={visibleDepartments}
        users={visibleUsers}
        onNavigate={handleSearchNavigate}
      />

      {/* Sidebar drawer panel */}
      <Sidebar
        currentView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          setSelectedProjectId(null); // Reset drill-down
        }}
        departments={visibleDepartments}
        selectedDeptId={selectedDeptId}
        onDeptSelect={setSelectedDeptId}
        userRole={currentUser.roleName}
        currentUser={currentUser}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((prev) => !prev)}
      />

      {/* Content Canvas */}
      <div className={`flex-1 flex flex-col min-h-screen overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'pl-16' : 'pl-60'}`}>
        {/* Top Header */}
        <Header
          currentView={currentView}
          selectedProjectName={visibleProjects.find((p) => p.id === selectedProjectId)?.name}
          onSearchClick={() => setIsCommandPaletteOpen(true)}
          userRole={currentUser.roleName}
          currentUser={currentUser}
          notifications={data.notifications.filter((n) => n.userId === 'all' || n.userId === currentUser.id)}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onNavigate={handleSearchNavigate}
          onSignOut={handleSignOut}
        />

        {/* View Sheets */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-16">
          {currentView === 'Dashboard' && (
            <>
              {userRole === 'admin' && (
                <AdminDashboard
                  users={visibleUsers}
                  projects={visibleProjects}
                  tasks={visibleTasks}
                  attendance={visibleAttendance}
                  departments={visibleDepartments}
                  pendingUserCount={data.pendingUsers.length}
                  onNavigate={handleSearchNavigate}
                />
              )}
              {userRole === 'team_leader' && (
                <TeamLeaderDashboard
                  currentUser={currentUser}
                  users={visibleUsers}
                  projects={visibleProjects}
                  tasks={visibleTasks}
                  attendance={visibleAttendance}
                  onApproveSubmission={handleApproveSubmission}
                  onRejectSubmission={handleRejectSubmission}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onNavigate={handleSearchNavigate}
                />
              )}
              {userRole === 'team_member' && (
                <TeamMemberDashboard
                  currentUser={currentUser}
                  departments={visibleDepartments}
                  projects={visibleProjects}
                  tasks={visibleTasks}
                  attendance={visibleAttendance}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onSubmitDailyLog={handleSubmitDailyLog}
                  onSubmitTaskWork={handleSubmitTaskWork}
                  onNavigate={handleSearchNavigate}
                />
              )}
            </>
          )}

          {currentView === 'Departments' && (
            <DepartmentsView
              departments={visibleDepartments}
              users={visibleUsers}
              admins={data.users.filter((u) => u.baseLevel === 'admin')}
              projects={visibleProjects}
              media={visibleMedia}
              tasks={visibleTasks}
              selectedDeptId={selectedDeptId}
              onDeptSelect={setSelectedDeptId}
              onNavigate={handleSearchNavigate}
              userRole={userRole}
              currentUser={currentUser}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onUpdateDepartmentStatus={handleUpdateDepartmentStatus}
              onDeleteDepartment={handleDeleteDepartment}
              currentUserId={currentUser.id}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTaskAssignee={handleUpdateTaskAssignee}
              onAddSubtask={handleAddSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onReorderTasks={handleReorderTasks}
              onReorderSubtasks={handleReorderSubtasks}
              onAddComment={handleAddComment}
              onSendTaskSummaryEmail={handleSendTaskSummaryEmail}
            />
          )}

          {currentView === 'Projects' && (
            <ProjectsView
              projects={visibleProjects}
              users={visibleUsers}
              tasks={visibleTasks}
              media={visibleMedia}
              selectedProjectId={selectedProjectId}
              userRole={userRole}
              currentUser={currentUser}
              onProjectSelect={setSelectedProjectId}
              onAddComment={handleAddComment}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onUpdateProjectAssignee={handleUpdateProjectAssignee}
              onNavigate={handleSearchNavigate}
            />
          )}

          {currentView === 'Tasks' && (
            <TasksView
              tasks={visibleTasks}
              users={visibleUsers}
              admins={data.users.filter((u) => u.baseLevel === 'admin')}
              projects={visibleProjects}
              userRole={userRole}
              currentUser={currentUser}
              currentUserId={currentUser.id}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onUpdateTaskAssignee={handleUpdateTaskAssignee}
              onAddSubtask={handleAddSubtask}
              onUpdateSubtask={handleUpdateSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onReorderTasks={handleReorderTasks}
              onReorderSubtasks={handleReorderSubtasks}
              onSendTaskSummaryEmail={handleSendTaskSummaryEmail}
            />
          )}

          {currentView === 'Attendance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Attendance Database Logs</h2>
                <p className="text-xs text-gray-500 mt-1">Real-time check-in and checkout registers across all departmental team units.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500">
                  <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-900">
                    <tr>
                      <th className="py-2.5">Staff Associate</th>
                      <th className="py-2.5">Timestamp Date</th>
                      <th className="py-2.5">Clock In</th>
                      <th className="py-2.5">Clock Out</th>
                      <th className="py-2.5">Status Check</th>
                      <th className="py-2.5 text-right">Sum working hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-900">
                    {visibleAttendance.slice().reverse().map((att) => {
                      const staff = visibleUsers.find(u => u.id === att.userId) || data.users.find(u => u.id === att.userId);
                      return (
                        <tr key={att.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                          <td className="py-3.5 flex items-center gap-2">
                            <img src={staff?.avatar} alt={staff?.name} className="h-6 w-6 rounded-full object-cover" />
                            <span className="font-bold text-gray-900 dark:text-gray-150">{staff?.name}</span>
                          </td>
                          <td className="py-3.5 font-mono text-gray-400">{att.date}</td>
                          <td className="py-3.5 font-mono text-gray-450">{att.checkInTime}</td>
                          <td className="py-3.5 font-mono text-gray-455">{att.checkOutTime || 'Duty active'}</td>
                          <td className="py-3.5">
                            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                              att.status === 'Late' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {att.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-semibold">
                            {att.workingHours ? `${att.workingHours.toFixed(2)} hrs` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'Calendar' && (
            <CalendarView
              tasks={visibleTasks}
              users={visibleUsers}
              projects={visibleProjects}
              userRole={userRole}
              currentUserId={currentUser.id}
              onAddTask={handleAddTask}
            />
          )}

          {currentView === 'Reports' && (
            <ReportsView
              departments={visibleDepartments}
              users={visibleUsers}
              projects={visibleProjects}
              tasks={visibleTasks}
            />
          )}

          {currentView === 'Files' && (
            <FilesView
              media={visibleMedia}
              departments={visibleDepartments}
              onAddMedia={handleAddMedia}
            />
          )}

          {currentView === 'Users' && (
            <UsersView
              users={data.users}
              departments={data.departments}
              userRole={userRole}
              currentUser={currentUser}
              currentUserId={currentUser.id}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
              pendingUsers={data.pendingUsers}
              onCategorizeUser={handleCategorizeUser}
              onDeclineUser={handleDeclineUser}
              onEditUser={handleEditUser}
              onSendPasswordReset={handleSendPasswordReset}
              onResetPassword={handleResetPassword}
              onAddUserWithPassword={handleAddUserWithPassword}
              onDeleteUser={handleDeleteUser}
              roles={data.roles}
              credentialUserIds={data.credentialUserIds}
              onViewCredentials={handleViewCredentials}
              businessSlug={businessSlug}
              onSendTaskSummaryEmail={handleSendTaskSummaryEmail}
            />
          )}

          {currentView === 'Roles' && userRole === 'admin' && (
            <RolesView
              roles={data.roles}
              users={data.users}
              onAddRole={handleAddRole}
              onUpdateRole={handleUpdateRole}
              onDeleteRole={handleDeleteRole}
            />
          )}

          {currentView === 'Settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Enterprise Settings</h2>
                <p className="text-xs text-gray-500 mt-1">Configure profile security credentials, interface templates, and notifications.</p>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-900 bg-white dark:bg-gray-950 p-6 shadow-sm space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 dark:border-gray-900 pb-5">
                  <img src={currentUser.avatar} alt={currentUser.name} className="h-12 w-12 rounded-full object-cover" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{currentUser.name}</h3>
                    <p className="text-xs text-blue-600 font-semibold">{currentUser.roleName} Profile Active</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Business Name</label>
                  {isEditingBusinessName ? (
                    <div className="flex items-center gap-2">
                      <input
                        id="business-name-input"
                        type="text"
                        value={businessNameDraft}
                        onChange={(e) => setBusinessNameDraft(e.target.value)}
                        autoFocus
                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-800 bg-transparent px-3 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        id="save-business-name-btn"
                        disabled={savingBusinessName || !businessNameDraft.trim()}
                        onClick={async () => {
                          setSavingBusinessName(true);
                          const ok = await handleSaveBusinessName(businessNameDraft.trim());
                          setSavingBusinessName(false);
                          if (ok) setIsEditingBusinessName(false);
                        }}
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-xs font-bold disabled:opacity-60"
                      >
                        {savingBusinessName ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        id="cancel-business-name-btn"
                        onClick={() => setIsEditingBusinessName(false)}
                        className="rounded-xl bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 text-gray-600 dark:text-gray-300 px-3 py-2 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                      <span className="flex-1 text-xs text-gray-900 dark:text-gray-100">{businessName || 'Unnamed business'}</span>
                      {userRole === 'admin' && (
                        <button
                          id="edit-business-name-btn"
                          onClick={() => {
                            setBusinessNameDraft(businessName || '');
                            setIsEditingBusinessName(true);
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  )}
                  <p className="text-[9px] text-gray-400 mt-1">
                    {businessSlug
                      ? "Saving a new name here also updates the login link below to match — any previously shared link stops working."
                      : "Saving a name here also creates this business's login link below, since none exists yet."}
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    Login Link{businessName ? ` for ${businessName}` : ''}
                  </label>
                  {SITE_URL && businessSlug ? (
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-800 px-3 py-2">
                      <a
                        href={`${SITE_URL}/${businessSlug}/user-login`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-blue-600 hover:underline truncate"
                      >
                        {`${SITE_URL}/${businessSlug}/user-login`}
                      </a>
                      <button
                        id="copy-settings-login-link-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(`${SITE_URL}/${businessSlug}/user-login`);
                          setLoginLinkCopied(true);
                          setTimeout(() => setLoginLinkCopied(false), 1500);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy login link"
                      >
                        {loginLinkCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic">Not available yet (this business has no login slug configured).</p>
                  )}
                  <p className="text-[9px] text-gray-400 mt-1">Bookmark this link — it&apos;s where you (and every employee at {businessName || 'your company'}) sign in.</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
