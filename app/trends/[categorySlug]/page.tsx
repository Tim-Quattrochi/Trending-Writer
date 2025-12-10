import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { Sparkles, ArrowLeft, Ghost, Layers } from "lucide-react";

import ArticleList from "@/components/ArticleList";
import { Button } from "@/components/ui/button";
import { getCategoryArticles } from "@/app/dashboard/actions";
import type { Article } from "@/app/api/articles/article.types";
import type { Database } from "@/types/types_db";

interface CategoryPageParams {
  categorySlug: string;
}

interface CategoryPageData {
  category: Database["public"]["Tables"]["categories"]["Row"];
  articles: Article[];
}

const loadCategoryPageData = cache(async (
  categorySlug: string
): Promise<CategoryPageData | null> => {
  const response = await getCategoryArticles(categorySlug);

  if (!response || "error" in response || !response.category) {
    return null;
  }

  return {
    category: response.category,
    articles: response.data ?? [],
  };
});

function summarizeKeywords(articles: Article[]): number {
  const keywords = new Set<string>();

  articles.forEach((article) => {
    const list = Array.isArray(article.meta_keywords)
      ? article.meta_keywords
      : typeof article.meta_keywords === "string"
      ? article.meta_keywords.split(",").map((kw) => kw.trim())
      : [];

    list.filter(Boolean).forEach((keyword) => keywords.add(keyword));
  });

  return keywords.size;
}

export async function generateMetadata({
  params,
}: {
  params: CategoryPageParams;
}): Promise<Metadata> {
  const data = await loadCategoryPageData(params.categorySlug);

  if (!data) {
    return {
      title: "Category not found | Daily Oddities Dispatch",
      description: "Browse all Daily Oddities dispatches across every category.",
    };
  }

  const { category, articles } = data;
  const description =
    category.description?.trim() ||
    `Fresh Daily Oddities dispatches for the ${category.name} beat.`;

  return {
    title: `${category.name} dispatches | Daily Oddities`,
    description: `${description} (${articles.length} stories).`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: CategoryPageParams;
}) {
  const data = await loadCategoryPageData(params.categorySlug);

  if (!data) {
    notFound();
  }

  const { category, articles } = data;
  const articleCount = articles.length;
  const keywordCount = summarizeKeywords(articles);

  return (
    <div className="container mx-auto space-y-12 py-12 px-4 md:px-6">
      <section className="grid gap-8 overflow-hidden rounded-3xl border bg-card/80 px-6 py-10 shadow-lg md:grid-cols-[1.15fr_0.85fr] md:px-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Curated stream
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              {category.name}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {category.description?.trim() ||
                "A focused feed of cultural blips, micro-trends, and whimsical dispatches pulled from today’s Google Trends pulse."}
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex flex-col rounded-2xl border bg-background/60 px-4 py-3">
              <span className="text-3xl font-semibold">{articleCount}</span>
              <span className="text-muted-foreground">Articles in rotation</span>
            </div>
            <div className="flex flex-col rounded-2xl border bg-background/60 px-4 py-3">
              <span className="text-3xl font-semibold">{keywordCount}</span>
              <span className="text-muted-foreground">Recurring motifs</span>
            </div>
            <div className="flex flex-col rounded-2xl border bg-primary/10 px-4 py-3 text-primary">
              <span className="text-3xl font-semibold capitalize">
                {category.slug}
              </span>
              <span className="text-sm">Slug ready</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Button asChild variant="default" className="gap-2">
              <Link href="/articles">
                Browse all dispatches
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                Back to home
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-muted via-background to-card">
          <div className="absolute inset-0" aria-hidden>
            <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.4),_transparent_60%)]" />
          </div>
          <div className="relative z-10 space-y-5 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">
              Category details
            </p>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-3 rounded-2xl border bg-background/80 px-4 py-3">
                <Layers className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-foreground">Canonical slug</p>
                  <p className="text-xs text-muted-foreground">/trends/{category.slug}</p>
                </div>
              </div>
              <div className="rounded-2xl border bg-background/80 px-4 py-3">
                <p className="text-foreground">Dispatch cadence</p>
                <p className="text-xs text-muted-foreground">
                  Updated whenever the RSS workflow produces a {category.name} story.
                </p>
              </div>
              <div className="rounded-2xl border border-dashed bg-background/60 px-4 py-4 text-xs">
                <p className="font-semibold text-foreground">Share link</p>
                <p className="break-all text-muted-foreground">
                  {`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://trendingwriters.com"}/trends/${category.slug}`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {articleCount > 0 ? (
        <ArticleList articles={articles} />
      ) : (
        <div className="rounded-3xl border border-dashed bg-muted/40 p-12 text-center">
          <Ghost className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">No dispatches yet</h2>
          <p className="mt-2 text-muted-foreground">
            The Daily Oddities workflow hasn’t published any stories for this category yet.
          </p>
          <Button asChild className="mt-6">
            <Link href="/articles">Browse all dispatches</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
