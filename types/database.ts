// public schema generated via mcp__claude_ai_Supabase__generate_typescript_types
// (project uaifxlpiwuupwiqfyzvl). pm schema hand-authored from
// mcp__claude_ai_Supabase__list_tables(schemas:["pm"], verbose:true) against
// the same project, to match supabase/migrations/0001-0003 exactly, since
// generate_typescript_types only returns the public schema.
// Regenerate public via the MCP tool; re-derive pm via list_tables if the
// migrations change.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      business_invites: {
        Row: {
          accepted_at: string | null
          business_id: string
          created_at: string
          email: string
          id: string
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          business_id: string
          created_at?: string
          email: string
          id?: string
          role?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string
          created_at?: string
          email?: string
          id?: string
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          invited_by: string | null
          role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          invited_by?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      has_business_role: { Args: { b_id: string; roles: string[] }; Returns: boolean }
      is_business_member: { Args: { b_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
  pm: {
    Tables: {
      // Owned by another tool-dev — unchanged, do not modify shape here.
      projects: {
        Row: { id: string; business_id: string; name: string; description: string | null; status: string; start_date: string | null; due_date: string | null; created_by: string; created_at: string; updated_at: string }
        Insert: { id?: string; business_id: string; name: string; description?: string | null; status?: string; start_date?: string | null; due_date?: string | null; created_by: string; created_at?: string; updated_at?: string }
        Update: { id?: string; business_id?: string; name?: string; description?: string | null; status?: string; start_date?: string | null; due_date?: string | null; created_by?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      tasks: {
        Row: { id: string; business_id: string; project_id: string; title: string; description: string | null; status: string; priority: string; due_date: string | null; created_by: string; created_at: string; updated_at: string }
        Insert: { id?: string; business_id: string; project_id: string; title: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; created_by: string; created_at?: string; updated_at?: string }
        Update: { id?: string; business_id?: string; project_id?: string; title?: string; description?: string | null; status?: string; priority?: string; due_date?: string | null; created_by?: string; created_at?: string; updated_at?: string }
        Relationships: []
      }
      task_assignees: {
        Row: { task_id: string; user_id: string; assigned_by: string | null; assigned_at: string }
        Insert: { task_id: string; user_id: string; assigned_by?: string | null; assigned_at?: string }
        Update: { task_id?: string; user_id?: string; assigned_by?: string | null; assigned_at?: string }
        Relationships: []
      }
      task_comments: {
        Row: { id: string; business_id: string; task_id: string; author_id: string; body: string; created_at: string }
        Insert: { id?: string; business_id: string; task_id: string; author_id: string; body: string; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; author_id?: string; body?: string; created_at?: string }
        Relationships: []
      }

      // This app's tables (supabase/migrations/0001_pm_employee_schema.sql)
      departments: {
        Row: { id: string; business_id: string; name: string; icon: string; code: string; description: string; status: Database["pm"]["Enums"]["active_status"]; created_at: string }
        Insert: { id: string; business_id: string; name: string; icon: string; code: string; description?: string; status?: Database["pm"]["Enums"]["active_status"]; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; icon?: string; code?: string; description?: string; status?: Database["pm"]["Enums"]["active_status"]; created_at?: string }
        Relationships: [
          { foreignKeyName: "departments_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
        ]
      }
      users: {
        Row: { id: string; business_id: string; auth_id: string | null; name: string; email: string; role_id: string | null; department_id: string | null; status: Database["pm"]["Enums"]["active_status"]; avatar: string; title: string; performance_score: number; phone: string | null; team_leader_id: string | null; employee_code: string | null; must_change_password: boolean; created_at: string }
        Insert: { id: string; business_id: string; auth_id?: string | null; name: string; email: string; role_id?: string | null; department_id?: string | null; status?: Database["pm"]["Enums"]["active_status"]; avatar?: string; title?: string; performance_score?: number; phone?: string | null; team_leader_id?: string | null; employee_code?: string | null; must_change_password?: boolean; created_at?: string }
        Update: { id?: string; business_id?: string; auth_id?: string | null; name?: string; email?: string; role_id?: string | null; department_id?: string | null; status?: Database["pm"]["Enums"]["active_status"]; avatar?: string; title?: string; performance_score?: number; phone?: string | null; team_leader_id?: string | null; employee_code?: string | null; must_change_password?: boolean; created_at?: string }
        Relationships: [
          { foreignKeyName: "users_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "users_department_id_fkey"; columns: ["department_id"]; isOneToOne: false; referencedRelation: "departments"; referencedColumns: ["id"] },
          { foreignKeyName: "users_team_leader_id_fkey"; columns: ["team_leader_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "users_role_id_fkey"; columns: ["role_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["id"] },
        ]
      }
      roles: {
        Row: { id: string; business_id: string; name: string; base_level: Database["pm"]["Enums"]["role_base_level"]; is_system: boolean; permissions: Json; created_at: string }
        Insert: { id: string; business_id: string; name: string; base_level: Database["pm"]["Enums"]["role_base_level"]; is_system?: boolean; permissions?: Json; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; base_level?: Database["pm"]["Enums"]["role_base_level"]; is_system?: boolean; permissions?: Json; created_at?: string }
        Relationships: [
          { foreignKeyName: "roles_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
        ]
      }
      user_credentials: {
        Row: { user_id: string; business_id: string; password: string; created_at: string }
        Insert: { user_id: string; business_id: string; password: string; created_at?: string }
        Update: { user_id?: string; business_id?: string; password?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "user_credentials_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "user_credentials_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
        ]
      }
      employee_projects: {
        Row: { id: string; business_id: string; name: string; department_id: string | null; description: string; start_date: string; deadline: string; status: Database["pm"]["Enums"]["project_status"]; progress: number; leader_id: string | null; assignee_id: string | null; notes: string[]; created_at: string }
        Insert: { id: string; business_id: string; name: string; department_id?: string | null; description?: string; start_date: string; deadline: string; status?: Database["pm"]["Enums"]["project_status"]; progress?: number; leader_id?: string | null; assignee_id?: string | null; notes?: string[]; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; department_id?: string | null; description?: string; start_date?: string; deadline?: string; status?: Database["pm"]["Enums"]["project_status"]; progress?: number; leader_id?: string | null; assignee_id?: string | null; notes?: string[]; created_at?: string }
        Relationships: [
          { foreignKeyName: "employee_projects_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_projects_department_id_fkey"; columns: ["department_id"]; isOneToOne: false; referencedRelation: "departments"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_projects_leader_id_fkey"; columns: ["leader_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_projects_assignee_id_fkey"; columns: ["assignee_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      project_members: {
        Row: { business_id: string; project_id: string; user_id: string }
        Insert: { business_id: string; project_id: string; user_id: string }
        Update: { business_id?: string; project_id?: string; user_id?: string }
        Relationships: [
          { foreignKeyName: "project_members_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "project_members_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "employee_projects"; referencedColumns: ["id"] },
          { foreignKeyName: "project_members_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      media_files: {
        Row: { id: string; business_id: string; name: string; type: Database["pm"]["Enums"]["media_type"]; url: string; size: string; extension: string; uploaded_by: string; date_added: string; project_id: string | null; department_id: string | null; created_at: string }
        Insert: { id: string; business_id: string; name: string; type: Database["pm"]["Enums"]["media_type"]; url: string; size?: string; extension?: string; uploaded_by?: string; date_added?: string; project_id?: string | null; department_id?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; type?: Database["pm"]["Enums"]["media_type"]; url?: string; size?: string; extension?: string; uploaded_by?: string; date_added?: string; project_id?: string | null; department_id?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "media_files_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "media_files_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "employee_projects"; referencedColumns: ["id"] },
          { foreignKeyName: "media_files_department_id_fkey"; columns: ["department_id"]; isOneToOne: false; referencedRelation: "departments"; referencedColumns: ["id"] },
        ]
      }
      employee_tasks: {
        Row: { id: string; business_id: string; name: string; project_id: string; department_id: string | null; category: Database["pm"]["Enums"]["task_category"]; description: string; priority: Database["pm"]["Enums"]["task_priority"]; status: Database["pm"]["Enums"]["task_status"]; progress: number; start_date: string | null; start_time: string | null; due_date: string; due_time: string | null; due_days: number | null; assigned_to: string | null; milestones: Json; position: number; created_at: string }
        Insert: { id: string; business_id: string; name: string; project_id: string; department_id?: string | null; category?: Database["pm"]["Enums"]["task_category"]; description?: string; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; progress?: number; start_date?: string | null; start_time?: string | null; due_date: string; due_time?: string | null; due_days?: number | null; assigned_to?: string | null; milestones?: Json; position?: number; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; project_id?: string; department_id?: string | null; category?: Database["pm"]["Enums"]["task_category"]; description?: string; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; progress?: number; start_date?: string | null; start_time?: string | null; due_date?: string; due_time?: string | null; due_days?: number | null; assigned_to?: string | null; milestones?: Json; position?: number; created_at?: string }
        Relationships: [
          { foreignKeyName: "employee_tasks_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_tasks_project_id_fkey"; columns: ["project_id"]; isOneToOne: false; referencedRelation: "employee_projects"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_tasks_department_id_fkey"; columns: ["department_id"]; isOneToOne: false; referencedRelation: "departments"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_tasks_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      subtasks: {
        Row: { id: string; business_id: string; task_id: string; name: string; owner_id: string | null; assigned_to: string | null; priority: Database["pm"]["Enums"]["task_priority"]; status: Database["pm"]["Enums"]["task_status"]; start_date: string | null; due_date: string | null; progress: number; position: number; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; name: string; owner_id?: string | null; assigned_to?: string | null; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; start_date?: string | null; due_date?: string | null; progress?: number; position?: number; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; name?: string; owner_id?: string | null; assigned_to?: string | null; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; start_date?: string | null; due_date?: string | null; progress?: number; position?: number; created_at?: string }
        Relationships: [
          { foreignKeyName: "subtasks_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "subtasks_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "employee_tasks"; referencedColumns: ["id"] },
          { foreignKeyName: "subtasks_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "subtasks_assigned_to_fkey"; columns: ["assigned_to"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      employee_task_comments: {
        Row: { id: string; business_id: string; task_id: string; user_name: string; user_avatar: string; text: string; timestamp: string; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; user_name: string; user_avatar?: string; text: string; timestamp: string; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; user_name?: string; user_avatar?: string; text?: string; timestamp?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "employee_task_comments_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "employee_task_comments_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "employee_tasks"; referencedColumns: ["id"] },
        ]
      }
      task_submissions: {
        Row: { id: string; business_id: string; task_id: string; user_id: string | null; user_name: string; date: string; work_done: string; notes: string; status: Database["pm"]["Enums"]["submission_status"]; feedback: string | null; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; user_id?: string | null; user_name: string; date: string; work_done?: string; notes?: string; status?: Database["pm"]["Enums"]["submission_status"]; feedback?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; user_id?: string | null; user_name?: string; date?: string; work_done?: string; notes?: string; status?: Database["pm"]["Enums"]["submission_status"]; feedback?: string | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "task_submissions_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submissions_task_id_fkey"; columns: ["task_id"]; isOneToOne: false; referencedRelation: "employee_tasks"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submissions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      task_submission_attachments: {
        Row: { business_id: string; task_submission_id: string; media_file_id: string }
        Insert: { business_id: string; task_submission_id: string; media_file_id: string }
        Update: { business_id?: string; task_submission_id?: string; media_file_id?: string }
        Relationships: [
          { foreignKeyName: "task_submission_attachments_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submission_attachments_task_submission_id_fkey"; columns: ["task_submission_id"]; isOneToOne: false; referencedRelation: "task_submissions"; referencedColumns: ["id"] },
          { foreignKeyName: "task_submission_attachments_media_file_id_fkey"; columns: ["media_file_id"]; isOneToOne: false; referencedRelation: "media_files"; referencedColumns: ["id"] },
        ]
      }
      attendance: {
        Row: { id: string; business_id: string; user_id: string; date: string; check_in_time: string; check_out_time: string | null; status: Database["pm"]["Enums"]["attendance_status"]; working_hours: number | null; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; date: string; check_in_time: string; check_out_time?: string | null; status?: Database["pm"]["Enums"]["attendance_status"]; working_hours?: number | null; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; date?: string; check_in_time?: string; check_out_time?: string | null; status?: Database["pm"]["Enums"]["attendance_status"]; working_hours?: number | null; created_at?: string }
        Relationships: [
          { foreignKeyName: "attendance_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "attendance_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      notifications: {
        Row: { id: string; business_id: string; user_id: string; title: string; message: string; type: Database["pm"]["Enums"]["notification_type"]; time: string; read: boolean; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; title: string; message: string; type: Database["pm"]["Enums"]["notification_type"]; time: string; read?: boolean; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; title?: string; message?: string; type?: Database["pm"]["Enums"]["notification_type"]; time?: string; read?: boolean; created_at?: string }
        Relationships: [
          { foreignKeyName: "notifications_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
        ]
      }
      daily_worklogs: {
        Row: { id: string; business_id: string; user_id: string; user_name: string; date: string; tasks_done: string; problems: string; notes: string; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; user_name: string; date: string; tasks_done?: string; problems?: string; notes?: string; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; user_name?: string; date?: string; tasks_done?: string; problems?: string; notes?: string; created_at?: string }
        Relationships: [
          { foreignKeyName: "daily_worklogs_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "daily_worklogs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ]
      }
      daily_worklog_attachments: {
        Row: { business_id: string; daily_worklog_id: string; media_file_id: string }
        Insert: { business_id: string; daily_worklog_id: string; media_file_id: string }
        Update: { business_id?: string; daily_worklog_id?: string; media_file_id?: string }
        Relationships: [
          { foreignKeyName: "daily_worklog_attachments_business_id_fkey"; columns: ["business_id"]; isOneToOne: false; referencedRelation: "businesses"; referencedColumns: ["id"] },
          { foreignKeyName: "daily_worklog_attachments_daily_worklog_id_fkey"; columns: ["daily_worklog_id"]; isOneToOne: false; referencedRelation: "daily_worklogs"; referencedColumns: ["id"] },
          { foreignKeyName: "daily_worklog_attachments_media_file_id_fkey"; columns: ["media_file_id"]; isOneToOne: false; referencedRelation: "media_files"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      current_app_base_level: { Args: Record<PropertyKey, never>; Returns: Database["pm"]["Enums"]["role_base_level"] }
      current_app_has_action: { Args: { p_action: string }; Returns: boolean }
      current_app_user_id: { Args: Record<PropertyKey, never>; Returns: string }
      ensure_system_roles: { Args: { p_business_id: string }; Returns: undefined }
    }
    Enums: {
      role_base_level: "admin" | "team_leader" | "team_member"
      active_status: "Active" | "Inactive"
      project_status: "Planning" | "In Progress" | "In Review" | "Completed"
      task_status: "Todo" | "In Progress" | "Review" | "Completed" | "Cancelled"
      task_priority: "High" | "Medium" | "Low"
      task_category: "daily" | "continuous"
      attendance_status: "Present" | "Late" | "Half Day" | "Absent"
      submission_status: "Pending" | "Approved" | "Changes Requested"
      media_type: "image" | "video" | "document"
      notification_type: "task_assigned" | "task_updated" | "task_completed" | "task_approved" | "task_rejected" | "new_project" | "attendance" | "deadline" | "password_reset_request"
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
  pm: {
    Enums: {
      role_base_level: ["admin", "team_leader", "team_member"],
      active_status: ["Active", "Inactive"],
      project_status: ["Planning", "In Progress", "In Review", "Completed"],
      task_status: ["Todo", "In Progress", "Review", "Completed", "Cancelled"],
      task_priority: ["High", "Medium", "Low"],
      task_category: ["daily", "continuous"],
      attendance_status: ["Present", "Late", "Half Day", "Absent"],
      submission_status: ["Pending", "Approved", "Changes Requested"],
      media_type: ["image", "video", "document"],
      notification_type: ["task_assigned", "task_updated", "task_completed", "task_approved", "task_rejected", "new_project", "attendance", "deadline", "password_reset_request"],
    },
  },
} as const
