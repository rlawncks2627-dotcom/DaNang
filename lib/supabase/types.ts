// Supabase 스키마에서 생성된 타입.
// 스키마를 바꾸면 다시 생성한다:
//   npx supabase gen types typescript --project-id zvvcziaayljdiwupwawc > lib/supabase/types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.15'
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string | null
          address_local: string | null
          confirmation_no: string | null
          created_at: string
          ends_at: string | null
          file_url: string | null
          id: string
          is_emergency: boolean
          memo: string | null
          phone: string | null
          sort_order: number
          starts_at: string | null
          title: string
          trip_id: string
          type: string
        }
        Insert: {
          address?: string | null
          address_local?: string | null
          confirmation_no?: string | null
          created_at?: string
          ends_at?: string | null
          file_url?: string | null
          id?: string
          is_emergency?: boolean
          memo?: string | null
          phone?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          trip_id: string
          type?: string
        }
        Update: {
          address?: string | null
          address_local?: string | null
          confirmation_no?: string | null
          created_at?: string
          ends_at?: string | null
          file_url?: string | null
          id?: string
          is_emergency?: boolean
          memo?: string | null
          phone?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          trip_id?: string
          type?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          created_at: string
          done_at: string | null
          done_by: string | null
          id: string
          is_done: boolean
          owner_id: string | null
          sort_order: number
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          sort_order?: number
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          done_at?: string | null
          done_by?: string | null
          id?: string
          is_done?: boolean
          owner_id?: string | null
          sort_order?: number
          title?: string
          trip_id?: string
        }
        Relationships: []
      }
      expense_shares: {
        Row: {
          expense_id: string
          member_id: string
        }
        Insert: {
          expense_id: string
          member_id: string
        }
        Update: {
          expense_id?: string
          member_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount_krw: number | null
          amount_vnd: number | null
          category: string
          created_at: string
          id: string
          memo: string | null
          paid_by: string
          receipt_url: string | null
          spent_at: string
          title: string
          trip_id: string
        }
        Insert: {
          amount_krw?: number | null
          amount_vnd?: number | null
          category?: string
          created_at?: string
          id?: string
          memo?: string | null
          paid_by: string
          receipt_url?: string | null
          spent_at?: string
          title: string
          trip_id: string
        }
        Update: {
          amount_krw?: number | null
          amount_vnd?: number | null
          category?: string
          created_at?: string
          id?: string
          memo?: string | null
          paid_by?: string
          receipt_url?: string | null
          spent_at?: string
          title?: string
          trip_id?: string
        }
        Relationships: []
      }
      itinerary: {
        Row: {
          created_at: string
          created_by: string | null
          day_date: string
          id: string
          kind: string
          memo: string | null
          place_id: string | null
          sort_order: number
          start_time: string | null
          title: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          day_date: string
          id?: string
          kind?: string
          memo?: string | null
          place_id?: string | null
          sort_order?: number
          start_time?: string | null
          title: string
          trip_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          day_date?: string
          id?: string
          kind?: string
          memo?: string | null
          place_id?: string | null
          sort_order?: number
          start_time?: string | null
          title?: string
          trip_id?: string
        }
        Relationships: []
      }
      members: {
        Row: {
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
          sort_order: number
          trip_id: string
          user_id: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          sort_order?: number
          trip_id: string
          user_id?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          sort_order?: number
          trip_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          member_id: string | null
          photo_urls: string[]
          trip_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          photo_urls?: string[]
          trip_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          member_id?: string | null
          photo_urls?: string[]
          trip_id?: string
        }
        Relationships: []
      }
      place_votes: {
        Row: {
          created_at: string
          member_id: string
          place_id: string
        }
        Insert: {
          created_at?: string
          member_id: string
          place_id: string
        }
        Update: {
          created_at?: string
          member_id?: string
          place_id?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          gmap_url: string | null
          id: string
          name: string
          name_local: string | null
          price_level: string | null
          ref_url: string | null
          status: string
          trip_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          gmap_url?: string | null
          id?: string
          name: string
          name_local?: string | null
          price_level?: string | null
          ref_url?: string | null
          status?: string
          trip_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          gmap_url?: string | null
          id?: string
          name?: string
          name_local?: string | null
          price_level?: string | null
          ref_url?: string | null
          status?: string
          trip_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          base_rate_vnd_krw: number
          created_at: string
          destination: string
          end_date: string | null
          id: string
          join_code: string
          start_date: string | null
          title: string
        }
        Insert: {
          base_rate_vnd_krw?: number
          created_at?: string
          destination?: string
          end_date?: string | null
          id?: string
          join_code: string
          start_date?: string | null
          title: string
        }
        Update: {
          base_rate_vnd_krw?: number
          created_at?: string
          destination?: string
          end_date?: string | null
          id?: string
          join_code?: string
          start_date?: string | null
          title?: string
        }
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: {
      claim_member: {
        Args: { p_code: string; p_member_id: string }
        Returns: Database['public']['Tables']['members']['Row']
      }
      is_trip_member: { Args: { p_trip_id: string }; Returns: boolean }
      list_member_slots: {
        Args: { p_code: string }
        Returns: {
          color: string
          emoji: string
          id: string
          is_taken: boolean
          name: string
        }[]
      }
      lookup_trip: {
        Args: { p_code: string }
        Returns: {
          destination: string
          end_date: string | null
          start_date: string | null
          title: string
          trip_id: string
        }[]
      }
      my_member_id: { Args: { p_trip_id: string }; Returns: string }
    }
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']

// 앱 전반에서 쓰는 별칭
export type Trip = Tables<'trips'>
export type Member = Tables<'members'>
export type Place = Tables<'places'>
export type PlaceVote = Tables<'place_votes'>
export type ItineraryItem = Tables<'itinerary'>
export type Expense = Tables<'expenses'>
export type ExpenseShare = Tables<'expense_shares'>
export type ChecklistItem = Tables<'checklists'>
export type Booking = Tables<'bookings'>
export type Note = Tables<'notes'>

export type MemberSlot =
  PublicSchema['Functions']['list_member_slots']['Returns'][number]

export const PLACE_CATEGORIES = [
  { value: 'food', label: '맛집', emoji: '🍜' },
  { value: 'cafe', label: '카페', emoji: '☕' },
  { value: 'sight', label: '관광', emoji: '🏖' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍' },
  { value: 'massage', label: '마사지', emoji: '💆' },
  { value: 'etc', label: '기타', emoji: '📌' },
] as const

export const ITINERARY_KINDS = [
  { value: 'move', label: '이동', emoji: '🚕' },
  { value: 'meal', label: '식사', emoji: '🍽' },
  { value: 'sight', label: '관광', emoji: '📸' },
  { value: 'rest', label: '휴식', emoji: '😴' },
] as const

export const EXPENSE_CATEGORIES = [
  { value: 'food', label: '식비', emoji: '🍽' },
  { value: 'transport', label: '교통', emoji: '🚕' },
  { value: 'ticket', label: '입장료', emoji: '🎟' },
  { value: 'shopping', label: '쇼핑', emoji: '🛍' },
  { value: 'stay', label: '숙박', emoji: '🏨' },
  { value: 'etc', label: '기타', emoji: '💳' },
] as const

export const BOOKING_TYPES = [
  { value: 'flight', label: '항공', emoji: '✈️' },
  { value: 'hotel', label: '숙소', emoji: '🏨' },
  { value: 'pickup', label: '픽업·투어', emoji: '🚐' },
  { value: 'etc', label: '기타', emoji: '📄' },
] as const
