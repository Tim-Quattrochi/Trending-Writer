import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Article } from "@/app/api/articles/article.types";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const article: Article = await req.json();

    if (!article || !article.summary) {
      return NextResponse.json(
        { error: "Missing article data" },
        { status: 400 }
      );
    }

    const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
    const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
      console.error(
        "Missing Facebook credentials in environment variables"
      );
      return NextResponse.json(
        { error: "Facebook API configuration missing" },
        { status: 500 }
      );
    }

    const message = buildFacebookMessage(article);

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${FB_PAGE_ID}/feed`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          access_token: FB_ACCESS_TOKEN,

          link: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/articles/${article.slug}`
            : undefined,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Facebook API error:", errorData);
      throw new Error(
        errorData.error?.message || "Failed to post to Facebook"
      );
    }

    const result = await response.json();

    await logFacebookPost(article.id, result.id);

    return NextResponse.json(
      {
        message: "Successfully posted to Facebook",
        postId: result.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}

function buildFacebookMessage(article: Article): string {
  return `${article.title}

${article.summary}

Read the full article: ${process.env.NEXT_PUBLIC_SITE_URL}/articles/${
    article.slug
  }

#TrendingNews #${article.meta_keywords?.[0] || "News"} #${
    article.meta_keywords?.[1] || "TrendingWriter"
  }`;
}

async function logFacebookPost(
  articleId: number,
  facebookPostId: string
): Promise<void> {
  try {
    const supabase = await createClient();

    await supabase.from("facebook_posts").insert({
      article_id: articleId,
      facebook_post_id: facebookPostId,
      posted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log Facebook post:", error);
  }
}
