import { google } from "@ai-sdk/google";
import { z } from "zod";

import { generateObject } from "ai";

const articleSchema = z.object({
  title: z
    .string()
    .describe("The SEO-optimized title of the article"),
  content: z.string().describe("The full content of the article"),
  summary: z
    .string()
    .describe("A short summary suitable for social media"),
});

export async function POST(req: Request) {
  const { trendData } = await req.json();

  const prompt1 = `
    Generate an SEO-friendly article based on the following trend data:

    Trend Title: ${trendData.title}
    Approximate Traffic: ${trendData.approxTraffic}
    Publication Date: ${trendData.pubDate}
    News Items (Markdown): ${trendData.newsItems}
    Focus on these SEO keywords: ${trendData.title}, ${trendData.approxTraffic}, 

    Return the article in the following format:
    Title: ${trendData.title}
    Content: [generated content]
    Summary: [generated summary]
    
    `;
  const { object } = await generateObject({
    model: google("gemini-1.0-pro"),
    schema: articleSchema,
    prompt: prompt1,
    temperature: 0.01,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5,

    system:
      "You are an expert in SEO and content marketing. Write an article that will rank well on Google and attract organic traffic.",
  });

  return Response.json({ message: "Article generated", object });
}
