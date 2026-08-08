// Write-side helpers: every function here takes the same app-shaped (camelCase)
// objects the rest of the app already builds, converts them to snake_case rows,
// and performs the equivalent Supabase insert/update/delete. Callers own local
// state — they call these, then patch `data` themselves so the UI updates
// immediately without a full refetch.
//
// businessId is threaded in from the caller (sourced from getActiveBusiness())
// rather than a hardcoded constant, since every pm.* table is multi-tenant.
import { supabase } from './pm-client';
import type {
  Department,
  User,
  Project,
  Task,
  Subtask,
  TaskComment,
  TaskSubmission,
  Attendance,
  MediaFile,
  Notification,
  DailyWorkLog
} from '../types';

const check = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------
export async function dbInsertDepartment(dept: Department, businessId: string) {
  const { error } = await supabase.from('departments').insert({
    id: dept.id,
    business_id: businessId,
    name: dept.name,
    icon: dept.icon,
    code: dept.code,
    description: dept.description,
    status: dept.status
  });
  check(error);
}

export async function dbUpdateDepartment(id: string, updates: Partial<Department>) {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.icon !== undefined) row.icon = updates.icon;
  if (updates.code !== undefined) row.code = updates.code;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.status !== undefined) row.status = updates.status;
  const { error } = await supabase.from('departments').update(row as any).eq('id', id);
  check(error);
}

export async function dbDeleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function dbInsertUser(user: User, businessId: string) {
  const { error } = await supabase.from('users').insert({
    id: user.id,
    business_id: businessId,
    name: user.name,
    email: user.email,
    role: user.role,
    department_id: user.departmentId,
    status: user.status,
    avatar: user.avatar,
    title: user.title,
    performance_score: user.performanceScore,
    phone: user.phone ?? null,
    team_leader_id: user.teamLeaderId ?? null
  });
  check(error);
}

export async function dbUpdateUser(id: string, updates: Partial<User>) {
  const row: Record<string, unknown> = {};
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.title !== undefined) row.title = updates.title;
  if (updates.phone !== undefined) row.phone = updates.phone;
  if (updates.departmentId !== undefined) row.department_id = updates.departmentId;
  if (updates.teamLeaderId !== undefined) row.team_leader_id = updates.teamLeaderId || null;
  const { error } = await supabase.from('users').update(row as any).eq('id', id);
  check(error);
}

export async function dbDeclineUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  check(error);
}

// Removes only this tool's pm.users profile row — the actual login/business
// membership is owned by the lead's portal and isn't touched here (see
// app/api/admin/delete-user disposition in the port plan).
export async function dbDeleteUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function dbInsertProject(project: Project, businessId: string) {
  const { error } = await supabase.from('employee_projects').insert({
    id: project.id,
    business_id: businessId,
    name: project.name,
    department_id: project.departmentId,
    description: project.description,
    start_date: project.startDate,
    deadline: project.deadline,
    status: project.status,
    progress: project.progress,
    leader_id: project.leaderId,
    assignee_id: project.assigneeId ?? null,
    notes: project.notes
  });
  check(error);

  if (project.members.length > 0) {
    const { error: memberError } = await supabase
      .from('project_members')
      .insert(project.members.map((userId) => ({ business_id: businessId, project_id: project.id, user_id: userId })));
    check(memberError);
  }
}

export async function dbUpdateProject(id: string, updates: Partial<Project>, businessId: string) {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.departmentId !== undefined) row.department_id = updates.departmentId;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.startDate !== undefined) row.start_date = updates.startDate;
  if (updates.deadline !== undefined) row.deadline = updates.deadline;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.progress !== undefined) row.progress = updates.progress;
  if (updates.leaderId !== undefined) row.leader_id = updates.leaderId;
  if (updates.assigneeId !== undefined) row.assignee_id = updates.assigneeId ?? null;
  if (updates.notes !== undefined) row.notes = updates.notes;
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from('employee_projects').update(row as any).eq('id', id);
    check(error);
  }

  if (updates.members !== undefined) {
    const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', id);
    check(deleteError);
    if (updates.members.length > 0) {
      const { error: insertError } = await supabase
        .from('project_members')
        .insert(updates.members.map((userId) => ({ business_id: businessId, project_id: id, user_id: userId })));
      check(insertError);
    }
  }
}

export async function dbDeleteProject(id: string) {
  const { error } = await supabase.from('employee_projects').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function dbInsertTask(task: Task, position: number, businessId: string) {
  const { error } = await supabase.from('employee_tasks').insert({
    id: task.id,
    business_id: businessId,
    name: task.name,
    project_id: task.projectId,
    department_id: task.departmentId,
    category: task.category,
    description: task.description,
    priority: task.priority,
    status: task.status,
    progress: task.progress,
    start_date: task.startDate ?? null,
    start_time: task.startTime ?? null,
    due_date: task.dueDate,
    due_time: task.dueTime ?? null,
    due_days: task.dueDays ?? null,
    assigned_to: task.assignedTo,
    milestones: (task.milestones ?? []) as any,
    position
  });
  check(error);
}

export async function dbUpdateTask(id: string, updates: Partial<Task>) {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.projectId !== undefined) row.project_id = updates.projectId;
  if (updates.departmentId !== undefined) row.department_id = updates.departmentId;
  if (updates.category !== undefined) row.category = updates.category;
  if (updates.description !== undefined) row.description = updates.description;
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.progress !== undefined) row.progress = updates.progress;
  if (updates.startDate !== undefined) row.start_date = updates.startDate ?? null;
  if (updates.startTime !== undefined) row.start_time = updates.startTime ?? null;
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate;
  if (updates.dueTime !== undefined) row.due_time = updates.dueTime ?? null;
  if (updates.dueDays !== undefined) row.due_days = updates.dueDays ?? null;
  if (updates.assignedTo !== undefined) row.assigned_to = updates.assignedTo;
  if (updates.milestones !== undefined) row.milestones = updates.milestones;
  const { error } = await supabase.from('employee_tasks').update(row as any).eq('id', id);
  check(error);
}

export async function dbDeleteTask(id: string) {
  const { error } = await supabase.from('employee_tasks').delete().eq('id', id);
  check(error);
}

export async function dbReorderTasks(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from('employee_tasks').update({ position: index }).eq('id', id))
  );
}

export async function dbInsertSubtask(taskId: string, subtask: Subtask, position: number, businessId: string) {
  const { error } = await supabase.from('subtasks').insert({
    id: subtask.id,
    business_id: businessId,
    task_id: taskId,
    name: subtask.name,
    owner_id: subtask.ownerId ?? null,
    assigned_to: subtask.assignedTo ?? null,
    priority: subtask.priority,
    status: subtask.status,
    start_date: subtask.startDate ?? null,
    due_date: subtask.dueDate ?? null,
    progress: subtask.progress,
    position
  });
  check(error);
}

export async function dbUpdateSubtask(id: string, updates: Partial<Subtask>) {
  const row: Record<string, unknown> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.ownerId !== undefined) row.owner_id = updates.ownerId ?? null;
  if (updates.assignedTo !== undefined) row.assigned_to = updates.assignedTo ?? null;
  if (updates.priority !== undefined) row.priority = updates.priority;
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.startDate !== undefined) row.start_date = updates.startDate ?? null;
  if (updates.dueDate !== undefined) row.due_date = updates.dueDate ?? null;
  if (updates.progress !== undefined) row.progress = updates.progress;
  const { error } = await supabase.from('subtasks').update(row as any).eq('id', id);
  check(error);
}

export async function dbDeleteSubtask(id: string) {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  check(error);
}

export async function dbReorderSubtasks(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from('subtasks').update({ position: index }).eq('id', id))
  );
}

export async function dbInsertTaskComment(taskId: string, comment: TaskComment, businessId: string) {
  const { error } = await supabase.from('employee_task_comments').insert({
    id: comment.id,
    business_id: businessId,
    task_id: taskId,
    user_name: comment.userName,
    user_avatar: comment.userAvatar,
    text: comment.text,
    timestamp: comment.timestamp
  });
  check(error);
}

export async function dbInsertTaskSubmission(taskId: string, submission: TaskSubmission, businessId: string) {
  const { error } = await supabase.from('task_submissions').insert({
    id: submission.id,
    business_id: businessId,
    task_id: taskId,
    user_id: submission.userId,
    user_name: submission.userName,
    date: submission.date,
    work_done: submission.workDone,
    notes: submission.notes,
    status: submission.status,
    feedback: submission.feedback ?? null
  });
  check(error);

  if (submission.attachments.length > 0) {
    const { error: attachError } = await supabase.from('task_submission_attachments').insert(
      submission.attachments.map((file) => ({
        business_id: businessId,
        task_submission_id: submission.id,
        media_file_id: file.id
      }))
    );
    check(attachError);
  }
}

export async function dbUpdateTaskSubmission(id: string, updates: Partial<TaskSubmission>) {
  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.feedback !== undefined) row.feedback = updates.feedback ?? null;
  const { error } = await supabase.from('task_submissions').update(row as any).eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export async function dbInsertMediaFile(file: MediaFile, businessId: string) {
  const { error } = await supabase.from('media_files').insert({
    id: file.id,
    business_id: businessId,
    name: file.name,
    type: file.type,
    url: file.url,
    size: file.size,
    extension: file.extension,
    uploaded_by: file.uploadedBy,
    date_added: file.dateAdded,
    project_id: file.projectId ?? null,
    department_id: file.departmentId ?? null
  });
  check(error);
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export async function dbInsertAttendance(row: Attendance, businessId: string) {
  const { error } = await supabase.from('attendance').insert({
    id: row.id,
    business_id: businessId,
    user_id: row.userId,
    date: row.date,
    check_in_time: row.checkInTime,
    check_out_time: row.checkOutTime ?? null,
    status: row.status,
    working_hours: row.workingHours ?? null
  });
  check(error);
}

export async function dbUpdateAttendance(id: string, updates: Partial<Attendance>) {
  const row: Record<string, unknown> = {};
  if (updates.checkOutTime !== undefined) row.check_out_time = updates.checkOutTime;
  if (updates.workingHours !== undefined) row.working_hours = updates.workingHours;
  if (updates.status !== undefined) row.status = updates.status;
  const { error } = await supabase.from('attendance').update(row as any).eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function dbInsertNotification(notif: Notification, businessId: string) {
  const { error } = await supabase.from('notifications').insert({
    id: notif.id,
    business_id: businessId,
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    time: notif.time,
    read: notif.read
  });
  check(error);
}

export async function dbMarkAllNotificationsRead(ids: string[]) {
  if (ids.length === 0) return;
  const { error } = await supabase.from('notifications').update({ read: true }).in('id', ids);
  check(error);
}

// ---------------------------------------------------------------------------
// Daily worklogs
// ---------------------------------------------------------------------------
export async function dbInsertWorklog(log: DailyWorkLog, businessId: string) {
  const { error } = await supabase.from('daily_worklogs').insert({
    id: log.id,
    business_id: businessId,
    user_id: log.userId,
    user_name: log.userName,
    date: log.date,
    tasks_done: log.tasksDone,
    problems: log.problems,
    notes: log.notes
  });
  check(error);

  if (log.attachments.length > 0) {
    const { error: attachError } = await supabase
      .from('daily_worklog_attachments')
      .insert(log.attachments.map((file) => ({
        business_id: businessId,
        daily_worklog_id: log.id,
        media_file_id: file.id
      })));
    check(attachError);
  }
}
