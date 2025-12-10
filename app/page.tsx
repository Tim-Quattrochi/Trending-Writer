import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/supabase/server";
import { Article } from "@/app/api/articles/article.types";
import {
  ARTICLE_WITH_CATEGORIES,
  getArticlePath,
  mapArticles,
} from "@/lib/article-helpers";

async function getPreviewArticles(): Promise<Article[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_WITH_CATEGORIES)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(6);

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

function normalizeKeywords(keywords?: string[] | string | null): string[] {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  return keywords
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

const fallbackGradients = [
  "from-amber-200 via-orange-200 to-rose-200",
  "from-violet-200 via-purple-200 to-fuchsia-200",
  "from-emerald-200 via-teal-200 to-cyan-200",
  "from-sky-200 via-blue-200 to-indigo-200",
];

export default async function LandingPage() {
  const articles = await getPreviewArticles();
  const featuredArticle = articles[0];
  const previewArticles = articles.slice(1, 5);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-12 lg:py-20">
        <div className="container mx-auto">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
            {/* Hero Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary">
                <Zap className="h-3.5 w-3.5" />
                Fresh from Google Trends
              </div>

              <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-5xl lg:leading-[1.1]">
                Strange signals from
                <span className="block text-primary">
                  today&apos;s internet
                </span>
              </h1>

              <p className="max-w-lg text-base text-muted-foreground lg:text-lg">
                Curious stories born from trending rabbit holes. Delightful
                oddities, cultural blips, and the wonderfully weird—delivered
                fresh daily.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/login">
                    Start reading
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/articles">Browse all stories</Link>
                </Button>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>
                    <strong className="text-foreground">
                      {articles.length > 0 ? "35+" : "Daily"}
                    </strong>{" "}
                    fresh dispatches
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  <span>
                    <strong className="text-foreground">Growing</strong>{" "}
                    community
                  </span>
                </div>
              </div>
            </div>

            {/* Featured Article Preview */}
            {featuredArticle && featuredArticle.title && (
              <Card className="group relative overflow-hidden border-border/60 bg-card/90 p-0 shadow-xl">
                <div className="relative aspect-[4/3] overflow-hidden">
                  {featuredArticle.image_url ? (
                    <Image
                      src={featuredArticle.image_url}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white lg:p-6">
                    <Badge className="mb-3 bg-primary/90 text-primary-foreground">
                      Featured
                    </Badge>
                    <h2 className="mb-2 text-lg font-semibold leading-snug lg:text-xl">
                      {featuredArticle.title}
                    </h2>
                    <p className="line-clamp-2 text-sm text-white/80">
                      {featuredArticle.summary ||
                        featuredArticle.meta_description ||
                        featuredArticle.content?.slice(0, 120) + "…"}
                    </p>
                  </div>
                </div>
                <Link
                  href={getArticlePath(featuredArticle)}
                  className="absolute inset-0"
                  aria-label={`Read ${featuredArticle.title}`}
                />
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Preview Articles Grid */}
      {previewArticles.length > 0 && (
        <section className="border-t bg-muted/30 px-4 py-12 lg:py-16">
          <div className="container mx-auto">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                  Latest Dispatches
                </p>
                <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
                  What&apos;s catching eyes today
                </h2>
              </div>
              <Button
                asChild
                variant="ghost"
                className="gap-2 self-start lg:self-auto"
              >
                <Link href="/articles">
                  View all stories
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
              {previewArticles
                .filter((article) => article.title)
                .map((article) => {
                  const keywords = normalizeKeywords(article.meta_keywords);
                  const readingTime = getReadingTime(article.content);
                  const gradient =
                    fallbackGradients[article.id % fallbackGradients.length];

                  return (
                    <Card
                      key={article.id}
                      className="group relative overflow-hidden border-border/60 bg-card/80 transition-shadow hover:shadow-lg"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row lg:p-6">
                        {/* Image */}
                        <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-xl sm:aspect-square sm:w-28 lg:w-32">
                          {article.image_url ? (
                            <Image
                              src={article.image_url}
                              alt={article.title || "Article image"}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div
                              className={`h-full w-full bg-gradient-to-br ${gradient}`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col justify-between gap-3">
                          <div className="space-y-2">
                            <h3 className="line-clamp-2 text-base font-semibold leading-snug tracking-tight lg:text-lg">
                              {article.title}
                            </h3>
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {article.summary ||
                                article.meta_description ||
                                article.content?.slice(0, 100) + "…"}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-2 py-0.5">
                              <Clock className="h-3 w-3" />
                              {readingTime} min
                            </span>
                            {keywords.slice(0, 1).map((kw) => (
                              <Badge
                                key={kw}
                                variant="secondary"
                                className="rounded-full px-2 py-0.5 text-xs"
                              >
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={getArticlePath(article)}
                        className="absolute inset-0"
                        aria-label={`Read ${article.title}`}
                      />
                    </Card>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-4 py-12 lg:py-16">
        <div className="container mx-auto">
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 lg:p-10">
            <div className="relative z-10 mx-auto max-w-2xl text-center">
              <Sparkles className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h2 className="mb-3 text-2xl font-bold tracking-tight lg:text-3xl">
                Join the Daily Oddities community
              </h2>
              <p className="mb-6 text-muted-foreground">
                Get the full experience. Access all dispatches, personalized
                feeds, and be first to catch the latest internet curiosities.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/login">
                    Sign in to continue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link
                    href="https://www.facebook.com/profile.php?id=61584742131394"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow on Facebook
                  </Link>
                </Button>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          </Card>
        </div>
      </section>
    </div>
  );
}
