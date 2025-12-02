import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { Article } from "@/app/api/articles/article.types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type ArticleCardVariant = "featured" | "grid" | "list";

interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
}

const fallbackGradients = [
  "from-[#fef3c7] via-[#fde68a] to-[#fbbf24]",
  "from-[#fdf2f8] via-[#fbcfe8] to-[#f472b6]",
  "from-[#ecfccb] via-[#d9f99d] to-[#bef264]",
  "from-[#cffafe] via-[#a5f3fc] to-[#67e8f9]",
];

function getReadingTime(content?: string) {
  if (!content) return 2;
  const wordsPerMinute = 190;
  const words = content.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / wordsPerMinute));
}

function normalizeKeywords(keywords?: string[] | string | null) {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  return keywords
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

export default function ArticleCard({
  article,
  variant = "grid",
}: ArticleCardProps) {
  const readingTime = getReadingTime(article.content);
  const keywords = normalizeKeywords(article.meta_keywords);
  const truncatedContent = article.content
    ? `${article.content.slice(0, 180)}${
        article.content.length > 180 ? "…" : ""
      }`
    : undefined;
  const description =
    article.summary ||
    article.meta_description ||
    truncatedContent ||
    "Freshly generated from the Daily Oddities feed.";

  const gradient = fallbackGradients[article.id % fallbackGradients.length];
  const href = `/articles/${article.slug ?? article.id}`;

  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4"
      aria-label={`Read article ${article.title}`}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-border/70 bg-card/80 backdrop-blur transition shadow-sm hover:shadow-lg",
          variant === "featured"
            ? "grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-10"
            : variant === "list"
            ? "flex flex-col gap-4 p-6 sm:flex-row"
            : "flex flex-col gap-5 p-6"
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border border-border/60 bg-muted/40",
            variant === "list" ? "sm:max-w-[280px] sm:flex-shrink-0" : "",
            variant === "featured" && "lg:min-h-[360px]"
          )}
        >
          {article.image_url ? (
            <Image
              src={!article.image_url ? "/unnamed.jpg" : article.image_url}
              alt={article.title}
              width={900}
              height={600}
              className={cn(
                "w-full object-cover transition duration-500 group-hover:scale-[1.03]",
                variant === "featured" ? "h-full min-h-[320px]" : "h-48"
              )}
              priority={variant === "featured"}
            />
          ) : (
            <div
              className={cn(
                "w-full bg-gradient-to-br",
                gradient,
                variant === "featured" ? "h-full min-h-[320px]" : "h-48"
              )}
            />
          )}
          <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow">
            <Calendar className="h-3.5 w-3.5" />
            <time dateTime={article.created_at || undefined}>
              {article.created_at
                ? new Date(article.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Recently"}
            </time>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="eyebrow text-primary/70">Daily Oddities Dispatch</p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {article.title}
            </h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              {readingTime} min read
            </span>
            {keywords.slice(0, 2).map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {keyword}
              </Badge>
            ))}
            {keywords.length > 2 && (
              <span className="text-xs text-muted-foreground">
                +{keywords.length - 2} more
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm font-medium text-primary">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Open story
            </span>
            <div className="h-px flex-1 bg-border/70" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
