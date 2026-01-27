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
          billing_cycle_anchor: string | null
          created_at: string | null
          custom_domain: string | null
          custom_leads_table: string | null
          domain_status: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          subscription_status: string | null
          subscription_valid_until: string | null
          total_licenses: number
          unique_constraints: string[] | null
          updated_at: string | null
          used_licenses: number
        }
        Insert: {
          admin_id: string
          billing_cycle_anchor?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_leads_table?: string | null
          domain_status?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          subscription_status?: string | null
          subscription_valid_until?: string | null
          total_licenses?: number
          unique_constraints?: string[] | null
          updated_at?: string | null
          used_licenses?: number
        }
        Update: {
          admin_id?: string
          billing_cycle_anchor?: string | null
          created_at?: string | null
          custom_domain?: string | null
          custom_leads_table?: string | null
          domain_status?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          subscription_status?: string | null
          subscription_valid_until?: string | null
          total_licenses?: number
          unique_constraints?: string[] | null
          updated_at?: string | null
          used_licenses?: number
        }
        Relationships: []
      }
      company_hierarchies: {
        Row: {
          company_id: string
          created_at: string
          level_1: string
          level_10: string
          level_11: string
          level_12: string
          level_13: string
          level_14: string
          level_15: string
          level_16: string
          level_17: string
          level_18: string
          level_19: string
          level_2: string
          level_20: string
          level_3: string
          level_4: string
          level_5: string
          level_6: string
          level_7: string
          level_8: string
          level_9: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          level_1?: string
          level_10?: string
          level_11?: string
          level_12?: string
          level_13?: string
          level_14?: string
          level_15?: string
          level_16?: string
          level_17?: string
          level_18?: string
          level_19?: string
          level_2?: string
          level_20?: string
          level_3?: string
          level_4?: string
          level_5?: string
          level_6?: string
          level_7?: string
          level_8?: string
          level_9?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          level_1?: string
          level_10?: string
          level_11?: string
          level_12?: string
          level_13?: string
          level_14?: string
          level_15?: string
          level_16?: string
          level_17?: string
          level_18?: string
          level_19?: string
          level_2?: string
          level_20?: string
          level_3?: string
          level_4?: string
          level_5?: string
          level_6?: string
          level_7?: string
          level_8?: string
          level_9?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_hierarchies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      debug_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          discount_percentage: number
          total_uses: number | null
          uses_count: number | null
          valid_until: string | null
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          discount_percentage: number
          total_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          discount_percentage?: number
          total_uses?: number | null
          uses_count?: number | null
          valid_until?: string | null
        }
        Relationships: []
      }
      domain_verification: {
        Row: {
          company_id: string
          created_at: string | null
          domain: string
          id: string
          is_verified: boolean | null
          txt_record_name: string
          txt_record_value: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          domain: string
          id?: string
          is_verified?: boolean | null
          txt_record_name: string
          txt_record_value: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          domain?: string
          id?: string
          is_verified?: boolean | null
          txt_record_name?: string
          txt_record_value?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domain_verification_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      gift_cards: {
        Row: {
          active: boolean | null
          amount: number
          code: string
          created_at: string | null
          expires_at: string | null
          is_redeemed: boolean | null
          redeemed_at: string | null
          redeemed_by: string | null
        }
        Insert: {
          active?: boolean | null
          amount: number
          code: string
          created_at?: string | null
          expires_at?: string | null
          is_redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Update: {
          active?: boolean | null
          amount?: number
          code?: string
          created_at?: string | null
          expires_at?: string | null
          is_redeemed?: boolean | null
          redeemed_at?: string | null
          redeemed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_cards_redeemed_by_fkey"
            columns: ["redeemed_by"]
            isOneToOne: false
            referencedRelation: "companies"
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
          company_id: string | null
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
          product_category: string | null
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
          company_id?: string | null
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
          product_category?: string | null
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
          company_id?: string | null
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
          product_category?: string | null
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
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      leads_weskill: {
        Row: {
          batch_month: string | null
          branch: string | null
          ca_name: string | null
          cgpa: number | null
          college: string | null
          company: string | null
          company_id: string | null
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
          product_category: string | null
          product_purchased: string | null
          revenue_projected: number | null
          revenue_received: number | null
          sales_owner_id: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          test_atribute: string | null
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
          company_id?: string | null
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
          product_category?: string | null
          product_purchased?: string | null
          revenue_projected?: number | null
          revenue_received?: number | null
          sales_owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          test_atribute?: string | null
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
          company_id?: string | null
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
          product_category?: string | null
          product_purchased?: string | null
          revenue_projected?: number | null
          revenue_received?: number | null
          sales_owner_id?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          test_atribute?: string | null
          total_recovered?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string | null
        }
        Relationships: []
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
      products: {
        Row: {
          category: string
          company_id: string
          created_at: string
          id: string
          name: string
          price: number
          quantity_available: number | null
          updated_at: string
        }
        Insert: {
          category: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          price?: number
          quantity_available?: number | null
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          quantity_available?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          status: Database["public"]["Enums"]["wallet_transaction_status"]
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          type: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          status?: Database["public"]["Enums"]["wallet_transaction_status"]
          type?: Database["public"]["Enums"]["wallet_transaction_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["company_id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          company_id: string
          created_at: string | null
          currency: string
          updated_at: string | null
        }
        Insert: {
          balance?: number
          company_id: string
          created_at?: string | null
          currency?: string
          updated_at?: string | null
        }
        Update: {
          balance?: number
          company_id?: string
          created_at?: string | null
          currency?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      add_lead_attribute: {
        Args: {
          attribute_name: string
          attribute_type?: string
          input_company_id: string
        }
        Returns: Json
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
      debug_company_status: { Args: never; Returns: Json }
      debug_get_constraints: { Args: { target_table: string }; Returns: Json }
      debug_rls_status: { Args: { target_table: string }; Returns: Json }
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
      deduplicate_leads: {
        Args: { attribute_name: string; input_table_name: string }
        Returns: undefined
      }
      enable_custom_leads_table: {
        Args: { input_company_id: string }
        Returns: Json
      }
      fix_custom_table_rls: {
        Args: { input_table_name: string }
        Returns: undefined
      }
      fix_custom_table_rls_comprehensive: {
        Args: { input_table_name: string }
        Returns: undefined
      }
      get_company_by_domain: { Args: { _domain: string }; Returns: string }
      get_company_lead_columns: {
        Args: { input_company_id: string }
        Returns: {
          column_name: string
          data_type: string
          is_nullable: string
        }[]
      }
      get_lead_unique_constraints: {
        Args: { input_company_id: string }
        Returns: Json
      }
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
      remove_lead_attribute: {
        Args: { attribute_name: string; input_company_id: string }
        Returns: Json
      }
      reset_monthly_xp: { Args: never; Returns: undefined }
      toggle_lead_unique_constraint: {
        Args: {
          attribute_name: string
          input_company_id: string
          is_unique: boolean
        }
        Returns: Json
      }
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
      | "level_3"
      | "level_4"
      | "level_5"
      | "level_6"
      | "level_7"
      | "level_8"
      | "level_9"
      | "level_10"
      | "level_11"
      | "level_12"
      | "level_13"
      | "level_14"
      | "level_15"
      | "level_16"
      | "level_17"
      | "level_18"
      | "level_19"
      | "level_20"
      lead_status:
      | "new"
      | "interested"
      | "not_interested"
      | "follow_up"
      | "rnr"
      | "dnd"
      | "paid"
      wallet_transaction_status: "pending" | "success" | "failed"
      wallet_transaction_type:
      | "credit_recharge"
      | "credit_gift_card"
      | "debit_license_purchase"
      | "debit_auto_renewal"
      | "debit_manual_adjustment"
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
        "level_3",
        "level_4",
        "level_5",
        "level_6",
        "level_7",
        "level_8",
        "level_9",
        "level_10",
        "level_11",
        "level_12",
        "level_13",
        "level_14",
        "level_15",
        "level_16",
        "level_17",
        "level_18",
        "level_19",
        "level_20",
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
      wallet_transaction_status: ["pending", "success", "failed"],
      wallet_transaction_type: [
        "credit_recharge",
        "credit_gift_card",
        "debit_license_purchase",
        "debit_auto_renewal",
        "debit_manual_adjustment",
      ],
    },
  },
} as const
