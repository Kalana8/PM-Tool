// Generated to match the applied database migrations (Tool Project).
// Regenerate after schema changes:
// supabase gen types typescript --project-id uaifxlpiwuupwiqfyzvl --schema public --schema pm > types/database.ts
//
// public block mirrors platform-crm / platform-smm verbatim (the shared portal
// contract). pm block authored from supabase/migrations/0008_pm_employee_schema.sql.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: { id: string; name: string; slug: string | null; owner_id: string; logo_url: string | null; created_at: string }
        Insert: { id?: string; name: string; slug?: string | null; owner_id: string; logo_url?: string | null; created_at?: string }
        Update: { id?: string; name?: string; slug?: string | null; owner_id?: string; logo_url?: string | null; created_at?: string }
        Relationships: []
      }
      business_members: {
        Row: { business_id: string; user_id: string; role: string; invited_by: string | null; created_at: string }
        Insert: { business_id: string; user_id: string; role?: string; invited_by?: string | null; created_at?: string }
        Update: { business_id?: string; user_id?: string; role?: string; invited_by?: string | null; created_at?: string }
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
      business_invites: {
        Row: { id: string; business_id: string; email: string; role: string; token: string; accepted_at: string | null; created_at: string }
        Insert: { id?: string; business_id: string; email: string; role?: string; token?: string; accepted_at?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; email?: string; role?: string; token?: string; accepted_at?: string | null; created_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string }
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string }
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; created_at?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      is_business_member: { Args: { b_id: string }; Returns: boolean }
      has_business_role: { Args: { b_id: string; roles: string[] }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
  pm: {
    Tables: {
      departments: {
        Row: { id: string; business_id: string; name: string; icon: string; code: string; description: string; status: Database["pm"]["Enums"]["active_status"]; created_at: string }
        Insert: { id: string; business_id: string; name: string; icon: string; code: string; description?: string; status?: Database["pm"]["Enums"]["active_status"]; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; icon?: string; code?: string; description?: string; status?: Database["pm"]["Enums"]["active_status"]; created_at?: string }
        Relationships: []
      }
      users: {
        Row: { id: string; business_id: string; auth_id: string | null; name: string; email: string; role: Database["pm"]["Enums"]["user_role"] | null; department_id: string | null; status: Database["pm"]["Enums"]["active_status"]; avatar: string; title: string; performance_score: number; phone: string | null; team_leader_id: string | null; created_at: string }
        Insert: { id: string; business_id: string; auth_id?: string | null; name: string; email: string; role?: Database["pm"]["Enums"]["user_role"] | null; department_id?: string | null; status?: Database["pm"]["Enums"]["active_status"]; avatar?: string; title?: string; performance_score?: number; phone?: string | null; team_leader_id?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; auth_id?: string | null; name?: string; email?: string; role?: Database["pm"]["Enums"]["user_role"] | null; department_id?: string | null; status?: Database["pm"]["Enums"]["active_status"]; avatar?: string; title?: string; performance_score?: number; phone?: string | null; team_leader_id?: string | null; created_at?: string }
        Relationships: []
      }
      employee_projects: {
        Row: { id: string; business_id: string; name: string; department_id: string | null; description: string; start_date: string; deadline: string; status: Database["pm"]["Enums"]["project_status"]; progress: number; leader_id: string | null; assignee_id: string | null; notes: string[]; created_at: string }
        Insert: { id: string; business_id: string; name: string; department_id?: string | null; description?: string; start_date: string; deadline: string; status?: Database["pm"]["Enums"]["project_status"]; progress?: number; leader_id?: string | null; assignee_id?: string | null; notes?: string[]; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; department_id?: string | null; description?: string; start_date?: string; deadline?: string; status?: Database["pm"]["Enums"]["project_status"]; progress?: number; leader_id?: string | null; assignee_id?: string | null; notes?: string[]; created_at?: string }
        Relationships: []
      }
      project_members: {
        Row: { business_id: string; project_id: string; user_id: string }
        Insert: { business_id: string; project_id: string; user_id: string }
        Update: { business_id?: string; project_id?: string; user_id?: string }
        Relationships: []
      }
      media_files: {
        Row: { id: string; business_id: string; name: string; type: Database["pm"]["Enums"]["media_type"]; url: string; size: string; extension: string; uploaded_by: string; date_added: string; project_id: string | null; department_id: string | null; created_at: string }
        Insert: { id: string; business_id: string; name: string; type: Database["pm"]["Enums"]["media_type"]; url: string; size?: string; extension?: string; uploaded_by?: string; date_added?: string; project_id?: string | null; department_id?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; type?: Database["pm"]["Enums"]["media_type"]; url?: string; size?: string; extension?: string; uploaded_by?: string; date_added?: string; project_id?: string | null; department_id?: string | null; created_at?: string }
        Relationships: []
      }
      employee_tasks: {
        Row: { id: string; business_id: string; name: string; project_id: string; department_id: string | null; category: Database["pm"]["Enums"]["task_category"]; description: string; priority: Database["pm"]["Enums"]["task_priority"]; status: Database["pm"]["Enums"]["task_status"]; progress: number; start_date: string | null; start_time: string | null; due_date: string; due_time: string | null; due_days: number | null; assigned_to: string | null; milestones: Json; position: number; created_at: string }
        Insert: { id: string; business_id: string; name: string; project_id: string; department_id?: string | null; category?: Database["pm"]["Enums"]["task_category"]; description?: string; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; progress?: number; start_date?: string | null; start_time?: string | null; due_date: string; due_time?: string | null; due_days?: number | null; assigned_to?: string | null; milestones?: Json; position?: number; created_at?: string }
        Update: { id?: string; business_id?: string; name?: string; project_id?: string; department_id?: string | null; category?: Database["pm"]["Enums"]["task_category"]; description?: string; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; progress?: number; start_date?: string | null; start_time?: string | null; due_date?: string; due_time?: string | null; due_days?: number | null; assigned_to?: string | null; milestones?: Json; position?: number; created_at?: string }
        Relationships: []
      }
      subtasks: {
        Row: { id: string; business_id: string; task_id: string; name: string; owner_id: string | null; assigned_to: string | null; priority: Database["pm"]["Enums"]["task_priority"]; status: Database["pm"]["Enums"]["task_status"]; start_date: string | null; due_date: string | null; progress: number; position: number; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; name: string; owner_id?: string | null; assigned_to?: string | null; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; start_date?: string | null; due_date?: string | null; progress?: number; position?: number; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; name?: string; owner_id?: string | null; assigned_to?: string | null; priority?: Database["pm"]["Enums"]["task_priority"]; status?: Database["pm"]["Enums"]["task_status"]; start_date?: string | null; due_date?: string | null; progress?: number; position?: number; created_at?: string }
        Relationships: []
      }
      employee_task_comments: {
        Row: { id: string; business_id: string; task_id: string; user_name: string; user_avatar: string; text: string; timestamp: string; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; user_name: string; user_avatar?: string; text: string; timestamp: string; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; user_name?: string; user_avatar?: string; text?: string; timestamp?: string; created_at?: string }
        Relationships: []
      }
      task_submissions: {
        Row: { id: string; business_id: string; task_id: string; user_id: string | null; user_name: string; date: string; work_done: string; notes: string; status: Database["pm"]["Enums"]["submission_status"]; feedback: string | null; created_at: string }
        Insert: { id: string; business_id: string; task_id: string; user_id?: string | null; user_name: string; date: string; work_done?: string; notes?: string; status?: Database["pm"]["Enums"]["submission_status"]; feedback?: string | null; created_at?: string }
        Update: { id?: string; business_id?: string; task_id?: string; user_id?: string | null; user_name?: string; date?: string; work_done?: string; notes?: string; status?: Database["pm"]["Enums"]["submission_status"]; feedback?: string | null; created_at?: string }
        Relationships: []
      }
      task_submission_attachments: {
        Row: { business_id: string; task_submission_id: string; media_file_id: string }
        Insert: { business_id: string; task_submission_id: string; media_file_id: string }
        Update: { business_id?: string; task_submission_id?: string; media_file_id?: string }
        Relationships: []
      }
      attendance: {
        Row: { id: string; business_id: string; user_id: string; date: string; check_in_time: string; check_out_time: string | null; status: Database["pm"]["Enums"]["attendance_status"]; working_hours: number | null; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; date: string; check_in_time: string; check_out_time?: string | null; status?: Database["pm"]["Enums"]["attendance_status"]; working_hours?: number | null; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; date?: string; check_in_time?: string; check_out_time?: string | null; status?: Database["pm"]["Enums"]["attendance_status"]; working_hours?: number | null; created_at?: string }
        Relationships: []
      }
      notifications: {
        Row: { id: string; business_id: string; user_id: string; title: string; message: string; type: Database["pm"]["Enums"]["notification_type"]; time: string; read: boolean; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; title: string; message: string; type: Database["pm"]["Enums"]["notification_type"]; time: string; read?: boolean; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; title?: string; message?: string; type?: Database["pm"]["Enums"]["notification_type"]; time?: string; read?: boolean; created_at?: string }
        Relationships: []
      }
      daily_worklogs: {
        Row: { id: string; business_id: string; user_id: string; user_name: string; date: string; tasks_done: string; problems: string; notes: string; created_at: string }
        Insert: { id: string; business_id: string; user_id: string; user_name: string; date: string; tasks_done?: string; problems?: string; notes?: string; created_at?: string }
        Update: { id?: string; business_id?: string; user_id?: string; user_name?: string; date?: string; tasks_done?: string; problems?: string; notes?: string; created_at?: string }
        Relationships: []
      }
      daily_worklog_attachments: {
        Row: { business_id: string; daily_worklog_id: string; media_file_id: string }
        Insert: { business_id: string; daily_worklog_id: string; media_file_id: string }
        Update: { business_id?: string; daily_worklog_id?: string; media_file_id?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      user_role: "Admin" | "Team Leader" | "Team Member"
      active_status: "Active" | "Inactive"
      project_status: "Planning" | "In Progress" | "In Review" | "Completed"
      task_status: "Todo" | "In Progress" | "Review" | "Completed" | "Cancelled"
      task_priority: "High" | "Medium" | "Low"
      task_category: "daily" | "continuous"
      attendance_status: "Present" | "Late" | "Half Day" | "Absent"
      submission_status: "Pending" | "Approved" | "Changes Requested"
      media_type: "image" | "video" | "document"
      notification_type:
        | "task_assigned"
        | "task_completed"
        | "task_approved"
        | "task_rejected"
        | "new_project"
        | "attendance"
        | "deadline"
    }
    CompositeTypes: { [_ in never]: never }
  }
}
