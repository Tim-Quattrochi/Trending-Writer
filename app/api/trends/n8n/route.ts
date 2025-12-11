import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import crypto from "crypto";

/**
 * POST /api/trends/n8n
 * 
 * Endpoint for n8n workflow to save trends to Supabase.
 * Handles deduplication via hash and returns trend_id for article linking.
 * 
 * Expected body:
 * {
 *   title: string,
 *   approxTraffic: string,       // e.g., "500+", "10K+"
 *   pubDate: string,             // e.g., "Wed, 10 Dec 2025 17:50:00 -0800"
 *   newsItems: string | object[], // Markdown string or array of news item objects
 *   imageUrl?: string,
 *   imageSource?: string
 * }
 * 
 * Returns:
 * {
 *   success: boolean,
 *   trend_id: number,
 *   isNew: boolean,
 *   message: string
 * }
 */

interface NewsItemObject {
  "ht:news_item_title"?: string;
  "ht:news_item_url"?: string;
  "ht:news_item_picture"?: string;
  "ht:news_item_source"?: string;
  title?: string;
  url?: string;
}

interface TrendRequestBody {
  title: string;
  approxTraffic?: string;
  pubDate?: string;
  newsItems?: string | NewsItemObject[];
  imageUrl?: string;
  imageSource?: string;
  picture?: string;
  pictureSource?: string;
}

function formatNewsItemsToMarkdown(newsItems: NewsItemObject[]): string {
  if (!Array.isArray(newsItems) || newsItems.length === 0) {
    return "";
  }

  return newsItems
    .map((item) => {
      const title = item["ht:news_item_title"] || item.title || "";
      const url = item["ht:news_item_url"] || item.url || "";
      if (title && url) {
        return `- **${title}**: [Link](${url})`;
      }
      return null;
    })
    .filter(Boolean)
    .join("\n");
}

function generateTrendHash(title: string, pubDate: string): string {
  return crypto
    .createHash("md5")
    .update(title + pubDate)
    .digest("hex");
}

function parsePublicationDate(pubDate: string): string {
  try {
    const parsed = new Date(pubDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch {
    // Fall through to return current time
  }
  return new Date().toISOString();
}

export async function POST(req: Request) {
  try {
    const body: TrendRequestBody = await req.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "title is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Prepare trend data
    const title = body.title.trim();
    const pubDate = body.pubDate || new Date().toISOString();
    const publicationDate = parsePublicationDate(pubDate);
    const hash = generateTrendHash(title, pubDate);

    // Format news items to markdown if they're an array
    let newsItemsMarkdown = "";
    if (typeof body.newsItems === "string") {
      newsItemsMarkdown = body.newsItems;
    } else if (Array.isArray(body.newsItems)) {
      newsItemsMarkdown = formatNewsItemsToMarkdown(body.newsItems);
    }

    // Get image URL (check multiple field names n8n might send)
    const imageUrl = body.imageUrl || body.picture || null;

    // Check if trend already exists by hash
    const { data: existingTrend, error: lookupError } = await supabase
      .from("trends")
      .select("id, hash")
      .eq("hash", hash)
      .maybeSingle();

    if (lookupError && lookupError.code !== "PGRST116") {
      console.error("Error looking up existing trend:", lookupError);
      return NextResponse.json(
        { success: false, error: "Database lookup failed" },
        { status: 500 }
      );
    }

    // If trend exists, return existing ID
    if (existingTrend) {
      // Optionally update the existing trend with fresh data
      await supabase
        .from("trends")
        .update({
          approx_traffic: body.approxTraffic || null,
          news_items: newsItemsMarkdown || null,
          stored_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingTrend.id);

      return NextResponse.json({
        success: true,
        trend_id: existingTrend.id,
        isNew: false,
        message: "Trend already exists, updated with latest data",
      });
    }

    // Insert new trend
    const { data: newTrend, error: insertError } = await supabase
      .from("trends")
      .insert({
        title: title,
        approx_traffic: body.approxTraffic || null,
        publication_date: publicationDate,
        news_items: newsItemsMarkdown || null,
        hash: hash,
        stored_image_url: imageUrl,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error inserting trend:", insertError);
      return NextResponse.json(
        { success: false, error: "Failed to save trend" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      trend_id: newTrend.id,
      isNew: true,
      message: "New trend saved successfully",
    });
  } catch (error) {
    console.error("Error in n8n trends endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if a trend exists (useful for n8n deduplication)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const title = url.searchParams.get("title");
    const pubDate = url.searchParams.get("pubDate");

    if (!title || !pubDate) {
      return NextResponse.json(
        { success: false, error: "title and pubDate query params required" },
        { status: 400 }
      );
    }

    const hash = generateTrendHash(title, pubDate);
    const supabase = await createClient();

    const { data: existingTrend, error } = await supabase
      .from("trends")
      .select("id, title, publication_date")
      .eq("hash", hash)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { success: false, error: "Database lookup failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      exists: !!existingTrend,
      trend_id: existingTrend?.id || null,
    });
  } catch (error) {
    console.error("Error checking trend existence:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
