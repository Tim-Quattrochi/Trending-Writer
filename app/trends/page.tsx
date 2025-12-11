import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import {
  TrendingUp,
  Sparkles,
  ArrowRight,
  Flame,
  BookOpen,
  Zap,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/supabase/server";

interface CategoryWithStats {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean | null;
  articleCount: number;
  latestArticleDate: string | null;
}

interface TrendWithTraffic {
  id: number;
  title: string | null;
  approx_traffic: string | null;
  publication_date: string | null;
}

interface TrendsPageData {
  categories: CategoryWithStats[];
  trendingNow: TrendWithTraffic[];
  totalArticles: number;
  totalTrends: number;
}

const loadTrendsPageData = cache(async (): Promise<TrendsPageData> => {
  const supabase = await createClient();

  // Fetch all active categories
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, description, is_active")
    .eq("is_active", true)
    .order("name");

  // Fetch article counts per category
  const { data: articleCounts } = await supabase
    .from("article_categories")
    .select("category_id, articles(id, created_at)")
    .order("category_id");

  // Fetch recent high-traffic trends
  const { data: trends } = await supabase
    .from("trends")
    .select("id, title, approx_traffic, publication_date")
    .order("publication_date", { ascending: false })
    .limit(6);

  // Fetch total counts for stats
  const { count: totalArticles } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });

  const { count: totalTrends } = await supabase
    .from("trends")
    .select("*", { count: "exact", head: true });

  // Build category stats
  const categoryStats = new Map<
    number,
    { count: number; latestDate: string | null }
  >();

  (articleCounts ?? []).forEach((item) => {
    const catId = item.category_id;
    if (!catId) return;

    const existing = categoryStats.get(catId) || { count: 0, latestDate: null };
    const articles = Array.isArray(item.articles) ? item.articles : [];

    articles.forEach((article) => {
      existing.count++;
      if (
        article.created_at &&
        (!existing.latestDate || article.created_at > existing.latestDate)
      ) {
        existing.latestDate = article.created_at;
      }
    });

    categoryStats.set(catId, existing);
  });

  const categoriesWithStats: CategoryWithStats[] = (categories ?? []).map(
    (cat) => {
      const stats = categoryStats.get(cat.id) || {
        count: 0,
        latestDate: null,
      };
      return {
        ...cat,
        articleCount: stats.count,
        latestArticleDate: stats.latestDate,
      };
    }
  );

  // Sort by article count descending (most popular first)
  categoriesWithStats.sort((a, b) => b.articleCount - a.articleCount);

  return {
    categories: categoriesWithStats,
    trendingNow: (trends ?? []) as TrendWithTraffic[],
    totalArticles: totalArticles ?? 0,
    totalTrends: totalTrends ?? 0,
  };
});

function formatRelativeDate(dateString: string | null): string {
  if (!dateString) return "No articles yet";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 7) return `Updated ${diffDays} days ago`;
  if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
  return `Updated ${Math.floor(diffDays / 30)} months ago`;
}

function parseTraffic(traffic: string | null): number {
  if (!traffic) return 0;
  const match = traffic.match(/(\d+)/);
  if (!match) return 0;
  const num = parseInt(match[1], 10);
  if (traffic.toLowerCase().includes("m")) return num * 1000000;
  if (traffic.toLowerCase().includes("k")) return num * 1000;
  return num;
}

// SEO Metadata
export const metadata: Metadata = {
  title: "Trending Topics & Categories | Daily Oddities",
  description:
    "Explore trending topics and viral stories across categories. From bizarre news to cultural phenomena, discover what's capturing the internet's attention today.",
  keywords: [
    "trending topics",
    "viral stories",
    "oddities",
    "bizarre news",
    "trending now",
    "internet trends",
    "cultural phenomena",
    "weird news",
    "daily trends",
  ],
  openGraph: {
    title: "Trending Topics & Categories | Daily Oddities",
    description:
      "Explore trending topics and viral stories. Discover what's capturing the internet's attention today.",
    type: "website",
    url: "https://trendingwriters.com/trends",
    siteName: "Daily Oddities",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trending Topics & Categories | Daily Oddities",
    description:
      "Explore trending topics and viral stories. Discover what's capturing the internet's attention today.",
  },
  alternates: {
    canonical: "https://trendingwriters.com/trends",
  },
};

// JSON-LD Structured Data
function generateStructuredData(data: TrendsPageData) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Trending Topics & Categories",
    description:
      "Browse all trending topic categories on Daily Oddities. Discover viral stories, bizarre news, and cultural phenomena.",
    url: "https://trendingwriters.com/trends",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: data.categories.length,
      itemListElement: data.categories.map((cat, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CollectionPage",
          name: cat.name,
          description: cat.description,
          url: `https://trendingwriters.com/trends/${cat.slug}`,
        },
      })),
    },
    publisher: {
      "@type": "Organization",
      name: "Daily Oddities",
      url: "https://trendingwriters.com",
    },
  };
}

export default async function TrendsPage() {
  const data = await loadTrendsPageData();
  const { categories, trendingNow, totalArticles, totalTrends } = data;

  const sortedTrends = [...trendingNow].sort(
    (a, b) => parseTraffic(b.approx_traffic) - parseTraffic(a.approx_traffic)
  );

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateStructuredData(data)),
        }}
      />

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-background to-orange-50/30 dark:to-orange-950/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%)]" />
          <div className="container relative mx-auto px-4 py-16 md:py-24">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <TrendingUp className="h-4 w-4" />
                Discover What&apos;s Trending
              </div>
              <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Trending Topics
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground md:text-xl">
                Explore curated stories across every category. From viral
                oddities to cultural phenomena, find what&apos;s capturing the
                internet&apos;s attention.
              </p>

              {/* Quick Stats */}
              <div className="mx-auto flex max-w-md flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 shadow-sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{totalArticles}</span>
                  <span className="text-muted-foreground">Stories</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 shadow-sm">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold">{totalTrends}</span>
                  <span className="text-muted-foreground">Trends Tracked</span>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 shadow-sm">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{categories.length}</span>
                  <span className="text-muted-foreground">Categories</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hot Trends Bar */}
        {sortedTrends.length > 0 && (
          <section className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-orange-700 dark:text-orange-400">
                  <Zap className="h-4 w-4" />
                  Hot Right Now:
                </span>
                <div className="flex flex-wrap gap-2">
                  {sortedTrends.slice(0, 4).map((trend) => (
                    <Badge
                      key={trend.id}
                      variant="secondary"
                      className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium dark:bg-background/80"
                    >
                      {trend.title}
                      {trend.approx_traffic && (
                        <span className="ml-1.5 text-orange-600 dark:text-orange-400">
                          {trend.approx_traffic}
                        </span>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Categories Grid */}
        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="mb-2 font-serif text-2xl font-bold tracking-tight md:text-3xl">
                Browse by Category
              </h2>
              <p className="text-muted-foreground">
                Dive into topics that match your curiosity
              </p>
            </div>
            <Button asChild variant="outline" className="hidden sm:flex">
              <Link href="/articles">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/trends/${category.slug}`}
                className="group"
              >
                <Card className="relative h-full overflow-hidden border-2 border-transparent bg-card/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-card hover:shadow-lg">
                  {/* Popular Badge */}
                  {index < 3 && category.articleCount > 0 && (
                    <Badge className="absolute right-4 top-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Popular
                    </Badge>
                  )}

                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <h3 className="mb-2 text-xl font-semibold tracking-tight">
                    {category.name}
                  </h3>

                  <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                    {category.description ||
                      `Explore ${category.name.toLowerCase()} stories and trending topics.`}
                  </p>

                  <div className="mt-auto flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-primary">
                        {category.articleCount}{" "}
                        {category.articleCount === 1 ? "story" : "stories"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(category.latestArticleDate)}
                    </span>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="mt-6 sm:hidden">
            <Button asChild className="w-full">
              <Link href="/articles">
                View All Stories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-4 font-serif text-2xl font-bold tracking-tight">
                About Daily Oddities Trends
              </h2>
              <div className="prose prose-neutral dark:prose-invert">
                <p className="text-muted-foreground">
                  Daily Oddities tracks the most fascinating trending topics
                  across the internet. We curate stories from viral phenomena,
                  bizarre news, and cultural moments that capture collective
                  attention. Our AI-powered system monitors search trends and
                  social signals to bring you timely, engaging content organized
                  by category.
                </p>
                <p className="text-muted-foreground">
                  Whether you&apos;re interested in the latest oddities, strange
                  discoveries, or simply want to stay informed about what&apos;s
                  trending, our categorized approach helps you find exactly what
                  captures your curiosity.
                </p>
              </div>

              {/* Internal Links for SEO */}
              <div className="mt-8 flex flex-wrap gap-2">
                {categories.slice(0, 5).map((cat) => (
                  <Button
                    key={cat.id}
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                  >
                    <Link href={`/trends/${cat.slug}`}>
                      Explore {cat.name}
                    </Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto max-w-2xl rounded-3xl bg-gradient-to-br from-primary/10 via-orange-50 to-amber-50 p-8 text-center dark:from-primary/20 dark:via-orange-950/20 dark:to-amber-950/20 md:p-12">
              <Flame className="mx-auto mb-4 h-10 w-10 text-orange-500" />
              <h2 className="mb-3 font-serif text-2xl font-bold tracking-tight md:text-3xl">
                Never Miss a Trend
              </h2>
              <p className="mb-6 text-muted-foreground">
                New stories are added daily as trends emerge. Bookmark your
                favorite categories to stay ahead of the curve.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/articles">
                    Browse All Stories
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
