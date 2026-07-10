// Row <-> app-type mapping layer. Every function here exists so that the rest of
// the app never has to know about snake_case columns or Postgrest's nested-embed
// shape — components keep working against the exact same `lib/types.ts` shapes
// they always have.
import { supabase } from '../supabaseClient';
import type {
  Department,
  User,
  PendingUser,
  Project,
  Task,
  Subtask,
  TaskComment,
  TaskSubmission,
  Attendance,
  MediaFile,
  Notification,
  DailyWorkLog,
  Milestone
} from '../types';

// ---------------------------------------------------------------------------
// DB row -> app type
// ---------------------------------------------------------------------------

function mapDepartment(row: any): Department {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    code: row.code,
    description: row.description,
    status: row.status
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    departmentId: row.department_id,
    status: row.status,
    avatar: row.avatar,
    title: row.title,
    performanceScore: row.performance_score,
    phone: row.phone ?? undefined,
    teamLeaderId: row.team_leader_id ?? undefined
  };
}

function mapPendingUser(row: any): PendingUser {
  return {
    id: row.id,
    authId: row.auth_id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    createdAt: row.created_at
  };
}

function mapMediaFile(row: any): MediaFile {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    url: row.url,
    size: row.size,
    extension: row.extension,
    uploadedBy: row.uploaded_by,
    dateAdded: row.date_added,
    projectId: row.project_id ?? undefined,
    departmentId: row.department_id ?? undefined
  };
}

function mapProject(row: any, allMedia: MediaFile[]): Project {
  const projectMedia = allMedia.filter((m) => m.projectId === row.id);
  return {
    id: row.id,
    name: row.name,
    departmentId: row.department_id,
    description: row.description,
    startDate: row.start_date,
    deadline: row.deadline,
    status: row.status,
    progress: row.progress,
    leaderId: row.leader_id,
    assigneeId: row.assignee_id ?? undefined,
    members: (row.project_members ?? []).map((pm: any) => pm.user_id),
    documents: projectMedia.filter((m) => m.type === 'document'),
    images: projectMedia.filter((m) => m.type === 'image'),
    videos: projectMedia.filter((m) => m.type === 'video'),
    notes: row.notes ?? []
  };
}

function mapSubtask(row: any): Subtask {
  return {
    id: row.id,
    name: row.name,
    ownerId: row.owner_id ?? undefined,
    assignedTo: row.assigned_to ?? undefined,
    priority: row.priority,
    status: row.status,
    startDate: row.start_date ?? undefined,
    dueDate: row.due_date ?? undefined,
    progress: row.progress
  };
}

function mapTaskComment(row: any): TaskComment {
  return {
    id: row.id,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    text: row.text,
    timestamp: row.timestamp
  };
}

function mapTaskSubmission(row: any): TaskSubmission {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    date: row.date,
    workDone: row.work_done,
    notes: row.notes,
    status: row.status,
    feedback: row.feedback ?? undefined,
    attachments: (row.task_submission_attachments ?? []).map((a: any) => mapMediaFile(a.media_files))
  };
}

function mapTask(row: any): Task {
  return {
    id: row.id,
    name: row.name,
    projectId: row.project_id,
    departmentId: row.department_id,
    category: row.category,
    description: row.description,
    priority: row.priority,
    status: row.status,
    progress: row.progress,
    startDate: row.start_date ?? undefined,
    startTime: row.start_time ? row.start_time.slice(0, 5) : undefined,
    dueDate: row.due_date,
    dueTime: row.due_time ? row.due_time.slice(0, 5) : undefined,
    dueDays: row.due_days ?? undefined,
    assignedTo: row.assigned_to,
    milestones: (row.milestones ?? []) as Milestone[],
    subtasks: (row.subtasks ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map(mapSubtask),
    comments: (row.task_comments ?? []).map(mapTaskComment),
    submissions: (row.task_submissions ?? []).map(mapTaskSubmission)
  };
}

function mapAttendance(row: any): Attendance {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    checkInTime: row.check_in_time,
    checkOutTime: row.check_out_time ?? undefined,
    status: row.status,
    workingHours: row.working_hours != null ? Number(row.working_hours) : undefined
  };
}

function mapNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    message: row.message,
    type: row.type,
    time: row.time,
    read: row.read
  };
}

function mapWorklog(row: any): DailyWorkLog {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    date: row.date,
    tasksDone: row.tasks_done,
    problems: row.problems,
    notes: row.notes,
    attachments: (row.daily_worklog_attachments ?? []).map((a: any) => mapMediaFile(a.media_files))
  };
}

// ---------------------------------------------------------------------------
// Bulk fetch: everything the app needs on boot, mapped back to lib/types.ts shapes
// ---------------------------------------------------------------------------
export interface AppData {
  departments: Department[];
  users: User[];
  pendingUsers: PendingUser[];
  projects: Project[];
  tasks: Task[];
  attendance: Attendance[];
  media: MediaFile[];
  notifications: Notification[];
  worklogs: DailyWorkLog[];
}

export async function fetchAllData(): Promise<AppData> {
  const [
    departmentsRes,
    usersRes,
    pendingUsersRes,
    mediaRes,
    projectsRes,
    tasksRes,
    attendanceRes,
    notificationsRes,
    worklogsRes
  ] = await Promise.all([
    supabase.from('departments').select('*').order('name'),
    supabase.from('users').select('*').not('role', 'is', null).order('name'),
    supabase.from('users').select('id, auth_id, name, email, avatar, created_at').is('role', null).order('created_at'),
    supabase.from('media_files').select('*').order('date_added', { ascending: false }),
    supabase.from('projects').select('*, project_members(user_id)').order('created_at'),
    supabase
      .from('tasks')
      .select(
        '*, subtasks(*), task_comments(*), task_submissions(*, task_submission_attachments(media_files(*)))'
      )
      .order('position'),
    supabase.from('attendance').select('*').order('date', { ascending: false }),
    supabase.from('notifications').select('*').order('created_at', { ascending: false }),
    supabase.from('daily_worklogs').select('*, daily_worklog_attachments(media_files(*))').order('date', { ascending: false })
  ]);

  const firstError =
    departmentsRes.error ||
    usersRes.error ||
    pendingUsersRes.error ||
    mediaRes.error ||
    projectsRes.error ||
    tasksRes.error ||
    attendanceRes.error ||
    notificationsRes.error ||
    worklogsRes.error;
  if (firstError) throw firstError;

  const media = (mediaRes.data ?? []).map(mapMediaFile);

  return {
    departments: (departmentsRes.data ?? []).map(mapDepartment),
    users: (usersRes.data ?? []).map(mapUser),
    pendingUsers: (pendingUsersRes.data ?? []).map(mapPendingUser),
    projects: (projectsRes.data ?? []).map((row) => mapProject(row, media)),
    tasks: (tasksRes.data ?? []).map(mapTask),
    attendance: (attendanceRes.data ?? []).map(mapAttendance),
    media,
    notifications: (notificationsRes.data ?? []).map(mapNotification),
    worklogs: (worklogsRes.data ?? []).map(mapWorklog)
  };
}

export async function fetchCurrentProfile(authId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).maybeSingle();
  if (error) throw error;
  return data ? mapUser(data) : null;
}
