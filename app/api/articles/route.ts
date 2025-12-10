import { google } from "@ai-sdk/google";
import { z } from "zod";
import { generateSummaryWithGemini } from "@/lib/gemini";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";
import { checkAdminAccess } from "@/lib/auth";
import {
  ARTICLE_WITH_CATEGORIES,
  DEFAULT_CATEGORY_SLUG,
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

export async function POST(req: Request) {
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  const body = await req.json();

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

    revalidateTag("articles");

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const fallbackCategorySlug =
      typeof body.categorySlug === "string"
        ? body.categorySlug
        : DEFAULT_CATEGORY_SLUG;

    return Response.json({
      message: "Article generated",
      article: {
        id: newArticle.id,
        slug: newArticle.slug,
        url:
          baseUrl && newArticle.slug
            ? `${baseUrl}/trends/${fallbackCategorySlug}/${newArticle.slug}`
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
