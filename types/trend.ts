export interface TrendItem {
  id: string;
  title: string;
  approx_traffic: string;
  publication_date: string;
  news_items: string;
  hash: string;
  stored_image_url?: string | null;
  image_source?: string | null;
}
export interface NewsItem {
  title: string;
  url: string;
}
