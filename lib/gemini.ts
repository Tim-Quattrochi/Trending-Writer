import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API with your API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

async function generateSummaryWithGemini(
  articleContent: string,
  maxLength: number = 200
): Promise<string> {
  const prompt = `Generate a concise and engaging summary (under ${maxLength} characters) based on the following article content. The summary should be suitable for use as a social media post or a meta description:\n\n${articleContent}`;

  try {
    const { text } = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: {
        candidateCount: 1,
      },
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
