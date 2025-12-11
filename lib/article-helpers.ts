import { Article, Category, Trend } from "@/app/api/articles/article.types";
import { Database } from "@/types/types_db";

export const DEFAULT_CATEGORY_SLUG = "oddities";
export const DEFAULT_CATEGORY_NAME = "Oddities";

export const ARTICLE_WITH_CATEGORIES = `
  *,
  article_categories:article_categories (
    categories:categories (*)
  ),
  trend:trends (
    id,
    title,
    approx_traffic,
    publication_date,
    news_items,
    stored_image_url
  )
`;

export type ArticleQueryResult =
  Database["public"]["Tables"]["articles"]["Row"] & {
    article_categories?: Array<{
      categories?: Database["public"]["Tables"]["categories"]["Row"] | null;
    }>;
    trend?: Database["public"]["Tables"]["trends"]["Row"] | null;
  };

function mapCategory(row: Database["public"]["Tables"]["categories"]["Row"]): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapTrend(row: Database["public"]["Tables"]["trends"]["Row"] | null): Trend | null {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    approx_traffic: row.approx_traffic,
    publication_date: row.publication_date,
    news_items: row.news_items,
    stored_image_url: row.stored_image_url,
  };
}

export function mapArticle(record: ArticleQueryResult): Article {
  const categories =
    record.article_categories
      ?.map((relation) => relation.categories)
      .filter((category): category is NonNullable<typeof category> => Boolean(category))
      .map(mapCategory) ?? [];

  const primaryCategory = categories[0];
  const trend = mapTrend(record.trend ?? null);

  return {
    ...record,
    title: record.title ?? "Untitled Article",
    summary: record.summary ?? "",
    categories,
    trend,
    primaryCategorySlug: primaryCategory?.slug ?? DEFAULT_CATEGORY_SLUG,
    primaryCategoryName: primaryCategory?.name ?? DEFAULT_CATEGORY_NAME,
  };
}

export function mapArticles(records?: ArticleQueryResult[] | null): Article[] {
  if (!records) {
    return [];
  }

  return records.map(mapArticle);
}

interface ArticlePathOptions {
  fallbackCategorySlug?: string;
}

export function getArticlePath(
  article: Pick<Article, "slug" | "primaryCategorySlug">,
  options: ArticlePathOptions = {}
): string {
  if (!article.slug) {
    return "/articles";
  }

  const categorySlug =
    article.primaryCategorySlug ||
    options.fallbackCategorySlug ||
    DEFAULT_CATEGORY_SLUG;

  return `/trends/${categorySlug}/${article.slug}`;
}
