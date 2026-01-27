export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bug_attachments: {
        Row: {
          bug_id: string
          created_at: string
          id: string
          name: string
          size: number | null
          type: string | null
          url: string
        }
        Insert: {
          bug_id: string
          created_at?: string
          id?: string
          name: string
          size?: number | null
          type?: string | null
          url: string
        }
        Update: {
          bug_id?: string
          created_at?: string
          id?: string
          name?: string
          size?: number | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_attachments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_comments: {
        Row: {
          author_id: string | null
          bug_id: string
          content: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          bug_id: string
          content: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          bug_id?: string
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_comments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bug_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_reports: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          bug_id: string
          created_at: string
          description: string | null
          expected_behavior: string | null
          id: string
          reported_by: string | null
          severity: Database["public"]["Enums"]["bug_severity"]
          status: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce: string | null
          task_id: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_behavior?: string | null
          assigned_to?: string | null
          bug_id: string
          created_at?: string
          description?: string | null
          expected_behavior?: string | null
          id?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["bug_severity"]
          status?: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce?: string | null
          task_id: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_behavior?: string | null
          assigned_to?: string | null
          bug_id?: string
          created_at?: string
          description?: string | null
          expected_behavior?: string | null
          id?: string
          reported_by?: string | null
          severity?: Database["public"]["Enums"]["bug_severity"]
          status?: Database["public"]["Enums"]["bug_status"]
          steps_to_reproduce?: string | null
          task_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bug_reports_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bug_reports_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_attachments: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          name: string
          size: number | null
          type: string | null
          url: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          name: string
          size?: number | null
          type?: string | null
          url: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          name?: string
          size?: number | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_attachments_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string | null
          size: number | null
          task_id: string | null
          type: string | null
          uploaded_by: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id?: string | null
          size?: number | null
          task_id?: string | null
          type?: string | null
          uploaded_by?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string | null
          size?: number | null
          task_id?: string | null
          type?: string | null
          uploaded_by?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          designation: string | null
          email: string
          id: string
          name: string
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          email: string
          id?: string
          name: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          designation?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          permission_key: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          permission_key?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          assignee_id: string
          created_at: string
          id: string
          task_id: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          id?: string
          task_id: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id: string
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_stats: {
        Row: {
          avg_resolution_time: number
          badges: string[]
          bugs_reported: number
          bugs_resolved: number
          calculated_at: string
          created_at: string
          critical_bugs_fixed: number
          id: string
          profile_id: string
          rank: number
          score: number
          tasks_assigned: number
          tasks_completed: number
          test_cases_approved: number
          trend: string
          updated_at: string
        }
        Insert: {
          avg_resolution_time?: number
          badges?: string[]
          bugs_reported?: number
          bugs_resolved?: number
          calculated_at?: string
          created_at?: string
          critical_bugs_fixed?: number
          id?: string
          profile_id: string
          rank?: number
          score?: number
          tasks_assigned?: number
          tasks_completed?: number
          test_cases_approved?: number
          trend?: string
          updated_at?: string
        }
        Update: {
          avg_resolution_time?: number
          badges?: string[]
          bugs_reported?: number
          bugs_resolved?: number
          calculated_at?: string
          created_at?: string
          critical_bugs_fixed?: number
          id?: string
          profile_id?: string
          rank?: number
          score?: number
          tasks_assigned?: number
          tasks_completed?: number
          test_cases_approved?: number
          trend?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_stats_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_case_documents: {
        Row: {
          document_name: string
          document_size: number | null
          document_type: string | null
          document_url: string
          id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["test_case_status"]
          submitted_at: string
          submitted_by: string | null
          task_id: string
        }
        Insert: {
          document_name: string
          document_size?: number | null
          document_type?: string | null
          document_url: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["test_case_status"]
          submitted_at?: string
          submitted_by?: string | null
          task_id: string
        }
        Update: {
          document_name?: string
          document_size?: number | null
          document_type?: string | null
          document_url?: string
          id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["test_case_status"]
          submitted_at?: string
          submitted_by?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_case_documents_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_case_documents_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_case_documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheet_entries: {
        Row: {
          created_at: string
          date: string
          description: string
          end_time: string | null
          entry_type: string
          hours: number | null
          id: string
          minutes: number | null
          project_id: string | null
          start_time: string | null
          task_id: string | null
          total_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          description: string
          end_time?: string | null
          entry_type: string
          hours?: number | null
          id?: string
          minutes?: number | null
          project_id?: string | null
          start_time?: string | null
          task_id?: string | null
          total_minutes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          end_time?: string | null
          entry_type?: string
          hours?: number | null
          id?: string
          minutes?: number | null
          project_id?: string | null
          start_time?: string | null
          task_id?: string | null
          total_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "team_lead"
        | "backend_developer"
        | "frontend_developer"
        | "mobile_developer"
        | "testing_team"
      bug_severity: "low" | "medium" | "high" | "critical"
      bug_status: "open" | "in_progress" | "resolved" | "closed" | "reopened"
      project_type: "crm" | "website" | "mobile_app" | "internal_software"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "draft"
        | "backlog"
        | "in_progress"
        | "development_in_progress"
        | "review_pending"
        | "testing_in_progress"
        | "testing_failed"
        | "ui_completed"
        | "uat_approved"
        | "live"
      test_case_status: "pending" | "approved" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
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
    Enums: {
      app_role: [
        "admin",
        "manager",
        "team_lead",
        "backend_developer",
        "frontend_developer",
        "mobile_developer",
        "testing_team",
      ],
      bug_severity: ["low", "medium", "high", "critical"],
      bug_status: ["open", "in_progress", "resolved", "closed", "reopened"],
      project_type: ["crm", "website", "mobile_app", "internal_software"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "draft",
        "backlog",
        "in_progress",
        "development_in_progress",
        "review_pending",
        "testing_in_progress",
        "testing_failed",
        "ui_completed",
        "uat_approved",
        "live",
      ],
      test_case_status: ["pending", "approved", "rejected"],
    },
  },
} as const
