export interface Article {
  id: string;
  title: string;
  content: string;
  trend_id?: number;
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  summary: string;
  image_url?: string;
  meta_description?: string;
  meta_keywords?: string[];
  is_published?: boolean;
  slug?: string;
}

interface ArticleResponseSuccess {
  data: Article[];
  error?: undefined;
}

interface ArticleResponseError {
  error: string;
  data?: undefined;
}

export type ArticleResponse =
  | ArticleResponseSuccess
  | ArticleResponseError;

export type ArticleUpdate = Partial<
  Omit<Article, "id" | "created_at">
>;
