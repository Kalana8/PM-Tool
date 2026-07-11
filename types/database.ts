// Generated to match the applied database migrations (Tool Project).
// Regenerate after schema changes:
// supabase gen types typescript --project-id uaifxlpiwuupwiqfyzvl --schema public --schema pm > types/database.ts
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
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
