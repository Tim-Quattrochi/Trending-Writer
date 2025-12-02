import { Metadata } from "next";
import { Ghost } from "lucide-react";
import ArticleList from "@/components/ArticleList";
import { getAllArticles } from "@/app/dashboard/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Daily Oddities Dispatch | Articles",
  description:
    "A modern editorial hub for quirky observations sourced from Google Trends and the Daily Oddities community.",
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

  if (!data || data.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 md:px-6">
        <div className="rounded-3xl border border-dashed bg-muted/40 p-10 text-center">
          <Ghost className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <h1 className="text-3xl font-semibold">No dispatches yet</h1>
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
              The Dispatch — Strange signals from today&apos;s internet
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Stories born from Google Trends rabbit holes, remixed with Daily
              Oddities humour. Expect delightful oddities, cultural blips, and
              curious human behavior wrapped in an accessible editorial layout.
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
            <Button asChild variant="outline" className="gap-2">
              <Link href="/">Back home</Link>
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
              Posts regenerate hourly via Google Trends RSS. Tap into the stream
              anytime.
            </p>
          </div>
        </div>
      </section>

      <ArticleList articles={data} />
    </div>
  );
}
