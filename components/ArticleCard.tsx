"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Clock, ArrowRight, TrendingUp } from "lucide-react";
import { Article } from "@/app/api/articles/article.types";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CATEGORY_NAME,
  DEFAULT_CATEGORY_SLUG,
  getArticlePath,
} from "@/lib/article-helpers";

type ArticleCardVariant = "featured" | "grid" | "list";

interface ArticleCardProps {
  article: Article;
  variant?: ArticleCardVariant;
}

const fallbackGradients = [
  "from-amber-100 via-orange-100 to-rose-100",
  "from-violet-100 via-purple-100 to-fuchsia-100",
  "from-emerald-100 via-teal-100 to-cyan-100",
  "from-sky-100 via-blue-100 to-indigo-100",
];

function getReadingTime(content?: string) {
  if (!content) return 2;
  const wordsPerMinute = 190;
  const words = content.split(/\s+/).length;
  return Math.max(2, Math.ceil(words / wordsPerMinute));
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

function normalizeKeywords(keywords?: string[] | string | null) {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords.map(humanizeKeyword);
  return keywords
    .split(",")
    .map((keyword) => humanizeKeyword(keyword.trim()))
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

export default function ArticleCard({
  article,
  variant = "grid",
}: ArticleCardProps) {
  const router = useRouter();
  const readingTime = getReadingTime(article.content);
  const keywords = normalizeKeywords(article.meta_keywords);
  const description =
    article.summary ||
    article.meta_description ||
    (article.content ? article.content.slice(0, 140) + "…" : "");

  const gradient = fallbackGradients[article.id % fallbackGradients.length];
  const href = getArticlePath(article);
  const categorySlug = article.primaryCategorySlug ?? DEFAULT_CATEGORY_SLUG;
  const categoryName = article.primaryCategoryName ?? DEFAULT_CATEGORY_NAME;
  const categoryHref = `/trends/${categorySlug}`;

  const handleCategoryNavigation = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    router.push(categoryHref);
  };

  return (
    <Link
      href={href}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-4"
      aria-label={`Read article: ${article.title}`}
    >
      <Card
        className={cn(
          "group relative overflow-hidden border-border/50 bg-card transition-all hover:shadow-lg",
          variant === "featured"
            ? "grid gap-0 lg:grid-cols-[1.2fr_1fr]"
            : variant === "list"
              ? "flex flex-col gap-0 sm:flex-row"
              : "flex flex-col"
        )}
      >
        {/* Image */}
        <div
          className={cn(
            "relative overflow-hidden bg-muted",
            variant === "list"
              ? "aspect-[16/10] sm:aspect-square sm:w-48 sm:shrink-0"
              : variant === "featured"
                ? "aspect-[16/10] lg:aspect-auto lg:min-h-[380px]"
                : "aspect-[16/10]"
          )}
        >
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              sizes={variant === "featured" ? "(max-width: 1024px) 100vw, 55vw" : variant === "list" ? "(max-width: 640px) 100vw, 192px" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority={variant === "featured"}
            />
          ) : (
            <div className={cn("h-full w-full bg-gradient-to-br", gradient)} />
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            "flex flex-1 flex-col p-5",
            variant === "featured" && "justify-center lg:p-8"
          )}
        >
          {/* Meta row */}
          <div className="mb-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleCategoryNavigation}
              className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
              aria-label={`Browse ${categoryName} stories`}
            >
              <Badge
                variant="outline"
                className="rounded-full border-primary/30 bg-primary/5 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary hover:bg-primary/10"
              >
                {categoryName}
              </Badge>
            </button>
            <span className="text-xs text-muted-foreground">
              {formatDate(article.created_at)}
            </span>
          </div>

          {/* Title */}
          <h3
            className={cn(
              "mb-2 font-semibold leading-snug tracking-tight text-foreground",
              variant === "featured"
                ? "text-xl lg:text-2xl"
                : "line-clamp-2 text-base lg:text-lg"
            )}
          >
            {article.title}
          </h3>

          {/* Description - only on featured and list variants */}
          {(variant === "featured" || variant === "list") && description && (
            <p
              className={cn(
                "mb-4 text-muted-foreground",
                variant === "featured"
                  ? "line-clamp-3 text-base"
                  : "line-clamp-2 text-sm"
              )}
            >
              {description}
            </p>
          )}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {readingTime} min
              </span>
              {article.trend?.approx_traffic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-400">
                  <TrendingUp className="h-3 w-3" />
                  {article.trend.approx_traffic}
                </span>
              )}
              {keywords.slice(0, 1).map((keyword) => (
                <Badge
                  key={keyword}
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                >
                  {keyword}
                </Badge>
              ))}
            </div>

            {variant === "featured" && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                Read story
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
