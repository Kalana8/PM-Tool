// Write-side helpers: every function here takes the same app-shaped (camelCase)
// objects the rest of the app already builds, converts them to snake_case rows,
// and performs the equivalent Supabase insert/update/delete. Callers in
// app/page.tsx still own local state — they call these, then patch `data`
// themselves so the UI updates immediately without a full refetch.
import { supabase } from '../supabaseClient';
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
export async function dbInsertDepartment(dept: Department) {
  const { error } = await supabase.from('departments').insert({
    id: dept.id,
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
  const { error } = await supabase.from('departments').update(row).eq('id', id);
  check(error);
}

export async function dbDeleteDepartment(id: string) {
  const { error } = await supabase.from('departments').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function dbInsertUser(user: User) {
  const { error } = await supabase.from('users').insert({
    id: user.id,
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
  const { error } = await supabase.from('users').update(row).eq('id', id);
  check(error);
}

export async function dbDeclineUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function dbInsertProject(project: Project) {
  const { error } = await supabase.from('projects').insert({
    id: project.id,
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
      .insert(project.members.map((userId) => ({ project_id: project.id, user_id: userId })));
    check(memberError);
  }
}

export async function dbUpdateProject(id: string, updates: Partial<Project>) {
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
    const { error } = await supabase.from('projects').update(row).eq('id', id);
    check(error);
  }

  if (updates.members !== undefined) {
    const { error: deleteError } = await supabase.from('project_members').delete().eq('project_id', id);
    check(deleteError);
    if (updates.members.length > 0) {
      const { error: insertError } = await supabase
        .from('project_members')
        .insert(updates.members.map((userId) => ({ project_id: id, user_id: userId })));
      check(insertError);
    }
  }
}

export async function dbDeleteProject(id: string) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------
export async function dbInsertTask(task: Task, position: number) {
  const { error } = await supabase.from('tasks').insert({
    id: task.id,
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
    milestones: task.milestones ?? [],
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
  const { error } = await supabase.from('tasks').update(row).eq('id', id);
  check(error);
}

export async function dbDeleteTask(id: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  check(error);
}

export async function dbReorderTasks(orderedIds: string[]) {
  await Promise.all(
    orderedIds.map((id, index) => supabase.from('tasks').update({ position: index }).eq('id', id))
  );
}

export async function dbInsertSubtask(taskId: string, subtask: Subtask, position: number) {
  const { error } = await supabase.from('subtasks').insert({
    id: subtask.id,
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
  const { error } = await supabase.from('subtasks').update(row).eq('id', id);
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

export async function dbInsertTaskComment(taskId: string, comment: TaskComment) {
  const { error } = await supabase.from('task_comments').insert({
    id: comment.id,
    task_id: taskId,
    user_name: comment.userName,
    user_avatar: comment.userAvatar,
    text: comment.text,
    timestamp: comment.timestamp
  });
  check(error);
}

export async function dbInsertTaskSubmission(taskId: string, submission: TaskSubmission) {
  const { error } = await supabase.from('task_submissions').insert({
    id: submission.id,
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
      submission.attachments.map((file) => ({ task_submission_id: submission.id, media_file_id: file.id }))
    );
    check(attachError);
  }
}

export async function dbUpdateTaskSubmission(id: string, updates: Partial<TaskSubmission>) {
  const row: Record<string, unknown> = {};
  if (updates.status !== undefined) row.status = updates.status;
  if (updates.feedback !== undefined) row.feedback = updates.feedback ?? null;
  const { error } = await supabase.from('task_submissions').update(row).eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export async function dbInsertMediaFile(file: MediaFile) {
  const { error } = await supabase.from('media_files').insert({
    id: file.id,
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
export async function dbInsertAttendance(row: Attendance) {
  const { error } = await supabase.from('attendance').insert({
    id: row.id,
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
  const { error } = await supabase.from('attendance').update(row).eq('id', id);
  check(error);
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function dbInsertNotification(notif: Notification) {
  const { error } = await supabase.from('notifications').insert({
    id: notif.id,
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
export async function dbInsertWorklog(log: DailyWorkLog) {
  const { error } = await supabase.from('daily_worklogs').insert({
    id: log.id,
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
      .insert(log.attachments.map((file) => ({ daily_worklog_id: log.id, media_file_id: file.id })));
    check(attachError);
  }
}
