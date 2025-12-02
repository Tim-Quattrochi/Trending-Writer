import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarIcon,
  Clock,
  Facebook,
  Share2,
  Sparkles,
  Tag,
} from "lucide-react";
import { ClientMarkdown } from "@/components/Markdown";
import { Article } from "@/app/api/articles/article.types";
import { Database } from "@/types/types_db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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
      .select("*")
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

    return data as Article;
  } catch (error) {
    console.error("Error fetching article:", error);
    return null;
  }
}

function getReadingTime(content: string) {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  return readingTime;
}

export default async function Page({ params }: { params: { slug: string } }) {
  //https://nextjs.org/docs/messages/sync-dynamic-apis
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const readingTime = getReadingTime(article.content);
  const keywords = Array.isArray(article.meta_keywords)
    ? article.meta_keywords
    : typeof article.meta_keywords === "string"
    ? article.meta_keywords.split(",").map((kw) => kw.trim())
    : [];
  const relatedKeywords = keywords.slice(0, 6);

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://trending-writer.vercel.app"
    }/articles/${slug}`
  )}`;

  return (
    <div className="container mx-auto max-w-6xl space-y-12 py-12 px-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to the dispatch
        </Link>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={fbShareUrl} target="_blank" rel="noreferrer">
            <Share2 className="h-4 w-4" /> Share
          </a>
        </Button>
      </div>

      <section className="overflow-hidden rounded-3xl border bg-card/80 shadow-xl">
        <div className="space-y-6 px-6 py-10 md:px-10">
          <div className="space-y-4">
            <p className="eyebrow text-primary/80">Daily Oddities Dispatch</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {article.title}
            </h1>
            {article.summary && (
              <p className="max-w-3xl text-lg text-muted-foreground">
                {article.summary}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5">
              <CalendarIcon className="h-4 w-4" />
              <time dateTime={article.created_at}>
                {article.created_at
                  ? new Date(article.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : "Recently"}
              </time>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5">
              <Clock className="h-4 w-4" /> {readingTime} min read
            </div>
            {keywords.length > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5">
                <Sparkles className="h-4 w-4" /> Trending oddity
              </div>
            )}
          </div>
        </div>

        {article.image_url ? (
          <div className="relative h-[320px] w-full overflow-hidden border-y bg-muted/40 md:h-[420px]">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition duration-700 hover:scale-[1.03]"
              priority
            />
          </div>
        ) : (
          <div className="h-[260px] w-full border-t bg-gradient-to-r from-[#fde68a] via-[#fb923c] to-[#f97316]" />
        )}
      </section>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(260px,1fr)]">
        <article className="rounded-3xl border bg-card/90 px-6 py-8 shadow-sm md:px-10">
          <div className="article-content prose prose-lg dark:prose-invert max-w-none">
            <ClientMarkdown
              content={article.content}
              className="article-content"
            />
          </div>
        </article>

        <aside className="space-y-6 rounded-3xl border bg-muted/40 p-6">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Dispatch meta
            </h2>
            <div className="rounded-2xl border bg-background/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">About this story</p>
              <p className="mt-2 leading-relaxed">
                Generated from Google Trends RSS and polished for the Daily
                Oddities Facebook community. Share it directly with members or
                remix into a post.
              </p>
            </div>
          </div>

          {relatedKeywords.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Topics
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="rounded-full px-4 py-1 text-xs"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Actions
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild variant="outline" className="gap-2">
                <a href={fbShareUrl} target="_blank" rel="noreferrer">
                  <Facebook className="h-4 w-4" /> Share on Facebook
                </a>
              </Button>
              <Button asChild variant="ghost" className="gap-2">
                <Link href="/articles">Browse more oddities</Link>
              </Button>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-3xl border bg-card/60 p-8 text-center shadow-sm">
        <p className="eyebrow text-primary">Stay curious</p>
        <h2 className="mt-3 text-3xl font-semibold">
          Daily drops for the Daily Oddities crowd
        </h2>
        <p className="mx-auto mt-2 max-w-3xl text-muted-foreground">
          New trends roll in throughout the day. Keep the tab open, refresh the
          dashboard, or subscribe to the Facebook group to never miss a curious
          cultural blip.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild className="gap-2">
            <Link href="/">Return to dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/articles">View all dispatches</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
