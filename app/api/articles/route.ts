import { google } from "@ai-sdk/google";
import { z } from "zod";
import { generateSummaryWithGemini } from "@/lib/gemini";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";
import { checkAdminAccess } from "@/lib/auth";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/types_db";
import {
  ARTICLE_WITH_CATEGORIES,
  DEFAULT_CATEGORY_NAME,
  DEFAULT_CATEGORY_SLUG,
  getArticlePath,
  mapArticles,
} from "@/lib/article-helpers";
import { Article } from "@/app/api/articles/article.types";

const articleSchema = z.object({
  title: z
    .string()
    .max(150)
    .describe(
      "A catchy and SEO-friendly headline for the article (max 150 characters)"
    ),

  content: z
    .string()
    .min(500)
    .transform((val) => {
      // Ensure the content is clean and standardized with proper markdown formatting
      // This helps ensure consistent rendering regardless of AI generation quirks
      return val
        .trim()
        .replace(/\r\n/g, "\n") // Normalize line endings
        .replace(/\n{3,}/g, "\n\n"); // Remove excessive line breaks
    })
    .describe(
      "The full content of the article, well-structured, engaging, and optimized for SEO (minimum 500 words)"
    ),
  summary: z
    .string()
    .transform((val) => {
      const normalized = val.normalize("NFC").trim();

      const cleaned = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

      const charCount = Array.from(cleaned).length;

      return charCount > 200 ? cleaned.slice(0, 300) + "..." : cleaned;
    })

    .describe(
      "A concise summary of the article, suitable for social media posts (max 200 characters)"
    ),
  meta_description: z
    .string()
    .trim()
    .transform((val) => {
      // Normalize the string to NFC form (canonical form)
      const normalized = val.normalize("NFC").trim();
      // Remove hidden or non-printable characters
      const cleaned = normalized.replace(/[\u200B-\u200D\uFEFF]/g, "");

      const charCount = Array.from(cleaned).length;

      // Truncate if needed
      return charCount > 160 ? cleaned.slice(0, 157) + "..." : cleaned;
    })
    .describe(
      "An SEO-friendly meta description for the article (max 160 characters)"
    ),
  keywords: z
    .array(z.string())
    .describe("A list of 5-7 relevant SEO keywords for the article"),
});

// Function to normalize article content format for consistent rendering
function normalizeArticleContent(articles: Article[]): Article[] {
  return articles.map((article) => {
    // Return articles with consistently formatted content
    return {
      ...article,
      content: article.content
        .trim()
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n"),
    };
  });
}

type SupabaseServerClient = SupabaseClient<Database>;

type CategoryRecord = { id: number; slug: string };

function pickStringCandidate(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length) {
        return trimmed;
      }
    }
  }
  return null;
}

function pickNumberCandidate(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function formatCategoryName(slug: string): string {
  const pretty = slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");

  return pretty || DEFAULT_CATEGORY_NAME;
}

function uniqueSlugs(values: Array<string | null>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

async function getCategoryById(
  supabase: SupabaseServerClient,
  categoryId: number
): Promise<CategoryRecord | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("id", categoryId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching category by id:", error);
    return null;
  }

  return data;
}

async function getCategoryBySlug(
  supabase: SupabaseServerClient,
  slug: string
): Promise<CategoryRecord | null> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("Error fetching category by slug:", error);
    return null;
  }

  return data;
}

async function createCategoryRecord(
  supabase: SupabaseServerClient,
  slug: string,
  categoryName?: string | null
): Promise<CategoryRecord | null> {
  const name = categoryName?.trim() || formatCategoryName(slug);

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      is_active: true,
    })
    .select("id, slug")
    .single();

  if (error) {
    if (error.code === "23505") {
      return getCategoryBySlug(supabase, slug);
    }
    console.error("Error creating category:", error);
    return null;
  }

  revalidateTag("categories");

  return data;
}

async function linkArticleToCategory(
  supabase: SupabaseServerClient,
  articleId: number,
  categoryId: number
): Promise<boolean> {
  const { error } = await supabase
    .from("article_categories")
    .insert([{ article_id: articleId, category_id: categoryId }]);

  if (error) {
    if (error.code === "23505") {
      return true;
    }

    console.error("Error linking article to category:", error);
    return false;
  }

  return true;
}

interface EnsureArticleCategoryOptions {
  supabase: SupabaseServerClient;
  articleId: number;
  categoryId?: number | null;
  categorySlug?: string | null;
  categoryName?: string | null;
}

async function ensureArticleCategory({
  supabase,
  articleId,
  categoryId,
  categorySlug,
  categoryName,
}: EnsureArticleCategoryOptions): Promise<string> {
  const slugFromName = categoryName ? generateSlug(categoryName) : null;
  const slugCandidates = uniqueSlugs([
    categorySlug ? generateSlug(categorySlug) : null,
    slugFromName,
    DEFAULT_CATEGORY_SLUG,
  ]);

  if (categoryId) {
    const category = await getCategoryById(supabase, categoryId);
    if (category) {
      const linked = await linkArticleToCategory(supabase, articleId, category.id);
      if (linked) {
        return category.slug;
      }
    }
  }

  for (const slug of slugCandidates) {
    let category = await getCategoryBySlug(supabase, slug);

    if (!category && slug !== DEFAULT_CATEGORY_SLUG) {
      category = await createCategoryRecord(
        supabase,
        slug,
        categoryName ?? formatCategoryName(slug)
      );
    }

    if (!category) {
      continue;
    }

    const linked = await linkArticleToCategory(supabase, articleId, category.id);

    if (linked) {
      return category.slug;
    }
  }

  return DEFAULT_CATEGORY_SLUG;
}

export async function POST(req: Request) {
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  const body = await req.json();

  const categoryPayload =
    body.category && typeof body.category === "object"
      ? body.category
      : null;
  const trendCategoryPayload =
    body.trendData?.category && typeof body.trendData.category === "object"
      ? body.trendData.category
      : null;

  const requestedCategorySlug = pickStringCandidate(
    body.categorySlug,
    body.category_slug,
    categoryPayload?.slug,
    trendCategoryPayload?.slug,
    body.trendData?.categorySlug,
    body.trendData?.category_slug,
    typeof body.category === "string" ? body.category : null,
    typeof body.trendData?.category === "string" ? body.trendData.category : null
  );

  const requestedCategoryName = pickStringCandidate(
    body.categoryName,
    body.category_name,
    body.categoryLabel,
    body.category_label,
    categoryPayload?.name,
    categoryPayload?.label,
    trendCategoryPayload?.name,
    trendCategoryPayload?.label,
    body.trendData?.categoryName,
    body.trendData?.category_name,
    body.trendData?.categoryLabel,
    typeof body.category === "string" ? body.category : null,
    typeof body.trendData?.category === "string" ? body.trendData.category : null
  );

  const requestedCategoryId = pickNumberCandidate(
    body.categoryId,
    body.category_id,
    categoryPayload?.id,
    trendCategoryPayload?.id,
    body.trendData?.categoryId,
    body.trendData?.category_id
  );

  if (!body.trendData || !body.title) {
    return NextResponse.json(
      { message: "trend data and title are required." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const prompt = `
    You are a world-class journalist and an expert in SEO and content marketing. Your task is to write a high-quality, engaging, and SEO-optimized article that will rank well on Google and attract organic traffic.

  Base your article on the following trend data:

  Trend Title: ${body.title}
  Approximate Traffic: ${body.approxTraffic}
  Publication Date: ${body.pubDate}
  News Items (Markdown): ${body.newsItems}

  Article Requirements:

  1. Headline: Craft a catchy and SEO-friendly headline that accurately reflects the content and is under 150 characters.
  2. Content: Write a well-structured article of at least 500 words. Naturally incorporate these SEO keywords: ${body.title}, trending news, [related terms]. Reference at least 2 of the news items provided.
  3. Visuals: Use at least one bullet-point list, table, or formatted section to enhance readability.
  4. Summary: Keep the summary UNDER 200 characters and suitable for social media sharing.
  5. Meta Description: Write a concise meta description under 160 characters that captures the essence of the article.
  6. Keywords: Dynamically generate 5-7 relevant SEO keywords based on the trend data, including synonyms and commonly searched terms.
  7. CTA: Conclude with a subtle call to action encouraging readers to engage or explore related content.

  Format your content with proper markdown:
  - Use blank lines between paragraphs
  - Format bullet lists with * or - 
  - Format tables with proper pipe syntax
  - Use proper markdown for headings (# for main headings, ## for subheadings)

  Maintain a professional, engaging tone that appeals to social media scrollers and social media users who love reading juicy articles. Use the provided news items as a foundation, but expand on the topic with additional insights as needed.`;

    const { object } = await generateObject({
      model: google("gemini-2.5-pro"),
      schema: articleSchema,
      prompt,
      temperature: 0.4,
      system:
        "You are an expert in SEO and writing articles that generate organic traffic. Write an article that will rank well on Google and attract readers interested in trending news. Ensure the meta description is under 160 characters.",
      maxRetries: 3,
    });

    const slug = generateSlug(object.title);

    if (!object.meta_description || object.meta_description.length > 160) {
      object.meta_description = await generateSummaryWithGemini(
        object.content,
        160
      );
    }

    const formattedContent = object.content
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");

    const { data: newArticle, error: insertError } = await supabase
      .from("articles")
      .insert([
        {
          trend_id: body.trendData.trend_id,
          topic: body.topic,
          title: object.title,
          content: formattedContent,
          summary: object.summary,
          image_url: body.image_url,
          slug,
          is_published: body.is_published,
          published_at: body.is_published ? new Date().toISOString() : null,
          meta_description: object.meta_description,
          meta_keywords: object.keywords,
        },
      ])
      .select("*")
      .single();

    if (insertError) {
      console.error("Error inserting article:", insertError);
      return NextResponse.json(
        { message: "Error creating article" },
        { status: 500 }
      );
    }

    const assignedCategorySlug = await ensureArticleCategory({
      supabase,
      articleId: newArticle.id,
      categoryId: requestedCategoryId,
      categorySlug: requestedCategorySlug,
      categoryName: requestedCategoryName,
    });

    revalidateTag("articles");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const canonicalArticlePath =
      newArticle.slug
        ? getArticlePath({
            slug: newArticle.slug,
            primaryCategorySlug: assignedCategorySlug,
          })
        : null;

    return Response.json({
      message: "Article generated",
      article: {
        id: newArticle.id,
        slug: newArticle.slug,
        categorySlug: assignedCategorySlug,
        url:
          baseUrl && canonicalArticlePath
            ? `${baseUrl}${canonicalArticlePath}`
            : null,
      },
      object,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  type SortKey = "created_at" | "published_at" | "title";
  const sortParam = url.searchParams.get("sortBy") as SortKey | null;
  const sortBy: SortKey =
    sortParam && ["created_at", "published_at", "title"].includes(sortParam)
      ? sortParam
      : "created_at";

  const slug = url.searchParams.get("slug");

  const validSortColumns: Record<
    SortKey,
    { column: string; ascending: boolean }
  > = {
    created_at: { column: "created_at", ascending: false },
    published_at: { column: "published_at", ascending: false },
    title: { column: "title", ascending: true },
  };

  try {
    let query = supabase
      .from("articles")
      .select(ARTICLE_WITH_CATEGORIES);

    if (slug) {
      query = query.eq("slug", slug);
    }

    if (sortBy && validSortColumns[sortBy]) {
      query = query.order(validSortColumns[sortBy].column, {
        ascending: validSortColumns[sortBy].ascending,
      });
    } else {
      query = query.order("id", { ascending: true });
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error("Error fetching articles:", error);
      return NextResponse.json(
        { message: "Error fetching articles" },
        { status: 500 }
      );
    }

    const normalizedArticles = normalizeArticleContent(
      mapArticles(articles)
    );

    revalidateTag("articles");
    return NextResponse.json({ items: normalizedArticles });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const { isAdmin, error: authError } = await checkAdminAccess();
  if (!isAdmin) {
    return authError;
  }

  const supabase = await createClient();
  const body = await req.json();

  if (!body.title || !body.approx_traffic) {
    return NextResponse.json(
      { message: "All fields are required." },
      { status: 422 }
    );
  }

  const { title, approx_traffic } = body;

  const { data, error } = await supabase
    .from("trends")
    .update({ title, approx_traffic })
    .select();

  if (error) {
    console.error(error);
    return NextResponse.json({
      message: `Error editing tend: ${error}`,
    });
  }

  revalidateTag("trends");

  return NextResponse.json({ data });
}
