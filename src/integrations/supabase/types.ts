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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          admin_id: string
          created_at: string | null
          custom_domain: string | null
          domain_status: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          total_licenses: number
          updated_at: string | null
          used_licenses: number
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          custom_domain?: string | null
          domain_status?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          total_licenses?: number
          updated_at?: string | null
          used_licenses?: number
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          custom_domain?: string | null
          domain_status?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          total_licenses?: number
          updated_at?: string | null
          used_licenses?: number
        }
        Relationships: []
      }
      company_licenses: {
        Row: {
          amount_paid: number
          company_id: string
          created_at: string | null
          id: string
          payment_id: string | null
          quantity: number
          razorpay_order_id: string | null
          status: string | null
        }
        Insert: {
          amount_paid: number
          company_id: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          quantity: number
          razorpay_order_id?: string | null
          status?: string | null
        }
        Update: {
          amount_paid?: number
          company_id?: string
          created_at?: string | null
          id?: string
          payment_id?: string | null
          quantity?: number
          razorpay_order_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_licenses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      country_prefixes: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          dial_code: string
          flag_emoji: string
          id: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          dial_code: string
          flag_emoji: string
          id?: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          dial_code?: string
          flag_emoji?: string
          id?: string
        }
        Relationships: []
      }
      forms: {
        Row: {
          created_at: string
          created_by_id: string
          description: string | null
          fields: Json
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_id: string
          description?: string | null
          fields?: Json
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_id?: string
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          service_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          service_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          service_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          batch_month: string | null
          branch: string | null
          ca_name: string | null
          cgpa: number | null
          college: string | null
          company: string | null
          created_at: string
          created_by_id: string
          domain: string | null
          email: string | null
          form_id: string | null
          graduating_year: number | null
          id: string
          lead_source: string | null
          lg_link_id: string | null
          name: string
          payment_link: string | null
          phone: string | null
          post_sales_owner_id: string | null
          pre_sales_owner_id: string | null
          preferred_language: string | null
          product_purchased: string | null
          revenue_projected: number | null
          revenue_received: number | null
          sales_owner_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          total_recovered: number | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string | null
        }
        Insert: {
          batch_month?: string | null
          branch?: string | null
          ca_name?: string | null
          cgpa?: number | null
          college?: string | null
          company?: string | null
          created_at?: string
          created_by_id: string
          domain?: string | null
          email?: string | null
          form_id?: string | null
          graduating_year?: number | null
          id?: string
          lead_source?: string | null
          lg_link_id?: string | null
          name: string
          payment_link?: string | null
          phone?: string | null
          post_sales_owner_id?: string | null
          pre_sales_owner_id?: string | null
          preferred_language?: string | null
          product_purchased?: string | null
          revenue_projected?: number | null
          revenue_received?: number | null
          sales_owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          total_recovered?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Update: {
          batch_month?: string | null
          branch?: string | null
          ca_name?: string | null
          cgpa?: number | null
          college?: string | null
          company?: string | null
          created_at?: string
          created_by_id?: string
          domain?: string | null
          email?: string | null
          form_id?: string | null
          graduating_year?: number | null
          id?: string
          lead_source?: string | null
          lg_link_id?: string | null
          name?: string
          payment_link?: string | null
          phone?: string | null
          post_sales_owner_id?: string | null
          pre_sales_owner_id?: string | null
          preferred_language?: string | null
          product_purchased?: string | null
          revenue_projected?: number | null
          revenue_received?: number | null
          sales_owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          total_recovered?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lg_link_id_fkey"
            columns: ["lg_link_id"]
            isOneToOne: false
            referencedRelation: "lg_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_post_sales_owner_id_fkey"
            columns: ["post_sales_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pre_sales_owner_id_fkey"
            columns: ["pre_sales_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sales_owner_id_fkey"
            columns: ["sales_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lg_links: {
        Row: {
          ca_name: string
          created_at: string
          created_by_id: string
          form_id: string
          id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string
        }
        Insert: {
          ca_name: string
          created_at?: string
          created_by_id: string
          form_id: string
          id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source: string
        }
        Update: {
          ca_name?: string
          created_at?: string
          created_by_id?: string
          form_id?: string
          id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "lg_links_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lg_links_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          manager_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          manager_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referred_by: string | null
          total_referrals: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_by?: string | null
          total_referrals?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_by?: string | null
          total_referrals?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          created_at: string
          credits: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
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
      add_company_licenses: {
        Args: { _company_id: string; _quantity: number }
        Returns: boolean
      }
      add_credits: {
        Args: { amount: number; transaction_label: string }
        Returns: boolean
      }
      can_add_team_member: { Args: { _company_id: string }; Returns: boolean }
      can_promote_user: {
        Args: {
          _new_role: Database["public"]["Enums"]["app_role"]
          _promoter_id: string
          _target_user_id: string
        }
        Returns: boolean
      }
      decrement_used_licenses: {
        Args: { _company_id: string }
        Returns: boolean
      }
      deduct_ai_credits: { Args: { amount?: number }; Returns: undefined }
      deduct_credits:
        | {
            Args: { amount: number; reason: string; transaction_type?: string }
            Returns: undefined
          }
        | {
            Args: { amount: number; transaction_label: string }
            Returns: boolean
          }
      generate_referral_code: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_company_by_domain: { Args: { _domain: string }; Returns: string }
      get_role_level: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: number
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
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
      increment_used_licenses: {
        Args: { _company_id: string }
        Returns: boolean
      }
      is_company_admin: { Args: { _user_id: string }; Returns: boolean }
      is_in_hierarchy: {
        Args: { _manager_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_monthly_xp: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role:
        | "platform_admin"
        | "company"
        | "company_subadmin"
        | "cbo"
        | "vp"
        | "avp"
        | "dgm"
        | "agm"
        | "sm"
        | "tl"
        | "bde"
        | "intern"
        | "ca"
      lead_status:
        | "new"
        | "interested"
        | "not_interested"
        | "follow_up"
        | "rnr"
        | "dnd"
        | "paid"
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
        "platform_admin",
        "company",
        "company_subadmin",
        "cbo",
        "vp",
        "avp",
        "dgm",
        "agm",
        "sm",
        "tl",
        "bde",
        "intern",
        "ca",
      ],
      lead_status: [
        "new",
        "interested",
        "not_interested",
        "follow_up",
        "rnr",
        "dnd",
        "paid",
      ],
    },
  },
} as const
