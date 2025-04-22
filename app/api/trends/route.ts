import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { checkAdminAccess } from "@/lib/auth";

async function fetchRSS(url: string) {
  const response = await fetch(url, { next: { tags: ["trends"] } });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return await response.text();
}

interface HtNewsItem {
  "ht:news_item_title": string;
  "ht:news_item_url": string;
}

interface RssItem {
  title: string;
  "ht:approx_traffic"?: string;
  pubDate: string;
  "ht:news_item"?: HtNewsItem | HtNewsItem[];
  "ht:picture"?: string | null;
}

interface ParsedXml {
  rss: {
    channel: {
      item: RssItem[];
    };
  };
}

interface ParsedItem {
  Title: string;
  "Approx Traffic": string;
  "Publication Date": string;
  "News Items": string;
  Picture: string | null;
  Hash: string;
}

async function parseRSS(xmlContent: string): Promise<ParsedItem[]> {
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "text",
    allowBooleanAttributes: true,
    trimValues: true,
  });
  const jsonObj = parser.parse(xmlContent) as ParsedXml;
  const items: ParsedItem[] = [];

  const channelItems = jsonObj.rss.channel.item;

  for (const item of channelItems) {
    const title = item.title;
    const approxTraffic = item["ht:approx_traffic"] || "N/A";
    const pubDate = item.pubDate;
    const picture = item["ht:picture"] || null;

    const newsItems: string[] = [];
    if (Array.isArray(item["ht:news_item"])) {
      for (const newsItem of item["ht:news_item"]) {
        newsItems.push(
          `- **${newsItem["ht:news_item_title"]}**: [Link](${newsItem["ht:news_item_url"]})`
        );
      }
    } else if (item["ht:news_item"]) {
      newsItems.push(
        `- **${item["ht:news_item"]["ht:news_item_title"]}**: [Link](${item["ht:news_item"]["ht:news_item_url"]})`
      );
    }

    const newsItemsCombined = newsItems.join("\n");

    const pubDateTimestamp = new Date(pubDate);

    const itemHash = crypto
      .createHash("md5")
      .update(title + pubDate)
      .digest("hex");

    items.push({
      Title: title,
      "Approx Traffic": approxTraffic,
      "Publication Date": pubDateTimestamp.toISOString(),
      Picture: picture,
      "News Items": newsItemsCombined,
      Hash: itemHash,
    });
  }

  return items;
}

export async function POST(req: Request) {
  const { isAdmin, error } = await checkAdminAccess();
  if (!isAdmin) {
    return error;
  }

  const supabase = await createClient();

  const { data: lastUpdated, error: lastUpdatedError } =
    await supabase.from("trend_updates").select("last_checked_at");

  if (lastUpdatedError) {
    console.error(
      "Error fetching last updated time:",
      lastUpdatedError
    );
    return NextResponse.json(
      { error: "Error fetching last updated time" },
      { status: 500 }
    );
  }

  const lastCheckedAt = lastUpdated[0]
    ? new Date(lastUpdated[0].last_checked_at)
    : null;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  if (!lastCheckedAt || lastCheckedAt < oneHourAgo) {
    const rssUrl = "https://trends.google.com/trending/rss?geo=US";

    let updatedTrendsCount = 0;
    let insertedTrendsCount = 0;

    try {
      const rssContent = await fetchRSS(rssUrl);
      const newItems = await parseRSS(rssContent);

      const newTrends = [];

      for (const item of newItems) {
        const { data: existingTrend, error: hashError } =
          await supabase
            .from("trends")
            .select("hash")
            .eq("hash", item.Hash)
            .single();

        if (hashError && hashError.code !== "PGRST116") {
          // "PGRST116" means no data found
          console.error("Error fetching existing trend:", hashError);
          throw new Error("Error fetching existing trend");
        }

        if (!existingTrend) {
          const { error: insertError } = await supabase
            .from("trends")
            .insert([
              {
                title: item.Title,
                approx_traffic: item["Approx Traffic"],
                publication_date: item["Publication Date"],
                news_items: item["News Items"],
                hash: item.Hash,
                stored_image_url: item.Picture,
              },
            ]);

          if (insertError) {
            console.error(
              "Error inserting new trend:",
              insertError.message
            );
            throw new Error("Error inserting new trend");
          }

          newTrends.push(item);
          insertedTrendsCount++;
          revalidatePath("/", "layout");
        } else {
          const { error: updateError } = await supabase
            .from("trends")
            .update({
              title: item.Title,
              approx_traffic: item["Approx Traffic"],
              publication_date: item["Publication Date"],
              news_items: item["News Items"],
            })
            .eq("hash", item.Hash);
          if (updateError) {
            console.error(
              "Error updating existing trend:",
              updateError
            );
            throw new Error("Error updating existing trend");
          }
          updatedTrendsCount++;
        }
      }
      revalidatePath("/", "layout");

      return NextResponse.json({
        message: "Successfully updated trending news.",
        addedTrends: newTrends,
        insertedTrendsCount,
        updatedTrendsCount,
      });
    } catch (error) {
      console.error("Error:", error);
      return NextResponse.json(
        {
          message: "Error updating trending news.",
        },
        { status: 500 }
      );
    }
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const url = new URL(req.url);

  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const {
      data: trends,
      error,
      count,
    } = await supabase
      .from("trends")
      .select("*", { count: "exact" })
      .range(start, end)
      .order("publication_date", { ascending: false });

    if (error) {
      console.error("Error fetching trends:", error);
      throw new Error("Error fetching trends");
    }

    return NextResponse.json({
      items: trends,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Error fetching trends.",
      },
      { status: 500 }
    );
  }
}
