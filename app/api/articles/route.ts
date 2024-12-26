import { google } from "@ai-sdk/google";
import { z } from "zod";
import { generateSummaryWithGemini } from "@/lib/gemini";
import { createClient } from "@/supabase/server";

import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { generateSlug } from "@/lib/utils";

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
    .describe(
      "The full content of the article, well-structured, engaging, and optimized for SEO (minimum 500 words)"
    ),
  summary: z
    .string()
    .transform((val) => {
      const normalized = val.normalize("NFC").trim();

      const cleaned = normalized.replace(
        /[\u200B-\u200D\uFEFF]/g,
        ""
      );

      const charCount = Array.from(cleaned).length;

      return charCount > 200
        ? cleaned.slice(0, 300) + "..."
        : cleaned;
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
      const cleaned = normalized.replace(
        /[\u200B-\u200D\uFEFF]/g,
        ""
      );

      const charCount = Array.from(cleaned).length;

      // Truncate if needed
      return charCount > 160
        ? cleaned.slice(0, 157) + "..."
        : cleaned;
    })
    .describe(
      "An SEO-friendly meta description for the article (max 160 characters)"
    ),
  keywords: z
    .array(z.string())
    .describe("A list of 5-7 relevant SEO keywords for the article"),
});

export async function POST(req: Request) {
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

    1.  Headline: Craft a catchy and SEO-friendly headline that accurately reflects the content and is under 150 characters.
    2.  Content: Write a well-structured article of at least 500 words. The article should be informative, engaging, and provide valuable insights related to the trend. Naturally incorporate the following SEO keywords: ${body.title}, ${body.approxTraffic}, trending news, [other relevant keywords].
    3.  Summary: CRITICAL: Keep summary UNDER 200 characters. Generate a concise summary (under 200 characters) of the article. This summary should be suitable for sharing on social media.
    4. Meta Description: The meta description MUST be under 160 characters. No exceptions. Write a short, focused meta description that captures the essence of the article.
    5.  Keywords: Provide a list of 5-7 relevant SEO keywords that accurately reflect the article's topic and will help it rank well in search engines.

    Remember to maintain a professional and engaging tone throughout the article. Use the provided news items as a foundation, but feel free to expand on the topic and provide additional context or insights as needed`;

    const { object } = await generateObject({
      model: google("gemini-1.5-pro"),
      schema: articleSchema,
      prompt,

      temperature: 0.4,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      system:
        "You are an expert in SEO and writing articles that generate organic traffic. Write an article that will rank well on Google and attract readers interested in trending news. the [meta_description] is to be under 160 characters.",
      maxRetries: 3,
    });

    const slug = generateSlug(object.title);

    if (
      !object.meta_description ||
      object.meta_description.length > 160
    ) {
      object.meta_description = await generateSummaryWithGemini(
        object.content,
        160
      );
    }

    const { data: newArticle, error: insertError } = await supabase
      .from("articles")
      .insert([
        {
          trend_id: body.trendData.trend_id,
          title: object.title,
          content: object.content,
          summary: object.summary,
          image_url: body.image_url,
          slug,
          is_published: body.is_published,
          published_at: body.is_published ? new Date() : null,
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

    return Response.json({
      message: "Article generated",
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
    sortParam &&
    ["created_at", "published_at", "title"].includes(sortParam)
      ? sortParam
      : "created_at";

  const validSortColumns: Record<
    SortKey,
    { column: string; ascending: boolean }
  > = {
    created_at: { column: "created_at", ascending: false },
    published_at: { column: "published_at", ascending: false },
    title: { column: "title", ascending: true },
  };

  try {
    let query = supabase.from("articles").select("*");

    if (sortBy && validSortColumns[sortBy]) {
      query = query.order(validSortColumns[sortBy].column, {
        ascending: validSortColumns[sortBy].ascending,
      });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data: articles, error } = await query;

    if (error) {
      console.error("Error fetching articles:", error);
      return NextResponse.json(
        { message: "Error fetching articles" },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: articles });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
