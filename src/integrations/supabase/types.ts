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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          base_4_drinks: number
          base_5_drinks: number
          base_6_drinks: number
          blue_1_drink: number
          blue_2_plus_drinks: number
          child_percentage: number
          freight_included_km: number
          freight_per_km: number
          glass_rental_per_person: number
          green_increment: number
          green_initial_price: number
          id: number
          maximum_distance_km: number
          maximum_drinks: number
          minimum_drinks: number
          minimum_freight: number
          minimum_guests: number
          origin_address: string
          origin_cep: string
          origin_city: string
          origin_complement: string
          origin_lat: number
          origin_lng: number
          origin_number: string
          origin_state: string
          payment_whatsapp_number: string
          pix_key: string
          pix_qr_url: string
          purple_1_drink: number
          purple_2_plus_drinks: number
          served_cities: string[]
          tasting_address: string
          tasting_cep: string
          tasting_city: string
          tasting_complement: string
          tasting_end_time: string
          tasting_interval_minutes: number
          tasting_neighborhood: string
          tasting_number: string
          tasting_payment_link: string
          tasting_price_per_person: number
          tasting_start_time: string
          tasting_state: string
          updated_at: string
          whatsapp_number: string
        }
        Insert: {
          base_4_drinks?: number
          base_5_drinks?: number
          base_6_drinks?: number
          blue_1_drink?: number
          blue_2_plus_drinks?: number
          child_percentage?: number
          freight_included_km?: number
          freight_per_km?: number
          glass_rental_per_person?: number
          green_increment?: number
          green_initial_price?: number
          id?: number
          maximum_distance_km?: number
          maximum_drinks?: number
          minimum_drinks?: number
          minimum_freight?: number
          minimum_guests?: number
          origin_address?: string
          origin_cep?: string
          origin_city?: string
          origin_complement?: string
          origin_lat?: number
          origin_lng?: number
          origin_number?: string
          origin_state?: string
          payment_whatsapp_number?: string
          pix_key?: string
          pix_qr_url?: string
          purple_1_drink?: number
          purple_2_plus_drinks?: number
          served_cities?: string[]
          tasting_address?: string
          tasting_cep?: string
          tasting_city?: string
          tasting_complement?: string
          tasting_end_time?: string
          tasting_interval_minutes?: number
          tasting_neighborhood?: string
          tasting_number?: string
          tasting_payment_link?: string
          tasting_price_per_person?: number
          tasting_start_time?: string
          tasting_state?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Update: {
          base_4_drinks?: number
          base_5_drinks?: number
          base_6_drinks?: number
          blue_1_drink?: number
          blue_2_plus_drinks?: number
          child_percentage?: number
          freight_included_km?: number
          freight_per_km?: number
          glass_rental_per_person?: number
          green_increment?: number
          green_initial_price?: number
          id?: number
          maximum_distance_km?: number
          maximum_drinks?: number
          minimum_drinks?: number
          minimum_freight?: number
          minimum_guests?: number
          origin_address?: string
          origin_cep?: string
          origin_city?: string
          origin_complement?: string
          origin_lat?: number
          origin_lng?: number
          origin_number?: string
          origin_state?: string
          payment_whatsapp_number?: string
          pix_key?: string
          pix_qr_url?: string
          purple_1_drink?: number
          purple_2_plus_drinks?: number
          served_cities?: string[]
          tasting_address?: string
          tasting_cep?: string
          tasting_city?: string
          tasting_complement?: string
          tasting_end_time?: string
          tasting_interval_minutes?: number
          tasting_neighborhood?: string
          tasting_number?: string
          tasting_payment_link?: string
          tasting_price_per_person?: number
          tasting_start_time?: string
          tasting_state?: string
          updated_at?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      drinks: {
        Row: {
          active: boolean
          base_spirits: string
          category: string
          created_at: string
          id: string
          image_url: string | null
          ingredients: string[]
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_spirits?: string
          category: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string[]
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_spirits?: string
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          ingredients?: string[]
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          address: string | null
          address_complement: string | null
          address_number: string | null
          adults: number
          adults_total: number | null
          applied_category: string | null
          archived_at: string | null
          bar_time: string | null
          buffet_time: string | null
          cep: string | null
          children: number
          children_total: number | null
          city: string | null
          client_cpf: string
          client_name: string
          created_at: string
          distance_km: number | null
          dj_time: string | null
          drink_ids: string[]
          drink_names: string[]
          event_date: string | null
          event_type: string
          freight: number | null
          glass_rental: number | null
          honoree_names: Json
          id: string
          price_per_person: number | null
          public_token: string
          state: string | null
          status: string
          total: number | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          adults?: number
          adults_total?: number | null
          applied_category?: string | null
          archived_at?: string | null
          bar_time?: string | null
          buffet_time?: string | null
          cep?: string | null
          children?: number
          children_total?: number | null
          city?: string | null
          client_cpf: string
          client_name: string
          created_at?: string
          distance_km?: number | null
          dj_time?: string | null
          drink_ids?: string[]
          drink_names?: string[]
          event_date?: string | null
          event_type: string
          freight?: number | null
          glass_rental?: number | null
          honoree_names?: Json
          id?: string
          price_per_person?: number | null
          public_token?: string
          state?: string | null
          status?: string
          total?: number | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          address_complement?: string | null
          address_number?: string | null
          adults?: number
          adults_total?: number | null
          applied_category?: string | null
          archived_at?: string | null
          bar_time?: string | null
          buffet_time?: string | null
          cep?: string | null
          children?: number
          children_total?: number | null
          city?: string | null
          client_cpf?: string
          client_name?: string
          created_at?: string
          distance_km?: number | null
          dj_time?: string | null
          drink_ids?: string[]
          drink_names?: string[]
          event_date?: string | null
          event_type?: string
          freight?: number | null
          glass_rental?: number | null
          honoree_names?: Json
          id?: string
          price_per_person?: number | null
          public_token?: string
          state?: string | null
          status?: string
          total?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          active: boolean
          created_at: string
          id: string
          state_code: string
          state_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          state_code: string
          state_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          state_code?: string
          state_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasting_appointments: {
        Row: {
          client_name: string
          client_phone: string
          created_at: string
          date: string
          duration_minutes: number
          hold_expires_at: string | null
          id: string
          payment_status: string
          people: number
          price_per_person: number
          public_token: string
          quote_id: string | null
          status: string
          time: string
          total: number
          updated_at: string
        }
        Insert: {
          client_name?: string
          client_phone?: string
          created_at?: string
          date: string
          duration_minutes?: number
          hold_expires_at?: string | null
          id?: string
          payment_status?: string
          people?: number
          price_per_person?: number
          public_token?: string
          quote_id?: string | null
          status?: string
          time: string
          total?: number
          updated_at?: string
        }
        Update: {
          client_name?: string
          client_phone?: string
          created_at?: string
          date?: string
          duration_minutes?: number
          hold_expires_at?: string | null
          id?: string
          payment_status?: string
          people?: number
          price_per_person?: number
          public_token?: string
          quote_id?: string | null
          status?: string
          time?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasting_appointments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      tasting_availability: {
        Row: {
          active: boolean
          blocked_times: string[]
          created_at: string
          date: string
          end_time: string
          id: string
          interval_minutes: number
          start_time: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          blocked_times?: string[]
          created_at?: string
          date: string
          end_time?: string
          id?: string
          interval_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          blocked_times?: string[]
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          interval_minutes?: number
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin"],
    },
  },
} as const
