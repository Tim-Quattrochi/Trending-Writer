export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Trend {
  id: number;
  title: string | null;
  approx_traffic: string | null;
  publication_date: string | null;
  news_items: string | null;
  stored_image_url: string | null;
}

export interface Article {
  id: number;
  title: string;
  content: string;
  trend_id?: number | null;
  trend?: Trend | null;
  created_at?: string | null;
  updated_at?: string | null;
  published_at?: string | null;
  summary: string;
  image_url?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | string | null;
  is_published?: boolean | null;
  slug?: string | null;
  topic?: string | null;
  source_url?: string | null;
  likes?: number | null;
  comments?: number | null;
  categories?: Category[];
  primaryCategorySlug?: string;
  primaryCategoryName?: string | null;
}

interface ArticleResponseSuccess {
  items: Article[];
  error?: undefined;
}

interface ArticleResponseError {
  error: string;
  items?: undefined;
}

export type ArticleResponse =
  | ArticleResponseSuccess
  | ArticleResponseError;

export type ArticleUpdate = Partial<
  Omit<Article, "id" | "created_at">
>;
