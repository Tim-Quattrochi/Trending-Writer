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
      articles: {
        Row: {
          content: string | null;
          created_at: string | null;
          id: number;
          image_url: string | null;
          is_published: boolean | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          published_at: string | null;
          slug: string | null;
          summary: string | null;
          title: string | null;
          trend_id: number;
          updated_at: string | null;
        };
        Insert: {
          content?: string | null;
          created_at?: string | null;
          id?: number;
          image_url?: string | null;
          is_published?: boolean | null;
          meta_description?: string | null;
          meta_keywords?: string[] | null;
          published_at?: string | null;
          slug?: string | null;
          summary?: string | null;
          title?: string | null;
          trend_id: number;
          updated_at?: string | null;
        };
        Update: {
          content?: string | null;
          created_at?: string | null;
          id?: number;
          image_url?: string | null;
          is_published?: boolean | null;
          meta_description?: string | null;
          meta_keywords?: string[] | null;
          published_at?: string | null;
          slug?: string | null;
          summary?: string | null;
          title?: string | null;
          trend_id?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "articles_trend_id_fkey";
            columns: ["trend_id"];
            isOneToOne: false;
            referencedRelation: "trends";
            referencedColumns: ["id"];
          }
        ];
      };
      article_categories: {
        Row: {
          article_id: number;
          category_id: number;
          created_at: string;
        };
        Insert: {
          article_id: number;
          category_id: number;
          created_at?: string;
        };
        Update: {
          article_id?: number;
          category_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_categories_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          description: string | null;
          slug: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          description?: string | null;
          slug: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          description?: string | null;
          slug?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      trend_updates: {
        Row: {
          id: number;
          last_checked_at: string;
        };
        Insert: {
          id?: number;
          last_checked_at?: string;
        };
        Update: {
          id?: number;
          last_checked_at?: string;
        };
        Relationships: [];
      };
      trends: {
        Row: {
          approx_traffic: string | null;
          created_at: string | null;
          hash: string | null;
          id: number;
          news_items: string | null;
          publication_date: string | null;
          title: string | null;
          updated_at: string | null;
          stored_image_url: string | null;
        };
        Insert: {
          approx_traffic?: string | null;
          created_at?: string | null;
          hash?: string | null;
          id?: number;
          news_items?: string | null;
          publication_date?: string | null;
          title?: string | null;
          updated_at?: string | null;
          stored_image_url?: string | null;
        };
        Update: {
          approx_traffic?: string | null;
          created_at?: string | null;
          hash?: string | null;
          id?: number;
          news_items?: string | null;
          publication_date?: string | null;
          title?: string | null;
          updated_at?: string | null;
          stored_image_url?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
