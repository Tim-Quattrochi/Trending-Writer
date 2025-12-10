import { notFound, redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Article } from "@/app/api/articles/article.types";
import { Database } from "@/types/types_db";
import {
  ARTICLE_WITH_CATEGORIES,
  getArticlePath,
  mapArticle,
} from "@/lib/article-helpers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY; cannot fetch article content."
    );
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

export async function generateStaticParams() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from("articles")
      .select("slug")
      .not("slug", "is", null);

    if (error || !data) {
      console.error("Failed to fetch article slugs from Supabase:", error);
      return [];
    }

    return data
      .filter((article) => article.slug)
      .map((article) => ({ slug: article.slug as string }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return null;
    }

    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLE_WITH_CATEGORIES)
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error fetching article from Supabase:", error);
      return null;
    }

    if (!data) {
      console.error("Article not found");
      return null;
    }

    return mapArticle(data);
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  //https://nextjs.org/docs/messages/sync-dynamic-apis
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }
  // Legacy /articles/{slug} URLs now redirect to the canonical category-aware path.
  redirect(getArticlePath(article));
}
