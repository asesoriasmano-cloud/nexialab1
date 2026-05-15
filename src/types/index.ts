export type BusinessCategory =
  | 'salon' | 'barbershop' | 'nails' | 'tattoo' | 'massage'
  | 'personal_training' | 'pet_grooming' | 'photography'
  | 'coaching' | 'tutoring' | 'other'

export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export type Plan = 'free' | 'starter' | 'professional' | 'enterprise'

export interface Business {
  id: string
  owner_id: string
  name: string
  slug: string
  description?: string
  category: BusinessCategory
  logo_url?: string
  cover_url?: string
  primary_color: string
  secondary_color: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  country: string
  timezone: string
  currency: string
  booking_window_days: number
  min_advance_hours: number
  cancellation_hours: number
  deposit_required: boolean
  deposit_percentage: number
  stripe_account_id?: string
  plan: Plan
  plan_expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Staff {
  id: string
  business_id: string
  profile_id?: string
  name: string
  email?: string
  phone?: string
  bio?: string
  avatar_url?: string
  role: 'owner' | 'staff'
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  business_id: string
  name: string
  description?: string
  category?: string
  duration_minutes: number
  buffer_minutes: number
  price: number
  deposit_amount?: number
  max_clients: number
  color: string
  image_url?: string
  is_active: boolean
  requires_intake: boolean
  intake_questions: IntakeQuestion[]
  created_at: string
  updated_at: string
}

export interface IntakeQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'multiselect' | 'boolean'
  required: boolean
  options?: string[]
}

export interface WorkingHours {
  id: string
  business_id?: string
  staff_id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

export interface Client {
  id: string
  business_id: string
  profile_id?: string
  name: string
  email?: string
  phone?: string
  notes?: string
  tags: string[]
  birth_date?: string
  address?: string
  total_spent: number
  visit_count: number
  no_show_count: number
  last_visit_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  business_id: string
  client_id?: string
  staff_id?: string
  service_id?: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  notes?: string
  internal_notes?: string
  price?: number
  deposit_amount: number
  deposit_paid: boolean
  intake_responses: Record<string, string | string[] | boolean>
  source: string
  is_recurring: boolean
  recurring_group_id?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
  client?: Client
  staff?: Staff
  service?: Service
}

export interface TimeSlot {
  time: string
  available: boolean
  staff_id?: string
}

export interface DashboardStats {
  todayAppointments: number
  weekRevenue: number
  monthRevenue: number
  newClientsMonth: number
  occupancyRate: number
  noShowRate: number
}
