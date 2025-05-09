import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API with your API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// Utility for delay in ms
const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Utility for exponential backoff with jitter
const getBackoffTime = (
  retryCount: number,
  baseDelay = 1000,
  maxDelay = 30000
) => {
  const exponentialBackoff = Math.min(
    baseDelay * Math.pow(2, retryCount),
    maxDelay
  );
  const jitter = Math.random() * 0.1 * exponentialBackoff;
  return exponentialBackoff + jitter;
};

// Model fallback chain for summary generation - use smaller models first
const MODEL_FALLBACK_CHAIN = [
  "gemini-1.5-flash", // Try with flash first for summaries (faster)
  "gemini-pro", // If rate limited, try with older model
  "gemini-pro-latest", // Last resort
];

async function generateSummaryWithGemini(
  articleContent: string,
  maxLength: number = 200
): Promise<string> {
  try {
    let lastError: any = null;

    // Try each model in the fallback chain
    for (const modelName of MODEL_FALLBACK_CHAIN) {
      let retries = 0;
      const maxRetries = 2; // Fewer retries for summary generation

      while (retries < maxRetries) {
        try {
          console.log(
            `Attempting summary with model: ${modelName}, retry: ${retries}`
          );

          // Define configuration
          const config = {
            responseMimeType: "application/json",
            systemInstruction: [
              {
                text: `You are an expert in writing concise and engaging summaries for online content.`,
              },
            ],
            generationConfig: {
              maxOutputTokens: 1000, // Reduced tokens for summary
              temperature: 0.5,
            },
          };

          // Define contents
          const contents = [
            {
              role: "user",
              parts: [
                {
                  text: `Generate a concise and engaging summary (under ${maxLength} characters) based on the following article content. The summary should be suitable for use as a social media post or a meta description:\n\n${articleContent}`,
                },
              ],
            },
          ];

          // Generate content using the structure exactly as in the docs
          const response = await ai.models.generateContent({
            model: modelName,
            contents,
            ...config,
          });

          const result = response.text();

          if (!result) {
            throw new Error("Empty response from the API");
          }

          console.log(
            `Successfully generated summary with ${modelName}`
          );
          return result;
        } catch (error: any) {
          lastError = error;

          // If rate limited and we should retry
          if (
            error?.message?.includes("429") ||
            error?.error?.code === 429
          ) {
            console.log(
              `Rate limited during summary generation. Retrying...`
            );

            // Calculate backoff time
            const backoffTime = getBackoffTime(retries);
            console.log(
              `Backing off for ${backoffTime}ms before retry`
            );

            // Wait before retry
            await delay(backoffTime);
            retries++;
          } else {
            // For non-rate-limit errors, break and try next model
            console.error(
              `Error with model ${modelName} during summary generation:`,
              error
            );
            break;
          }
        }
      }
    }

    // If all models and retries failed
    throw (
      lastError ||
      new Error("Failed to generate summary with all fallback models")
    );
  } catch (error) {
    console.error("Error generating summary:", error);
    // Return a generic summary as fallback when all else fails
    return `Article about ${articleContent.slice(
      0,
      50
    )}...`.substring(0, maxLength);
  }
}

export { generateSummaryWithGemini };
