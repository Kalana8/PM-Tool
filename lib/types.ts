// The 3 levels every role still maps to under the hood, regardless of its
// display name — drives dashboard variant, dept-scoping, and other identity
// behavior that a custom role's name/permissions don't otherwise determine.
export type RoleBaseLevel = 'admin' | 'team_leader' | 'team_member';

// Sidebar pages a role can see, and the key actions it can perform. Both are
// plain string keys (PAGE_KEYS/ACTION_KEYS below are the single source of
// truth for what's valid) so admin-created custom roles aren't limited to a
// fixed enum.
export interface RolePermissions {
  pages: string[];
  actions: string[];
}

export interface Role {
  id: string;
  name: string;
  baseLevel: RoleBaseLevel;
  isSystem: boolean;
  permissions: RolePermissions;
}

export const PAGE_KEYS = ['Departments', 'Tasks', 'Calendar', 'Attendance', 'Users', 'Reports', 'Settings'] as const;

export const ACTION_KEYS = [
  'users.add',
  'users.edit',
  'users.delete',
  'users.manage_login',
  'departments.manage',
  'projects.manage',
  'tasks.edit_progress',
  'attendance.manage'
] as const;

// A signup that hasn't been categorized (role assigned) by an admin yet.
export interface PendingUser {
  id: string;
  authId: string;
  name: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  baseLevel: RoleBaseLevel;
  permissions: RolePermissions;
  departmentId: string;
  status: 'Active' | 'Inactive';
  avatar: string;
  title: string;
  performanceScore: number; // 0 to 100
  phone?: string;
  teamLeaderId?: string; // for Team Members: the Team Leader supervising them
  employeeCode?: string; // department-letter + sequence, e.g. "H001" — assigned once, never changes
}

export interface Department {
  id: string;
  name: string;
  icon: string;
  code: string;
  description: string;
  status: 'Active' | 'Inactive';
}

export interface Project {
  id: string;
  name: string;
  departmentId: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  deadline: string;
  status: 'Planning' | 'In Progress' | 'In Review' | 'Completed';
  progress: number; // percentage
  leaderId: string; // Owner: Admin or Team Leader
  assigneeId?: string; // Assignee: Team Leader or Team Member
  members: string[]; // user IDs
  documents: MediaFile[];
  images: MediaFile[];
  videos: MediaFile[];
  notes: string[];
}

export type TaskCategory = 'daily' | 'continuous';
export type TaskStatus = 'Todo' | 'In Progress' | 'Review' | 'Completed' | 'Cancelled';
export type TaskPriority = 'High' | 'Medium' | 'Low';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export interface Subtask {
  id: string;
  name: string;
  ownerId?: string; // Owner: Admin or Team Leader
  assignedTo?: string; // Assignee: Team Leader or Team Member
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  progress: number; // 0 to 100
}

export interface TaskComment {
  id: string;
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface TaskSubmission {
  id: string;
  userId: string;
  userName: string;
  date: string;
  workDone: string;
  notes: string;
  status: 'Pending' | 'Approved' | 'Changes Requested';
  feedback?: string;
  attachments: MediaFile[];
}

export interface Task {
  id: string;
  name: string;
  projectId: string;
  departmentId: string;
  category: TaskCategory;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number; // 0 to 100
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  dueDays?: number; // duration in days
  assignedTo: string; // user ID
  milestones?: Milestone[];
  subtasks?: Subtask[];
  comments: TaskComment[];
  submissions: TaskSubmission[];
}

export interface Attendance {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM:SS
  checkOutTime?: string; // HH:MM:SS
  status: 'Present' | 'Late' | 'Half Day' | 'Absent';
  workingHours?: number; // decimal hours
}

export interface DailyWorkLog {
  id: string;
  userId: string;
  userName: string;
  date: string;
  tasksDone: string;
  problems: string;
  notes: string;
  attachments: MediaFile[];
}

export interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url: string;
  size: string;
  extension: string;
  uploadedBy: string;
  dateAdded: string;
  projectId?: string;
  departmentId?: string;
}

export interface Notification {
  id: string;
  userId: string; // 'all' or specific ID
  title: string;
  message: string;
  type: 'task_assigned' | 'task_updated' | 'task_completed' | 'task_approved' | 'task_rejected' | 'new_project' | 'attendance' | 'deadline' | 'password_reset_request';
  time: string;
  read: boolean;
}
