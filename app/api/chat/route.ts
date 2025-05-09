import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

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

  // Initialize the AI with the API key
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Specify model ID as string (per docs)
  const model = "gemini-1.5-pro";

  // Define configuration
  const config = {
    responseMimeType: "application/json",
    systemInstruction: [
      {
        text: `You are an expert in SEO and content marketing. Write an article that will rank well on Google and attract organic traffic.`,
      },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8000,
    },
  };

  // Define contents using proper structure
  const contents = [
    {
      role: "user",
      parts: [
        {
          text: `Generate an SEO-friendly article based on the following trend data:

Trend Title: ${trendData.title}
Approximate Traffic: ${trendData.approxTraffic}
Publication Date: ${trendData.pubDate}
News Items (Markdown): ${trendData.newsItems}
Focus on these SEO keywords: ${trendData.title}, ${trendData.approxTraffic}

Return the article in the following format:
Title: ${trendData.title}
Content: [generated content]
Summary: [generated summary]`,
        },
      ],
    },
  ];

  try {
    // Stream the response using the official documented pattern
    const response = await ai.models.generateContentStream({
      model,
      contents,
      ...config,
    });

    // Set up streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            controller.enqueue(encoder.encode(chunk.text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return Response.json(
      { error: "Failed to generate article" },
      { status: 500 }
    );
  }
}
