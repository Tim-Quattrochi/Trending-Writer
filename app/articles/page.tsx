import { Metadata } from "next";
import { Ghost } from "lucide-react";
import ArticleList from "@/components/ArticleList";
import { getAllArticles } from "@/app/dashboard/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DEFAULT_CATEGORY_NAME,
  DEFAULT_CATEGORY_SLUG,
} from "@/lib/article-helpers";

export const metadata: Metadata = {
  title: "Daily Oddities Brief | Articles",
  description:
    "A modern editorial hub for quirky observations sourced from curious corners of the internet and the Daily Oddities community.",
};

export default async function ArticlesPage() {
  const response = await getAllArticles();

  if (response.error) {
    return (
      <div className="container mx-auto py-12 px-4 md:px-6">
        <Alert variant="destructive">
          <AlertTitle>Something went sideways</AlertTitle>
          <AlertDescription>{response.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { data } = response;

  const categoryHighlights = [
    {
      slug: "ai-breakthroughs",
      title: "AI Breakthroughs",
      blurb:
        "Deep dives on the models and policies shaping this week's hype cycle.",
      accent: "from-[#a855f7] to-[#6366f1]",
    },
    {
      slug: "industry-moves",
      title: "Industry Moves",
      blurb:
        "Fundraises, pivots, and boardroom intrigue—packaged for your morning brief.",
      accent: "from-[#34d399] to-[#10b981]",
    },
    {
      slug: DEFAULT_CATEGORY_SLUG ?? "macro",
      title: DEFAULT_CATEGORY_NAME ?? "Macro Signals",
      blurb:
        "Economic swings, regulation chatter, and energy shocks in one scroll.",
      accent: "from-[#f59e0b] to-[#ef4444]",
    },
  ];

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 md:px-6">
        <div className="rounded-3xl border border-dashed bg-muted/40 p-10 text-center">
          <Ghost className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-semibold">No articles yet</h1>
          <p className="mb-6 text-muted-foreground">
            Fresh stories are on the way. Check back soon for quirky takes on
            trending topics.
          </p>
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const totalTopics = Array.from(
    new Set(
      data
        .flatMap((article) =>
          Array.isArray(article.meta_keywords)
            ? article.meta_keywords
            : typeof article.meta_keywords === "string"
            ? article.meta_keywords.split(",").map((kw) => kw.trim())
            : []
        )
        .filter(Boolean)
    )
  ).length;

  return (
    <div className="container mx-auto space-y-12 py-12 px-4 md:px-6">
      <section className="grid gap-8 overflow-hidden rounded-3xl border bg-card/80 px-6 py-10 shadow-lg md:grid-cols-[1.1fr_0.9fr] md:px-10">
        <div className="space-y-6">
          <p className="eyebrow text-primary tracking-[0.3em]">
            Daily Oddities
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Daily Brief — Strange signals from today&apos;s internet
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Stories sparked by emerging conversations across the web, remixed
              with Daily Oddities humour. Expect delightful oddities, cultural
              blips, and curious human behavior wrapped in an accessible
              editorial layout.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex flex-col rounded-2xl border bg-background/60 px-4 py-3">
              <span className="text-3xl font-semibold">{data.length}</span>
              <span className="text-muted-foreground">Articles published</span>
            </div>
            <div className="flex flex-col rounded-2xl border bg-background/60 px-4 py-3">
              <span className="text-3xl font-semibold">{totalTopics}</span>
              <span className="text-muted-foreground">Topics covered</span>
            </div>
            <div className="flex flex-col rounded-2xl border bg-primary/10 px-4 py-3 text-primary">
              <span className="text-3xl font-semibold">Daily</span>
              <span className="text-sm">Oddities drop</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Button asChild variant="default" className="gap-2">
              <Link
                href="https://www.facebook.com/profile.php?id=61584742131394"
                target="_blank"
                rel="noreferrer"
              >
                Like the Facebook page
              </Link>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link
                href={`/trends/${DEFAULT_CATEGORY_SLUG ?? "macro"}`}
                prefetch
              >
                Browse category hubs
              </Link>
            </Button>
          </div>
        </div>
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#1f2937] via-[#0f172a] to-[#020617] text-white">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "radial-gradient(circle at top, rgba(255,255,255,0.25), transparent 55%)",
            }}
          />
          <div className="relative z-10 space-y-4 p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-amber-300">
              Editorial cues
            </p>
            <ul className="space-y-3 text-base">
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Quirky ledes inspired by trend spikes
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Fast-loading layouts tuned for social sharing
              </li>
              <li className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                Accessible typography paired with editorial flourishes
              </li>
            </ul>
            <p className="text-sm text-white/70">
              Stories refresh hourly as new cultural sparks bubble up across the
              internet. Tap into the stream anytime.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted-foreground">Category hubs</p>
            <h2 className="text-2xl font-semibold">
              Follow the threads bubbling across the internet
            </h2>
            <p className="text-muted-foreground">
              Pick a topic and we&apos;ll keep the stories flowing with fresh
              angles and share-ready links.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/trends" prefetch>
              View all hubs
            </Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categoryHighlights.map((highlight) => (
            <Link
              key={highlight.slug}
              href={`/trends/${highlight.slug}`}
              className="group relative overflow-hidden rounded-3xl border"
              prefetch
            >
              <div
                className={`relative h-full space-y-3 bg-gradient-to-br ${highlight.accent} p-6 text-white`}
              >
                <div className="text-sm uppercase tracking-[0.35em] text-white/80">
                  Spotlight
                </div>
                <h3 className="text-2xl font-semibold">{highlight.title}</h3>
                <p className="text-white/80">{highlight.blurb}</p>
                <span className="inline-flex items-center gap-2 text-sm">
                  Dive in
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ArticleList
        articles={data}
        eyebrow="Fresh articles"
        heading="All articles, filtered by what you care about"
        subcopy="Use the category filters to jump into AI, energy, macro, or indie creator storylines and grab a share-ready link when something resonates."
        showCategoryFilters
        defaultCategorySlug={DEFAULT_CATEGORY_SLUG ?? "macro"}
      />
    </div>
  );
}
