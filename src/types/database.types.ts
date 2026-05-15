export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string | null
          category: string
          logo_url: string | null
          cover_url: string | null
          primary_color: string
          secondary_color: string
          phone: string | null
          email: string | null
          website: string | null
          address: string | null
          city: string | null
          country: string
          timezone: string
          currency: string
          booking_window_days: number
          min_advance_hours: number
          cancellation_hours: number
          deposit_required: boolean
          deposit_percentage: number
          stripe_account_id: string | null
          stripe_customer_id: string | null
          plan: string
          plan_expires_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          description?: string | null
          category?: string
          logo_url?: string | null
          cover_url?: string | null
          primary_color?: string
          secondary_color?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string
          timezone?: string
          currency?: string
          booking_window_days?: number
          min_advance_hours?: number
          cancellation_hours?: number
          deposit_required?: boolean
          deposit_percentage?: number
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          plan?: string
          plan_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          logo_url?: string | null
          cover_url?: string | null
          primary_color?: string
          secondary_color?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          address?: string | null
          city?: string | null
          country?: string
          timezone?: string
          currency?: string
          booking_window_days?: number
          min_advance_hours?: number
          cancellation_hours?: number
          deposit_required?: boolean
          deposit_percentage?: number
          stripe_account_id?: string | null
          stripe_customer_id?: string | null
          plan?: string
          plan_expires_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          business_id: string
          profile_id: string | null
          name: string
          email: string | null
          phone: string | null
          bio: string | null
          avatar_url: string | null
          role: string
          color: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          profile_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: string
          color?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          category: string | null
          duration_minutes: number
          buffer_minutes: number
          price: number
          deposit_amount: number | null
          max_clients: number
          color: string
          image_url: string | null
          is_active: boolean
          requires_intake: boolean
          intake_questions: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          category?: string | null
          duration_minutes?: number
          buffer_minutes?: number
          price?: number
          deposit_amount?: number | null
          max_clients?: number
          color?: string
          image_url?: string | null
          is_active?: boolean
          requires_intake?: boolean
          intake_questions?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          category?: string | null
          duration_minutes?: number
          buffer_minutes?: number
          price?: number
          deposit_amount?: number | null
          max_clients?: number
          color?: string
          image_url?: string | null
          is_active?: boolean
          requires_intake?: boolean
          intake_questions?: Json
          created_at?: string
          updated_at?: string
        }
      }
      working_hours: {
        Row: {
          id: string
          business_id: string | null
          staff_id: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active: boolean
        }
        Insert: {
          id?: string
          business_id?: string | null
          staff_id?: string | null
          day_of_week: number
          start_time: string
          end_time: string
          is_active?: boolean
        }
        Update: {
          id?: string
          business_id?: string | null
          staff_id?: string | null
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_active?: boolean
        }
      }
      blocked_times: {
        Row: {
          id: string
          business_id: string
          staff_id: string | null
          title: string
          start_time: string
          end_time: string
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          staff_id?: string | null
          title?: string
          start_time: string
          end_time: string
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          staff_id?: string | null
          title?: string
          start_time?: string
          end_time?: string
          reason?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          business_id: string
          profile_id: string | null
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          tags: string[]
          birth_date: string | null
          address: string | null
          total_spent: number
          visit_count: number
          no_show_count: number
          last_visit_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          profile_id?: string | null
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          tags?: string[]
          birth_date?: string | null
          address?: string | null
          total_spent?: number
          visit_count?: number
          no_show_count?: number
          last_visit_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          profile_id?: string | null
          name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          tags?: string[]
          birth_date?: string | null
          address?: string | null
          total_spent?: number
          visit_count?: number
          no_show_count?: number
          last_visit_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          business_id: string
          client_id: string | null
          staff_id: string | null
          service_id: string | null
          start_time: string
          end_time: string
          status: string
          notes: string | null
          internal_notes: string | null
          price: number | null
          deposit_amount: number
          deposit_paid: boolean
          intake_responses: Json
          source: string
          recurring_group_id: string | null
          is_recurring: boolean
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmed_at: string | null
          completed_at: string | null
          reminder_24h_sent: boolean
          reminder_2h_sent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          client_id?: string | null
          staff_id?: string | null
          service_id?: string | null
          start_time: string
          end_time: string
          status?: string
          notes?: string | null
          internal_notes?: string | null
          price?: number | null
          deposit_amount?: number
          deposit_paid?: boolean
          intake_responses?: Json
          source?: string
          recurring_group_id?: string | null
          is_recurring?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          client_id?: string | null
          staff_id?: string | null
          service_id?: string | null
          start_time?: string
          end_time?: string
          status?: string
          notes?: string | null
          internal_notes?: string | null
          price?: number | null
          deposit_amount?: number
          deposit_paid?: boolean
          intake_responses?: Json
          source?: string
          recurring_group_id?: string | null
          is_recurring?: boolean
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          reminder_24h_sent?: boolean
          reminder_2h_sent?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          business_id: string
          appointment_id: string | null
          client_id: string | null
          amount: number
          currency: string
          status: string
          payment_method: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          appointment_id?: string | null
          client_id?: string | null
          amount: number
          currency?: string
          status?: string
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          appointment_id?: string | null
          client_id?: string | null
          amount?: number
          currency?: string
          status?: string
          payment_method?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      packages: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          service_id: string | null
          sessions_count: number
          price: number
          valid_days: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          service_id?: string | null
          sessions_count?: number
          price: number
          valid_days?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          service_id?: string | null
          sessions_count?: number
          price?: number
          valid_days?: number
          is_active?: boolean
          created_at?: string
        }
      }
      client_packages: {
        Row: {
          id: string
          package_id: string
          client_id: string
          business_id: string
          sessions_remaining: number
          sessions_total: number
          expires_at: string | null
          payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          client_id: string
          business_id: string
          sessions_remaining: number
          sessions_total: number
          expires_at?: string | null
          payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          client_id?: string
          business_id?: string
          sessions_remaining?: number
          sessions_total?: number
          expires_at?: string | null
          payment_id?: string | null
          created_at?: string
        }
      }
      staff_services: {
        Row: {
          id: string
          staff_id: string
          service_id: string
          price_override: number | null
          duration_override: number | null
        }
        Insert: {
          id?: string
          staff_id: string
          service_id: string
          price_override?: number | null
          duration_override?: number | null
        }
        Update: {
          id?: string
          staff_id?: string
          service_id?: string
          price_override?: number | null
          duration_override?: number | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
