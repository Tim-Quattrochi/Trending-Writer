export interface Article {
  id: string;
  title: string;
  content: string;
  trendId?: number;
  published_at?: string;
  summary: string;
  image_url?: string;
  meta_description?: string;
  meta_keywords?: string;
  is_published?: boolean;
}

export type ArticleUpdate = Partial<
  Omit<Article, "id" | "created_at">
>;
