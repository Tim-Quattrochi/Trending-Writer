import { createClient } from "@/supabase/server";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

// Interfaces
interface HtNewsItem {
  "ht:news_item_title": string;
  "ht:news_item_url": string;
  "ht:news_item_picture"?: string;
  "ht:news_item_source"?: string;
}

interface RssItem {
  title: string;
  "ht:approx_traffic"?: string;
  pubDate: string;
  "ht:news_item"?: HtNewsItem | HtNewsItem[];
  "ht:picture"?: string | null;
  "media:content"?: { url: string };
  enclosure?: { url: string; type?: string };
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

async function fetchRSS(url: string) {
  const response = await fetch(url, { next: { tags: ["trends"] } });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.text();
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

    // Enhanced image extraction
    let picture = null;
    if (item["ht:picture"]) {
      // Direct picture attribute
      picture = item["ht:picture"];
    } else if (item["media:content"] && item["media:content"].url) {
      // Try media:content tag if available
      picture = item["media:content"].url;
    } else if (
      item["enclosure"] &&
      item["enclosure"].url &&
      (item["enclosure"].type || "").startsWith("image/")
    ) {
      // Try enclosure tag with image type
      picture = item["enclosure"].url;
    }

    // Try to get the first news_item_picture if available
    if (!picture && item["ht:news_item"]) {
      if (Array.isArray(item["ht:news_item"])) {
        // If there are multiple news items, try to get the picture from the first one
        const firstNewsItem = item["ht:news_item"][0];
        if (firstNewsItem["ht:news_item_picture"]) {
          picture = firstNewsItem["ht:news_item_picture"];
        }
      } else if (item["ht:news_item"]["ht:news_item_picture"]) {
        // If there's only one news item, try to get its picture
        picture = item["ht:news_item"]["ht:news_item_picture"];
      }
    }

    // Attempt to extract image from news item content if still null
    if (
      !picture &&
      item["ht:news_item"] &&
      Array.isArray(item["ht:news_item"])
    ) {
      // Look for image URL patterns in the first few news items
      for (let i = 0; i < Math.min(3, item["ht:news_item"].length); i++) {
        const newsItemContent = item["ht:news_item"][i]["ht:news_item_url"];
        if (
          newsItemContent &&
          newsItemContent.match(/\.(jpg|jpeg|png|gif|webp)/i)
        ) {
          picture = newsItemContent;
          break;
        }
      }
    }

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

export async function updateTrendsFromRSS() {
  const supabase = await createClient();

  const { data: lastUpdated, error: lastUpdatedError } = await supabase
    .from("trend_updates")
    .select("id, last_checked_at");

  if (lastUpdatedError) {
    console.error("Error fetching last updated time:", lastUpdatedError);
    throw new Error("Error fetching last updated time");
  }

  const lastCheckedAt = lastUpdated[0]
    ? new Date(lastUpdated[0].last_checked_at)
    : null;
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // If checked recently, return early (or maybe we want to force update?)
  // The original code only updates if > 1 hour ago.
  // But the button says "Check for new Trends", implying a manual trigger.
  // If the user clicks it, they might expect it to check NOW.
  // However, I should preserve the original logic for now, or maybe allow an override?
  // The original code: if (!lastCheckedAt || lastCheckedAt < oneHourAgo)

  // Let's assume we want to respect the rate limit but maybe the user wants to force it?
  // For now, I'll keep the logic as is.

  if (lastCheckedAt && lastCheckedAt >= oneHourAgo) {
    return {
      message: "Trends were updated less than an hour ago.",
      insertedTrendsCount: 0,
      updatedTrendsCount: 0,
      skipped: true,
    };
  }

  const rssUrl = "https://trends.google.com/trending/rss?geo=US";

  let updatedTrendsCount = 0;
  let insertedTrendsCount = 0;
  const newTrends = [];

  try {
    const rssContent = await fetchRSS(rssUrl);
    const newItems = await parseRSS(rssContent);

    for (const item of newItems) {
      const { data: existingTrend, error: hashError } = await supabase
        .from("trends")
        .select("hash")
        .eq("hash", item.Hash)
        .single();

      if (hashError && hashError.code !== "PGRST116") {
        console.error("Error fetching existing trend:", hashError);
        throw new Error("Error fetching existing trend");
      }

      if (!existingTrend) {
        const { error: insertError } = await supabase.from("trends").insert([
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
          console.error("Error inserting new trend:", insertError.message);
          throw new Error("Error inserting new trend");
        }

        newTrends.push(item);
        insertedTrendsCount++;
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
          console.error("Error updating existing trend:", updateError);
          throw new Error("Error updating existing trend");
        }
        updatedTrendsCount++;
      }
    }

    // Update the last_checked_at timestamp
    if (lastUpdated && lastUpdated.length > 0) {
      await supabase
        .from("trend_updates")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", lastUpdated[0].id);
    } else {
      // Should have been inserted by migration, but just in case
      await supabase
        .from("trend_updates")
        .insert({ last_checked_at: new Date().toISOString() });
    }

    revalidatePath("/", "layout");

    return {
      message: "Successfully updated trending news.",
      addedTrends: newTrends,
      insertedTrendsCount,
      updatedTrendsCount,
    };
  } catch (error) {
    console.error("Error in updateTrendsFromRSS:", error);
    throw error;
  }
}
