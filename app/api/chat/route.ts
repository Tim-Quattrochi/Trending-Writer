import { GoogleGenAI, Type } from "@google/genai";
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

// Define schema for structured article output
const articleResponseSchema = {
  type: Type.OBJECT,
  required: [
    "title",
    "content",
    "summary",
    "meta_description",
    "keywords",
  ],
  properties: {
    title: {
      type: Type.STRING,
      description:
        "Catchy and SEO-friendly headline for the article (up to 150 characters)",
    },
    content: {
      type: Type.STRING,
      description:
        "The full article content in proper markdown format with headings, paragraphs, and lists",
    },
    summary: {
      type: Type.STRING,
      description:
        "A concise summary suitable for social media posts (under 200 characters)",
    },
    meta_description: {
      type: Type.STRING,
      description:
        "SEO-friendly meta description (under 160 characters)",
    },
    keywords: {
      type: Type.ARRAY,
      description:
        "5-7 relevant SEO keywords related to the article topic",
      items: {
        type: Type.STRING,
      },
    },
  },
};

export async function POST(req: Request) {
  const { trendData } = await req.json();

  // Initialize the AI with the API key
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  // Use the supported models for structured output
  const model = "gemini-2.0-flash-lite";

  // Define configuration with responseSchema
  const config = {
    temperature: 0.45,
    responseMimeType: "application/json",
    maxOutputTokens: 8000,
    responseSchema: articleResponseSchema,
    systemInstruction: [
      {
        text: `You are a world-class journalist and an expert in SEO and content marketing. Your task is to write a high-quality, engaging, and SEO-optimized article that will rank well on Google and attract organic traffic.

Base your article on the following trend data:

Trend Title: ${trendData.title}
Approximate Traffic: ${trendData.approxTraffic}
Publication Date: ${trendData.pubDate}
News Items (Markdown): ${trendData.newsItems}

Article Requirements:

1. Headline: Craft a catchy and SEO-friendly headline that accurately reflects the content and is under 150 characters.
2. Content: Write a well-structured article of at least 500 words. Naturally incorporate these SEO keywords: ${trendData.title}, trending news, [related terms]. Reference at least 2 of the news items provided.
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

Maintain a professional, engaging tone that appeals to social media scrollers and social media users who love reading juicy articles.`,
      },
    ],
  };

  const contents = [
    {
      role: "journalist",
      parts: [
        {
          text: `Generate a structured article about the trending topic "${trendData.title}" following the format in the schema.`,
        },
      ],
    },
  ];

  try {
    console.log(
      "Generating structured article for:",
      trendData.title
    );

    // Generate the content (non-streaming for structured output)
    const response = await ai.models.generateContent({
      model,
      contents,
      ...config,
    });

    const responseText = response.text;

    if (!responseText) {
      throw new Error("Empty response from the API");
    }

    // Parse the JSON response
    const structuredArticle = JSON.parse(responseText);

    console.log("Successfully generated structured article!");

    // Return the structured response
    return Response.json(structuredArticle, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return Response.json(
      {
        error: "Failed to generate article",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
