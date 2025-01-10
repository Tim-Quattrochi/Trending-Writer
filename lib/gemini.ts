import { generateText } from "ai";
import { google } from "@ai-sdk/google";

async function generateSummaryWithGemini(
  articleContent: string,
  maxLength: number = 200
): Promise<string> {
  const prompt = `Generate a concise and engaging summary (under ${maxLength} characters) based on the following article content. The summary should be suitable for use as a social media post or a meta description:\n\n${articleContent}`;

  try {
    const { text } = await generateText({
      model: google("gemini-1.5-pro"),
      prompt,
      maxTokens: 100,
      temperature: 0.5,
    });

    if (!text) {
      throw new Error("Failed to generate summary");
    }

    return text;
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

export { generateSummaryWithGemini };
