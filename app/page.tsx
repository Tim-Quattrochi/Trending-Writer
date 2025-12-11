import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Bookmark, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/supabase/server";
import { Article } from "@/app/api/articles/article.types";
import {
  ARTICLE_WITH_CATEGORIES,
  getArticlePath,
  mapArticles,
  DEFAULT_CATEGORY_NAME,
} from "@/lib/article-helpers";

async function getPreviewArticles(): Promise<Article[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_WITH_CATEGORIES)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(7);

  if (error) {
    console.error("Error fetching preview articles:", error);
    return [];
  }

  return mapArticles(data);
}

function getReadingTime(content?: string) {
  if (!content) return 2;
  const words = content.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / 190));
}

/** Convert slug-style keywords to human-readable labels */
function humanizeKeyword(keyword: string): string {
  return keyword
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\bAi\b/gi, "AI")
    .replace(/\bUi\b/gi, "UI")
    .replace(/\bUx\b/gi, "UX")
    .trim();
}

function normalizeKeywords(keywords?: string[] | string | null): string[] {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords.map(humanizeKeyword);
  return keywords
    .split(",")
    .map((k) => humanizeKeyword(k.trim()))
    .filter(Boolean);
}

function formatDate(dateString?: string | null): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  );

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffHours < 48) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const fallbackGradients = [
  "from-amber-100 via-orange-100 to-rose-100",
  "from-violet-100 via-purple-100 to-fuchsia-100",
  "from-emerald-100 via-teal-100 to-cyan-100",
  "from-sky-100 via-blue-100 to-indigo-100",
];

export default async function LandingPage() {
  const articles = await getPreviewArticles();
  const featuredArticle = articles[0];
  const secondaryFeatured = articles.slice(1, 3);
  const latestArticles = articles.slice(3, 7);

  return (
    <div className="flex flex-col">
      {/* Hero Section - Clean and focused */}
      <section className="px-4 pb-8 pt-6 lg:pb-12 lg:pt-10">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Curious stories from trending rabbit holes
          </p>

          <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight lg:text-6xl">
            Strange signals from
            <span className="block text-primary">today&apos;s internet</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground lg:text-xl">
            Delightful oddities, cultural blips, and the wonderfully
            weird—delivered fresh daily.
          </p>

          <Button asChild size="lg" className="gap-2 text-base">
            <Link href="/articles">
              Browse all stories
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Story - Hero treatment */}
      {featuredArticle && featuredArticle.title && (
        <section className="px-4 pb-12 lg:pb-16">
          <div className="container mx-auto">
            <Card className="group relative overflow-hidden border-0 bg-card shadow-2xl">
              <Link
                href={getArticlePath(featuredArticle)}
                className="block"
                aria-label={`Read featured story: ${featuredArticle.title}`}
              >
                <div className="grid lg:grid-cols-[1.2fr_1fr]">
                  {/* Image */}
                  <div className="relative aspect-[16/10] lg:aspect-auto lg:min-h-[420px]">
                    {featuredArticle.image_url ? (
                      <Image
                        src={featuredArticle.image_url}
                        alt={featuredArticle.title}
                        fill
                        sizes="(max-width: 1024px) 100vw, 55vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                      />
                    ) : (
                      <div
                        className={`h-full w-full bg-gradient-to-br ${
                          fallbackGradients[
                            featuredArticle.id % fallbackGradients.length
                          ]
                        }`}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col justify-center p-6 lg:p-10">
                    <div className="mb-4 flex items-center gap-3">
                      <Badge className="bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(featuredArticle.created_at)}
                      </span>
                    </div>

                    <h2 className="mb-4 text-2xl font-bold leading-tight tracking-tight lg:text-3xl">
                      {featuredArticle.title}
                    </h2>

                    <p className="mb-6 line-clamp-3 text-muted-foreground lg:text-lg">
                      {featuredArticle.summary ||
                        featuredArticle.meta_description ||
                        featuredArticle.content?.slice(0, 180) + "…"}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {getReadingTime(featuredArticle.content)} min read
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium text-primary">
                        Read story
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          </div>
        </section>
      )}

      {/* Secondary Featured Stories */}
      {secondaryFeatured.length > 0 && (
        <section className="border-y bg-muted/40 px-4 py-12 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
                Trending Now
              </h2>
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {secondaryFeatured.map((article) => {
                const keywords = normalizeKeywords(article.meta_keywords);
                const categoryName =
                  article.primaryCategoryName || DEFAULT_CATEGORY_NAME;

                return (
                  <Card
                    key={article.id}
                    className="group relative overflow-hidden border-border/50 bg-card transition-shadow hover:shadow-lg"
                  >
                    <Link
                      href={getArticlePath(article)}
                      className="block"
                      aria-label={`Read: ${article.title}`}
                    >
                      <div className="flex gap-4 p-5">
                        {/* Thumbnail */}
                        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl lg:h-32 lg:w-32">
                          {article.image_url ? (
                            <Image
                              src={article.image_url}
                              alt={article.title || "Article thumbnail"}
                              fill
                              sizes="128px"
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div
                              className={`h-full w-full bg-gradient-to-br ${
                                fallbackGradients[
                                  article.id % fallbackGradients.length
                                ]
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col justify-between py-1">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
                              {categoryName}
                            </p>
                            <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug tracking-tight lg:text-lg">
                              {article.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatDate(article.created_at)}</span>
                            <span>·</span>
                            <span>
                              {getReadingTime(article.content)} min read
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}
      {/* Latest Stories Grid */}
      {latestArticles.length > 0 && (
        <section className="px-4 py-12 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Fresh Reads
                </p>
                <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
                  Latest Stories
                </h2>
              </div>
              <Button asChild variant="outline" className="gap-2 self-start">
                <Link href="/articles">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {latestArticles.map((article) => {
                const keywords = normalizeKeywords(article.meta_keywords);
                const gradient =
                  fallbackGradients[article.id % fallbackGradients.length];

                return (
                  <Card
                    key={article.id}
                    className="group relative flex flex-col overflow-hidden border-border/50 bg-card transition-all hover:shadow-lg"
                  >
                    <Link
                      href={getArticlePath(article)}
                      className="flex flex-1 flex-col"
                      aria-label={`Read: ${article.title}`}
                    >
                      {/* Image */}
                      <div className="relative aspect-[16/10] overflow-hidden">
                        {article.image_url ? (
                          <Image
                            src={article.image_url}
                            alt={article.title || "Article image"}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div
                            className={`h-full w-full bg-gradient-to-br ${gradient}`}
                          />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-4">
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {formatDate(article.created_at)}
                        </p>

                        <h3 className="mb-3 line-clamp-2 flex-1 text-base font-semibold leading-snug tracking-tight">
                          {article.title}
                        </h3>

                        <div className="flex flex-wrap gap-1.5">
                          {keywords.slice(0, 2).map((kw) => (
                            <Badge
                              key={kw}
                              variant="secondary"
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                            >
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Community CTA Section - Clear value proposition */}
      <section className="border-t bg-muted/30 px-4 py-12 lg:py-16">
        <div className="container mx-auto max-w-3xl text-center">
          <Bookmark className="mx-auto mb-4 h-10 w-10 text-primary" />

          <h2 className="mb-3 text-2xl font-bold tracking-tight lg:text-3xl">
            Never miss a story
          </h2>

          <p className="mb-6 text-muted-foreground lg:text-lg">
            Sign in to save your favorite articles, get personalized
            recommendations, and join the Daily Oddities community.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <Link href="/login">
                Create free account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link
                href="https://www.facebook.com/profile.php?id=61584742131394"
                target="_blank"
                rel="noreferrer"
              >
                Follow on Facebook
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Free forever. No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
