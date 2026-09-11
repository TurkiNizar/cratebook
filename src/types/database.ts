export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      collection_item_tags: {
        Row: {
          collection_item_id: string;
          created_at: string;
          tag_id: string;
          user_id: string;
        };
        Insert: {
          collection_item_id: string;
          created_at?: string;
          tag_id: string;
          user_id: string;
        };
        Update: {
          collection_item_id?: string;
          created_at?: string;
          tag_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_item_tags_item_owner_fk";
            columns: ["collection_item_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "collection_items";
            referencedColumns: ["id", "user_id"];
          },
          {
            foreignKeyName: "collection_item_tags_tag_owner_fk";
            columns: ["tag_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id", "user_id"];
          },
        ];
      };
      collection_items: {
        Row: {
          acquired_from: string | null;
          acquired_on: string | null;
          created_at: string;
          entry_key: string;
          id: string;
          is_favorite: boolean;
          is_public: boolean;
          media_condition:
            Database["public"]["Enums"]["record_condition"] | null;
          notes: string | null;
          price_currency: string | null;
          price_paid_minor: number | null;
          purchase_state: Database["public"]["Enums"]["purchase_state"];
          rating: number | null;
          release_id: string;
          sleeve_condition:
            Database["public"]["Enums"]["record_condition"] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          acquired_from?: string | null;
          acquired_on?: string | null;
          created_at?: string;
          entry_key?: string;
          id?: string;
          is_favorite?: boolean;
          is_public?: boolean;
          media_condition?:
            Database["public"]["Enums"]["record_condition"] | null;
          notes?: string | null;
          price_currency?: string | null;
          price_paid_minor?: number | null;
          purchase_state?: Database["public"]["Enums"]["purchase_state"];
          rating?: number | null;
          release_id: string;
          sleeve_condition?:
            Database["public"]["Enums"]["record_condition"] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          acquired_from?: string | null;
          acquired_on?: string | null;
          created_at?: string;
          entry_key?: string;
          id?: string;
          is_favorite?: boolean;
          is_public?: boolean;
          media_condition?:
            Database["public"]["Enums"]["record_condition"] | null;
          notes?: string | null;
          price_currency?: string | null;
          price_paid_minor?: number | null;
          purchase_state?: Database["public"]["Enums"]["purchase_state"];
          rating?: number | null;
          release_id?: string;
          sleeve_condition?:
            Database["public"]["Enums"]["record_condition"] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "collection_items_release_owner_fk";
            columns: ["release_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id", "created_by"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_public: boolean;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_public?: boolean;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_path?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_public?: boolean;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      releases: {
        Row: {
          artist_display: string;
          barcode: string | null;
          catalog_number: string | null;
          country: string | null;
          cover_url: string | null;
          created_at: string;
          created_by: string;
          disc_count: number | null;
          edition_description: string | null;
          external_id: string | null;
          external_source: string | null;
          format: Database["public"]["Enums"]["release_format"] | null;
          id: string;
          is_reissue: boolean | null;
          label: string | null;
          matrix_runout: string | null;
          original_year: number | null;
          release_year: number | null;
          source_data: Json | null;
          title: string;
          updated_at: string;
          vinyl_color: string | null;
        };
        Insert: {
          artist_display: string;
          barcode?: string | null;
          catalog_number?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by: string;
          disc_count?: number | null;
          edition_description?: string | null;
          external_id?: string | null;
          external_source?: string | null;
          format?: Database["public"]["Enums"]["release_format"] | null;
          id?: string;
          is_reissue?: boolean | null;
          label?: string | null;
          matrix_runout?: string | null;
          original_year?: number | null;
          release_year?: number | null;
          source_data?: Json | null;
          title: string;
          updated_at?: string;
          vinyl_color?: string | null;
        };
        Update: {
          artist_display?: string;
          barcode?: string | null;
          catalog_number?: string | null;
          country?: string | null;
          cover_url?: string | null;
          created_at?: string;
          created_by?: string;
          disc_count?: number | null;
          edition_description?: string | null;
          external_id?: string | null;
          external_source?: string | null;
          format?: Database["public"]["Enums"]["release_format"] | null;
          id?: string;
          is_reissue?: boolean | null;
          label?: string | null;
          matrix_runout?: string | null;
          original_year?: number | null;
          release_year?: number | null;
          source_data?: Json | null;
          title?: string;
          updated_at?: string;
          vinyl_color?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          normalized_name: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          normalized_name?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          normalized_name?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      wishlist_items: {
        Row: {
          created_at: string;
          entry_key: string;
          id: string;
          is_public: boolean;
          max_price_minor: number | null;
          notes: string | null;
          preferred_edition: string | null;
          price_currency: string | null;
          priority: Database["public"]["Enums"]["wishlist_priority"];
          release_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          entry_key?: string;
          id?: string;
          is_public?: boolean;
          max_price_minor?: number | null;
          notes?: string | null;
          preferred_edition?: string | null;
          price_currency?: string | null;
          priority?: Database["public"]["Enums"]["wishlist_priority"];
          release_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          entry_key?: string;
          id?: string;
          is_public?: boolean;
          max_price_minor?: number | null;
          notes?: string | null;
          preferred_edition?: string | null;
          price_currency?: string | null;
          priority?: Database["public"]["Enums"]["wishlist_priority"];
          release_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_items_release_owner_fk";
            columns: ["release_id", "user_id"];
            isOneToOne: false;
            referencedRelation: "releases";
            referencedColumns: ["id", "created_by"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      convert_wishlist_item_to_collection: {
        Args: {
          p_acquired_from?: string;
          p_acquired_on?: string;
          p_entry_key: string;
          p_is_favorite?: boolean;
          p_media_condition?: Database["public"]["Enums"]["record_condition"];
          p_notes?: string;
          p_price_currency?: string;
          p_price_paid_minor?: number;
          p_purchase_state?: Database["public"]["Enums"]["purchase_state"];
          p_rating?: number;
          p_sleeve_condition?: Database["public"]["Enums"]["record_condition"];
          p_tags?: string[];
          p_wishlist_item_id: string;
        };
        Returns: string;
      };
      create_catalogue_collection_item: {
        Args: {
          p_artist_display: string;
          p_barcode?: string;
          p_catalog_number?: string;
          p_country?: string;
          p_cover_url?: string;
          p_disc_count?: number;
          p_edition_description?: string;
          p_entry_key: string;
          p_external_id: string;
          p_external_source: string;
          p_format?: Database["public"]["Enums"]["release_format"];
          p_is_reissue?: boolean;
          p_label?: string;
          p_matrix_runout?: string;
          p_original_year?: number;
          p_release_year?: number;
          p_source_data: Json;
          p_title: string;
          p_vinyl_color?: string;
        };
        Returns: string;
      };
      create_catalogue_wishlist_item: {
        Args: {
          p_artist_display: string;
          p_barcode?: string;
          p_catalog_number?: string;
          p_country?: string;
          p_cover_url?: string;
          p_disc_count?: number;
          p_edition_description?: string;
          p_entry_key: string;
          p_external_id: string;
          p_external_source: string;
          p_format?: Database["public"]["Enums"]["release_format"];
          p_is_public?: boolean;
          p_label?: string;
          p_max_price_minor?: number;
          p_notes?: string;
          p_original_year?: number;
          p_preferred_edition?: string;
          p_price_currency?: string;
          p_priority?: Database["public"]["Enums"]["wishlist_priority"];
          p_release_year?: number;
          p_source_data: Json;
          p_title: string;
        };
        Returns: string;
      };
      create_manual_collection_item: {
        Args: {
          p_artist_display: string;
          p_barcode?: string;
          p_catalog_number?: string;
          p_country?: string;
          p_disc_count?: number;
          p_edition_description?: string;
          p_entry_key: string;
          p_format?: Database["public"]["Enums"]["release_format"];
          p_is_reissue?: boolean;
          p_label?: string;
          p_matrix_runout?: string;
          p_original_year?: number;
          p_release_year?: number;
          p_title: string;
          p_vinyl_color?: string;
        };
        Returns: string;
      };
      create_manual_wishlist_item: {
        Args: {
          p_artist_display: string;
          p_entry_key: string;
          p_is_public?: boolean;
          p_max_price_minor?: number;
          p_notes?: string;
          p_preferred_edition?: string;
          p_price_currency?: string;
          p_priority?: Database["public"]["Enums"]["wishlist_priority"];
          p_title: string;
        };
        Returns: string;
      };
      delete_wishlist_item: { Args: { p_item_id: string }; Returns: boolean };
      find_collection_duplicates: {
        Args: { p_artist_display: string; p_title: string };
        Returns: {
          artist_display: string;
          collection_item_id: string;
          copy_count: number;
          created_at: string;
          title: string;
        }[];
      };
      search_collection_items: {
        Args: {
          p_condition?: Database["public"]["Enums"]["record_condition"];
          p_favorite?: boolean;
          p_format?: Database["public"]["Enums"]["release_format"];
          p_purchase_state?: Database["public"]["Enums"]["purchase_state"];
          p_query?: string;
          p_sort?: string;
        };
        Returns: {
          acquired_on: string;
          artist_display: string;
          catalog_number: string;
          country: string;
          cover_url: string;
          created_at: string;
          disc_count: number;
          format: Database["public"]["Enums"]["release_format"];
          id: string;
          is_favorite: boolean;
          label: string;
          media_condition: Database["public"]["Enums"]["record_condition"];
          original_year: number;
          purchase_state: Database["public"]["Enums"]["purchase_state"];
          release_year: number;
          sleeve_condition: Database["public"]["Enums"]["record_condition"];
          tags: string[];
          title: string;
        }[];
      };
      update_collection_item_details: {
        Args: {
          p_acquired_from?: string;
          p_acquired_on?: string;
          p_artist_display: string;
          p_barcode?: string;
          p_catalog_number?: string;
          p_country?: string;
          p_disc_count?: number;
          p_edition_description?: string;
          p_format?: Database["public"]["Enums"]["release_format"];
          p_is_favorite?: boolean;
          p_is_reissue?: boolean;
          p_item_id: string;
          p_label?: string;
          p_matrix_runout?: string;
          p_media_condition?: Database["public"]["Enums"]["record_condition"];
          p_notes?: string;
          p_original_year?: number;
          p_price_currency?: string;
          p_price_paid_minor?: number;
          p_purchase_state?: Database["public"]["Enums"]["purchase_state"];
          p_rating?: number;
          p_release_year?: number;
          p_sleeve_condition?: Database["public"]["Enums"]["record_condition"];
          p_tags?: string[];
          p_title: string;
          p_vinyl_color?: string;
        };
        Returns: boolean;
      };
      update_wishlist_item_details: {
        Args: {
          p_artist_display: string;
          p_is_public?: boolean;
          p_item_id: string;
          p_max_price_minor?: number;
          p_notes?: string;
          p_preferred_edition?: string;
          p_price_currency?: string;
          p_priority: Database["public"]["Enums"]["wishlist_priority"];
          p_title: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      purchase_state: "new" | "used" | "unknown";
      record_condition:
        | "mint"
        | "near_mint"
        | "very_good_plus"
        | "very_good"
        | "good_plus"
        | "good"
        | "fair"
        | "poor";
      release_format:
        "lp" | "seven_inch" | "ten_inch" | "twelve_inch" | "box_set" | "other";
      wishlist_priority: "interested" | "wanted" | "must_have";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      purchase_state: ["new", "used", "unknown"],
      record_condition: [
        "mint",
        "near_mint",
        "very_good_plus",
        "very_good",
        "good_plus",
        "good",
        "fair",
        "poor",
      ],
      release_format: [
        "lp",
        "seven_inch",
        "ten_inch",
        "twelve_inch",
        "box_set",
        "other",
      ],
      wishlist_priority: ["interested", "wanted", "must_have"],
    },
  },
} as const;
