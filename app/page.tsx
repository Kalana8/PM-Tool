'use client';

import React, { useState, useEffect } from 'react';
import { getStoredData, saveStoredData } from '../lib/initialData';
import {
  User,
  Department,
  Project,
  Task,
  Attendance,
  DailyWorkLog,
  MediaFile,
  Notification,
  TaskStatus,
  UserRole,
  TaskComment,
  Subtask
} from '../lib/types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import CommandPalette from '../components/CommandPalette';
import AdminDashboard from '../components/AdminDashboard';
import TeamLeaderDashboard from '../components/TeamLeaderDashboard';
import TeamMemberDashboard from '../components/TeamMemberDashboard';
import DepartmentsView from '../components/DepartmentsView';
import ProjectsView from '../components/ProjectsView';
import TasksView from '../components/TasksView';
import CalendarView from '../components/CalendarView';
import ReportsView from '../components/ReportsView';
import UsersView from '../components/UsersView';
import FilesView from '../components/FilesView';
import { Loader2, Settings, User as UserIcon, ShieldAlert } from 'lucide-react';

export default function Page() {
  const [data, setData] = useState<{
    departments: Department[];
    users: User[];
    projects: Project[];
    tasks: Task[];
    attendance: Attendance[];
    media: MediaFile[];
    notifications: Notification[];
    worklogs: DailyWorkLog[];
  } | null>(null);

  // Layout states
  const [currentView, setCurrentView] = useState<string>('Dashboard');
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const stored = getStoredData();
    setTimeout(() => {
      setData(stored);
    }, 0);

    // Keyboard listener for Ctrl + K command palette
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Initial Theme detection
    setTimeout(() => {
      const isDark = localStorage.getItem('theme') === 'dark';
      setDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }, 0);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save data to localStorage when state changes
  const updateData = (newData: typeof data) => {
    if (!newData) return;
    setData(newData);
    saveStoredData(newData);
  };

  if (!data) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-500">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-xs font-semibold tracking-wide">Bootstrapping Enterprise Prototype...</p>
        </div>
      </div>
    );
  }

  // Determine current active user based on role mapping
  const activeUserMap: Record<UserRole, string> = {
    Admin: 'user-admin',
    'Team Leader': 'user-leader-web',
    'Team Member': 'user-member-david'
  };
  const currentActiveUserId = activeUserMap[userRole];
  const currentUser = data.users.find((u) => u.id === currentActiveUserId) || data.users[0];

  // Actions
  const handleCheckIn = () => {
    const todayStr = '2026-07-07';
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    // Check if already checked in
    const existing = data.attendance.find((a) => a.userId === currentUser.id && a.date === todayStr);
    if (existing) {
      alert('You are already checked in for today.');
      return;
    }

    const newRow: Attendance = {
      id: `att-new-${Date.now()}`,
      userId: currentUser.id,
      date: todayStr,
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

    updateData({
      ...data,
      attendance: [...data.attendance, newRow],
      notifications: [newNotif, ...data.notifications]
    });
  };

  const handleCheckOut = () => {
    const todayStr = '2026-07-07';
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];

    const updated = data.attendance.map((a) => {
      if (a.userId === currentUser.id && a.date === todayStr && !a.checkOutTime) {
        // Calculate working hours
        const [inH, inM, inS] = a.checkInTime.split(':').map(Number);
        const [outH, outM, outS] = timeStr.split(':').map(Number);
        const diffHrs = outH - inH + (outM - inM) / 60 + (outS - inS) / 3600;

        return {
          ...a,
          checkOutTime: timeStr,
          workingHours: Math.max(diffHrs, 0.1)
        };
      }
      return a;
    });

    const newNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: 'all',
      title: 'Employee Check-Out stamp',
      message: `${currentUser.name} Checked out today at ${timeStr}.`,
      type: 'attendance',
      time: 'Just now',
      read: false
    };

    updateData({
      ...data,
      attendance: updated,
      notifications: [newNotif, ...data.notifications]
    });
  };

  const handleSubmitDailyLog = (log: Omit<DailyWorkLog, 'id' | 'userId' | 'userName' | 'date'>) => {
    const newLog: DailyWorkLog = {
      ...log,
      id: `log-new-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: '2026-07-07'
    };

    updateData({
      ...data,
      worklogs: [...data.worklogs, newLog]
    });
  };

  const handleSubmitTaskWork = (taskId: string, workDone: string, notes: string, attachments: MediaFile[]) => {
    // Add a submission row on task
    const submission: typeof data.tasks[0]['submissions'][0] = {
      id: `sub-new-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      date: '2026-07-07 18:00',
      workDone,
      notes,
      status: 'Pending',
      attachments
    };

    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status: 'Review' as TaskStatus,
          submissions: [...t.submissions, submission]
        };
      }
      return t;
    });

    // Notify leaders of department
    const leaderNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: 'user-leader-web', // default leader
      title: 'Work Deliverable Pushed',
      message: `${currentUser.name} pushed deliverable code for review on: "${updatedTasks.find(t => t.id === taskId)?.name}"`,
      type: 'task_completed',
      time: 'Just now',
      read: false
    };

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [leaderNotif, ...data.notifications],
      media: [...data.media, ...attachments.map(f => ({ ...f, projectId: updatedTasks.find(t => t.id === taskId)?.projectId }))]
    });
  };

  const handleApproveSubmission = (taskId: string, submissionId: string, feedback: string) => {
    let targetMemberId = '';
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        targetMemberId = t.assignedTo;
        const updatedSubs = t.submissions.map((sub) => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              status: 'Approved' as const,
              feedback
            };
          }
          return sub;
        });

        return {
          ...t,
          status: 'Completed' as TaskStatus,
          progress: 100,
          submissions: updatedSubs
        };
      }
      return t;
    });

    const userNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: targetMemberId,
      title: 'Task Completion Approved!',
      message: `Your supervisor approved completion of task: "${updatedTasks.find(t => t.id === taskId)?.name}"`,
      type: 'task_approved',
      time: 'Just now',
      read: false
    };

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleRejectSubmission = (taskId: string, submissionId: string, feedback: string) => {
    let targetMemberId = '';
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        targetMemberId = t.assignedTo;
        const updatedSubs = t.submissions.map((sub) => {
          if (sub.id === submissionId) {
            return {
              ...sub,
              status: 'Changes Requested' as const,
              feedback
            };
          }
          return sub;
        });

        // Add task comment automatically
        const newComment: TaskComment = {
          id: `c-new-${Date.now()}`,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          text: `Revision Requested: ${feedback}`,
          timestamp: '2026-07-07 18:05'
        };

        return {
          ...t,
          status: 'In Progress' as TaskStatus,
          progress: 50,
          submissions: updatedSubs,
          comments: [...t.comments, newComment]
        };
      }
      return t;
    });

    const userNotif: Notification = {
      id: `notif-new-${Date.now()}`,
      userId: targetMemberId,
      title: 'Revision Iteration Requested',
      message: `Your supervisor requested details on: "${updatedTasks.find(t => t.id === taskId)?.name}"`,
      type: 'task_rejected',
      time: 'Just now',
      read: false
    };

    updateData({
      ...data,
      tasks: updatedTasks,
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleAddComment = (projectId: string, text: string) => {
    const newComment: TaskComment = {
      id: `comment-new-${Date.now()}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text,
      timestamp: 'Just now'
    };

    // Find any active task in this project to place comment, or simply log it.
    const updatedTasks = data.tasks.map((t) => {
      if (t.projectId === projectId) {
        return {
          ...t,
          comments: [newComment, ...t.comments]
        };
      }
      return t;
    });

    updateData({
      ...data,
      tasks: updatedTasks
    });
  };

  const handleAddTask = (task: Omit<Task, 'id' | 'comments' | 'submissions'>) => {
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

    updateData({
      ...data,
      tasks: [...data.tasks, newTask],
      notifications: [userNotif, ...data.notifications]
    });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Omit<Task, 'id' | 'comments' | 'submissions'>>) => {
    const updatedTasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, ...updates } : t
    );

    updateData({
      ...data,
      tasks: updatedTasks
    });
  };

  const handleDeleteTask = (taskId: string) => {
    updateData({
      ...data,
      tasks: data.tasks.filter((t) => t.id !== taskId)
    });
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus, progress: number) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          progress
        };
      }
      return t;
    });

    updateData({
      ...data,
      tasks: updatedTasks
    });
  };

  const handleUpdateTaskAssignee = (taskId: string, assignedTo: string) => {
    const updatedTasks = data.tasks.map((t) =>
      t.id === taskId ? { ...t, assignedTo } : t
    );

    updateData({
      ...data,
      tasks: updatedTasks
    });
  };

  const handleAddSubtask = (taskId: string, subtask: Omit<Subtask, 'id' | 'status' | 'progress'>) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        const newSubtask: Subtask = { id: `subtask-${Date.now()}`, status: 'Todo', progress: 0, ...subtask };
        return { ...t, subtasks: [...(t.subtasks || []), newSubtask] };
      }
      return t;
    });

    updateData({ ...data, tasks: updatedTasks });
  };

  const handleUpdateSubtask = (taskId: string, subtaskId: string, updates: Partial<Omit<Subtask, 'id'>>) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: (t.subtasks || []).map((s) =>
            s.id === subtaskId ? { ...s, ...updates } : s
          )
        };
      }
      return t;
    });

    updateData({ ...data, tasks: updatedTasks });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, subtasks: (t.subtasks || []).filter((s) => s.id !== subtaskId) };
      }
      return t;
    });

    updateData({ ...data, tasks: updatedTasks });
  };

  // Reorders only the tasks named in orderedIds, keeping their relative
  // slot positions among the full task list (other tasks stay put).
  const handleReorderTasks = (orderedIds: string[]) => {
    const orderedIdSet = new Set(orderedIds);
    const slotIndices = data.tasks
      .map((t, index) => (orderedIdSet.has(t.id) ? index : -1))
      .filter((index) => index !== -1);

    const updatedTasks = [...data.tasks];
    slotIndices.forEach((slotIndex, i) => {
      const task = data.tasks.find((t) => t.id === orderedIds[i]);
      if (task) updatedTasks[slotIndex] = task;
    });

    updateData({ ...data, tasks: updatedTasks });
  };

  const handleReorderSubtasks = (taskId: string, orderedSubtaskIds: string[]) => {
    const updatedTasks = data.tasks.map((t) => {
      if (t.id === taskId) {
        const subtaskById = new Map((t.subtasks || []).map((s) => [s.id, s]));
        return { ...t, subtasks: orderedSubtaskIds.map((id) => subtaskById.get(id)!).filter(Boolean) };
      }
      return t;
    });

    updateData({ ...data, tasks: updatedTasks });
  };

  const handleAddUser = (user: Omit<User, 'id' | 'performanceScore'>) => {
    const newUser: User = {
      ...user,
      id: `user-new-${Date.now()}`,
      performanceScore: 85
    };

    updateData({
      ...data,
      users: [...data.users, newUser]
    });
  };

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = data.users.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'Active' ? ('Inactive' as const) : ('Active' as const)
        };
      }
      return u;
    });

    updateData({
      ...data,
      users: updatedUsers
    });
  };

  const handleResetPassword = (userId: string) => {
    const user = data.users.find((u) => u.id === userId);
    alert(`Reset security credentials sent successfully to: ${user?.email}`);
  };

  const handleAddDepartment = (dept: Omit<Department, 'id'>) => {
    const newDept: Department = {
      ...dept,
      id: `dept-new-${Date.now()}`
    };

    updateData({
      ...data,
      departments: [...data.departments, newDept]
    });
  };

  const handleUpdateDepartment = (deptId: string, updates: Omit<Department, 'id'>) => {
    const updatedDepartments = data.departments.map((d) =>
      d.id === deptId ? { ...d, ...updates } : d
    );

    updateData({
      ...data,
      departments: updatedDepartments
    });
  };

  const handleUpdateDepartmentStatus = (deptId: string, status: 'Active' | 'Inactive') => {
    const updatedDepartments = data.departments.map((d) =>
      d.id === deptId ? { ...d, status } : d
    );

    updateData({
      ...data,
      departments: updatedDepartments
    });
  };

  const handleDeleteDepartment = (deptId: string) => {
    updateData({
      ...data,
      departments: data.departments.filter((d) => d.id !== deptId)
    });
  };

  const handleAddProject = (project: Omit<Project, 'id' | 'progress' | 'members' | 'documents' | 'images' | 'videos' | 'notes'>) => {
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

    updateData({
      ...data,
      projects: [...data.projects, newProject]
    });
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Omit<Project, 'id'>>) => {
    const updatedProjects = data.projects.map((p) =>
      p.id === projectId ? { ...p, ...updates } : p
    );

    updateData({
      ...data,
      projects: updatedProjects
    });
  };

  const handleDeleteProject = (projectId: string) => {
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

  const handleAddMedia = (file: Omit<MediaFile, 'id' | 'dateAdded'>) => {
    const newFile: MediaFile = {
      ...file,
      id: `media-new-${Date.now()}`,
      dateAdded: '2026-07-07'
    };

    updateData({
      ...data,
      media: [...data.media, newFile]
    });
  };

  const handleMarkNotificationsRead = () => {
    const updated = data.notifications.map((n) => ({ ...n, read: true }));
    updateData({
      ...data,
      notifications: updated
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
  const isTeamMember = userRole === 'Team Member';
  // Isolate datasets for "Team Leader" role: only their own department & their own team members
  const isTeamLeader = userRole === 'Team Leader';
  const isDeptScoped = isTeamMember || isTeamLeader;

  // IDs of the Team Members directly supervised by this Team Leader
  const ownTeamMemberIds = isTeamLeader
    ? data.users.filter((u) => u.teamLeaderId === currentUser.id).map((u) => u.id)
    : [];

  // Filter departments: Team Members and Team Leaders only see their own SBU
  const visibleDepartments = isDeptScoped
    ? data.departments.filter((d) => d.id === currentUser.departmentId)
    : data.departments;

  // Filter projects: only show projects in the user's department
  const visibleProjects = isDeptScoped
    ? data.projects.filter((p) => p.departmentId === currentUser.departmentId)
    : data.projects;

  // Filter tasks: a Team Member sees only their own tasks; a Team Leader sees every
  // task in their own department (their team's tasks, plus any others logged against
  // that SBU) in addition to anything assigned to themselves
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

  // Filter attendance: strictly David's check-ins
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
        userRole={userRole}
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
          userRole={userRole}
          onRoleChange={setUserRole}
          currentUser={currentUser}
          notifications={data.notifications.filter((n) => n.userId === 'all' || n.userId === currentUser.id)}
          onMarkNotificationsRead={handleMarkNotificationsRead}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          onNavigate={handleSearchNavigate}
        />

        {/* View Sheets */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto pb-16">
          {currentView === 'Dashboard' && (
            <>
              {userRole === 'Admin' && (
                <AdminDashboard
                  users={visibleUsers}
                  projects={visibleProjects}
                  tasks={visibleTasks}
                  attendance={visibleAttendance}
                  departments={visibleDepartments}
                  onNavigate={handleSearchNavigate}
                />
              )}
              {userRole === 'Team Leader' && (
                <TeamLeaderDashboard
                  currentUser={currentUser}
                  users={visibleUsers}
                  projects={visibleProjects}
                  tasks={visibleTasks}
                  attendance={visibleAttendance}
                  onApproveSubmission={handleApproveSubmission}
                  onRejectSubmission={handleRejectSubmission}
                  onNavigate={handleSearchNavigate}
                />
              )}
              {userRole === 'Team Member' && (
                <TeamMemberDashboard
                  currentUser={currentUser}
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
              admins={data.users.filter((u) => u.role === 'Admin')}
              projects={visibleProjects}
              media={visibleMedia}
              tasks={visibleTasks}
              selectedDeptId={selectedDeptId}
              onDeptSelect={setSelectedDeptId}
              onNavigate={handleSearchNavigate}
              userRole={userRole}
              onAddDepartment={handleAddDepartment}
              onUpdateDepartment={handleUpdateDepartment}
              onUpdateDepartmentStatus={handleUpdateDepartmentStatus}
              onDeleteDepartment={handleDeleteDepartment}
              currentUserId={currentUser.id}
              onAddProject={handleAddProject}
              onUpdateProject={handleUpdateProject}
              onDeleteProject={handleDeleteProject}
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
              admins={data.users.filter((u) => u.role === 'Admin')}
              projects={visibleProjects}
              userRole={userRole}
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
              currentUserId={currentUser.id}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
              onResetPassword={handleResetPassword}
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
                    <p className="text-xs text-blue-600 font-semibold">{currentUser.role} Profile Active</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Company Domain</label>
                    <input type="text" readOnly value="enterprise.omniwork.com" className="w-full rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-gray-900/40 p-2.5 text-xs text-gray-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">API Node Endpoints</label>
                    <input type="text" readOnly value="https://api.omniwork.com/v1/sprint" className="w-full rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-gray-900/40 p-2.5 text-xs text-gray-400 focus:outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
