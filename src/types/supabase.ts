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
  analytics: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      cost_event_daily: {
        Row: {
          cost_category_id: string | null
          day: string | null
          event_count: number | null
          organization_id: number | null
          person_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      cost_event_daily_secure: {
        Row: {
          cost_category_id: string | null
          day: string | null
          event_count: number | null
          organization_id: number | null
          person_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      org_cost_rollups: {
        Row: {
          cost_30d: number | null
          cost_365d: number | null
          cost_category_id: string | null
          organization_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      org_cost_rollups_secure: {
        Row: {
          cost_30d: number | null
          cost_365d: number | null
          cost_category_id: string | null
          organization_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      person_cost_rollups: {
        Row: {
          cost_30d: number | null
          cost_365d: number | null
          cost_90d: number | null
          organization_id: number | null
          person_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
      person_cost_rollups_secure: {
        Row: {
          cost_30d: number | null
          cost_365d: number | null
          cost_90d: number | null
          organization_id: number | null
          person_id: number | null
          total_cost: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      refresh_cost_rollups: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          last_webauthn_challenge_data: Json | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          last_webauthn_challenge_data?: Json | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_authorizations: {
        Row: {
          approved_at: string | null
          authorization_code: string | null
          authorization_id: string
          client_id: string
          code_challenge: string | null
          code_challenge_method:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at: string
          expires_at: string
          id: string
          nonce: string | null
          redirect_uri: string
          resource: string | null
          response_type: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state: string | null
          status: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id: string | null
        }
        Insert: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id: string
          client_id: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id: string
          nonce?: string | null
          redirect_uri: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Update: {
          approved_at?: string | null
          authorization_code?: string | null
          authorization_id?: string
          client_id?: string
          code_challenge?: string | null
          code_challenge_method?:
            | Database["auth"]["Enums"]["code_challenge_method"]
            | null
          created_at?: string
          expires_at?: string
          id?: string
          nonce?: string | null
          redirect_uri?: string
          resource?: string | null
          response_type?: Database["auth"]["Enums"]["oauth_response_type"]
          scope?: string
          state?: string | null
          status?: Database["auth"]["Enums"]["oauth_authorization_status"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oauth_authorizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_authorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_client_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Insert: {
          code_verifier?: string | null
          created_at: string
          id: string
          provider_type: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          id?: string
          provider_type?: string
        }
        Relationships: []
      }
      oauth_clients: {
        Row: {
          client_name: string | null
          client_secret_hash: string | null
          client_type: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri: string | null
          created_at: string
          deleted_at: string | null
          grant_types: string
          id: string
          logo_uri: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at: string
        }
        Insert: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types: string
          id: string
          logo_uri?: string | null
          redirect_uris: string
          registration_type: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Update: {
          client_name?: string | null
          client_secret_hash?: string | null
          client_type?: Database["auth"]["Enums"]["oauth_client_type"]
          client_uri?: string | null
          created_at?: string
          deleted_at?: string | null
          grant_types?: string
          id?: string
          logo_uri?: string | null
          redirect_uris?: string
          registration_type?: Database["auth"]["Enums"]["oauth_registration_type"]
          updated_at?: string
        }
        Relationships: []
      }
      oauth_consents: {
        Row: {
          client_id: string
          granted_at: string
          id: string
          revoked_at: string | null
          scopes: string
          user_id: string
        }
        Insert: {
          client_id: string
          granted_at?: string
          id: string
          revoked_at?: string | null
          scopes: string
          user_id: string
        }
        Update: {
          client_id?: string
          granted_at?: string
          id?: string
          revoked_at?: string | null
          scopes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_consents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oauth_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown
          not_after: string | null
          oauth_client_id: string | null
          refresh_token_counter: number | null
          refresh_token_hmac_key: string | null
          refreshed_at: string | null
          scopes: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown
          not_after?: string | null
          oauth_client_id?: string | null
          refresh_token_counter?: number | null
          refresh_token_hmac_key?: string | null
          refreshed_at?: string | null
          scopes?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_oauth_client_id_fkey"
            columns: ["oauth_client_id"]
            isOneToOne: false
            referencedRelation: "oauth_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          disabled: boolean | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          disabled?: boolean | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          disabled?: boolean | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: { Args: never; Returns: string }
      jwt: { Args: never; Returns: Json }
      role: { Args: never; Returns: string }
      uid: { Args: never; Returns: string }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      oauth_authorization_status: "pending" | "approved" | "denied" | "expired"
      oauth_client_type: "public" | "confidential"
      oauth_registration_type: "dynamic" | "manual"
      oauth_response_type: "code"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  case_mgmt: {
    Tables: {
      assessments: {
        Row: {
          answers: Json
          case_id: number | null
          completed_at: string | null
          completion_level: Database["case_mgmt"]["Enums"]["assessment_completion_level_enum"]
          computed: Json | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          id: string
          instrument_slug: string
          instrument_variant: string
          instrument_version: string
          owning_org_id: number
          person_id: number
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          started_at: string
          status: Database["case_mgmt"]["Enums"]["assessment_status_enum"]
          summary: string | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          answers?: Json
          case_id?: number | null
          completed_at?: string | null
          completion_level: Database["case_mgmt"]["Enums"]["assessment_completion_level_enum"]
          computed?: Json | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          id?: string
          instrument_slug: string
          instrument_variant: string
          instrument_version: string
          owning_org_id: number
          person_id: number
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          started_at?: string
          status?: Database["case_mgmt"]["Enums"]["assessment_status_enum"]
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          answers?: Json
          case_id?: number | null
          completed_at?: string | null
          completion_level?: Database["case_mgmt"]["Enums"]["assessment_completion_level_enum"]
          computed?: Json | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          id?: string
          instrument_slug?: string
          instrument_variant?: string
          instrument_version?: string
          owning_org_id?: number
          person_id?: number
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          started_at?: string
          status?: Database["case_mgmt"]["Enums"]["assessment_status_enum"]
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "assessments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      calls_for_service: {
        Row: {
          anonymous_reporter: boolean | null
          anonymous_reporter_details: string | null
          attachments_count: number | null
          call_taker_id: string | null
          call_taker_notes: string | null
          converted_incident_id: number | null
          created_at: string | null
          created_by: string | null
          dedupe_key: string | null
          duplicate_of_report_id: number | null
          escalated_at: string | null
          escalated_by: string | null
          escalated_to_incident_id: number | null
          id: number
          initial_report_narrative: string
          location_confidence: string | null
          location_text: string | null
          notify_channel:
            | Database["core"]["Enums"]["notify_channel_enum"]
            | null
          notify_opt_in: boolean | null
          notify_target: string | null
          origin: Database["core"]["Enums"]["cfs_origin_enum"] | null
          owning_organization_id: number
          priority_hint:
            | Database["core"]["Enums"]["incident_priority_enum"]
            | null
          public_tracking_enabled: boolean
          public_tracking_id: string | null
          received_at: string | null
          referring_agency_name: string | null
          referring_organization_id: number | null
          related_report_ids: number[] | null
          report_method: string
          report_number: string
          report_priority_assessment: string
          report_received_at: string
          report_source_details: Json | null
          report_status: string | null
          reported_coordinates: string | null
          reported_location: string | null
          reporter_address: string | null
          reporter_email: string | null
          reporter_name: string | null
          reporter_phone: string | null
          reporter_relationship: string | null
          reporting_organization_id: number | null
          reporting_person_id: number | null
          risk_score: number | null
          source: Database["core"]["Enums"]["cfs_source_enum"] | null
          status: Database["core"]["Enums"]["cfs_status_enum"] | null
          triaged_by: string | null
          type_hint: Database["core"]["Enums"]["incident_type_enum"] | null
          updated_at: string | null
          updated_by: string | null
          urgency_indicators: Json | null
          verification_method: string | null
          verification_notes: string | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          anonymous_reporter?: boolean | null
          anonymous_reporter_details?: string | null
          attachments_count?: number | null
          call_taker_id?: string | null
          call_taker_notes?: string | null
          converted_incident_id?: number | null
          created_at?: string | null
          created_by?: string | null
          dedupe_key?: string | null
          duplicate_of_report_id?: number | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to_incident_id?: number | null
          id?: number
          initial_report_narrative: string
          location_confidence?: string | null
          location_text?: string | null
          notify_channel?:
            | Database["core"]["Enums"]["notify_channel_enum"]
            | null
          notify_opt_in?: boolean | null
          notify_target?: string | null
          origin?: Database["core"]["Enums"]["cfs_origin_enum"] | null
          owning_organization_id: number
          priority_hint?:
            | Database["core"]["Enums"]["incident_priority_enum"]
            | null
          public_tracking_enabled?: boolean
          public_tracking_id?: string | null
          received_at?: string | null
          referring_agency_name?: string | null
          referring_organization_id?: number | null
          related_report_ids?: number[] | null
          report_method: string
          report_number?: string
          report_priority_assessment?: string
          report_received_at?: string
          report_source_details?: Json | null
          report_status?: string | null
          reported_coordinates?: string | null
          reported_location?: string | null
          reporter_address?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_relationship?: string | null
          reporting_organization_id?: number | null
          reporting_person_id?: number | null
          risk_score?: number | null
          source?: Database["core"]["Enums"]["cfs_source_enum"] | null
          status?: Database["core"]["Enums"]["cfs_status_enum"] | null
          triaged_by?: string | null
          type_hint?: Database["core"]["Enums"]["incident_type_enum"] | null
          updated_at?: string | null
          updated_by?: string | null
          urgency_indicators?: Json | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          anonymous_reporter?: boolean | null
          anonymous_reporter_details?: string | null
          attachments_count?: number | null
          call_taker_id?: string | null
          call_taker_notes?: string | null
          converted_incident_id?: number | null
          created_at?: string | null
          created_by?: string | null
          dedupe_key?: string | null
          duplicate_of_report_id?: number | null
          escalated_at?: string | null
          escalated_by?: string | null
          escalated_to_incident_id?: number | null
          id?: number
          initial_report_narrative?: string
          location_confidence?: string | null
          location_text?: string | null
          notify_channel?:
            | Database["core"]["Enums"]["notify_channel_enum"]
            | null
          notify_opt_in?: boolean | null
          notify_target?: string | null
          origin?: Database["core"]["Enums"]["cfs_origin_enum"] | null
          owning_organization_id?: number
          priority_hint?:
            | Database["core"]["Enums"]["incident_priority_enum"]
            | null
          public_tracking_enabled?: boolean
          public_tracking_id?: string | null
          received_at?: string | null
          referring_agency_name?: string | null
          referring_organization_id?: number | null
          related_report_ids?: number[] | null
          report_method?: string
          report_number?: string
          report_priority_assessment?: string
          report_received_at?: string
          report_source_details?: Json | null
          report_status?: string | null
          reported_coordinates?: string | null
          reported_location?: string | null
          reporter_address?: string | null
          reporter_email?: string | null
          reporter_name?: string | null
          reporter_phone?: string | null
          reporter_relationship?: string | null
          reporting_organization_id?: number | null
          reporting_person_id?: number | null
          risk_score?: number | null
          source?: Database["core"]["Enums"]["cfs_source_enum"] | null
          status?: Database["core"]["Enums"]["cfs_status_enum"] | null
          triaged_by?: string | null
          type_hint?: Database["core"]["Enums"]["incident_type_enum"] | null
          updated_at?: string | null
          updated_by?: string | null
          urgency_indicators?: Json | null
          verification_method?: string | null
          verification_notes?: string | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_for_service_converted_incident_id_fkey"
            columns: ["converted_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_escalated_incident"
            columns: ["escalated_to_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      case_management: {
        Row: {
          agency: string | null
          case_manager_contact: string | null
          case_manager_name: string
          case_number: string | null
          case_type: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: number
          notes: string | null
          owning_org_id: number
          person_id: number
          priority: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          agency?: string | null
          case_manager_contact?: string | null
          case_manager_name: string
          case_number?: string | null
          case_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: number
          notes?: string | null
          owning_org_id: number
          person_id: number
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          agency?: string | null
          case_manager_contact?: string | null
          case_manager_name?: string
          case_number?: string | null
          case_type?: string | null
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: number
          notes?: string | null
          owning_org_id?: number
          person_id?: number
          priority?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      cfs_attachments: {
        Row: {
          cfs_id: number
          created_at: string
          id: string
          media_id: string
          metadata: Json | null
          organization_id: number
          uploaded_by: string
        }
        Insert: {
          cfs_id: number
          created_at?: string
          id?: string
          media_id: string
          metadata?: Json | null
          organization_id: number
          uploaded_by?: string
        }
        Update: {
          cfs_id?: number
          created_at?: string
          id?: string
          media_id?: string
          metadata?: Json | null
          organization_id?: number
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfs_attachments_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_attachments_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_attachments_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      cfs_org_access: {
        Row: {
          access_level: Database["core"]["Enums"]["cfs_access_level_enum"]
          cfs_id: number
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          organization_id: number
          reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          updated_at: string
        }
        Insert: {
          access_level?: Database["core"]["Enums"]["cfs_access_level_enum"]
          cfs_id: number
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          organization_id: number
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: Database["core"]["Enums"]["cfs_access_level_enum"]
          cfs_id?: number
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          organization_id?: number
          reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfs_org_access_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_org_access_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_org_access_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      cfs_public_tracking: {
        Row: {
          category: Database["core"]["Enums"]["cfs_public_category_enum"]
          cfs_id: number
          created_at: string
          id: string
          last_updated_at: string
          public_location_area: string
          public_summary: string | null
          public_tracking_id: string
          status_bucket: Database["core"]["Enums"]["cfs_public_status_enum"]
          updated_at: string
        }
        Insert: {
          category: Database["core"]["Enums"]["cfs_public_category_enum"]
          cfs_id: number
          created_at?: string
          id?: string
          last_updated_at?: string
          public_location_area: string
          public_summary?: string | null
          public_tracking_id: string
          status_bucket: Database["core"]["Enums"]["cfs_public_status_enum"]
          updated_at?: string
        }
        Update: {
          category?: Database["core"]["Enums"]["cfs_public_category_enum"]
          cfs_id?: number
          created_at?: string
          id?: string
          last_updated_at?: string
          public_location_area?: string
          public_summary?: string | null
          public_tracking_id?: string
          status_bucket?: Database["core"]["Enums"]["cfs_public_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cfs_public_tracking_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: true
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_public_tracking_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: true
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cfs_public_tracking_cfs_id_fkey"
            columns: ["cfs_id"]
            isOneToOne: true
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      cfs_timeline: {
        Row: {
          created_at: string | null
          created_by: string | null
          duration_seconds: number | null
          id: number
          incident_id: number | null
          incident_report_id: number
          organization_id: number
          performed_by: string | null
          phase: string
          phase_completed_at: string | null
          phase_data: Json | null
          phase_notes: string | null
          phase_started_at: string
          phase_status: string | null
          sla_met: boolean | null
          sla_target_seconds: number | null
          sub_phase: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: number
          incident_id?: number | null
          incident_report_id: number
          organization_id: number
          performed_by?: string | null
          phase: string
          phase_completed_at?: string | null
          phase_data?: Json | null
          phase_notes?: string | null
          phase_started_at?: string
          phase_status?: string | null
          sla_met?: boolean | null
          sla_target_seconds?: number | null
          sub_phase?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          duration_seconds?: number | null
          id?: number
          incident_id?: number | null
          incident_report_id?: number
          organization_id?: number
          performed_by?: string | null
          phase?: string
          phase_completed_at?: string | null
          phase_data?: Json | null
          phase_notes?: string | null
          phase_started_at?: string
          phase_status?: string | null
          sla_met?: boolean | null
          sla_target_seconds?: number | null
          sub_phase?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_timeline_incident"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_report_timeline_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_report_timeline_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_report_timeline_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      client_intakes: {
        Row: {
          consent_confirmed: boolean
          created_at: string
          ethnicity: Database["core"]["Enums"]["ethnicity_enum"][]
          general_notes: string | null
          health_concerns: Database["core"]["Enums"]["health_concern_enum"][]
          housing_status:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id: number
          immediate_needs:
            | Database["core"]["Enums"]["assessment_urgency"]
            | null
          intake_date: string
          intake_worker: string | null
          person_id: number
          place_of_origin:
            | Database["core"]["Enums"]["place_of_origin_enum"]
            | null
          privacy_acknowledged: boolean
          risk_factors: Database["core"]["Enums"]["risk_factor_enum"][]
          risk_level: Database["core"]["Enums"]["risk_level_enum"] | null
          situation_notes: string | null
        }
        Insert: {
          consent_confirmed: boolean
          created_at?: string
          ethnicity?: Database["core"]["Enums"]["ethnicity_enum"][]
          general_notes?: string | null
          health_concerns?: Database["core"]["Enums"]["health_concern_enum"][]
          housing_status?:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id?: number
          immediate_needs?:
            | Database["core"]["Enums"]["assessment_urgency"]
            | null
          intake_date?: string
          intake_worker?: string | null
          person_id: number
          place_of_origin?:
            | Database["core"]["Enums"]["place_of_origin_enum"]
            | null
          privacy_acknowledged: boolean
          risk_factors?: Database["core"]["Enums"]["risk_factor_enum"][]
          risk_level?: Database["core"]["Enums"]["risk_level_enum"] | null
          situation_notes?: string | null
        }
        Update: {
          consent_confirmed?: boolean
          created_at?: string
          ethnicity?: Database["core"]["Enums"]["ethnicity_enum"][]
          general_notes?: string | null
          health_concerns?: Database["core"]["Enums"]["health_concern_enum"][]
          housing_status?:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id?: number
          immediate_needs?:
            | Database["core"]["Enums"]["assessment_urgency"]
            | null
          intake_date?: string
          intake_worker?: string | null
          person_id?: number
          place_of_origin?:
            | Database["core"]["Enums"]["place_of_origin_enum"]
            | null
          privacy_acknowledged?: boolean
          risk_factors?: Database["core"]["Enums"]["risk_factor_enum"][]
          risk_level?: Database["core"]["Enums"]["risk_level_enum"] | null
          situation_notes?: string | null
        }
        Relationships: []
      }
      encounter_media_links: {
        Row: {
          created_at: string
          created_by: string | null
          encounter_id: string
          id: string
          link_kind: string
          media_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          encounter_id: string
          id?: string
          link_kind?: string
          media_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          encounter_id?: string
          id?: string
          link_kind?: string
          media_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "encounter_media_links_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      encounters: {
        Row: {
          case_id: number | null
          created_at: string
          created_by: string | null
          encounter_type: Database["case_mgmt"]["Enums"]["encounter_type_enum"]
          ended_at: string | null
          id: string
          location_context: string | null
          notes: string | null
          owning_org_id: number
          person_id: number
          program_context: string | null
          recorded_at: string
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          started_at: string
          summary: string | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          encounter_type: Database["case_mgmt"]["Enums"]["encounter_type_enum"]
          ended_at?: string | null
          id?: string
          location_context?: string | null
          notes?: string | null
          owning_org_id: number
          person_id: number
          program_context?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          started_at?: string
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          encounter_type?: Database["case_mgmt"]["Enums"]["encounter_type_enum"]
          ended_at?: string | null
          id?: string
          location_context?: string | null
          notes?: string | null
          owning_org_id?: number
          person_id?: number
          program_context?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          started_at?: string
          summary?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "encounters_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_management"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_media_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          incident_id: number
          link_kind: string
          media_id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id: number
          link_kind?: string
          media_id: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          incident_id?: number
          link_kind?: string
          media_id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_media_links_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_people: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: number
          incident_id: number
          involvement_type: string
          is_unknown_party: boolean
          notes: string | null
          party_role: Database["core"]["Enums"]["party_role_enum"] | null
          person_id: number | null
          unknown_party_description: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          incident_id: number
          involvement_type: string
          is_unknown_party?: boolean
          notes?: string | null
          party_role?: Database["core"]["Enums"]["party_role_enum"] | null
          person_id?: number | null
          unknown_party_description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: number
          incident_id?: number
          involvement_type?: string
          is_unknown_party?: boolean
          notes?: string | null
          party_role?: Database["core"]["Enums"]["party_role_enum"] | null
          person_id?: number | null
          unknown_party_description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incident_people_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          actions_taken: string | null
          address_id: number | null
          address_search: string | null
          agency_coordination_notes: string | null
          agency_response_notes: string | null
          ambulance_unit_number: string | null
          assigned_ranger: string | null
          bylaw_enforcement_action: string | null
          bylaw_file_number: string | null
          bylaw_notes: string | null
          bylaw_notified: boolean | null
          bylaw_officers_attending: string | null
          bylaw_personnel_names: string | null
          bylaw_response_time: string | null
          city: string | null
          community_impact_notes: string | null
          coordinates: string | null
          country: string | null
          created_at: string
          created_by: string | null
          description: string | null
          dispatch_at: string | null
          dispatch_notes: string | null
          dispatch_priority:
            | Database["core"]["Enums"]["dispatch_priority_enum"]
            | null
          disposition_type: string | null
          draft_created_at: string | null
          ems_personnel_names: string | null
          ems_response_time: string | null
          environmental_factors:
            | Database["core"]["Enums"]["environmental_factors_enum"][]
            | null
          fire_department_called: boolean | null
          fire_personnel: string | null
          fire_unit_number: string | null
          first_unit_arrived_at: string | null
          first_unit_assigned_at: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          hospital_destination: string | null
          hospital_transport_offered: boolean | null
          id: number
          incident_cleared_at: string | null
          incident_commander: string | null
          incident_complexity:
            | Database["core"]["Enums"]["incident_complexity_enum"]
            | null
          incident_date: string | null
          incident_number: string | null
          incident_people: Json | null
          incident_report_id: number | null
          incident_time: string | null
          incident_type: Database["core"]["Enums"]["incident_type_enum"] | null
          initial_observations: string | null
          is_draft: boolean | null
          latitude: number | null
          location: string
          location_notes: string | null
          log_entries: Json | null
          longitude: number | null
          media_attention: boolean | null
          medical_assessment_notes: string | null
          mental_health_component: boolean | null
          multi_agency_response: boolean | null
          officers_attending: string | null
          outcome: string | null
          owning_organization_id: number
          paramedics_called: boolean | null
          people_involved: string | null
          police_file_number: string | null
          police_notified: boolean | null
          postal_code: string | null
          priority: Database["core"]["Enums"]["incident_priority_enum"] | null
          priority_reason: string | null
          property_brand: string | null
          property_condition: string | null
          property_description: string | null
          property_involved: boolean | null
          property_model: string | null
          property_recovered: boolean | null
          property_serial: string | null
          property_type: string | null
          property_value: string | null
          province: string | null
          public_safety_impact:
            | Database["core"]["Enums"]["public_safety_impact_enum"]
            | null
          recommendations: string | null
          recovery_method: string | null
          referrals_made: string[] | null
          related_medical_episode_id: string | null
          reported_by: string | null
          reporter_id: string | null
          resource_allocation_notes: string | null
          resources_distributed: string[] | null
          response_time_minutes: number | null
          safety_concerns: string | null
          scene_conditions: string | null
          scene_safety: string | null
          services_notes: string | null
          services_offered: string[] | null
          services_provided: string[] | null
          status: Database["core"]["Enums"]["incident_status_enum"] | null
          status_history: Json | null
          street_address: string | null
          substance_indicators:
            | Database["core"]["Enums"]["substance_indicators_enum"][]
            | null
          tags: string[] | null
          total_incident_time_minutes: number | null
          transport_decline_reason: string | null
          transport_declined: boolean | null
          updated_at: string | null
          updated_by: string | null
          weather_conditions: string | null
        }
        Insert: {
          actions_taken?: string | null
          address_id?: number | null
          address_search?: string | null
          agency_coordination_notes?: string | null
          agency_response_notes?: string | null
          ambulance_unit_number?: string | null
          assigned_ranger?: string | null
          bylaw_enforcement_action?: string | null
          bylaw_file_number?: string | null
          bylaw_notes?: string | null
          bylaw_notified?: boolean | null
          bylaw_officers_attending?: string | null
          bylaw_personnel_names?: string | null
          bylaw_response_time?: string | null
          city?: string | null
          community_impact_notes?: string | null
          coordinates?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispatch_at?: string | null
          dispatch_notes?: string | null
          dispatch_priority?:
            | Database["core"]["Enums"]["dispatch_priority_enum"]
            | null
          disposition_type?: string | null
          draft_created_at?: string | null
          ems_personnel_names?: string | null
          ems_response_time?: string | null
          environmental_factors?:
            | Database["core"]["Enums"]["environmental_factors_enum"][]
            | null
          fire_department_called?: boolean | null
          fire_personnel?: string | null
          fire_unit_number?: string | null
          first_unit_arrived_at?: string | null
          first_unit_assigned_at?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          hospital_destination?: string | null
          hospital_transport_offered?: boolean | null
          id?: number
          incident_cleared_at?: string | null
          incident_commander?: string | null
          incident_complexity?:
            | Database["core"]["Enums"]["incident_complexity_enum"]
            | null
          incident_date?: string | null
          incident_number?: string | null
          incident_people?: Json | null
          incident_report_id?: number | null
          incident_time?: string | null
          incident_type?: Database["core"]["Enums"]["incident_type_enum"] | null
          initial_observations?: string | null
          is_draft?: boolean | null
          latitude?: number | null
          location: string
          location_notes?: string | null
          log_entries?: Json | null
          longitude?: number | null
          media_attention?: boolean | null
          medical_assessment_notes?: string | null
          mental_health_component?: boolean | null
          multi_agency_response?: boolean | null
          officers_attending?: string | null
          outcome?: string | null
          owning_organization_id: number
          paramedics_called?: boolean | null
          people_involved?: string | null
          police_file_number?: string | null
          police_notified?: boolean | null
          postal_code?: string | null
          priority?: Database["core"]["Enums"]["incident_priority_enum"] | null
          priority_reason?: string | null
          property_brand?: string | null
          property_condition?: string | null
          property_description?: string | null
          property_involved?: boolean | null
          property_model?: string | null
          property_recovered?: boolean | null
          property_serial?: string | null
          property_type?: string | null
          property_value?: string | null
          province?: string | null
          public_safety_impact?:
            | Database["core"]["Enums"]["public_safety_impact_enum"]
            | null
          recommendations?: string | null
          recovery_method?: string | null
          referrals_made?: string[] | null
          related_medical_episode_id?: string | null
          reported_by?: string | null
          reporter_id?: string | null
          resource_allocation_notes?: string | null
          resources_distributed?: string[] | null
          response_time_minutes?: number | null
          safety_concerns?: string | null
          scene_conditions?: string | null
          scene_safety?: string | null
          services_notes?: string | null
          services_offered?: string[] | null
          services_provided?: string[] | null
          status?: Database["core"]["Enums"]["incident_status_enum"] | null
          status_history?: Json | null
          street_address?: string | null
          substance_indicators?:
            | Database["core"]["Enums"]["substance_indicators_enum"][]
            | null
          tags?: string[] | null
          total_incident_time_minutes?: number | null
          transport_decline_reason?: string | null
          transport_declined?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          weather_conditions?: string | null
        }
        Update: {
          actions_taken?: string | null
          address_id?: number | null
          address_search?: string | null
          agency_coordination_notes?: string | null
          agency_response_notes?: string | null
          ambulance_unit_number?: string | null
          assigned_ranger?: string | null
          bylaw_enforcement_action?: string | null
          bylaw_file_number?: string | null
          bylaw_notes?: string | null
          bylaw_notified?: boolean | null
          bylaw_officers_attending?: string | null
          bylaw_personnel_names?: string | null
          bylaw_response_time?: string | null
          city?: string | null
          community_impact_notes?: string | null
          coordinates?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          dispatch_at?: string | null
          dispatch_notes?: string | null
          dispatch_priority?:
            | Database["core"]["Enums"]["dispatch_priority_enum"]
            | null
          disposition_type?: string | null
          draft_created_at?: string | null
          ems_personnel_names?: string | null
          ems_response_time?: string | null
          environmental_factors?:
            | Database["core"]["Enums"]["environmental_factors_enum"][]
            | null
          fire_department_called?: boolean | null
          fire_personnel?: string | null
          fire_unit_number?: string | null
          first_unit_arrived_at?: string | null
          first_unit_assigned_at?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          hospital_destination?: string | null
          hospital_transport_offered?: boolean | null
          id?: number
          incident_cleared_at?: string | null
          incident_commander?: string | null
          incident_complexity?:
            | Database["core"]["Enums"]["incident_complexity_enum"]
            | null
          incident_date?: string | null
          incident_number?: string | null
          incident_people?: Json | null
          incident_report_id?: number | null
          incident_time?: string | null
          incident_type?: Database["core"]["Enums"]["incident_type_enum"] | null
          initial_observations?: string | null
          is_draft?: boolean | null
          latitude?: number | null
          location?: string
          location_notes?: string | null
          log_entries?: Json | null
          longitude?: number | null
          media_attention?: boolean | null
          medical_assessment_notes?: string | null
          mental_health_component?: boolean | null
          multi_agency_response?: boolean | null
          officers_attending?: string | null
          outcome?: string | null
          owning_organization_id?: number
          paramedics_called?: boolean | null
          people_involved?: string | null
          police_file_number?: string | null
          police_notified?: boolean | null
          postal_code?: string | null
          priority?: Database["core"]["Enums"]["incident_priority_enum"] | null
          priority_reason?: string | null
          property_brand?: string | null
          property_condition?: string | null
          property_description?: string | null
          property_involved?: boolean | null
          property_model?: string | null
          property_recovered?: boolean | null
          property_serial?: string | null
          property_type?: string | null
          property_value?: string | null
          province?: string | null
          public_safety_impact?:
            | Database["core"]["Enums"]["public_safety_impact_enum"]
            | null
          recommendations?: string | null
          recovery_method?: string | null
          referrals_made?: string[] | null
          related_medical_episode_id?: string | null
          reported_by?: string | null
          reporter_id?: string | null
          resource_allocation_notes?: string | null
          resources_distributed?: string[] | null
          response_time_minutes?: number | null
          safety_concerns?: string | null
          scene_conditions?: string | null
          scene_safety?: string | null
          services_notes?: string | null
          services_offered?: string[] | null
          services_provided?: string[] | null
          status?: Database["core"]["Enums"]["incident_status_enum"] | null
          status_history?: Json | null
          street_address?: string | null
          substance_indicators?:
            | Database["core"]["Enums"]["substance_indicators_enum"][]
            | null
          tags?: string[] | null
          total_incident_time_minutes?: number | null
          transport_decline_reason?: string | null
          transport_declined?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incidents_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_incident_report_id_fkey"
            columns: ["incident_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      observation_promotions: {
        Row: {
          created_at: string
          created_by: string | null
          created_by_profile_id: string | null
          id: string
          metadata: Json | null
          observation_id: string
          promotion_type: Database["case_mgmt"]["Enums"]["observation_promotion_enum"]
          target_id: string
          target_label: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          created_by_profile_id?: string | null
          id?: string
          metadata?: Json | null
          observation_id: string
          promotion_type: Database["case_mgmt"]["Enums"]["observation_promotion_enum"]
          target_id: string
          target_label?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          created_by_profile_id?: string | null
          id?: string
          metadata?: Json | null
          observation_id?: string
          promotion_type?: Database["case_mgmt"]["Enums"]["observation_promotion_enum"]
          target_id?: string
          target_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observation_promotions_observation_id_fkey"
            columns: ["observation_id"]
            isOneToOne: false
            referencedRelation: "observations"
            referencedColumns: ["id"]
          },
        ]
      }
      observations: {
        Row: {
          case_id: number | null
          category: Database["case_mgmt"]["Enums"]["observation_category_enum"]
          created_at: string
          created_by: string | null
          details: string | null
          encounter_id: string | null
          id: string
          last_seen_at: string | null
          last_seen_location: string | null
          lead_expires_at: string | null
          lead_status:
            | Database["case_mgmt"]["Enums"]["observation_lead_status_enum"]
            | null
          metadata: Json | null
          owning_org_id: number
          person_id: number | null
          recorded_at: string
          recorded_by_profile_id: string | null
          reporter_person_id: number | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          subject_description: string | null
          subject_name: string | null
          subject_person_id: number | null
          subject_type: Database["case_mgmt"]["Enums"]["observation_subject_enum"]
          summary: string
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          case_id?: number | null
          category: Database["case_mgmt"]["Enums"]["observation_category_enum"]
          created_at?: string
          created_by?: string | null
          details?: string | null
          encounter_id?: string | null
          id?: string
          last_seen_at?: string | null
          last_seen_location?: string | null
          lead_expires_at?: string | null
          lead_status?:
            | Database["case_mgmt"]["Enums"]["observation_lead_status_enum"]
            | null
          metadata?: Json | null
          owning_org_id: number
          person_id?: number | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          reporter_person_id?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          subject_description?: string | null
          subject_name?: string | null
          subject_person_id?: number | null
          subject_type?: Database["case_mgmt"]["Enums"]["observation_subject_enum"]
          summary: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          case_id?: number | null
          category?: Database["case_mgmt"]["Enums"]["observation_category_enum"]
          created_at?: string
          created_by?: string | null
          details?: string | null
          encounter_id?: string | null
          id?: string
          last_seen_at?: string | null
          last_seen_location?: string | null
          lead_expires_at?: string | null
          lead_status?:
            | Database["case_mgmt"]["Enums"]["observation_lead_status_enum"]
            | null
          metadata?: Json | null
          owning_org_id?: number
          person_id?: number | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          reporter_person_id?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          subject_description?: string | null
          subject_name?: string | null
          subject_person_id?: number | null
          subject_type?: Database["case_mgmt"]["Enums"]["observation_subject_enum"]
          summary?: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "observations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "observations_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          case_id: number | null
          created_at: string
          created_by: string | null
          details: string | null
          encounter_id: string | null
          id: string
          metadata: Json | null
          owning_org_id: number
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          referral_status: Database["case_mgmt"]["Enums"]["referral_status_enum"]
          referred_at: string
          referred_to_name: string | null
          referred_to_org_id: number | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          summary: string
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          owning_org_id: number
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          referral_status?: Database["case_mgmt"]["Enums"]["referral_status_enum"]
          referred_at?: string
          referred_to_name?: string | null
          referred_to_org_id?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          summary: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          details?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          owning_org_id?: number
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          referral_status?: Database["case_mgmt"]["Enums"]["referral_status_enum"]
          referred_at?: string
          referred_to_name?: string | null
          referred_to_org_id?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          summary?: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "referrals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to_profile_id: string | null
          case_id: number | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          encounter_id: string | null
          id: string
          owning_org_id: number
          person_id: number
          priority: Database["case_mgmt"]["Enums"]["task_priority_enum"]
          recorded_at: string
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          source_id: string | null
          source_type: string | null
          status: Database["case_mgmt"]["Enums"]["task_status_enum"]
          title: string
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          assigned_to_profile_id?: string | null
          case_id?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          encounter_id?: string | null
          id?: string
          owning_org_id: number
          person_id: number
          priority?: Database["case_mgmt"]["Enums"]["task_priority_enum"]
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          source_id?: string | null
          source_type?: string | null
          status?: Database["case_mgmt"]["Enums"]["task_status_enum"]
          title: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          assigned_to_profile_id?: string | null
          case_id?: number | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          encounter_id?: string | null
          id?: string
          owning_org_id?: number
          person_id?: number
          priority?: Database["case_mgmt"]["Enums"]["task_priority_enum"]
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          source_id?: string | null
          source_type?: string | null
          status?: Database["case_mgmt"]["Enums"]["task_status_enum"]
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_management"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "encounters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cfs_queue_view: {
        Row: {
          converted_incident_id: number | null
          created_at: string | null
          duplicate_of_report_id: number | null
          escalated_to_incident_id: number | null
          id: number | null
          location_confidence: string | null
          location_text: string | null
          notify_channel:
            | Database["core"]["Enums"]["notify_channel_enum"]
            | null
          notify_opt_in: boolean | null
          notify_target: string | null
          origin: Database["core"]["Enums"]["cfs_origin_enum"] | null
          owning_organization_id: number | null
          owning_organization_name: string | null
          priority_hint:
            | Database["core"]["Enums"]["incident_priority_enum"]
            | null
          public_tracking_enabled: boolean | null
          public_tracking_id: string | null
          received_at: string | null
          report_method: string | null
          report_number: string | null
          report_priority_assessment: string | null
          report_received_at: string | null
          report_status: string | null
          reported_coordinates: string | null
          reported_location: string | null
          reporting_organization_id: number | null
          reporting_organization_name: string | null
          source: Database["core"]["Enums"]["cfs_source_enum"] | null
          status: Database["core"]["Enums"]["cfs_status_enum"] | null
          type_hint: Database["core"]["Enums"]["incident_type_enum"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_for_service_converted_incident_id_fkey"
            columns: ["converted_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_escalated_incident"
            columns: ["escalated_to_incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "calls_for_service"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_queue_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_reports_duplicate_of_report_id_fkey"
            columns: ["duplicate_of_report_id"]
            isOneToOne: false
            referencedRelation: "cfs_sla_view"
            referencedColumns: ["cfs_id"]
          },
        ]
      }
      cfs_sla_view: {
        Row: {
          cfs_id: number | null
          created_at: string | null
          dispatch_at: string | null
          dispatch_met: boolean | null
          dispatch_minutes: number | null
          dispatch_target_minutes: number | null
          owning_organization_id: number | null
          received_base_at: string | null
          report_number: string | null
          report_priority_assessment: string | null
          report_received_at: string | null
          report_status: string | null
          resolution_at: string | null
          resolution_met: boolean | null
          resolution_minutes: number | null
          resolution_target_minutes: number | null
          status: Database["core"]["Enums"]["cfs_status_enum"] | null
          triage_at: string | null
          triage_met: boolean | null
          triage_minutes: number | null
          triage_target_minutes: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      cfs_actor_has_permission: {
        Args: {
          p_cfs_id: number
          p_min_access?: Database["core"]["Enums"]["cfs_access_level_enum"]
          p_permission: string
        }
        Returns: boolean
      }
      cfs_add_note: {
        Args: { p_cfs_id: number; p_note: string }
        Returns: undefined
      }
      cfs_convert_to_incident: {
        Args: { p_cfs_id: number; p_payload?: Json }
        Returns: number
      }
      cfs_create_call: { Args: { p_payload: Json }; Returns: Json }
      cfs_dismiss: {
        Args: { p_cfs_id: number; p_notes?: string; p_report_status: string }
        Returns: undefined
      }
      cfs_generate_public_tracking_id: { Args: never; Returns: string }
      cfs_grant_org_access: {
        Args: {
          p_access_level: Database["core"]["Enums"]["cfs_access_level_enum"]
          p_cfs_id: number
          p_org_id: number
          p_reason?: string
        }
        Returns: undefined
      }
      cfs_mark_duplicate: {
        Args: { p_cfs_id: number; p_duplicate_of: number; p_notes?: string }
        Returns: undefined
      }
      cfs_public_status_from_call: {
        Args: { p_cfs_id: number }
        Returns: Database["core"]["Enums"]["cfs_public_status_enum"]
      }
      cfs_public_tracking_disable: {
        Args: { p_cfs_id: number }
        Returns: undefined
      }
      cfs_public_tracking_get: {
        Args: { p_tracking_id: string }
        Returns: {
          category: Database["core"]["Enums"]["cfs_public_category_enum"]
          last_updated_at: string
          public_location_area: string
          public_summary: string
          public_tracking_id: string
          status_bucket: Database["core"]["Enums"]["cfs_public_status_enum"]
        }[]
      }
      cfs_public_tracking_upsert: {
        Args: {
          p_category: Database["core"]["Enums"]["cfs_public_category_enum"]
          p_cfs_id: number
          p_public_location_area: string
          p_public_summary?: string
        }
        Returns: string
      }
      cfs_refresh_public_tracking: {
        Args: { p_cfs_id: number }
        Returns: undefined
      }
      cfs_revoke_org_access: {
        Args: { p_cfs_id: number; p_org_id: number; p_reason?: string }
        Returns: undefined
      }
      cfs_transfer_ownership: {
        Args: { p_cfs_id: number; p_new_org_id: number; p_reason?: string }
        Returns: undefined
      }
      cfs_triage: {
        Args: { p_cfs_id: number; p_payload: Json }
        Returns: undefined
      }
      cfs_update_status: {
        Args: {
          p_cfs_id: number
          p_notes?: string
          p_status: Database["core"]["Enums"]["cfs_status_enum"]
        }
        Returns: undefined
      }
      cfs_verify: {
        Args: {
          p_cfs_id: number
          p_method: string
          p_notes: string
          p_status: string
        }
        Returns: undefined
      }
      client_intake_create: {
        Args: {
          p_consent_confirmed: boolean
          p_general_notes: string
          p_intake_date: string
          p_intake_worker: string
          p_person_id: number
          p_privacy_acknowledged: boolean
        }
        Returns: number
      }
      client_intake_update: {
        Args: {
          p_change_reason: string
          p_changed_fields: string[]
          p_general_notes: string
          p_health_concerns: Database["core"]["Enums"]["health_concern_enum"][]
          p_housing_status: Database["core"]["Enums"]["housing_status_enum"]
          p_immediate_needs: Database["core"]["Enums"]["assessment_urgency"]
          p_intake_id: number
          p_person_id: number
          p_risk_factors: Database["core"]["Enums"]["risk_factor_enum"][]
          p_risk_level: Database["core"]["Enums"]["risk_level_enum"]
          p_situation_notes: string
        }
        Returns: undefined
      }
      incident_actor_has_permission: {
        Args: {
          p_incident_id: number
          p_min_access?: Database["core"]["Enums"]["cfs_access_level_enum"]
          p_permission: string
        }
        Returns: boolean
      }
    }
    Enums: {
      assessment_completion_level_enum: "quick" | "full"
      assessment_status_enum:
        | "draft"
        | "in_progress"
        | "completed"
        | "superseded"
      encounter_type_enum:
        | "outreach"
        | "intake"
        | "program"
        | "appointment"
        | "other"
      observation_category_enum:
        | "health_concern"
        | "safety_concern"
        | "welfare_check"
        | "housing_basic_needs"
        | "relationship_social"
        | "other"
      observation_lead_status_enum:
        | "open"
        | "in_progress"
        | "resolved"
        | "archived"
      observation_promotion_enum:
        | "medical_episode"
        | "safety_incident"
        | "referral"
      observation_subject_enum:
        | "this_client"
        | "known_person"
        | "named_unlinked"
        | "unidentified"
      referral_status_enum: "open" | "sent" | "completed" | "canceled"
      task_priority_enum: "low" | "normal" | "high" | "urgent"
      task_status_enum: "open" | "in_progress" | "blocked" | "done" | "canceled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  core: {
    Tables: {
      addresses: {
        Row: {
          address_type: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          id: number
          informal_description: string | null
          is_active: boolean | null
          landmark_reference: string | null
          latitude: number | null
          location_type: string | null
          longitude: number | null
          notes: string | null
          postal_code: string | null
          province: string | null
          street_address: string
          unit_number: string | null
          updated_at: string | null
          updated_by: string | null
          usage_count: number | null
        }
        Insert: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          informal_description?: string | null
          is_active?: boolean | null
          landmark_reference?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          street_address: string
          unit_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
        }
        Update: {
          address_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          informal_description?: string | null
          is_active?: boolean | null
          landmark_reference?: string | null
          latitude?: number | null
          location_type?: string | null
          longitude?: number | null
          notes?: string | null
          postal_code?: string | null
          province?: string | null
          street_address?: string
          unit_number?: string | null
          updated_at?: string | null
          updated_by?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      bwc_media: {
        Row: {
          camera_id: string | null
          camera_vendor: string | null
          created_at: string
          created_by: string | null
          ingestion_source: string
          ingestion_status: Database["core"]["Enums"]["bwc_ingestion_status_enum"]
          media_id: string
          metadata: Json | null
          recorded_end_at: string | null
          recorded_start_at: string | null
        }
        Insert: {
          camera_id?: string | null
          camera_vendor?: string | null
          created_at?: string
          created_by?: string | null
          ingestion_source?: string
          ingestion_status?: Database["core"]["Enums"]["bwc_ingestion_status_enum"]
          media_id: string
          metadata?: Json | null
          recorded_end_at?: string | null
          recorded_start_at?: string | null
        }
        Update: {
          camera_id?: string | null
          camera_vendor?: string | null
          created_at?: string
          created_by?: string | null
          ingestion_source?: string
          ingestion_status?: Database["core"]["Enums"]["bwc_ingestion_status_enum"]
          media_id?: string
          metadata?: Json | null
          recorded_end_at?: string | null
          recorded_start_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bwc_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: true
            referencedRelation: "media_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      cost_dimensions: {
        Row: {
          created_at: string
          description: string | null
          dimension_type: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimension_type: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          dimension_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      cost_events: {
        Row: {
          cost_amount: number
          cost_category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          entry_type: Database["core"]["Enums"]["cost_entry_type_enum"]
          id: string
          metadata: Json | null
          occurred_at: string
          organization_id: number
          person_id: number | null
          quantity: number | null
          source_id: string | null
          source_type: Database["core"]["Enums"]["cost_source_type_enum"]
          unit_cost: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cost_amount: number
          cost_category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type?: Database["core"]["Enums"]["cost_entry_type_enum"]
          id?: string
          metadata?: Json | null
          occurred_at: string
          organization_id: number
          person_id?: number | null
          quantity?: number | null
          source_id?: string | null
          source_type: Database["core"]["Enums"]["cost_source_type_enum"]
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cost_amount?: number
          cost_category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          entry_type?: Database["core"]["Enums"]["cost_entry_type_enum"]
          id?: string
          metadata?: Json | null
          occurred_at?: string
          organization_id?: number
          person_id?: number | null
          quantity?: number | null
          source_id?: string | null
          source_type?: Database["core"]["Enums"]["cost_source_type_enum"]
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cost_events_cost_category_id_fkey"
            columns: ["cost_category_id"]
            isOneToOne: false
            referencedRelation: "cost_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      enum_labels: {
        Row: {
          active: boolean
          description: string | null
          enum_name: string
          is_default: boolean
          label: string
          metadata: Json | null
          sort_order: number | null
          value: string
        }
        Insert: {
          active?: boolean
          description?: string | null
          enum_name: string
          is_default?: boolean
          label: string
          metadata?: Json | null
          sort_order?: number | null
          value: string
        }
        Update: {
          active?: boolean
          description?: string | null
          enum_name?: string
          is_default?: boolean
          label?: string
          metadata?: Json | null
          sort_order?: number | null
          value?: string
        }
        Relationships: []
      }
      global_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          is_system_role: boolean | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_system_role?: boolean | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_system_role?: boolean | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      items: {
        Row: {
          active: boolean
          category: string
          cost_per_unit: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          minimum_threshold: number | null
          name: string
          supplier: string | null
          unit_type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          category: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          minimum_threshold?: number | null
          name: string
          supplier?: string | null
          unit_type: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          cost_per_unit?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          minimum_threshold?: number | null
          name?: string
          supplier?: string | null
          unit_type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      justice_episodes: {
        Row: {
          agency: string | null
          bail_amount: number | null
          booking_number: string | null
          case_id: number | null
          case_number: string | null
          charges: string | null
          court_date: string | null
          created_at: string
          created_by: string | null
          disposition: string | null
          encounter_id: string | null
          episode_type: Database["core"]["Enums"]["justice_episode_type_enum"]
          event_date: string
          event_time: string | null
          id: string
          location: string | null
          metadata: Json | null
          notes: string | null
          owning_org_id: number
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          release_date: string | null
          release_type: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          supervision_agency: string | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          agency?: string | null
          bail_amount?: number | null
          booking_number?: string | null
          case_id?: number | null
          case_number?: string | null
          charges?: string | null
          court_date?: string | null
          created_at?: string
          created_by?: string | null
          disposition?: string | null
          encounter_id?: string | null
          episode_type: Database["core"]["Enums"]["justice_episode_type_enum"]
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          owning_org_id: number
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          release_date?: string | null
          release_type?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          supervision_agency?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          agency?: string | null
          bail_amount?: number | null
          booking_number?: string | null
          case_id?: number | null
          case_number?: string | null
          charges?: string | null
          court_date?: string | null
          created_at?: string
          created_by?: string | null
          disposition?: string | null
          encounter_id?: string | null
          episode_type?: Database["core"]["Enums"]["justice_episode_type_enum"]
          event_date?: string
          event_time?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          owning_org_id?: number
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          release_date?: string | null
          release_type?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          supervision_agency?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "justice_episodes_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justice_episodes_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justice_episodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "justice_episodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      media_access_log: {
        Row: {
          action: Database["core"]["Enums"]["media_access_action_enum"]
          actor_org_id: number | null
          actor_profile_id: string | null
          actor_user_id: string | null
          context: Json | null
          created_at: string
          id: string
          media_id: string
        }
        Insert: {
          action: Database["core"]["Enums"]["media_access_action_enum"]
          actor_org_id?: number | null
          actor_profile_id?: string | null
          actor_user_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          media_id: string
        }
        Update: {
          action?: Database["core"]["Enums"]["media_access_action_enum"]
          actor_org_id?: number | null
          actor_profile_id?: string | null
          actor_user_id?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          media_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_access_log_actor_org_id_fkey"
            columns: ["actor_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_access_log_actor_org_id_fkey"
            columns: ["actor_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_access_log_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_objects"
            referencedColumns: ["id"]
          },
        ]
      }
      media_objects: {
        Row: {
          content_type: string
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          is_public: boolean
          legal_hold: boolean
          legal_hold_reason: string | null
          legal_hold_set_at: string | null
          legal_hold_set_by: string | null
          metadata: Json | null
          original_file_name: string | null
          owning_org_id: number
          purpose: Database["core"]["Enums"]["media_purpose_enum"]
          retention_class: Database["core"]["Enums"]["media_retention_class_enum"]
          retention_until: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          sha256: string | null
          size_bytes: number
          storage_container: string
          storage_path: string
          storage_provider: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id: number | null
          updated_at: string | null
          updated_by: string | null
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          content_type: string
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          is_public?: boolean
          legal_hold?: boolean
          legal_hold_reason?: string | null
          legal_hold_set_at?: string | null
          legal_hold_set_by?: string | null
          metadata?: Json | null
          original_file_name?: string | null
          owning_org_id: number
          purpose: Database["core"]["Enums"]["media_purpose_enum"]
          retention_class?: Database["core"]["Enums"]["media_retention_class_enum"]
          retention_until?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          sha256?: string | null
          size_bytes: number
          storage_container: string
          storage_path: string
          storage_provider: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          content_type?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          is_public?: boolean
          legal_hold?: boolean
          legal_hold_reason?: string | null
          legal_hold_set_at?: string | null
          legal_hold_set_by?: string | null
          metadata?: Json | null
          original_file_name?: string | null
          owning_org_id?: number
          purpose?: Database["core"]["Enums"]["media_purpose_enum"]
          retention_class?: Database["core"]["Enums"]["media_retention_class_enum"]
          retention_until?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          sha256?: string | null
          size_bytes?: number
          storage_container?: string
          storage_path?: string
          storage_provider?: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "media_objects_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_objects_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_objects_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_objects_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      media_upload_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          error: Json | null
          expected_content_type: string
          expected_size_bytes: number
          expires_at: string
          id: string
          idempotency_key: string | null
          initiated_by: string | null
          initiated_by_profile_id: string | null
          link_context: Json
          media_id: string | null
          original_file_name: string | null
          owning_org_id: number
          purpose: Database["core"]["Enums"]["media_purpose_enum"]
          status: Database["core"]["Enums"]["media_upload_status_enum"]
          storage_container: string
          storage_path: string
          storage_provider: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id: number | null
          upload_mode: Database["core"]["Enums"]["media_upload_mode_enum"]
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error?: Json | null
          expected_content_type: string
          expected_size_bytes: number
          expires_at: string
          id?: string
          idempotency_key?: string | null
          initiated_by?: string | null
          initiated_by_profile_id?: string | null
          link_context?: Json
          media_id?: string | null
          original_file_name?: string | null
          owning_org_id: number
          purpose: Database["core"]["Enums"]["media_purpose_enum"]
          status?: Database["core"]["Enums"]["media_upload_status_enum"]
          storage_container: string
          storage_path: string
          storage_provider: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id?: number | null
          upload_mode?: Database["core"]["Enums"]["media_upload_mode_enum"]
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error?: Json | null
          expected_content_type?: string
          expected_size_bytes?: number
          expires_at?: string
          id?: string
          idempotency_key?: string | null
          initiated_by?: string | null
          initiated_by_profile_id?: string | null
          link_context?: Json
          media_id?: string | null
          original_file_name?: string | null
          owning_org_id?: number
          purpose?: Database["core"]["Enums"]["media_purpose_enum"]
          status?: Database["core"]["Enums"]["media_upload_status_enum"]
          storage_container?: string
          storage_path?: string
          storage_provider?: Database["core"]["Enums"]["media_storage_provider_enum"]
          subject_person_id?: number | null
          upload_mode?: Database["core"]["Enums"]["media_upload_mode_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "media_upload_sessions_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_upload_sessions_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_upload_sessions_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_upload_sessions_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_upload_sessions_subject_person_id_fkey"
            columns: ["subject_person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_conditions: {
        Row: {
          category: string
          common_in_homeless: boolean | null
          condition_name: string
          created_at: string | null
          description: string | null
          id: string
          plain_language_name: string
          severity_indicator: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          common_in_homeless?: boolean | null
          condition_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          plain_language_name: string
          severity_indicator?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          common_in_homeless?: boolean | null
          condition_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          plain_language_name?: string
          severity_indicator?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      medical_episode_media: {
        Row: {
          captured_at: string
          created_at: string
          created_by: string | null
          episode_id: string
          id: string
          media_id: string
          media_kind: Database["core"]["Enums"]["medical_media_kind_enum"]
          metadata: Json | null
          owning_org_id: number
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          wound_check_id: string | null
        }
        Insert: {
          captured_at?: string
          created_at?: string
          created_by?: string | null
          episode_id: string
          id?: string
          media_id: string
          media_kind: Database["core"]["Enums"]["medical_media_kind_enum"]
          metadata?: Json | null
          owning_org_id: number
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          wound_check_id?: string | null
        }
        Update: {
          captured_at?: string
          created_at?: string
          created_by?: string | null
          episode_id?: string
          id?: string
          media_id?: string
          media_kind?: Database["core"]["Enums"]["medical_media_kind_enum"]
          metadata?: Json | null
          owning_org_id?: number
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          wound_check_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_episode_media_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "medical_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_media_wound_check_id_fkey"
            columns: ["wound_check_id"]
            isOneToOne: false
            referencedRelation: "medical_wound_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_episode_note_signatures: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note_id: string
          owning_org_id: number
          signature_metadata: Json | null
          signed_at: string
          signed_by_profile_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_id: string
          owning_org_id: number
          signature_metadata?: Json | null
          signed_at?: string
          signed_by_profile_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note_id?: string
          owning_org_id?: number
          signature_metadata?: Json | null
          signed_at?: string
          signed_by_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_episode_note_signatures_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "medical_episode_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_note_signatures_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_note_signatures_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_episode_notes: {
        Row: {
          created_at: string
          created_by: string | null
          episode_id: string
          id: string
          note_payload: Json
          note_schema_version: number
          note_summary: string | null
          note_type: Database["core"]["Enums"]["medical_episode_note_type_enum"]
          owning_org_id: number
          parent_note_id: string | null
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          episode_id: string
          id?: string
          note_payload?: Json
          note_schema_version?: number
          note_summary?: string | null
          note_type: Database["core"]["Enums"]["medical_episode_note_type_enum"]
          owning_org_id: number
          parent_note_id?: string | null
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          episode_id?: string
          id?: string
          note_payload?: Json
          note_schema_version?: number
          note_summary?: string | null
          note_type?: Database["core"]["Enums"]["medical_episode_note_type_enum"]
          owning_org_id?: number
          parent_note_id?: string | null
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "medical_episode_notes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "medical_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_notes_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_notes_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_notes_parent_note_id_fkey"
            columns: ["parent_note_id"]
            isOneToOne: false
            referencedRelation: "medical_episode_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_notes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episode_notes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_episodes: {
        Row: {
          assessment_data: Json | null
          assessment_summary: string | null
          body_location_ids: string[] | null
          case_id: number | null
          chart_lock_metadata: Json | null
          check_in_id: string | null
          chief_complaint: string | null
          condition_id: string | null
          condition_instance_id: string | null
          consent_status: string | null
          created_at: string | null
          created_by: string | null
          days_since_onset: number | null
          destination_facility: string | null
          diagnosis_source: string | null
          duration_observed: string | null
          encounter_id: string | null
          environmental_factors: string | null
          episode_date: string
          episode_datetime: string | null
          episode_end_date: string | null
          episode_status:
            | Database["public"]["Enums"]["medical_status_enum"]
            | null
          escalation_needed: boolean | null
          facility_involved: string | null
          follow_up_needed: boolean | null
          follow_up_notes: string | null
          follow_up_timeline:
            | Database["core"]["Enums"]["follow_up_plan_enum"]
            | null
          gps_latitude: number | null
          gps_longitude: number | null
          healthcare_provider: string | null
          id: string
          incident_role: string | null
          initial_photo_urls: string[] | null
          intervention_details: Json | null
          intervention_ids: string[] | null
          interventions_used: string | null
          is_diagnosed: boolean | null
          last_assessment_date: string | null
          location_accuracy: number | null
          location_address: string | null
          location_occurred: string | null
          location_source: string | null
          location_timestamp: string | null
          medical_issue_type_ids: string[] | null
          objective_findings: string | null
          observable_symptoms: Json | null
          outcome: string | null
          outcome_id: string | null
          owning_org_id: number
          person_id: number
          person_response: string | null
          photo_urls: string[] | null
          plan_summary: string | null
          possible_triggers: string | null
          primary_condition: string
          primary_issue_type_id: string | null
          primary_symptom_ids: string[] | null
          progress_photo_urls: Json | null
          progression_status:
            | Database["core"]["Enums"]["progression_status"]
            | null
          recorded_at: string
          recorded_by_profile_id: string | null
          referrals_made: string | null
          refusal_reason: string | null
          related_incident_id: number | null
          risk_to_others: string | null
          risk_to_self: string | null
          safety_plan_discussed: boolean | null
          scene_arrival_at: string | null
          scene_departure_at: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          severity_factors: string[] | null
          severity_level:
            | Database["core"]["Enums"]["severity_level_enum"]
            | null
          severity_score: number | null
          situation_context: string | null
          source: Database["core"]["Enums"]["record_source_enum"]
          subjective_notes: string | null
          template_key: Database["core"]["Enums"]["medical_episode_template_key_enum"]
          template_version: number
          transport_decision: string | null
          updated_at: string | null
          updated_by: string | null
          urgency_level:
            | Database["public"]["Enums"]["medical_urgency_enum"]
            | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
          visible_symptom_ids: string[] | null
          warning_signs: string[] | null
          wound_details: Json | null
          wound_location_id: string | null
        }
        Insert: {
          assessment_data?: Json | null
          assessment_summary?: string | null
          body_location_ids?: string[] | null
          case_id?: number | null
          chart_lock_metadata?: Json | null
          check_in_id?: string | null
          chief_complaint?: string | null
          condition_id?: string | null
          condition_instance_id?: string | null
          consent_status?: string | null
          created_at?: string | null
          created_by?: string | null
          days_since_onset?: number | null
          destination_facility?: string | null
          diagnosis_source?: string | null
          duration_observed?: string | null
          encounter_id?: string | null
          environmental_factors?: string | null
          episode_date?: string
          episode_datetime?: string | null
          episode_end_date?: string | null
          episode_status?:
            | Database["public"]["Enums"]["medical_status_enum"]
            | null
          escalation_needed?: boolean | null
          facility_involved?: string | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          follow_up_timeline?:
            | Database["core"]["Enums"]["follow_up_plan_enum"]
            | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          healthcare_provider?: string | null
          id?: string
          incident_role?: string | null
          initial_photo_urls?: string[] | null
          intervention_details?: Json | null
          intervention_ids?: string[] | null
          interventions_used?: string | null
          is_diagnosed?: boolean | null
          last_assessment_date?: string | null
          location_accuracy?: number | null
          location_address?: string | null
          location_occurred?: string | null
          location_source?: string | null
          location_timestamp?: string | null
          medical_issue_type_ids?: string[] | null
          objective_findings?: string | null
          observable_symptoms?: Json | null
          outcome?: string | null
          outcome_id?: string | null
          owning_org_id: number
          person_id: number
          person_response?: string | null
          photo_urls?: string[] | null
          plan_summary?: string | null
          possible_triggers?: string | null
          primary_condition: string
          primary_issue_type_id?: string | null
          primary_symptom_ids?: string[] | null
          progress_photo_urls?: Json | null
          progression_status?:
            | Database["core"]["Enums"]["progression_status"]
            | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          referrals_made?: string | null
          refusal_reason?: string | null
          related_incident_id?: number | null
          risk_to_others?: string | null
          risk_to_self?: string | null
          safety_plan_discussed?: boolean | null
          scene_arrival_at?: string | null
          scene_departure_at?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          severity_factors?: string[] | null
          severity_level?:
            | Database["core"]["Enums"]["severity_level_enum"]
            | null
          severity_score?: number | null
          situation_context?: string | null
          source?: Database["core"]["Enums"]["record_source_enum"]
          subjective_notes?: string | null
          template_key: Database["core"]["Enums"]["medical_episode_template_key_enum"]
          template_version?: number
          transport_decision?: string | null
          updated_at?: string | null
          updated_by?: string | null
          urgency_level?:
            | Database["public"]["Enums"]["medical_urgency_enum"]
            | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          visible_symptom_ids?: string[] | null
          warning_signs?: string[] | null
          wound_details?: Json | null
          wound_location_id?: string | null
        }
        Update: {
          assessment_data?: Json | null
          assessment_summary?: string | null
          body_location_ids?: string[] | null
          case_id?: number | null
          chart_lock_metadata?: Json | null
          check_in_id?: string | null
          chief_complaint?: string | null
          condition_id?: string | null
          condition_instance_id?: string | null
          consent_status?: string | null
          created_at?: string | null
          created_by?: string | null
          days_since_onset?: number | null
          destination_facility?: string | null
          diagnosis_source?: string | null
          duration_observed?: string | null
          encounter_id?: string | null
          environmental_factors?: string | null
          episode_date?: string
          episode_datetime?: string | null
          episode_end_date?: string | null
          episode_status?:
            | Database["public"]["Enums"]["medical_status_enum"]
            | null
          escalation_needed?: boolean | null
          facility_involved?: string | null
          follow_up_needed?: boolean | null
          follow_up_notes?: string | null
          follow_up_timeline?:
            | Database["core"]["Enums"]["follow_up_plan_enum"]
            | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          healthcare_provider?: string | null
          id?: string
          incident_role?: string | null
          initial_photo_urls?: string[] | null
          intervention_details?: Json | null
          intervention_ids?: string[] | null
          interventions_used?: string | null
          is_diagnosed?: boolean | null
          last_assessment_date?: string | null
          location_accuracy?: number | null
          location_address?: string | null
          location_occurred?: string | null
          location_source?: string | null
          location_timestamp?: string | null
          medical_issue_type_ids?: string[] | null
          objective_findings?: string | null
          observable_symptoms?: Json | null
          outcome?: string | null
          outcome_id?: string | null
          owning_org_id?: number
          person_id?: number
          person_response?: string | null
          photo_urls?: string[] | null
          plan_summary?: string | null
          possible_triggers?: string | null
          primary_condition?: string
          primary_issue_type_id?: string | null
          primary_symptom_ids?: string[] | null
          progress_photo_urls?: Json | null
          progression_status?:
            | Database["core"]["Enums"]["progression_status"]
            | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          referrals_made?: string | null
          refusal_reason?: string | null
          related_incident_id?: number | null
          risk_to_others?: string | null
          risk_to_self?: string | null
          safety_plan_discussed?: boolean | null
          scene_arrival_at?: string | null
          scene_departure_at?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          severity_factors?: string[] | null
          severity_level?:
            | Database["core"]["Enums"]["severity_level_enum"]
            | null
          severity_score?: number | null
          situation_context?: string | null
          source?: Database["core"]["Enums"]["record_source_enum"]
          subjective_notes?: string | null
          template_key?: Database["core"]["Enums"]["medical_episode_template_key_enum"]
          template_version?: number
          transport_decision?: string | null
          updated_at?: string | null
          updated_by?: string | null
          urgency_level?:
            | Database["public"]["Enums"]["medical_urgency_enum"]
            | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          visible_symptom_ids?: string[] | null
          warning_signs?: string[] | null
          wound_details?: Json | null
          wound_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_episodes_condition_id_fkey"
            columns: ["condition_id"]
            isOneToOne: false
            referencedRelation: "medical_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_condition_instance_id_fkey"
            columns: ["condition_instance_id"]
            isOneToOne: false
            referencedRelation: "person_conditions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_outcome_id_fkey"
            columns: ["outcome_id"]
            isOneToOne: false
            referencedRelation: "medical_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_owning_org_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_owning_org_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_episodes_wound_location_id_fkey"
            columns: ["wound_location_id"]
            isOneToOne: false
            referencedRelation: "medical_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guidance_protocols: {
        Row: {
          approved_at: string | null
          approved_by_profile_id: string | null
          content: Json
          created_at: string
          created_by: string | null
          id: string
          owning_org_id: number | null
          protocol_key: string
          protocol_type: string
          scenario: string
          status: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          owning_org_id?: number | null
          protocol_key: string
          protocol_type: string
          scenario: string
          status: string
          updated_at?: string
          updated_by?: string | null
          version: number
        }
        Update: {
          approved_at?: string | null
          approved_by_profile_id?: string | null
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          owning_org_id?: number | null
          protocol_key?: string
          protocol_type?: string
          scenario?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "medical_guidance_protocols_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_protocols_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guidance_reviews: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          owning_org_id: number
          recommended_protocol_changes: Json | null
          review_notes: string | null
          review_status: string
          reviewed_at: string
          reviewed_by_profile_id: string
          run_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          owning_org_id: number
          recommended_protocol_changes?: Json | null
          review_notes?: string | null
          review_status: string
          reviewed_at?: string
          reviewed_by_profile_id: string
          run_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          owning_org_id?: number
          recommended_protocol_changes?: Json | null
          review_notes?: string | null
          review_status?: string
          reviewed_at?: string
          reviewed_by_profile_id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_guidance_reviews_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_reviews_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_reviews_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "medical_guidance_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guidance_run_answers: {
        Row: {
          answers: Json
          created_at: string
          created_by: string | null
          decision_support_acknowledged: boolean
          decision_support_acknowledged_at: string | null
          decision_support_statement: string | null
          decision_support_version: string | null
          final_summary: string | null
          id: string
          owning_org_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          run_id: string
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          answers: Json
          created_at?: string
          created_by?: string | null
          decision_support_acknowledged?: boolean
          decision_support_acknowledged_at?: string | null
          decision_support_statement?: string | null
          decision_support_version?: string | null
          final_summary?: string | null
          id?: string
          owning_org_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          run_id: string
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          answers?: Json
          created_at?: string
          created_by?: string | null
          decision_support_acknowledged?: boolean
          decision_support_acknowledged_at?: string | null
          decision_support_statement?: string | null
          decision_support_version?: string | null
          final_summary?: string | null
          id?: string
          owning_org_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          run_id?: string
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "medical_guidance_run_answers_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_run_answers_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_run_answers_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "medical_guidance_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_guidance_runs: {
        Row: {
          created_at: string
          created_by: string | null
          episode_id: string | null
          error: string | null
          id: string
          input_snapshot: Json
          latency_ms: number | null
          model: string
          model_revision: string | null
          output_snapshot: Json
          owning_org_id: number
          person_id: number
          prompt_version: string
          protocol_id: string
          protocol_version: number
          recorded_at: string
          recorded_by_profile_id: string | null
          review_reason: Json | null
          review_required: boolean
          ruleset_version: number
          run_type: string
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          status: string
          token_usage: Json | null
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
          vitals_id: string | null
          wound_check_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          episode_id?: string | null
          error?: string | null
          id?: string
          input_snapshot: Json
          latency_ms?: number | null
          model: string
          model_revision?: string | null
          output_snapshot: Json
          owning_org_id: number
          person_id: number
          prompt_version: string
          protocol_id: string
          protocol_version: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          review_reason?: Json | null
          review_required?: boolean
          ruleset_version: number
          run_type: string
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          status: string
          token_usage?: Json | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          vitals_id?: string | null
          wound_check_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          episode_id?: string | null
          error?: string | null
          id?: string
          input_snapshot?: Json
          latency_ms?: number | null
          model?: string
          model_revision?: string | null
          output_snapshot?: Json
          owning_org_id?: number
          person_id?: number
          prompt_version?: string
          protocol_id?: string
          protocol_version?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          review_reason?: Json | null
          review_required?: boolean
          ruleset_version?: number
          run_type?: string
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          status?: string
          token_usage?: Json | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          vitals_id?: string | null
          wound_check_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_guidance_runs_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "medical_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "medical_guidance_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_vitals_id_fkey"
            columns: ["vitals_id"]
            isOneToOne: false
            referencedRelation: "medical_vitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_guidance_runs_wound_check_id_fkey"
            columns: ["wound_check_id"]
            isOneToOne: false
            referencedRelation: "medical_wound_checks"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_locations: {
        Row: {
          body_region: string
          created_at: string | null
          id: string
          location_code: string
          sort_order: number | null
          specific_location: string
        }
        Insert: {
          body_region: string
          created_at?: string | null
          id?: string
          location_code: string
          sort_order?: number | null
          specific_location: string
        }
        Update: {
          body_region?: string
          created_at?: string | null
          id?: string
          location_code?: string
          sort_order?: number | null
          specific_location?: string
        }
        Relationships: []
      }
      medical_outcomes: {
        Row: {
          created_at: string | null
          follow_up_required: boolean | null
          id: string
          outcome_description: string
          outcome_type: string
          plain_language_name: string
        }
        Insert: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome_description: string
          outcome_type: string
          plain_language_name: string
        }
        Update: {
          created_at?: string | null
          follow_up_required?: boolean | null
          id?: string
          outcome_description?: string
          outcome_type?: string
          plain_language_name?: string
        }
        Relationships: []
      }
      medical_vitals: {
        Row: {
          bgl_mmol: number | null
          bp_diastolic: number | null
          bp_systolic: number | null
          created_at: string
          created_by: string | null
          episode_id: string
          gcs_eye: number | null
          gcs_motor: number | null
          gcs_verbal: number | null
          gps_lat: number | null
          gps_lng: number | null
          hr_bpm: number | null
          id: string
          measurement_context: Json
          notes: string | null
          observed_at: string
          owning_org_id: number
          pain_0_10: number | null
          person_id: number
          pupils_left: string | null
          pupils_right: string | null
          recorded_at: string
          recorded_by_profile_id: string | null
          rr_bpm: number | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          spo2_pct: number | null
          temp_c: number | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          bgl_mmol?: number | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          created_by?: string | null
          episode_id: string
          gcs_eye?: number | null
          gcs_motor?: number | null
          gcs_verbal?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          hr_bpm?: number | null
          id?: string
          measurement_context?: Json
          notes?: string | null
          observed_at?: string
          owning_org_id: number
          pain_0_10?: number | null
          person_id: number
          pupils_left?: string | null
          pupils_right?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          rr_bpm?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          spo2_pct?: number | null
          temp_c?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          bgl_mmol?: number | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          created_at?: string
          created_by?: string | null
          episode_id?: string
          gcs_eye?: number | null
          gcs_motor?: number | null
          gcs_verbal?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          hr_bpm?: number | null
          id?: string
          measurement_context?: Json
          notes?: string | null
          observed_at?: string
          owning_org_id?: number
          pain_0_10?: number | null
          person_id?: number
          pupils_left?: string | null
          pupils_right?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          rr_bpm?: number | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          spo2_pct?: number | null
          temp_c?: number | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_vitals_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "medical_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_vitals_owning_org_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_vitals_owning_org_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_vitals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_vitals_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_wound_checks: {
        Row: {
          created_at: string
          created_by: string | null
          drainage_present: boolean | null
          episode_id: string
          id: string
          notes: string | null
          observed_at: string
          owning_org_id: number
          pain_present: boolean | null
          person_id: number
          recommendation: string | null
          recorded_at: string
          recorded_by_profile_id: string | null
          redness_present: boolean | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          swelling_present: boolean | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
          warmth_present: boolean | null
          wound_location: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          drainage_present?: boolean | null
          episode_id: string
          id?: string
          notes?: string | null
          observed_at?: string
          owning_org_id: number
          pain_present?: boolean | null
          person_id: number
          recommendation?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          redness_present?: boolean | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          swelling_present?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          warmth_present?: boolean | null
          wound_location?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          drainage_present?: boolean | null
          episode_id?: string
          id?: string
          notes?: string | null
          observed_at?: string
          owning_org_id?: number
          pain_present?: boolean | null
          person_id?: number
          recommendation?: string | null
          recorded_at?: string
          recorded_by_profile_id?: string | null
          redness_present?: boolean | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          swelling_present?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
          warmth_present?: boolean | null
          wound_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_wound_checks_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "medical_episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_wound_checks_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_wound_checks_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_wound_checks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_wound_checks_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      org_role_permissions: {
        Row: {
          created_at: string | null
          created_by: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          org_role_id: string
          permission_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          org_role_id: string
          permission_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          org_role_id?: string
          permission_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_role_permissions_org_role_id_fkey"
            columns: ["org_role_id"]
            isOneToOne: false
            referencedRelation: "org_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      org_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          organization_id: number
          role_kind: Database["core"]["Enums"]["org_role_kind"]
          template_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          organization_id: number
          role_kind?: Database["core"]["Enums"]["org_role_kind"]
          template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          organization_id?: number
          role_kind?: Database["core"]["Enums"]["org_role_kind"]
          template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_roles_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "role_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_people: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          id: number
          is_primary: boolean
          job_title: string | null
          notes: string | null
          organization_id: number
          person_id: number
          relationship_type: Database["core"]["Enums"]["organization_person_relationship_enum"]
          start_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: number
          is_primary?: boolean
          job_title?: string | null
          notes?: string | null
          organization_id: number
          person_id: number
          relationship_type: Database["core"]["Enums"]["organization_person_relationship_enum"]
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: number
          is_primary?: boolean
          job_title?: string | null
          notes?: string | null
          organization_id?: number
          person_id?: number
          relationship_type?: Database["core"]["Enums"]["organization_person_relationship_enum"]
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          availability_notes: string | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          contact_title: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: number
          is_active: boolean | null
          name: string
          notes: string | null
          operating_hours: string | null
          organization_type: string | null
          partnership_type: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          referral_process: string | null
          services_provided: string | null
          services_tags: Json | null
          special_requirements: string | null
          status: Database["core"]["Enums"]["organization_status_enum"] | null
          updated_at: string | null
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          availability_notes?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          name: string
          notes?: string | null
          operating_hours?: string | null
          organization_type?: string | null
          partnership_type?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_process?: string | null
          services_provided?: string | null
          services_tags?: Json | null
          special_requirements?: string | null
          status?: Database["core"]["Enums"]["organization_status_enum"] | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          availability_notes?: string | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          contact_title?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: number
          is_active?: boolean | null
          name?: string
          notes?: string | null
          operating_hours?: string | null
          organization_type?: string | null
          partnership_type?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          referral_process?: string | null
          services_provided?: string | null
          services_tags?: Json | null
          special_requirements?: string | null
          status?: Database["core"]["Enums"]["organization_status_enum"] | null
          updated_at?: string | null
          updated_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      people: {
        Row: {
          age: number | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          emergency_contact: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          gender: Database["core"]["Enums"]["gender_enum"] | null
          has_id_documents:
            | Database["core"]["Enums"]["document_status_enum"]
            | null
          housing_status:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id: number
          income_source: Database["core"]["Enums"]["income_source_enum"] | null
          last_name: string | null
          last_service_date: string | null
          last_verification_date: string | null
          notes: string | null
          organization_name: string | null
          person_category: Database["core"]["Enums"]["person_category"] | null
          person_type: Database["core"]["Enums"]["person_type"] | null
          phone: string | null
          preferred_contact_method: string | null
          preferred_pronouns: string | null
          primary_language: string | null
          privacy_restrictions: string | null
          professional_title: string | null
          risk_level: Database["core"]["Enums"]["risk_level_enum"] | null
          service_eligibility_status:
            | Database["core"]["Enums"]["eligibility_status_enum"]
            | null
          status: Database["core"]["Enums"]["person_status"]
          updated_at: string | null
          updated_by: string | null
          verification_method: string | null
          veteran_status:
            | Database["core"]["Enums"]["veteran_status_enum"]
            | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: Database["core"]["Enums"]["gender_enum"] | null
          has_id_documents?:
            | Database["core"]["Enums"]["document_status_enum"]
            | null
          housing_status?:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id?: number
          income_source?: Database["core"]["Enums"]["income_source_enum"] | null
          last_name?: string | null
          last_service_date?: string | null
          last_verification_date?: string | null
          notes?: string | null
          organization_name?: string | null
          person_category?: Database["core"]["Enums"]["person_category"] | null
          person_type?: Database["core"]["Enums"]["person_type"] | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_pronouns?: string | null
          primary_language?: string | null
          privacy_restrictions?: string | null
          professional_title?: string | null
          risk_level?: Database["core"]["Enums"]["risk_level_enum"] | null
          service_eligibility_status?:
            | Database["core"]["Enums"]["eligibility_status_enum"]
            | null
          status?: Database["core"]["Enums"]["person_status"]
          updated_at?: string | null
          updated_by?: string | null
          verification_method?: string | null
          veteran_status?:
            | Database["core"]["Enums"]["veteran_status_enum"]
            | null
        }
        Update: {
          age?: number | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          gender?: Database["core"]["Enums"]["gender_enum"] | null
          has_id_documents?:
            | Database["core"]["Enums"]["document_status_enum"]
            | null
          housing_status?:
            | Database["core"]["Enums"]["housing_status_enum"]
            | null
          id?: number
          income_source?: Database["core"]["Enums"]["income_source_enum"] | null
          last_name?: string | null
          last_service_date?: string | null
          last_verification_date?: string | null
          notes?: string | null
          organization_name?: string | null
          person_category?: Database["core"]["Enums"]["person_category"] | null
          person_type?: Database["core"]["Enums"]["person_type"] | null
          phone?: string | null
          preferred_contact_method?: string | null
          preferred_pronouns?: string | null
          primary_language?: string | null
          privacy_restrictions?: string | null
          professional_title?: string | null
          risk_level?: Database["core"]["Enums"]["risk_level_enum"] | null
          service_eligibility_status?:
            | Database["core"]["Enums"]["eligibility_status_enum"]
            | null
          status?: Database["core"]["Enums"]["person_status"]
          updated_at?: string | null
          updated_by?: string | null
          verification_method?: string | null
          veteran_status?:
            | Database["core"]["Enums"]["veteran_status_enum"]
            | null
        }
        Relationships: []
      }
      people_aliases: {
        Row: {
          alias_name: string
          created_at: string
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          id: number
          is_active: boolean
          person_id: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          alias_name: string
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: number
          is_active?: boolean
          person_id: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          alias_name?: string
          created_at?: string
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          id?: number
          is_active?: boolean
          person_id?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_aliases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_aliases_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          domain: string
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain?: string
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          domain?: string
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      person_access_grants: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string
          grantee_org_id: number | null
          grantee_user_id: string | null
          id: string
          person_id: number
          scope: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          grantee_org_id?: number | null
          grantee_user_id?: string | null
          id?: string
          person_id: number
          scope: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          grantee_org_id?: number | null
          grantee_user_id?: string | null
          id?: string
          person_id?: number
          scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_access_grants_org_fkey"
            columns: ["grantee_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_access_grants_org_fkey"
            columns: ["grantee_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_access_grants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_access_grants_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      person_characteristics: {
        Row: {
          body_location: string | null
          case_id: number | null
          characteristic_type: string
          created_at: string
          created_by: string | null
          encounter_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          observed_at: string
          observed_by: string | null
          owning_org_id: number
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          updated_at: string | null
          updated_by: string | null
          value_number: number | null
          value_text: string | null
          value_unit: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          body_location?: string | null
          case_id?: number | null
          characteristic_type: string
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          observed_at?: string
          observed_by?: string | null
          owning_org_id: number
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          updated_at?: string | null
          updated_by?: string | null
          value_number?: number | null
          value_text?: string | null
          value_unit?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          body_location?: string | null
          case_id?: number | null
          characteristic_type?: string
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          observed_at?: string
          observed_by?: string | null
          owning_org_id?: number
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          updated_at?: string | null
          updated_by?: string | null
          value_number?: number | null
          value_text?: string | null
          value_unit?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "person_characteristics_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_characteristics_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_characteristics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_characteristics_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      person_conditions: {
        Row: {
          care_plan: Json
          care_plan_version: number
          category: string
          condition_name: string
          created_at: string
          created_by: string
          diagnosis_code: string | null
          id: string
          is_primary: boolean
          last_confirmed_at: string | null
          notes: string | null
          onset_date: string | null
          person_id: number
          primary_clinician: string | null
          reference_condition_id: string | null
          risk_flags: Database["core"]["Enums"]["person_condition_risk_flag_enum"][]
          status: Database["core"]["Enums"]["person_condition_status_enum"]
          updated_at: string
          updated_by: string
          verification_level: Database["core"]["Enums"]["person_condition_verification_enum"]
        }
        Insert: {
          care_plan?: Json
          care_plan_version?: number
          category?: string
          condition_name: string
          created_at?: string
          created_by?: string
          diagnosis_code?: string | null
          id?: string
          is_primary?: boolean
          last_confirmed_at?: string | null
          notes?: string | null
          onset_date?: string | null
          person_id: number
          primary_clinician?: string | null
          reference_condition_id?: string | null
          risk_flags?: Database["core"]["Enums"]["person_condition_risk_flag_enum"][]
          status?: Database["core"]["Enums"]["person_condition_status_enum"]
          updated_at?: string
          updated_by?: string
          verification_level?: Database["core"]["Enums"]["person_condition_verification_enum"]
        }
        Update: {
          care_plan?: Json
          care_plan_version?: number
          category?: string
          condition_name?: string
          created_at?: string
          created_by?: string
          diagnosis_code?: string | null
          id?: string
          is_primary?: boolean
          last_confirmed_at?: string | null
          notes?: string | null
          onset_date?: string | null
          person_id?: number
          primary_clinician?: string | null
          reference_condition_id?: string | null
          risk_flags?: Database["core"]["Enums"]["person_condition_risk_flag_enum"][]
          status?: Database["core"]["Enums"]["person_condition_status_enum"]
          updated_at?: string
          updated_by?: string
          verification_level?: Database["core"]["Enums"]["person_condition_verification_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "person_conditions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_conditions_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_conditions_reference_condition_id_fkey"
            columns: ["reference_condition_id"]
            isOneToOne: false
            referencedRelation: "medical_conditions"
            referencedColumns: ["id"]
          },
        ]
      }
      person_consent_orgs: {
        Row: {
          allowed: boolean
          consent_id: string
          id: string
          organization_id: number
          reason: string | null
          set_at: string
          set_by: string | null
        }
        Insert: {
          allowed: boolean
          consent_id: string
          id?: string
          organization_id: number
          reason?: string | null
          set_at?: string
          set_by?: string | null
        }
        Update: {
          allowed?: boolean
          consent_id?: string
          id?: string
          organization_id?: number
          reason?: string | null
          set_at?: string
          set_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_consent_orgs_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "person_consents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_orgs_consent_id_fkey"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "v_person_consents_with_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_orgs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_orgs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_consent_requests: {
        Row: {
          decision_at: string | null
          decision_by: string | null
          decision_reason: string | null
          expires_at: string | null
          id: string
          metadata: Json | null
          person_id: number
          purpose: string
          requested_at: string
          requested_by_profile_id: string | null
          requested_by_user_id: string
          requested_scopes: string[]
          requesting_org_id: number
          status: Database["core"]["Enums"]["consent_request_status_enum"]
        }
        Insert: {
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          person_id: number
          purpose: string
          requested_at?: string
          requested_by_profile_id?: string | null
          requested_by_user_id: string
          requested_scopes?: string[]
          requesting_org_id: number
          status: Database["core"]["Enums"]["consent_request_status_enum"]
        }
        Update: {
          decision_at?: string | null
          decision_by?: string | null
          decision_reason?: string | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          person_id?: number
          purpose?: string
          requested_at?: string
          requested_by_profile_id?: string | null
          requested_by_user_id?: string
          requested_scopes?: string[]
          requesting_org_id?: number
          status?: Database["core"]["Enums"]["consent_request_status_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "person_consent_requests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      person_consents: {
        Row: {
          attested_at: string | null
          attested_by_client: boolean
          attested_by_staff: boolean
          captured_by: string | null
          captured_method: Database["core"]["Enums"]["consent_method_enum"]
          captured_org_id: number | null
          consent_type: Database["core"]["Enums"]["consent_type_enum"]
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          person_id: number
          policy_version: string | null
          restrictions: Json | null
          revoked_at: string | null
          revoked_by: string | null
          scope: Database["core"]["Enums"]["consent_scope_enum"]
          status: Database["core"]["Enums"]["consent_status_enum"]
          updated_at: string | null
        }
        Insert: {
          attested_at?: string | null
          attested_by_client?: boolean
          attested_by_staff?: boolean
          captured_by?: string | null
          captured_method: Database["core"]["Enums"]["consent_method_enum"]
          captured_org_id?: number | null
          consent_type: Database["core"]["Enums"]["consent_type_enum"]
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          person_id: number
          policy_version?: string | null
          restrictions?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          scope: Database["core"]["Enums"]["consent_scope_enum"]
          status: Database["core"]["Enums"]["consent_status_enum"]
          updated_at?: string | null
        }
        Update: {
          attested_at?: string | null
          attested_by_client?: boolean
          attested_by_staff?: boolean
          captured_by?: string | null
          captured_method?: Database["core"]["Enums"]["consent_method_enum"]
          captured_org_id?: number | null
          consent_type?: Database["core"]["Enums"]["consent_type_enum"]
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          person_id?: number
          policy_version?: string | null
          restrictions?: Json | null
          revoked_at?: string | null
          revoked_by?: string | null
          scope?: Database["core"]["Enums"]["consent_scope_enum"]
          status?: Database["core"]["Enums"]["consent_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_consents_captured_org_id_fkey"
            columns: ["captured_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_captured_org_id_fkey"
            columns: ["captured_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      person_media_links: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          link_kind: string
          media_id: string
          metadata: Json | null
          person_id: number
          shared_by_profile_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          link_kind: string
          media_id: string
          metadata?: Json | null
          person_id: number
          shared_by_profile_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          link_kind?: string
          media_id?: string
          metadata?: Json | null
          person_id?: number
          shared_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_objects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_media_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_media_links_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      person_relationships: {
        Row: {
          case_id: number | null
          contact_address: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          end_date: string | null
          id: string
          is_emergency: boolean
          is_primary: boolean
          metadata: Json | null
          notes: string | null
          owning_org_id: number
          person_id: number
          recorded_at: string
          recorded_by_profile_id: string | null
          related_person_id: number | null
          relationship_status: string | null
          relationship_subtype: string | null
          relationship_type: string
          safe_contact_notes: string | null
          safe_to_contact: boolean
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source: Database["core"]["Enums"]["record_source_enum"]
          start_date: string | null
          updated_at: string | null
          updated_by: string | null
          verification_status: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          case_id?: number | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          end_date?: string | null
          id?: string
          is_emergency?: boolean
          is_primary?: boolean
          metadata?: Json | null
          notes?: string | null
          owning_org_id: number
          person_id: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          related_person_id?: number | null
          relationship_status?: string | null
          relationship_subtype?: string | null
          relationship_type: string
          safe_contact_notes?: string | null
          safe_to_contact?: boolean
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          case_id?: number | null
          contact_address?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          end_date?: string | null
          id?: string
          is_emergency?: boolean
          is_primary?: boolean
          metadata?: Json | null
          notes?: string | null
          owning_org_id?: number
          person_id?: number
          recorded_at?: string
          recorded_by_profile_id?: string | null
          related_person_id?: number | null
          relationship_status?: string | null
          relationship_subtype?: string | null
          relationship_type?: string
          safe_contact_notes?: string | null
          safe_to_contact?: boolean
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source?: Database["core"]["Enums"]["record_source_enum"]
          start_date?: string | null
          updated_at?: string | null
          updated_by?: string | null
          verification_status?: Database["core"]["Enums"]["verification_status_enum"]
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "person_relationships_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_relationships_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_relationships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_relationships_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_relationships_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_relationships_related_person_id_fkey"
            columns: ["related_person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_count_observations: {
        Row: {
          addiction_response:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          addiction_severity:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          age_bracket: Database["core"]["Enums"]["pit_age_bracket"] | null
          created_at: string
          created_by: string | null
          external_id: string | null
          gender: Database["core"]["Enums"]["gender_enum"] | null
          homelessness_response:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          id: string
          location_type: Database["core"]["Enums"]["pit_location_type"] | null
          mental_health_response:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          mental_health_severity:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          metadata: Json
          municipality: string | null
          notes: string | null
          observed_at: string
          person_id: number | null
          pit_count_id: string
          updated_at: string
          updated_by: string | null
          wants_treatment:
            | Database["core"]["Enums"]["pit_treatment_interest"]
            | null
        }
        Insert: {
          addiction_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          addiction_severity?:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          age_bracket?: Database["core"]["Enums"]["pit_age_bracket"] | null
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          gender?: Database["core"]["Enums"]["gender_enum"] | null
          homelessness_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          id?: string
          location_type?: Database["core"]["Enums"]["pit_location_type"] | null
          mental_health_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          mental_health_severity?:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          metadata?: Json
          municipality?: string | null
          notes?: string | null
          observed_at?: string
          person_id?: number | null
          pit_count_id: string
          updated_at?: string
          updated_by?: string | null
          wants_treatment?:
            | Database["core"]["Enums"]["pit_treatment_interest"]
            | null
        }
        Update: {
          addiction_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          addiction_severity?:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          age_bracket?: Database["core"]["Enums"]["pit_age_bracket"] | null
          created_at?: string
          created_by?: string | null
          external_id?: string | null
          gender?: Database["core"]["Enums"]["gender_enum"] | null
          homelessness_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          id?: string
          location_type?: Database["core"]["Enums"]["pit_location_type"] | null
          mental_health_response?:
            | Database["core"]["Enums"]["pit_boolean_response"]
            | null
          mental_health_severity?:
            | Database["core"]["Enums"]["pit_severity_level"]
            | null
          metadata?: Json
          municipality?: string | null
          notes?: string | null
          observed_at?: string
          person_id?: number | null
          pit_count_id?: string
          updated_at?: string
          updated_by?: string | null
          wants_treatment?:
            | Database["core"]["Enums"]["pit_treatment_interest"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "pit_count_observations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pit_count_observations_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pit_count_observations_pit_count_id_fkey"
            columns: ["pit_count_id"]
            isOneToOne: false
            referencedRelation: "pit_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      pit_counts: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          external_reference: string | null
          id: string
          lead_profile_id: string | null
          methodology: string | null
          municipality: string | null
          observed_end: string | null
          observed_start: string | null
          slug: string
          status: Database["core"]["Enums"]["pit_count_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_reference?: string | null
          id?: string
          lead_profile_id?: string | null
          methodology?: string | null
          municipality?: string | null
          observed_end?: string | null
          observed_start?: string | null
          slug: string
          status?: Database["core"]["Enums"]["pit_count_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          external_reference?: string | null
          id?: string
          lead_profile_id?: string | null
          methodology?: string | null
          municipality?: string | null
          observed_end?: string | null
          observed_start?: string | null
          slug?: string
          status?: Database["core"]["Enums"]["pit_count_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      role_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          role_kind: Database["core"]["Enums"]["org_role_kind"]
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          role_kind?: Database["core"]["Enums"]["org_role_kind"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          role_kind?: Database["core"]["Enums"]["org_role_kind"]
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      timeline_events: {
        Row: {
          case_id: number | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          event_at: string
          event_category: Database["core"]["Enums"]["timeline_event_category_enum"]
          id: string
          metadata: Json | null
          owning_org_id: number
          person_id: number
          recorded_by_profile_id: string | null
          sensitivity_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          source_id: string | null
          source_type: string | null
          summary: string | null
          visibility_scope: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Insert: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          event_at: string
          event_category: Database["core"]["Enums"]["timeline_event_category_enum"]
          id?: string
          metadata?: Json | null
          owning_org_id: number
          person_id: number
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Update: {
          case_id?: number | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          event_at?: string
          event_category?: Database["core"]["Enums"]["timeline_event_category_enum"]
          id?: string
          metadata?: Json | null
          owning_org_id?: number
          person_id?: number
          recorded_by_profile_id?: string | null
          sensitivity_level?: Database["core"]["Enums"]["sensitivity_level_enum"]
          source_id?: string | null
          source_type?: string | null
          summary?: string | null
          visibility_scope?: Database["core"]["Enums"]["visibility_scope_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_owning_org_id_fkey"
            columns: ["owning_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
      user_global_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          role_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_global_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "global_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_org_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          org_role_id: string
          organization_id: number
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          org_role_id: string
          organization_id: number
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          org_role_id?: string
          organization_id?: number
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_org_roles_org_role_id_fkey"
            columns: ["org_role_id"]
            isOneToOne: false
            referencedRelation: "org_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_org_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_people: {
        Row: {
          id: string
          linked_at: string
          person_id: number
          profile_id: string | null
          user_id: string
        }
        Insert: {
          id?: string
          linked_at?: string
          person_id: number
          profile_id?: string | null
          user_id: string
        }
        Update: {
          id?: string
          linked_at?: string
          person_id?: number
          profile_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_people_person_fk"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_people_person_fk"
            columns: ["person_id"]
            isOneToOne: true
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      participating_organizations: {
        Row: {
          id: number | null
          is_active: boolean | null
          name: string | null
          organization_type: string | null
          partnership_type: string | null
        }
        Insert: {
          id?: number | null
          is_active?: boolean | null
          name?: string | null
          organization_type?: string | null
          partnership_type?: string | null
        }
        Update: {
          id?: number | null
          is_active?: boolean | null
          name?: string | null
          organization_type?: string | null
          partnership_type?: string | null
        }
        Relationships: []
      }
      people_name_only: {
        Row: {
          first_name: string | null
          id: number | null
          last_name: string | null
          last_service_month: string | null
          person_type: Database["core"]["Enums"]["person_type"] | null
        }
        Insert: {
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          last_service_month?: never
          person_type?: Database["core"]["Enums"]["person_type"] | null
        }
        Update: {
          first_name?: string | null
          id?: number | null
          last_name?: string | null
          last_service_month?: never
          person_type?: Database["core"]["Enums"]["person_type"] | null
        }
        Relationships: []
      }
      person_consent_requests_status: {
        Row: {
          decision_at: string | null
          expires_at: string | null
          id: string | null
          person_id: number | null
          requested_at: string | null
          requested_by_user_id: string | null
          requesting_org_id: number | null
          status:
            | Database["core"]["Enums"]["consent_request_status_enum"]
            | null
        }
        Insert: {
          decision_at?: string | null
          expires_at?: string | null
          id?: string | null
          person_id?: number | null
          requested_at?: string | null
          requested_by_user_id?: string | null
          requesting_org_id?: number | null
          status?:
            | Database["core"]["Enums"]["consent_request_status_enum"]
            | null
        }
        Update: {
          decision_at?: string | null
          expires_at?: string | null
          id?: string | null
          person_id?: number | null
          requested_at?: string | null
          requested_by_user_id?: string | null
          requesting_org_id?: number | null
          status?:
            | Database["core"]["Enums"]["consent_request_status_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "person_consent_requests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consent_requests_requesting_org_id_fkey"
            columns: ["requesting_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      v_person_consents_with_profiles: {
        Row: {
          attested_at: string | null
          attested_by_client: boolean | null
          attested_by_staff: boolean | null
          captured_by: string | null
          captured_by_profile_name: string | null
          captured_method:
            | Database["core"]["Enums"]["consent_method_enum"]
            | null
          captured_org_id: number | null
          consent_type: Database["core"]["Enums"]["consent_type_enum"] | null
          created_at: string | null
          expires_at: string | null
          id: string | null
          notes: string | null
          person_id: number | null
          policy_version: string | null
          restrictions: Json | null
          revoked_at: string | null
          revoked_by: string | null
          revoked_by_profile_name: string | null
          scope: Database["core"]["Enums"]["consent_scope_enum"] | null
          status: Database["core"]["Enums"]["consent_status_enum"] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_consents_captured_org_id_fkey"
            columns: ["captured_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_captured_org_id_fkey"
            columns: ["captured_org_id"]
            isOneToOne: false
            referencedRelation: "participating_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_consents_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people_name_only"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_actor_can_read_media: {
        Args: { p_media_id: string }
        Returns: boolean
      }
      fn_observation_sensitivity_allowed: {
        Args: {
          p_level: Database["core"]["Enums"]["sensitivity_level_enum"]
          p_org_id: number
          p_user?: string
        }
        Returns: boolean
      }
      fn_person_consent_allows_org: {
        Args: { p_org_id: number; p_person_id: number }
        Returns: boolean
      }
      get_actor_global_roles: {
        Args: { p_user?: string }
        Returns: {
          role_name: string
        }[]
      }
      get_actor_org_permissions: {
        Args: { p_org_id?: number }
        Returns: {
          permission_name: string
        }[]
      }
      get_actor_org_roles: {
        Args: { p_org_id?: number }
        Returns: {
          role_display_name: string
          role_id: string
          role_kind: Database["core"]["Enums"]["org_role_kind"]
          role_name: string
        }[]
      }
      get_actor_permissions_summary: {
        Args: { p_user?: string }
        Returns: {
          permission_name: string
        }[]
      }
      get_enum_options: {
        Args: { enum_name: string }
        Returns: {
          description: string
          is_default: boolean
          label: string
          metadata: Json
          sort_order: number
          value: string
        }[]
      }
      get_iharc_org_id: { Args: never; Returns: number }
      get_people_list_with_types: {
        Args: {
          p_page?: number
          p_page_size?: number
          p_person_category?: Database["core"]["Enums"]["person_category"]
          p_person_types?: Database["core"]["Enums"]["person_type"][]
          p_search_term?: string
          p_sort_by?: string
          p_sort_order?: string
          p_status?: Database["core"]["Enums"]["person_status"]
        }
        Returns: {
          created_at: string
          email: string
          first_name: string
          housing_status: string
          id: number
          last_name: string
          last_service_date: string
          organization_name: string
          person_category: Database["core"]["Enums"]["person_category"]
          person_type: Database["core"]["Enums"]["person_type"]
          phone: string
          professional_title: string
          risk_level: string
          status: Database["core"]["Enums"]["person_status"]
          total_count: number
          updated_at: string
        }[]
      }
      has_iharc_permission: {
        Args: { p_user?: string; permission_name: string }
        Returns: boolean
      }
      has_org_permission: {
        Args: { p_org_id: number; p_user?: string; permission_name: string }
        Returns: boolean
      }
      is_global_admin: { Args: { p_user?: string }; Returns: boolean }
      is_org_member: {
        Args: { p_org_id: number; p_user?: string }
        Returns: boolean
      }
      log_consent_contact: {
        Args: { p_org_id: number; p_person_id: number; p_summary: string }
        Returns: undefined
      }
      person_alias_create: {
        Args: {
          p_alias_name: string
          p_change_reason: string
          p_person_id: number
        }
        Returns: number
      }
      person_alias_set_active: {
        Args: {
          p_alias_id: number
          p_change_reason: string
          p_is_active: boolean
          p_person_id: number
        }
        Returns: undefined
      }
      person_alias_update: {
        Args: {
          p_alias_id: number
          p_alias_name: string
          p_change_reason: string
          p_person_id: number
        }
        Returns: undefined
      }
      person_create_basic: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_preferred_contact_method: string
          p_preferred_pronouns: string
          p_privacy_restrictions: string
          p_status?: Database["core"]["Enums"]["person_status"]
        }
        Returns: number
      }
      person_update_contact: {
        Args: {
          p_change_reason: string
          p_changed_fields: string[]
          p_email: string
          p_person_id: number
          p_phone: string
          p_preferred_contact_method: string
          p_privacy_restrictions: string
        }
        Returns: undefined
      }
      person_update_identity: {
        Args: {
          p_age: number
          p_change_reason: string
          p_changed_fields: string[]
          p_date_of_birth: string
          p_first_name: string
          p_gender: Database["core"]["Enums"]["gender_enum"]
          p_last_name: string
          p_person_id: number
          p_preferred_pronouns: string
        }
        Returns: undefined
      }
      request_person_consent: {
        Args: {
          p_note?: string
          p_org_id: number
          p_person_id: number
          p_purpose: string
          p_requested_scopes?: string[]
        }
        Returns: string
      }
      staff_outreach_logs: {
        Args: { limit_rows?: number; staff_uuid: string }
        Returns: {
          id: string
          location: string
          occurred_at: string
          summary: string
          title: string
        }[]
      }
      staff_shifts_today: {
        Args: { staff_uuid: string }
        Returns: {
          ends_at: string
          id: string
          location: string
          starts_at: string
          title: string
        }[]
      }
    }
    Enums: {
      assessment_urgency:
        | "emergency"
        | "urgent"
        | "concern"
        | "followup"
        | "routine"
      bwc_ingestion_status_enum: "uploaded" | "processing" | "ready" | "failed"
      cfs_access_level_enum: "view" | "collaborate" | "dispatch"
      cfs_origin_enum: "community" | "system"
      cfs_public_category_enum:
        | "cleanup"
        | "outreach"
        | "welfare_check"
        | "supply_distribution"
        | "other"
      cfs_public_status_enum:
        | "received"
        | "triaged"
        | "dispatched"
        | "in_progress"
        | "resolved"
      cfs_source_enum:
        | "web_form"
        | "phone"
        | "sms"
        | "email"
        | "social"
        | "api"
        | "staff_observed"
      cfs_status_enum: "received" | "triaged" | "dismissed" | "converted"
      consent_method_enum:
        | "portal"
        | "staff_assisted"
        | "verbal"
        | "documented"
        | "migration"
      consent_request_status_enum: "pending" | "approved" | "denied" | "expired"
      consent_scope_enum: "all_orgs" | "selected_orgs" | "none"
      consent_status_enum: "active" | "revoked" | "expired"
      consent_type_enum: "data_sharing"
      cost_entry_type_enum: "direct" | "replacement_value" | "overhead"
      cost_source_type_enum:
        | "activity"
        | "distribution"
        | "inventory_tx"
        | "appointment"
        | "manual"
        | "external"
        | "staff_time"
        | "encounter"
      dispatch_priority_enum:
        | "informational"
        | "low"
        | "medium"
        | "high"
        | "critical"
      document_status_enum: "yes" | "no" | "partial" | "unknown"
      eligibility_status_enum:
        | "eligible"
        | "ineligible"
        | "pending_assessment"
        | "under_review"
      environmental_factors_enum:
        | "rain"
        | "snow"
        | "ice"
        | "extreme_heat"
        | "extreme_cold"
        | "poor_lighting"
        | "unstable_structure"
        | "weather_hazards"
        | "traffic_road"
        | "wildlife"
        | "contamination"
        | "structural_damage"
        | "other"
      ethnicity_enum:
        | "indigenous"
        | "black_african"
        | "east_asian"
        | "south_asian"
        | "southeast_asian"
        | "west_asian"
        | "latin_american"
        | "white_european"
        | "mixed"
        | "other"
        | "prefer_not_to_say"
      follow_up_plan_enum:
        | "immediate"
        | "urgent"
        | "weekly"
        | "routine"
        | "client_initiated"
      gender_enum:
        | "Male"
        | "Female"
        | "Non-binary"
        | "Other"
        | "Prefer not to say"
      health_concern_enum:
        | "mental_health"
        | "addiction_substance_use"
        | "physical_health"
        | "chronic_conditions"
        | "disabilities"
        | "none"
      housing_status_enum:
        | "housed"
        | "emergency_shelter"
        | "transitional_housing"
        | "temporarily_housed"
        | "unsheltered"
        | "unknown"
      incident_complexity_enum: "simple" | "moderate" | "complex" | "major"
      incident_priority_enum: "low" | "medium" | "high" | "critical"
      incident_status_enum:
        | "draft"
        | "open"
        | "in_progress"
        | "resolved"
        | "closed"
      incident_type_enum:
        | "outreach"
        | "welfare_check"
        | "medical"
        | "mental_health"
        | "mental_health_crisis"
        | "overdose"
        | "death"
        | "assault"
        | "theft"
        | "disturbance"
        | "property_damage"
        | "fire"
        | "cleanup"
        | "supply_distribution"
        | "other"
      income_source_enum:
        | "employment"
        | "benefits"
        | "disability"
        | "pension"
        | "other"
        | "none"
        | "unknown"
      justice_episode_type_enum:
        | "arrest"
        | "charge"
        | "court"
        | "probation"
        | "parole"
        | "warrant"
        | "other"
      media_access_action_enum:
        | "upload_initiated"
        | "upload_completed"
        | "upload_failed"
        | "view_url_issued"
        | "linked"
        | "unlinked"
        | "deleted"
      media_purpose_enum:
        | "cfs_attachment"
        | "medical_photo"
        | "medical_thermal"
        | "client_document"
        | "person_profile_photo"
        | "bwc_raw"
        | "bwc_clip"
        | "marketing_hero"
        | "marketing_logo_light"
        | "marketing_logo_dark"
        | "marketing_favicon"
        | "org_logo"
      media_retention_class_enum:
        | "routine"
        | "clinical"
        | "incident"
        | "legal_hold"
      media_storage_provider_enum: "azure_blob" | "supabase_storage"
      media_upload_mode_enum: "single_put" | "block_blob"
      media_upload_status_enum:
        | "initiated"
        | "uploaded"
        | "completed"
        | "aborted"
        | "expired"
        | "failed"
      medical_episode_note_type_enum: "soap" | "addendum" | "narrative"
      medical_episode_template_key_enum:
        | "vitals_check_guided"
        | "wound_care_guided"
        | "clinical_assessment"
      medical_media_kind_enum: "photo" | "thermal"
      notify_channel_enum: "none" | "email" | "sms"
      org_role_kind: "staff" | "volunteer"
      organization_person_relationship_enum:
        | "employee"
        | "volunteer"
        | "contractor"
        | "partner_staff"
        | "liaison"
        | "board_member"
        | "sponsor"
        | "other"
      organization_status_enum:
        | "active"
        | "inactive"
        | "pending"
        | "under_review"
      party_role_enum:
        | "subject"
        | "reporter"
        | "responder"
        | "agency"
        | "bystander"
      person_category:
        | "service_recipient"
        | "community"
        | "professional"
        | "support"
      person_condition_risk_flag_enum:
        | "self_harm_risk"
        | "risk_to_others"
        | "medication_nonadherence"
        | "substance_trigger"
        | "medical_instability"
        | "needs_meds_support"
        | "housing_instability"
        | "legal_concern"
      person_condition_status_enum:
        | "active"
        | "remission"
        | "ruled_out"
        | "inactive"
        | "resolved"
        | "unknown"
      person_condition_verification_enum:
        | "self_report"
        | "clinician_diagnosis"
        | "chart_confirmed"
        | "collateral_report"
        | "screening_assessment"
      person_status:
        | "active"
        | "inactive"
        | "deceased"
        | "archived"
        | "pending_verification"
        | "do_not_contact"
        | "merged"
      person_type:
        | "client"
        | "former_client"
        | "potential_client"
        | "resident"
        | "concerned_citizen"
        | "agency_contact"
        | "case_worker"
        | "healthcare_provider"
        | "emergency_contact"
        | "family_member"
        | "support_person"
      pit_age_bracket:
        | "under_19"
        | "age_20_39"
        | "age_40_59"
        | "age_60_plus"
        | "unknown"
      pit_boolean_response: "yes" | "no" | "maybe" | "unknown" | "not_answered"
      pit_count_status: "planned" | "active" | "closed"
      pit_location_type:
        | "encampment"
        | "shelter"
        | "street"
        | "vehicle"
        | "motel"
        | "couch_surfing"
        | "institutional"
        | "other"
        | "unknown"
      pit_severity_level:
        | "none"
        | "mild"
        | "moderate"
        | "severe"
        | "critical"
        | "unknown"
        | "not_recorded"
        | "not_applicable"
      pit_treatment_interest: "yes" | "no" | "not_suitable" | "not_applicable"
      place_of_origin_enum:
        | "Port Hope"
        | "Cobourg"
        | "Northumberland County (other)"
        | "Durham Region"
        | "Peterborough"
        | "Prince Edward County"
        | "GTA (including Toronto)"
        | "Outside of Province"
        | "Outside of Country"
      progression_status:
        | "new"
        | "improving"
        | "stable"
        | "worsening"
        | "much_worse"
        | "resolved"
        | "unknown"
      public_safety_impact_enum:
        | "none"
        | "minimal"
        | "moderate"
        | "significant"
        | "major"
      record_source_enum:
        | "client_reported"
        | "staff_observed"
        | "document"
        | "partner_org"
        | "system"
      risk_factor_enum:
        | "Substance Use"
        | "Mental Health"
        | "Domestic Violence"
        | "Justice Involvement"
        | "Chronic Health"
        | "Weather Exposure"
        | "Mobility Issue"
      risk_level_enum: "low" | "medium" | "high" | "critical" | "unknown"
      sensitivity_level_enum: "standard" | "sensitive" | "high" | "restricted"
      severity_level_enum:
        | "minimal"
        | "mild"
        | "moderate"
        | "severe"
        | "critical"
      substance_indicators_enum:
        | "alcohol"
        | "cannabis"
        | "hard_drugs"
        | "needles_paraphernalia"
        | "pills_medication"
        | "smoking_materials"
        | "unknown_substances"
        | "other"
      timeline_event_category_enum:
        | "encounter"
        | "task"
        | "referral"
        | "supply"
        | "appointment"
        | "note"
        | "client_update"
        | "intake"
        | "medical"
        | "justice"
        | "relationship"
        | "characteristic"
        | "consent"
        | "system"
        | "other"
        | "observation"
      verification_status_enum: "unverified" | "verified" | "disputed" | "stale"
      veteran_status_enum: "yes" | "no" | "unknown"
      visibility_scope_enum: "internal_to_org" | "shared_via_consent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  donations: {
    Tables: {
      catalog_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_public: boolean
          label: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          label: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          label?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      catalog_item_categories: {
        Row: {
          catalog_item_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          catalog_item_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          catalog_item_id?: string
          category_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_item_categories_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_item_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "catalog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_items: {
        Row: {
          category: string | null
          created_at: string
          currency: string
          default_quantity: number
          id: string
          image_url: string | null
          inventory_item_id: string
          is_active: boolean
          long_description: string | null
          priority: number
          short_description: string | null
          slug: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          target_buffer: number | null
          title: string
          unit_cost_cents: number | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string
          default_quantity?: number
          id?: string
          image_url?: string | null
          inventory_item_id: string
          is_active?: boolean
          long_description?: string | null
          priority?: number
          short_description?: string | null
          slug: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          target_buffer?: number | null
          title: string
          unit_cost_cents?: number | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string
          default_quantity?: number
          id?: string
          image_url?: string | null
          inventory_item_id?: string
          is_active?: boolean
          long_description?: string | null
          priority?: number
          short_description?: string | null
          slug?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          target_buffer?: number | null
          title?: string
          unit_cost_cents?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      donation_intent_items: {
        Row: {
          catalog_item_id: string
          created_at: string
          donation_intent_id: string
          id: string
          line_amount_cents: number
          quantity: number
          unit_amount_cents: number
        }
        Insert: {
          catalog_item_id: string
          created_at?: string
          donation_intent_id: string
          id?: string
          line_amount_cents: number
          quantity: number
          unit_amount_cents: number
        }
        Update: {
          catalog_item_id?: string
          created_at?: string
          donation_intent_id?: string
          id?: string
          line_amount_cents?: number
          quantity?: number
          unit_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "donation_intent_items_catalog_item_id_fkey"
            columns: ["catalog_item_id"]
            isOneToOne: false
            referencedRelation: "catalog_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_intent_items_donation_intent_id_fkey"
            columns: ["donation_intent_id"]
            isOneToOne: false
            referencedRelation: "donation_intents"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_intents: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          custom_amount_cents: number
          donor_id: string | null
          id: string
          metadata: Json | null
          status: Database["donations"]["Enums"]["donation_intent_status"]
          stripe_session_id: string | null
          total_amount_cents: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          custom_amount_cents?: number
          donor_id?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["donations"]["Enums"]["donation_intent_status"]
          stripe_session_id?: string | null
          total_amount_cents: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          custom_amount_cents?: number
          donor_id?: string | null
          id?: string
          metadata?: Json | null
          status?: Database["donations"]["Enums"]["donation_intent_status"]
          stripe_session_id?: string | null
          total_amount_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "donation_intents_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          donation_intent_id: string | null
          donation_subscription_id: string | null
          id: string
          processed_at: string
          provider: string
          provider_charge_id: string | null
          provider_invoice_id: string | null
          provider_payment_id: string | null
          raw_payload: Json | null
          status: Database["donations"]["Enums"]["donation_payment_status"]
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          donation_intent_id?: string | null
          donation_subscription_id?: string | null
          id?: string
          processed_at?: string
          provider?: string
          provider_charge_id?: string | null
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["donations"]["Enums"]["donation_payment_status"]
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          donation_intent_id?: string | null
          donation_subscription_id?: string | null
          id?: string
          processed_at?: string
          provider?: string
          provider_charge_id?: string | null
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          raw_payload?: Json | null
          status?: Database["donations"]["Enums"]["donation_payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "donation_payments_donation_intent_id_fkey"
            columns: ["donation_intent_id"]
            isOneToOne: false
            referencedRelation: "donation_intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_payments_donation_subscription_id_fkey"
            columns: ["donation_subscription_id"]
            isOneToOne: false
            referencedRelation: "donation_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_subscriptions: {
        Row: {
          amount_cents: number
          canceled_at: string | null
          created_at: string
          currency: string
          donor_id: string
          id: string
          last_invoice_status: string | null
          last_payment_at: string | null
          started_at: string | null
          status: Database["donations"]["Enums"]["donation_subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          donor_id: string
          id?: string
          last_invoice_status?: string | null
          last_payment_at?: string | null
          started_at?: string | null
          status?: Database["donations"]["Enums"]["donation_subscription_status"]
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          canceled_at?: string | null
          created_at?: string
          currency?: string
          donor_id?: string
          id?: string
          last_invoice_status?: string | null
          last_payment_at?: string | null
          started_at?: string | null
          status?: Database["donations"]["Enums"]["donation_subscription_status"]
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_subscriptions_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_manage_tokens: {
        Row: {
          consumed_at: string | null
          created_at: string
          donor_id: string
          expires_at: string
          id: string
          token_hash: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          donor_id: string
          expires_at: string
          id?: string
          token_hash: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          donor_id?: string
          expires_at?: string
          id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_manage_tokens_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      donors: {
        Row: {
          address: Json | null
          created_at: string
          email: string
          id: string
          name: string | null
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          email: string
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limit_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      stripe_amount_prices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          interval: string
          stripe_mode: string
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency: string
          interval: string
          stripe_mode?: string
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          interval?: string
          stripe_mode?: string
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_products: {
        Row: {
          created_at: string
          key: string
          stripe_mode: string
          stripe_product_id: string
        }
        Insert: {
          created_at?: string
          key: string
          stripe_mode?: string
          stripe_product_id: string
        }
        Update: {
          created_at?: string
          key?: string
          stripe_mode?: string
          stripe_product_id?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          error: string | null
          id: string
          processed_at: string | null
          received_at: string
          status:
            | Database["donations"]["Enums"]["stripe_webhook_event_status"]
            | null
          stripe_event_id: string
          type: string
        }
        Insert: {
          error?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          status?:
            | Database["donations"]["Enums"]["stripe_webhook_event_status"]
            | null
          stripe_event_id: string
          type: string
        }
        Update: {
          error?: string | null
          id?: string
          processed_at?: string | null
          received_at?: string
          status?:
            | Database["donations"]["Enums"]["stripe_webhook_event_status"]
            | null
          stripe_event_id?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_upsert_catalog_item: {
        Args: {
          p_category_ids?: string[]
          p_currency?: string
          p_default_quantity?: number
          p_id?: string
          p_image_url?: string
          p_inventory_item_id: string
          p_long_description?: string
          p_priority?: number
          p_short_description?: string
          p_should_be_active?: boolean
          p_slug: string
          p_target_buffer?: number
        }
        Returns: string
      }
      assert_catalog_item_can_be_active: {
        Args: { p_catalog_item_id: string; p_inventory_item_id: string }
        Returns: undefined
      }
      donations_admin_set_stripe_mode: {
        Args: { p_actor_profile_id: string; p_mode: string }
        Returns: undefined
      }
      donations_admin_upsert_email_credentials: {
        Args: {
          p_actor_profile_id: string
          p_email_from: string
          p_sendgrid_api_key: string
        }
        Returns: undefined
      }
      donations_admin_upsert_stripe_credentials: {
        Args: {
          p_actor_profile_id: string
          p_mode: string
          p_stripe_secret_key: string
          p_stripe_webhook_secret: string
        }
        Returns: undefined
      }
      donations_check_rate_limit: {
        Args: {
          p_cooldown_ms?: number
          p_event: string
          p_identifier: string
          p_limit: number
          p_window_ms?: number
        }
        Returns: {
          allowed: boolean
          retry_in_ms: number
        }[]
      }
      donations_get_email_config: {
        Args: never
        Returns: {
          email_from: string
          provider: string
          sendgrid_api_key: string
        }[]
      }
      donations_get_stripe_config: {
        Args: never
        Returns: {
          stripe_mode: string
          stripe_secret_key: string
          stripe_webhook_secret: string
        }[]
      }
    }
    Enums: {
      donation_intent_status:
        | "pending"
        | "requires_payment"
        | "paid"
        | "failed"
        | "cancelled"
      donation_payment_status:
        | "succeeded"
        | "requires_action"
        | "failed"
        | "refunded"
      donation_subscription_status:
        | "active"
        | "canceled"
        | "past_due"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
      stripe_webhook_event_status: "succeeded" | "failed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  extensions: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      pg_stat_statements: {
        Row: {
          calls: number | null
          dbid: unknown
          jit_deform_count: number | null
          jit_deform_time: number | null
          jit_emission_count: number | null
          jit_emission_time: number | null
          jit_functions: number | null
          jit_generation_time: number | null
          jit_inlining_count: number | null
          jit_inlining_time: number | null
          jit_optimization_count: number | null
          jit_optimization_time: number | null
          local_blk_read_time: number | null
          local_blk_write_time: number | null
          local_blks_dirtied: number | null
          local_blks_hit: number | null
          local_blks_read: number | null
          local_blks_written: number | null
          max_exec_time: number | null
          max_plan_time: number | null
          mean_exec_time: number | null
          mean_plan_time: number | null
          min_exec_time: number | null
          min_plan_time: number | null
          minmax_stats_since: string | null
          plans: number | null
          query: string | null
          queryid: number | null
          rows: number | null
          shared_blk_read_time: number | null
          shared_blk_write_time: number | null
          shared_blks_dirtied: number | null
          shared_blks_hit: number | null
          shared_blks_read: number | null
          shared_blks_written: number | null
          stats_since: string | null
          stddev_exec_time: number | null
          stddev_plan_time: number | null
          temp_blk_read_time: number | null
          temp_blk_write_time: number | null
          temp_blks_read: number | null
          temp_blks_written: number | null
          toplevel: boolean | null
          total_exec_time: number | null
          total_plan_time: number | null
          userid: unknown
          wal_bytes: number | null
          wal_fpi: number | null
          wal_records: number | null
        }
        Relationships: []
      }
      pg_stat_statements_info: {
        Row: {
          dealloc: number | null
          stats_reset: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      dearmor: { Args: { "": string }; Returns: string }
      gen_random_uuid: { Args: never; Returns: string }
      gen_salt: { Args: { "": string }; Returns: string }
      pg_stat_statements: {
        Args: { showtext: boolean }
        Returns: Record<string, unknown>[]
      }
      pg_stat_statements_info: { Args: never; Returns: Record<string, unknown> }
      pg_stat_statements_reset: {
        Args: {
          dbid?: unknown
          minmax_only?: boolean
          queryid?: number
          userid?: unknown
        }
        Returns: string
      }
      pgp_armor_headers: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  inventory: {
    Tables: {
      distribution_items: {
        Row: {
          batch_id: string | null
          created_at: string | null
          created_by: string | null
          distribution_id: string
          id: string
          item_id: string
          qty: number
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          distribution_id: string
          id?: string
          item_id: string
          qty: number
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          distribution_id?: string
          id?: string
          item_id?: string
          qty?: number
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distribution_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "item_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_items_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          encounter_id: string | null
          gps_accuracy: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          gps_timestamp: string | null
          id: string
          location_id: string
          notes: string | null
          performed_by: string | null
          person_id: number | null
          provider_org_id: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          gps_accuracy?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_timestamp?: string | null
          id?: string
          location_id: string
          notes?: string | null
          performed_by?: string | null
          person_id?: number | null
          provider_org_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          encounter_id?: string | null
          gps_accuracy?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          gps_timestamp?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          performed_by?: string | null
          person_id?: number | null
          provider_org_id?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distributions_provider_org_id_fkey"
            columns: ["provider_org_id"]
            isOneToOne: false
            referencedRelation: "v_transactions_with_org"
            referencedColumns: ["provider_org_id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          location_id: string
          notes: string | null
          provider_organization_id: number | null
          qty: number
          reason_code: string
          ref_id: string | null
          ref_type: string | null
          unit_cost: number | null
          unit_multiplier: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id: string
          location_id: string
          notes?: string | null
          provider_organization_id?: number | null
          qty: number
          reason_code: string
          ref_id?: string | null
          ref_type?: string | null
          unit_cost?: number | null
          unit_multiplier?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          item_id?: string
          location_id?: string
          notes?: string | null
          provider_organization_id?: number | null
          qty?: number
          reason_code?: string
          ref_id?: string | null
          ref_type?: string | null
          unit_cost?: number | null
          unit_multiplier?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "item_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_provider_org_fk"
            columns: ["provider_organization_id"]
            isOneToOne: false
            referencedRelation: "v_transactions_with_org"
            referencedColumns: ["provider_org_id"]
          },
        ]
      }
      item_batches: {
        Row: {
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          item_id: string
          lot_number: string | null
          notes: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id: string
          lot_number?: string | null
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id?: string
          lot_number?: string | null
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      locations: {
        Row: {
          active: boolean
          address: Json | null
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          address?: Json | null
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          address?: Json | null
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_items_with_balances: {
        Row: {
          active: boolean | null
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          description: string | null
          id: string | null
          is_low_stock: boolean | null
          minimum_threshold: number | null
          name: string | null
          onhand_qty: number | null
          supplier: string | null
          unit_type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_low_stock: {
        Row: {
          active: boolean | null
          category: string | null
          cost_per_unit: number | null
          created_at: string | null
          description: string | null
          id: string | null
          is_low_stock: boolean | null
          minimum_threshold: number | null
          name: string | null
          onhand_qty: number | null
          supplier: string | null
          unit_type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_transactions_with_org: {
        Row: {
          batch_expiry_date: string | null
          batch_id: string | null
          batch_lot_number: string | null
          created_at: string | null
          created_by: string | null
          id: string | null
          item_category: string | null
          item_id: string | null
          item_name: string | null
          location_code: string | null
          location_id: string | null
          location_name: string | null
          notes: string | null
          provider_org_id: number | null
          provider_org_name: string | null
          provider_org_type: string | null
          provider_organization_id: number | null
          qty: number | null
          reason_code: string | null
          ref_id: string | null
          ref_type: string | null
          unit_cost: number | null
          unit_multiplier: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "item_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_provider_org_fk"
            columns: ["provider_organization_id"]
            isOneToOne: false
            referencedRelation: "v_transactions_with_org"
            referencedColumns: ["provider_org_id"]
          },
        ]
      }
    }
    Functions: {
      _parse_org_id_from_notes: { Args: { p_notes: string }; Returns: number }
      adjust_stock: {
        Args: {
          p_batch_id?: string
          p_item_id: string
          p_location_id: string
          p_notes?: string
          p_qty_delta: number
          p_reason: string
          p_unit_cost?: number
        }
        Returns: undefined
      }
      distribute_items: { Args: { p_payload: Json }; Returns: string }
      get_expiring_items: {
        Args: { days_ahead?: number }
        Returns: {
          batch_id: string
          category: string
          days_until_expiry: number
          expiry_date: string
          item_id: string
          item_name: string
          location_name: string
          lot_number: string
          onhand_qty: number
        }[]
      }
      get_items_with_balances: {
        Args: never
        Returns: {
          active: boolean
          category: string
          cost_per_unit: number
          created_at: string
          description: string
          id: string
          is_low_stock: boolean
          minimum_threshold: number
          name: string
          onhand_qty: number
          supplier: string
          unit_type: string
          updated_at: string
        }[]
      }
      receive_stock: {
        Args: {
          p_batch_id?: string
          p_expiry_date?: string
          p_item_id: string
          p_location_id: string
          p_lot_number?: string
          p_notes?: string
          p_qty: number
          p_unit_cost?: number
        }
        Returns: string
      }
      receive_stock_with_source: {
        Args: {
          p_batch_id?: string
          p_expiry_date?: string
          p_item_id: string
          p_location_id: string
          p_lot_number?: string
          p_notes?: string
          p_provider_org_id?: number
          p_qty: number
          p_source_type?: string
          p_unit_cost?: number
        }
        Returns: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          location_id: string
          notes: string | null
          provider_organization_id: number | null
          qty: number
          reason_code: string
          ref_id: string | null
          ref_type: string | null
          unit_cost: number | null
          unit_multiplier: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "inventory_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      transfer_stock: {
        Args: {
          p_batch_id?: string
          p_from_location_id: string
          p_item_id: string
          p_notes?: string
          p_qty: number
          p_to_location_id: string
        }
        Returns: undefined
      }
      update_transaction_source: {
        Args: {
          p_notes?: string
          p_provider_org_id: number
          p_source_type?: string
          p_transaction_id: string
        }
        Returns: {
          batch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          item_id: string
          location_id: string
          notes: string | null
          provider_organization_id: number | null
          qty: number
          reason_code: string
          ref_id: string | null
          ref_type: string | null
          unit_cost: number | null
          unit_multiplier: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "inventory_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  portal: {
    Tables: {
      appointments: {
        Row: {
          canceled_at: string | null
          cancellation_reason: string | null
          client_profile_id: string
          confirmed_at: string | null
          confirmed_by_profile_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          location: string | null
          location_type: Database["portal"]["Enums"]["appointment_channel"]
          meeting_url: string | null
          occurs_at: string | null
          organization_id: number | null
          outcome_notes: string | null
          requested_window: string | null
          requester_profile_id: string
          reschedule_note: string | null
          staff_profile_id: string | null
          status: Database["portal"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          cancellation_reason?: string | null
          client_profile_id: string
          confirmed_at?: string | null
          confirmed_by_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          location_type?: Database["portal"]["Enums"]["appointment_channel"]
          meeting_url?: string | null
          occurs_at?: string | null
          organization_id?: number | null
          outcome_notes?: string | null
          requested_window?: string | null
          requester_profile_id: string
          reschedule_note?: string | null
          staff_profile_id?: string | null
          status?: Database["portal"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          cancellation_reason?: string | null
          client_profile_id?: string
          confirmed_at?: string | null
          confirmed_by_profile_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          location_type?: Database["portal"]["Enums"]["appointment_channel"]
          meeting_url?: string | null
          occurs_at?: string | null
          organization_id?: number | null
          outcome_notes?: string | null
          requested_window?: string | null
          requester_profile_id?: string
          reschedule_note?: string | null
          staff_profile_id?: string | null
          status?: Database["portal"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_profile_id_fkey"
            columns: ["client_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_confirmed_by_profile_id_fkey"
            columns: ["confirmed_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_requester_profile_id_fkey"
            columns: ["requester_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_staff_profile_id_fkey"
            columns: ["staff_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_profile_id: string | null
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          meta: Json
        }
        Insert: {
          action: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          meta?: Json
        }
        Update: {
          action?: string
          actor_profile_id?: string | null
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          meta?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_profile_id_fkey"
            columns: ["actor_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_catalog: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          slug: string
          sort_order: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          slug: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          slug?: string
          sort_order?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      metric_daily: {
        Row: {
          created_at: string
          metric_date: string
          metric_id: string
          notes: string | null
          source: string | null
          updated_at: string
          value: number | null
          value_status: Database["portal"]["Enums"]["metric_value_status"]
        }
        Insert: {
          created_at?: string
          metric_date: string
          metric_id: string
          notes?: string | null
          source?: string | null
          updated_at?: string
          value?: number | null
          value_status?: Database["portal"]["Enums"]["metric_value_status"]
        }
        Update: {
          created_at?: string
          metric_date?: string
          metric_id?: string
          notes?: string | null
          source?: string | null
          updated_at?: string
          value?: number | null
          value_status?: Database["portal"]["Enums"]["metric_value_status"]
        }
        Relationships: [
          {
            foreignKeyName: "metric_daily_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metric_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          acknowledged_at: string | null
          body_html: string | null
          body_text: string
          channels: string[]
          created_at: string
          id: string
          notification_type: string
          payload: Json
          profile_id: string | null
          recipient_email: string | null
          recipient_phone: string | null
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          acknowledged_at?: string | null
          body_html?: string | null
          body_text: string
          channels?: string[]
          created_at?: string
          id?: string
          notification_type: string
          payload?: Json
          profile_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          acknowledged_at?: string | null
          body_html?: string | null
          body_text?: string
          channels?: string[]
          created_at?: string
          id?: string
          notification_type?: string
          payload?: Json
          profile_id?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          body_html: string
          category: Database["portal"]["Enums"]["policy_category"]
          created_at: string
          created_by_profile_id: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          internal_ref: string | null
          is_published: boolean | null
          last_reviewed_at: string
          short_summary: string
          slug: string
          sort_order: number
          status: Database["portal"]["Enums"]["policy_status"]
          title: string
          updated_at: string
          updated_by_profile_id: string | null
        }
        Insert: {
          body_html?: string
          category?: Database["portal"]["Enums"]["policy_category"]
          created_at?: string
          created_by_profile_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          internal_ref?: string | null
          is_published?: boolean | null
          last_reviewed_at?: string
          short_summary: string
          slug: string
          sort_order?: number
          status?: Database["portal"]["Enums"]["policy_status"]
          title: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Update: {
          body_html?: string
          category?: Database["portal"]["Enums"]["policy_category"]
          created_at?: string
          created_by_profile_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          internal_ref?: string | null
          is_published?: boolean | null
          last_reviewed_at?: string
          short_summary?: string
          slug?: string
          sort_order?: number
          status?: Database["portal"]["Enums"]["policy_status"]
          title?: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_invites: {
        Row: {
          affiliation_type: Database["portal"]["Enums"]["affiliation_type"]
          created_at: string
          display_name: string | null
          email: string
          id: string
          invited_by_profile_id: string | null
          invited_by_user_id: string | null
          message: string | null
          organization_id: number | null
          position_title: string | null
          profile_id: string | null
          responded_at: string | null
          status: Database["portal"]["Enums"]["invite_status"]
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliation_type: Database["portal"]["Enums"]["affiliation_type"]
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          invited_by_profile_id?: string | null
          invited_by_user_id?: string | null
          message?: string | null
          organization_id?: number | null
          position_title?: string | null
          profile_id?: string | null
          responded_at?: string | null
          status?: Database["portal"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliation_type?: Database["portal"]["Enums"]["affiliation_type"]
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          invited_by_profile_id?: string | null
          invited_by_user_id?: string | null
          message?: string | null
          organization_id?: number | null
          position_title?: string | null
          profile_id?: string | null
          responded_at?: string | null
          status?: Database["portal"]["Enums"]["invite_status"]
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_invites_invited_by_profile_id_fkey"
            columns: ["invited_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_invites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          affiliation_requested_at: string | null
          affiliation_reviewed_at: string | null
          affiliation_reviewed_by: string | null
          affiliation_status: Database["portal"]["Enums"]["affiliation_status"]
          affiliation_type: Database["portal"]["Enums"]["affiliation_type"]
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          display_name_confirmed_at: string | null
          government_role_type:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          has_signed_petition: boolean
          homelessness_experience: Database["portal"]["Enums"]["lived_experience_status"]
          id: string
          last_seen_at: string | null
          organization_id: number | null
          petition_signed_at: string | null
          position_title: string | null
          requested_government_level:
            | Database["portal"]["Enums"]["government_level"]
            | null
          requested_government_name: string | null
          requested_government_role:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          requested_organization_name: string | null
          rules_acknowledged_at: string | null
          substance_use_experience: Database["portal"]["Enums"]["lived_experience_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliation_requested_at?: string | null
          affiliation_reviewed_at?: string | null
          affiliation_reviewed_by?: string | null
          affiliation_status?: Database["portal"]["Enums"]["affiliation_status"]
          affiliation_type?: Database["portal"]["Enums"]["affiliation_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          display_name_confirmed_at?: string | null
          government_role_type?:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          has_signed_petition?: boolean
          homelessness_experience?: Database["portal"]["Enums"]["lived_experience_status"]
          id?: string
          last_seen_at?: string | null
          organization_id?: number | null
          petition_signed_at?: string | null
          position_title?: string | null
          requested_government_level?:
            | Database["portal"]["Enums"]["government_level"]
            | null
          requested_government_name?: string | null
          requested_government_role?:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          requested_organization_name?: string | null
          rules_acknowledged_at?: string | null
          substance_use_experience?: Database["portal"]["Enums"]["lived_experience_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliation_requested_at?: string | null
          affiliation_reviewed_at?: string | null
          affiliation_reviewed_by?: string | null
          affiliation_status?: Database["portal"]["Enums"]["affiliation_status"]
          affiliation_type?: Database["portal"]["Enums"]["affiliation_type"]
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          display_name_confirmed_at?: string | null
          government_role_type?:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          has_signed_petition?: boolean
          homelessness_experience?: Database["portal"]["Enums"]["lived_experience_status"]
          id?: string
          last_seen_at?: string | null
          organization_id?: number | null
          petition_signed_at?: string | null
          position_title?: string | null
          requested_government_level?:
            | Database["portal"]["Enums"]["government_level"]
            | null
          requested_government_name?: string | null
          requested_government_role?:
            | Database["portal"]["Enums"]["government_role_type"]
            | null
          requested_organization_name?: string | null
          rules_acknowledged_at?: string | null
          substance_use_experience?: Database["portal"]["Enums"]["lived_experience_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_affiliation_reviewed_by_fkey"
            columns: ["affiliation_reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_settings: {
        Row: {
          created_at: string
          created_by_profile_id: string | null
          description: string | null
          id: string
          is_public: boolean
          setting_key: string
          setting_type: string
          setting_value: string | null
          updated_at: string
          updated_by_profile_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_profile_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_profile_id?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          setting_key?: string
          setting_type?: string
          setting_value?: string | null
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "public_settings_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_settings_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_rate_limit_logs: {
        Row: {
          created_at: string
          event: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      registration_flows: {
        Row: {
          chosen_name: string
          claimed_at: string | null
          consent_contact: boolean | null
          consent_data_sharing: boolean | null
          consent_terms: boolean | null
          contact_email: string | null
          contact_phone: string | null
          contact_phone_safe_call: boolean | null
          contact_phone_safe_text: boolean | null
          contact_phone_safe_voicemail: boolean | null
          contact_window: string | null
          created_at: string
          created_by_user_id: string | null
          date_of_birth_month: number | null
          date_of_birth_year: number | null
          disability: string | null
          flow_type: string
          gender_identity: string | null
          id: string
          indigenous_identity: string | null
          legal_name: string | null
          metadata: Json
          organization_id: number | null
          portal_code: string | null
          postal_code: string | null
          profile_id: string | null
          pronouns: string | null
          status: string
          supabase_user_id: string | null
          updated_at: string
          updated_by_user_id: string | null
          volunteer_role_id: string | null
        }
        Insert: {
          chosen_name: string
          claimed_at?: string | null
          consent_contact?: boolean | null
          consent_data_sharing?: boolean | null
          consent_terms?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_safe_call?: boolean | null
          contact_phone_safe_text?: boolean | null
          contact_phone_safe_voicemail?: boolean | null
          contact_window?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date_of_birth_month?: number | null
          date_of_birth_year?: number | null
          disability?: string | null
          flow_type: string
          gender_identity?: string | null
          id?: string
          indigenous_identity?: string | null
          legal_name?: string | null
          metadata?: Json
          organization_id?: number | null
          portal_code?: string | null
          postal_code?: string | null
          profile_id?: string | null
          pronouns?: string | null
          status?: string
          supabase_user_id?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          volunteer_role_id?: string | null
        }
        Update: {
          chosen_name?: string
          claimed_at?: string | null
          consent_contact?: boolean | null
          consent_data_sharing?: boolean | null
          consent_terms?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_phone_safe_call?: boolean | null
          contact_phone_safe_text?: boolean | null
          contact_phone_safe_voicemail?: boolean | null
          contact_window?: string | null
          created_at?: string
          created_by_user_id?: string | null
          date_of_birth_month?: number | null
          date_of_birth_year?: number | null
          disability?: string | null
          flow_type?: string
          gender_identity?: string | null
          id?: string
          indigenous_identity?: string | null
          legal_name?: string | null
          metadata?: Json
          organization_id?: number | null
          portal_code?: string | null
          postal_code?: string | null
          profile_id?: string | null
          pronouns?: string | null
          status?: string
          supabase_user_id?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          volunteer_role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_flows_profile_fk"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_flows_volunteer_role_id_fkey"
            columns: ["volunteer_role_id"]
            isOneToOne: false
            referencedRelation: "volunteer_role_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_pages: {
        Row: {
          attachments: Json
          body_html: string
          cover_image: string | null
          created_at: string
          created_by_profile_id: string | null
          date_published: string
          embed: Json | null
          embed_placement: Database["portal"]["Enums"]["resource_embed_placement"]
          id: string
          is_published: boolean
          kind: Database["portal"]["Enums"]["resource_kind"]
          location: string | null
          slug: string
          summary: string | null
          tags: string[]
          title: string
          updated_at: string
          updated_by_profile_id: string | null
        }
        Insert: {
          attachments?: Json
          body_html?: string
          cover_image?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          date_published: string
          embed?: Json | null
          embed_placement?: Database["portal"]["Enums"]["resource_embed_placement"]
          id?: string
          is_published?: boolean
          kind?: Database["portal"]["Enums"]["resource_kind"]
          location?: string | null
          slug: string
          summary?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Update: {
          attachments?: Json
          body_html?: string
          cover_image?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          date_published?: string
          embed?: Json | null
          embed_placement?: Database["portal"]["Enums"]["resource_embed_placement"]
          id?: string
          is_published?: boolean
          kind?: Database["portal"]["Enums"]["resource_kind"]
          location?: string | null
          slug?: string
          summary?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_pages_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_pages_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_role_listings: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by_profile_id: string | null
          description: string
          id: string
          is_public: boolean
          location: string | null
          organization_id: number
          published_at: string | null
          requirements: string | null
          slug: string
          summary: string | null
          time_commitment: string | null
          title: string
          updated_at: string
          updated_by_profile_id: string | null
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          description: string
          id?: string
          is_public?: boolean
          location?: string | null
          organization_id: number
          published_at?: string | null
          requirements?: string | null
          slug: string
          summary?: string | null
          time_commitment?: string | null
          title: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          description?: string
          id?: string
          is_public?: boolean
          location?: string | null
          organization_id?: number
          published_at?: string | null
          requirements?: string | null
          slug?: string
          summary?: string | null
          time_commitment?: string | null
          title?: string
          updated_at?: string
          updated_by_profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_role_listings_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_role_listings_updated_by_profile_id_fkey"
            columns: ["updated_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pit_public_breakdowns: {
        Row: {
          bucket: string | null
          bucket_label: string | null
          bucket_sort: number | null
          dimension: string | null
          dimension_label: string | null
          dimension_sort: number | null
          last_observation_at: string | null
          percentage: number | null
          pit_count_id: string | null
          suppressed: boolean | null
          suppressed_reason: string | null
          total: number | null
          total_encounters: number | null
        }
        Relationships: []
      }
      pit_public_summary: {
        Row: {
          addiction_positive_count: number | null
          description: string | null
          homelessness_confirmed_count: number | null
          id: string | null
          is_active: boolean | null
          last_observation_at: string | null
          mental_health_positive_count: number | null
          methodology: string | null
          municipality: string | null
          observed_end: string | null
          observed_start: string | null
          slug: string | null
          status: Database["core"]["Enums"]["pit_count_status"] | null
          title: string | null
          total_encounters: number | null
          updated_at: string | null
          wants_treatment_no_count: number | null
          wants_treatment_not_applicable_count: number | null
          wants_treatment_not_suitable_count: number | null
          wants_treatment_yes_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      actor_is_approved: { Args: never; Returns: boolean }
      actor_org_id: { Args: never; Returns: number }
      complete_appointment_with_costs: {
        Args: {
          p_appointment_id: string
          p_cost_amount: number
          p_cost_category_id: string
          p_created_by: string
          p_currency: string
          p_metadata: Json
          p_outcome_notes: string
          p_person_id: number
          p_quantity: number
          p_unit_cost: number
          p_uom: string
        }
        Returns: {
          appointment_id: string
          cost_event_id: string
        }[]
      }
      current_profile_id: { Args: never; Returns: string }
      now_toronto: { Args: never; Returns: string }
      refresh_profile_claims: { Args: { p_profile_id: string }; Returns: Json }
    }
    Enums: {
      affiliation_status: "approved" | "pending" | "revoked"
      affiliation_type: "client" | "agency_partner" | "government_partner"
      appointment_channel: "in_person" | "phone" | "video" | "field" | "other"
      appointment_status:
        | "requested"
        | "pending_confirmation"
        | "scheduled"
        | "reschedule_requested"
        | "cancelled_by_client"
        | "cancelled_by_staff"
        | "completed"
        | "no_show"
      government_level:
        | "municipal"
        | "county"
        | "provincial"
        | "federal"
        | "other"
      government_role_type: "staff" | "politician"
      invite_status: "pending" | "accepted" | "cancelled" | "expired"
      lived_experience_status:
        | "none"
        | "current"
        | "former"
        | "prefer_not_to_share"
      metric_value_status: "reported" | "pending"
      policy_category:
        | "client_rights"
        | "safety"
        | "staff"
        | "governance"
        | "operations"
        | "finance"
      policy_status: "draft" | "published" | "archived"
      resource_embed_placement: "above" | "below"
      resource_kind:
        | "delegation"
        | "report"
        | "presentation"
        | "policy"
        | "press"
        | "dataset"
        | "other"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      myth_busting_entries: {
        Row: {
          analysis: string
          created_at: string
          fact_statement: string
          id: string
          is_published: boolean
          myth_statement: string
          order_index: number
          slug: string
          sources: Json
          status: Database["public"]["Enums"]["myth_truth_status"]
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          analysis: string
          created_at?: string
          fact_statement: string
          id?: string
          is_published?: boolean
          myth_statement: string
          order_index?: number
          slug: string
          sources?: Json
          status?: Database["public"]["Enums"]["myth_truth_status"]
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          analysis?: string
          created_at?: string
          fact_statement?: string
          id?: string
          is_published?: boolean
          myth_statement?: string
          order_index?: number
          slug?: string
          sources?: Json
          status?: Database["public"]["Enums"]["myth_truth_status"]
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_iharc_admin_role: { Args: never; Returns: boolean }
      create_episode_relationship: {
        Args: {
          p_confidence_level?: string
          p_created_by?: string
          p_episode_1_id: string
          p_episode_2_id: string
          p_identified_by?: string
          p_person_id: number
          p_relationship_description?: string
          p_relationship_type: string
        }
        Returns: {
          confidence_level: string
          created_at: string
          created_by: string
          episode_1_id: string
          episode_2_id: string
          id: string
          identified_by: string
          person_id: number
          relationship_description: string
          relationship_type: string
          time_between_episodes: unknown
        }[]
      }
      generate_incident_number: { Args: never; Returns: string }
      has_permission_single: {
        Args: { permission_name: string }
        Returns: boolean
      }
      is_iharc_user: { Args: never; Returns: boolean }
      portal_check_rate_limit: {
        Args: { p_cooldown_ms?: number; p_event: string; p_limit: number }
        Returns: {
          allowed: boolean
          retry_in_ms: number
        }[]
      }
      portal_check_public_rate_limit: {
        Args: {
          p_cooldown_ms?: number
          p_event: string
          p_identifier: string
          p_limit: number
          p_window_ms?: number
        }
        Returns: {
          allowed: boolean
          retry_in_ms: number
        }[]
      }
      portal_get_user_email: {
        Args: { p_profile_id?: string }
        Returns: string
      }
      portal_log_audit_event: {
        Args: {
          p_action: string
          p_actor_profile_id?: string
          p_entity_id: string
          p_entity_type: string
          p_meta?: Json
        }
        Returns: undefined
      }
      portal_log_public_audit_event: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_meta?: Json
        }
        Returns: undefined
      }
      portal_queue_notification: {
        Args: {
          p_body_html?: string
          p_body_text?: string
          p_payload?: Json
          p_profile_id?: string
          p_recipient_email?: string
          p_subject?: string
          p_type?: string
        }
        Returns: string
      }
      portal_refresh_profile_claims: {
        Args: { p_profile_id: string }
        Returns: Json
      }
    }
    Enums: {
      medical_status_enum: "active" | "monitoring" | "resolved" | "transferred"
      medical_urgency_enum:
        | "emergency"
        | "urgent"
        | "moderate"
        | "routine"
        | "wellness"
      myth_truth_status:
        | "true"
        | "false"
        | "partially_true"
        | "context_dependent"
        | "needs_more_evidence"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  realtime: {
    Tables: {
      messages: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_12_21: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_12_22: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_12_23: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_12_24: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages_2025_12_25: {
        Row: {
          event: string | null
          extension: string
          id: string
          inserted_at: string
          payload: Json | null
          private: boolean | null
          topic: string
          updated_at: string
        }
        Insert: {
          event?: string | null
          extension: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic: string
          updated_at?: string
        }
        Update: {
          event?: string | null
          extension?: string
          id?: string
          inserted_at?: string
          payload?: Json | null
          private?: boolean | null
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      schema_migrations: {
        Row: {
          inserted_at: string | null
          version: number
        }
        Insert: {
          inserted_at?: string | null
          version: number
        }
        Update: {
          inserted_at?: string | null
          version?: number
        }
        Relationships: []
      }
      subscription: {
        Row: {
          claims: Json
          claims_role: unknown
          created_at: string
          entity: unknown
          filters: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id: number
          subscription_id: string
        }
        Insert: {
          claims: Json
          claims_role?: unknown
          created_at?: string
          entity: unknown
          filters?: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id?: never
          subscription_id: string
        }
        Update: {
          claims?: Json
          claims_role?: unknown
          created_at?: string
          entity?: unknown
          filters?: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
          id?: never
          subscription_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_rls: {
        Args: { max_record_bytes?: number; wal: Json }
        Returns: Database["realtime"]["CompositeTypes"]["wal_rls"][]
        SetofOptions: {
          from: "*"
          to: "wal_rls"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      broadcast_changes: {
        Args: {
          event_name: string
          level?: string
          new: Record<string, unknown>
          old: Record<string, unknown>
          operation: string
          table_name: string
          table_schema: string
          topic_name: string
        }
        Returns: undefined
      }
      build_prepared_statement_sql: {
        Args: {
          columns: Database["realtime"]["CompositeTypes"]["wal_column"][]
          entity: unknown
          prepared_statement_name: string
        }
        Returns: string
      }
      cast: { Args: { type_: unknown; val: string }; Returns: Json }
      check_equality_op: {
        Args: {
          op: Database["realtime"]["Enums"]["equality_op"]
          type_: unknown
          val_1: string
          val_2: string
        }
        Returns: boolean
      }
      is_visible_through_filters: {
        Args: {
          columns: Database["realtime"]["CompositeTypes"]["wal_column"][]
          filters: Database["realtime"]["CompositeTypes"]["user_defined_filter"][]
        }
        Returns: boolean
      }
      list_changes: {
        Args: {
          max_changes: number
          max_record_bytes: number
          publication: unknown
          slot_name: unknown
        }
        Returns: Database["realtime"]["CompositeTypes"]["wal_rls"][]
        SetofOptions: {
          from: "*"
          to: "wal_rls"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      quote_wal2json: { Args: { entity: unknown }; Returns: string }
      send: {
        Args: { event: string; payload: Json; private?: boolean; topic: string }
        Returns: undefined
      }
      to_regrole: { Args: { role_name: string }; Returns: unknown }
      topic: { Args: never; Returns: string }
    }
    Enums: {
      action: "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE" | "ERROR"
      equality_op: "eq" | "neq" | "lt" | "lte" | "gt" | "gte" | "in"
    }
    CompositeTypes: {
      user_defined_filter: {
        column_name: string | null
        op: Database["realtime"]["Enums"]["equality_op"] | null
        value: string | null
      }
      wal_column: {
        name: string | null
        type_name: string | null
        type_oid: unknown
        value: Json | null
        is_pkey: boolean | null
        is_selectable: boolean | null
      }
      wal_rls: {
        wal: Json | null
        is_rls_enabled: boolean | null
        subscription_ids: string[] | null
        errors: string[] | null
      }
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  supabase_functions: {
    Tables: {
      hooks: {
        Row: {
          created_at: string
          hook_name: string
          hook_table_id: number
          id: number
          request_id: number | null
        }
        Insert: {
          created_at?: string
          hook_name: string
          hook_table_id: number
          id?: number
          request_id?: number | null
        }
        Update: {
          created_at?: string
          hook_name?: string
          hook_table_id?: number
          id?: number
          request_id?: number | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          inserted_at: string
          version: string
        }
        Insert: {
          inserted_at?: string
          version: string
        }
        Update: {
          inserted_at?: string
          version?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  vault: {
    Tables: {
      secrets: {
        Row: {
          created_at: string
          description: string
          id: string
          key_id: string | null
          name: string | null
          nonce: string | null
          secret: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      decrypted_secrets: {
        Row: {
          created_at: string | null
          decrypted_secret: string | null
          description: string | null
          id: string | null
          key_id: string | null
          name: string | null
          nonce: string | null
          secret: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decrypted_secret?: never
          description?: string | null
          id?: string | null
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decrypted_secret?: never
          description?: string | null
          id?: string | null
          key_id?: string | null
          name?: string | null
          nonce?: string | null
          secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _crypto_aead_det_decrypt: {
        Args: {
          additional: string
          context?: string
          key_id: number
          message: string
          nonce?: string
        }
        Returns: string
      }
      _crypto_aead_det_encrypt: {
        Args: {
          additional: string
          context?: string
          key_id: number
          message: string
          nonce?: string
        }
        Returns: string
      }
      _crypto_aead_det_noncegen: { Args: never; Returns: string }
      create_secret: {
        Args: {
          new_description?: string
          new_key_id?: string
          new_name?: string
          new_secret: string
        }
        Returns: string
      }
      update_secret: {
        Args: {
          new_description?: string
          new_key_id?: string
          new_name?: string
          new_secret?: string
          secret_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  analytics: {
    Enums: {},
  },
  auth: {
    Enums: {
      aal_level: ["aal1", "aal2", "aal3"],
      code_challenge_method: ["s256", "plain"],
      factor_status: ["unverified", "verified"],
      factor_type: ["totp", "webauthn", "phone"],
      oauth_authorization_status: ["pending", "approved", "denied", "expired"],
      oauth_client_type: ["public", "confidential"],
      oauth_registration_type: ["dynamic", "manual"],
      oauth_response_type: ["code"],
      one_time_token_type: [
        "confirmation_token",
        "reauthentication_token",
        "recovery_token",
        "email_change_token_new",
        "email_change_token_current",
        "phone_change_token",
      ],
    },
  },
  case_mgmt: {
    Enums: {
      assessment_completion_level_enum: ["quick", "full"],
      assessment_status_enum: [
        "draft",
        "in_progress",
        "completed",
        "superseded",
      ],
      encounter_type_enum: [
        "outreach",
        "intake",
        "program",
        "appointment",
        "other",
      ],
      observation_category_enum: [
        "health_concern",
        "safety_concern",
        "welfare_check",
        "housing_basic_needs",
        "relationship_social",
        "other",
      ],
      observation_lead_status_enum: [
        "open",
        "in_progress",
        "resolved",
        "archived",
      ],
      observation_promotion_enum: [
        "medical_episode",
        "safety_incident",
        "referral",
      ],
      observation_subject_enum: [
        "this_client",
        "known_person",
        "named_unlinked",
        "unidentified",
      ],
      referral_status_enum: ["open", "sent", "completed", "canceled"],
      task_priority_enum: ["low", "normal", "high", "urgent"],
      task_status_enum: ["open", "in_progress", "blocked", "done", "canceled"],
    },
  },
  core: {
    Enums: {
      assessment_urgency: [
        "emergency",
        "urgent",
        "concern",
        "followup",
        "routine",
      ],
      bwc_ingestion_status_enum: ["uploaded", "processing", "ready", "failed"],
      cfs_access_level_enum: ["view", "collaborate", "dispatch"],
      cfs_origin_enum: ["community", "system"],
      cfs_public_category_enum: [
        "cleanup",
        "outreach",
        "welfare_check",
        "supply_distribution",
        "other",
      ],
      cfs_public_status_enum: [
        "received",
        "triaged",
        "dispatched",
        "in_progress",
        "resolved",
      ],
      cfs_source_enum: [
        "web_form",
        "phone",
        "sms",
        "email",
        "social",
        "api",
        "staff_observed",
      ],
      cfs_status_enum: ["received", "triaged", "dismissed", "converted"],
      consent_method_enum: [
        "portal",
        "staff_assisted",
        "verbal",
        "documented",
        "migration",
      ],
      consent_request_status_enum: ["pending", "approved", "denied", "expired"],
      consent_scope_enum: ["all_orgs", "selected_orgs", "none"],
      consent_status_enum: ["active", "revoked", "expired"],
      consent_type_enum: ["data_sharing"],
      cost_entry_type_enum: ["direct", "replacement_value", "overhead"],
      cost_source_type_enum: [
        "activity",
        "distribution",
        "inventory_tx",
        "appointment",
        "manual",
        "external",
        "staff_time",
        "encounter",
      ],
      dispatch_priority_enum: [
        "informational",
        "low",
        "medium",
        "high",
        "critical",
      ],
      document_status_enum: ["yes", "no", "partial", "unknown"],
      eligibility_status_enum: [
        "eligible",
        "ineligible",
        "pending_assessment",
        "under_review",
      ],
      environmental_factors_enum: [
        "rain",
        "snow",
        "ice",
        "extreme_heat",
        "extreme_cold",
        "poor_lighting",
        "unstable_structure",
        "weather_hazards",
        "traffic_road",
        "wildlife",
        "contamination",
        "structural_damage",
        "other",
      ],
      ethnicity_enum: [
        "indigenous",
        "black_african",
        "east_asian",
        "south_asian",
        "southeast_asian",
        "west_asian",
        "latin_american",
        "white_european",
        "mixed",
        "other",
        "prefer_not_to_say",
      ],
      follow_up_plan_enum: [
        "immediate",
        "urgent",
        "weekly",
        "routine",
        "client_initiated",
      ],
      gender_enum: [
        "Male",
        "Female",
        "Non-binary",
        "Other",
        "Prefer not to say",
      ],
      health_concern_enum: [
        "mental_health",
        "addiction_substance_use",
        "physical_health",
        "chronic_conditions",
        "disabilities",
        "none",
      ],
      housing_status_enum: [
        "housed",
        "emergency_shelter",
        "transitional_housing",
        "temporarily_housed",
        "unsheltered",
        "unknown",
      ],
      incident_complexity_enum: ["simple", "moderate", "complex", "major"],
      incident_priority_enum: ["low", "medium", "high", "critical"],
      incident_status_enum: [
        "draft",
        "open",
        "in_progress",
        "resolved",
        "closed",
      ],
      incident_type_enum: [
        "outreach",
        "welfare_check",
        "medical",
        "mental_health",
        "mental_health_crisis",
        "overdose",
        "death",
        "assault",
        "theft",
        "disturbance",
        "property_damage",
        "fire",
        "cleanup",
        "supply_distribution",
        "other",
      ],
      income_source_enum: [
        "employment",
        "benefits",
        "disability",
        "pension",
        "other",
        "none",
        "unknown",
      ],
      justice_episode_type_enum: [
        "arrest",
        "charge",
        "court",
        "probation",
        "parole",
        "warrant",
        "other",
      ],
      media_access_action_enum: [
        "upload_initiated",
        "upload_completed",
        "upload_failed",
        "view_url_issued",
        "linked",
        "unlinked",
        "deleted",
      ],
      media_purpose_enum: [
        "cfs_attachment",
        "medical_photo",
        "medical_thermal",
        "client_document",
        "person_profile_photo",
        "bwc_raw",
        "bwc_clip",
        "marketing_hero",
        "marketing_logo_light",
        "marketing_logo_dark",
        "marketing_favicon",
        "org_logo",
      ],
      media_retention_class_enum: [
        "routine",
        "clinical",
        "incident",
        "legal_hold",
      ],
      media_storage_provider_enum: ["azure_blob", "supabase_storage"],
      media_upload_mode_enum: ["single_put", "block_blob"],
      media_upload_status_enum: [
        "initiated",
        "uploaded",
        "completed",
        "aborted",
        "expired",
        "failed",
      ],
      medical_episode_note_type_enum: ["soap", "addendum", "narrative"],
      medical_episode_template_key_enum: [
        "vitals_check_guided",
        "wound_care_guided",
        "clinical_assessment",
      ],
      medical_media_kind_enum: ["photo", "thermal"],
      notify_channel_enum: ["none", "email", "sms"],
      org_role_kind: ["staff", "volunteer"],
      organization_person_relationship_enum: [
        "employee",
        "volunteer",
        "contractor",
        "partner_staff",
        "liaison",
        "board_member",
        "sponsor",
        "other",
      ],
      organization_status_enum: [
        "active",
        "inactive",
        "pending",
        "under_review",
      ],
      party_role_enum: [
        "subject",
        "reporter",
        "responder",
        "agency",
        "bystander",
      ],
      person_category: [
        "service_recipient",
        "community",
        "professional",
        "support",
      ],
      person_condition_risk_flag_enum: [
        "self_harm_risk",
        "risk_to_others",
        "medication_nonadherence",
        "substance_trigger",
        "medical_instability",
        "needs_meds_support",
        "housing_instability",
        "legal_concern",
      ],
      person_condition_status_enum: [
        "active",
        "remission",
        "ruled_out",
        "inactive",
        "resolved",
        "unknown",
      ],
      person_condition_verification_enum: [
        "self_report",
        "clinician_diagnosis",
        "chart_confirmed",
        "collateral_report",
        "screening_assessment",
      ],
      person_status: [
        "active",
        "inactive",
        "deceased",
        "archived",
        "pending_verification",
        "do_not_contact",
        "merged",
      ],
      person_type: [
        "client",
        "former_client",
        "potential_client",
        "resident",
        "concerned_citizen",
        "agency_contact",
        "case_worker",
        "healthcare_provider",
        "emergency_contact",
        "family_member",
        "support_person",
      ],
      pit_age_bracket: [
        "under_19",
        "age_20_39",
        "age_40_59",
        "age_60_plus",
        "unknown",
      ],
      pit_boolean_response: ["yes", "no", "maybe", "unknown", "not_answered"],
      pit_count_status: ["planned", "active", "closed"],
      pit_location_type: [
        "encampment",
        "shelter",
        "street",
        "vehicle",
        "motel",
        "couch_surfing",
        "institutional",
        "other",
        "unknown",
      ],
      pit_severity_level: [
        "none",
        "mild",
        "moderate",
        "severe",
        "critical",
        "unknown",
        "not_recorded",
        "not_applicable",
      ],
      pit_treatment_interest: ["yes", "no", "not_suitable", "not_applicable"],
      place_of_origin_enum: [
        "Port Hope",
        "Cobourg",
        "Northumberland County (other)",
        "Durham Region",
        "Peterborough",
        "Prince Edward County",
        "GTA (including Toronto)",
        "Outside of Province",
        "Outside of Country",
      ],
      progression_status: [
        "new",
        "improving",
        "stable",
        "worsening",
        "much_worse",
        "resolved",
        "unknown",
      ],
      public_safety_impact_enum: [
        "none",
        "minimal",
        "moderate",
        "significant",
        "major",
      ],
      record_source_enum: [
        "client_reported",
        "staff_observed",
        "document",
        "partner_org",
        "system",
      ],
      risk_factor_enum: [
        "Substance Use",
        "Mental Health",
        "Domestic Violence",
        "Justice Involvement",
        "Chronic Health",
        "Weather Exposure",
        "Mobility Issue",
      ],
      risk_level_enum: ["low", "medium", "high", "critical", "unknown"],
      sensitivity_level_enum: ["standard", "sensitive", "high", "restricted"],
      severity_level_enum: [
        "minimal",
        "mild",
        "moderate",
        "severe",
        "critical",
      ],
      substance_indicators_enum: [
        "alcohol",
        "cannabis",
        "hard_drugs",
        "needles_paraphernalia",
        "pills_medication",
        "smoking_materials",
        "unknown_substances",
        "other",
      ],
      timeline_event_category_enum: [
        "encounter",
        "task",
        "referral",
        "supply",
        "appointment",
        "note",
        "client_update",
        "intake",
        "medical",
        "justice",
        "relationship",
        "characteristic",
        "consent",
        "system",
        "other",
        "observation",
      ],
      verification_status_enum: ["unverified", "verified", "disputed", "stale"],
      veteran_status_enum: ["yes", "no", "unknown"],
      visibility_scope_enum: ["internal_to_org", "shared_via_consent"],
    },
  },
  donations: {
    Enums: {
      donation_intent_status: [
        "pending",
        "requires_payment",
        "paid",
        "failed",
        "cancelled",
      ],
      donation_payment_status: [
        "succeeded",
        "requires_action",
        "failed",
        "refunded",
      ],
      donation_subscription_status: [
        "active",
        "canceled",
        "past_due",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "trialing",
      ],
      stripe_webhook_event_status: ["succeeded", "failed"],
    },
  },
  extensions: {
    Enums: {},
  },
  inventory: {
    Enums: {},
  },
  portal: {
    Enums: {
      affiliation_status: ["approved", "pending", "revoked"],
      affiliation_type: ["client", "agency_partner", "government_partner"],
      appointment_channel: ["in_person", "phone", "video", "field", "other"],
      appointment_status: [
        "requested",
        "pending_confirmation",
        "scheduled",
        "reschedule_requested",
        "cancelled_by_client",
        "cancelled_by_staff",
        "completed",
        "no_show",
      ],
      government_level: [
        "municipal",
        "county",
        "provincial",
        "federal",
        "other",
      ],
      government_role_type: ["staff", "politician"],
      invite_status: ["pending", "accepted", "cancelled", "expired"],
      lived_experience_status: [
        "none",
        "current",
        "former",
        "prefer_not_to_share",
      ],
      metric_value_status: ["reported", "pending"],
      policy_category: [
        "client_rights",
        "safety",
        "staff",
        "governance",
        "operations",
        "finance",
      ],
      policy_status: ["draft", "published", "archived"],
      resource_embed_placement: ["above", "below"],
      resource_kind: [
        "delegation",
        "report",
        "presentation",
        "policy",
        "press",
        "dataset",
        "other",
      ],
    },
  },
  public: {
    Enums: {
      medical_status_enum: ["active", "monitoring", "resolved", "transferred"],
      medical_urgency_enum: [
        "emergency",
        "urgent",
        "moderate",
        "routine",
        "wellness",
      ],
      myth_truth_status: [
        "true",
        "false",
        "partially_true",
        "context_dependent",
        "needs_more_evidence",
      ],
    },
  },
  realtime: {
    Enums: {
      action: ["INSERT", "UPDATE", "DELETE", "TRUNCATE", "ERROR"],
      equality_op: ["eq", "neq", "lt", "lte", "gt", "gte", "in"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
  supabase_functions: {
    Enums: {},
  },
  vault: {
    Enums: {},
  },
} as const
