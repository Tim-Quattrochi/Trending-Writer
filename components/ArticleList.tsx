"use client";

import { useEffect, useMemo, useState } from "react";
import { Filter, LayoutGrid, Rows, Search } from "lucide-react";
import ArticleCard from "./ArticleCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Article } from "@/app/api/articles/article.types";
import {
  DEFAULT_CATEGORY_NAME,
  DEFAULT_CATEGORY_SLUG,
} from "@/lib/article-helpers";

type SortByOptions = "created_at" | "alphabetical" | "published_at";

interface ArticleListProps {
  articles: Article[];
  eyebrow?: string;
  heading?: string;
  subcopy?: string;
  showCategoryFilters?: boolean;
  defaultCategorySlug?: string;
}

interface CategorySummary {
  slug: string;
  name: string;
  count: number;
}

function getArticleCategorySlugs(article: Article): string[] {
  if (Array.isArray(article.categories) && article.categories.length > 0) {
    return article.categories
      .map((category) => category?.slug)
      .filter((slug): slug is string => Boolean(slug));
  }

  if (article.primaryCategorySlug) {
    return [article.primaryCategorySlug];
  }

  return [];
}

function getArticleCategoryMeta(article: Article) {
  if (Array.isArray(article.categories) && article.categories.length > 0) {
    return article.categories
      .filter((category): category is NonNullable<typeof category> => Boolean(category?.slug))
      .map((category) => ({
        slug: category.slug!,
        name: category.name || DEFAULT_CATEGORY_NAME,
      }));
  }

  if (article.primaryCategorySlug) {
    return [
      {
        slug: article.primaryCategorySlug,
        name: article.primaryCategoryName ?? DEFAULT_CATEGORY_NAME,
      },
    ];
  }

  return [];
}

export default function ArticleList({
  articles,
  eyebrow = "Fresh dispatches",
  heading = "Latest from Daily Oddities",
  subcopy = "Curated oddities sourced from Google Trends RSS and shaped into playful essays for the Daily Oddities community.",
  showCategoryFilters = false,
  defaultCategorySlug,
}: ArticleListProps) {
  const [sortBy, setSortBy] = useState<SortByOptions>("created_at");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(
    defaultCategorySlug ?? "all"
  );

  const normalizedArticles = useMemo(() => articles ?? [], [articles]);

  useEffect(() => {
    if (defaultCategorySlug) {
      setActiveCategory(defaultCategorySlug);
    } else {
      setActiveCategory((previous) => (previous === "all" ? previous : "all"));
    }
  }, [defaultCategorySlug]);

  const sortedArticles = useMemo(() => {
    return [...normalizedArticles]
      .filter((article) => {
        const matchesSearch = article.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        if (!matchesSearch) {
          return false;
        }

        if (activeCategory === "all") {
          return true;
        }

        const categorySlugs = getArticleCategorySlugs(article);
        return categorySlugs.includes(activeCategory);
      })
      .sort((a, b) => {
        if (sortBy === "alphabetical") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "published_at" && a.published_at && b.published_at) {
          return (
            new Date(b.published_at).getTime() -
            new Date(a.published_at).getTime()
          );
        }
        return (
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime()
        );
        });
      }, [normalizedArticles, searchTerm, sortBy, activeCategory]);

  const featured = sortedArticles[0];
  const remainder = sortedArticles.slice(1);

  const keywordSet = new Set<string>();
  normalizedArticles.forEach((article) => {
    const keywords = Array.isArray(article.meta_keywords)
      ? article.meta_keywords
      : typeof article.meta_keywords === "string"
      ? article.meta_keywords.split(",").map((kw) => kw.trim())
      : [];
    keywords.filter(Boolean).forEach((kw) => keywordSet.add(kw));
  });

  const categoryOptions = useMemo<CategorySummary[]>(() => {
    const counts = new Map<string, CategorySummary>();

    normalizedArticles.forEach((article) => {
      const meta = getArticleCategoryMeta(article);

      meta.forEach((category) => {
        if (!counts.has(category.slug)) {
          counts.set(category.slug, {
            slug: category.slug,
            name: category.name,
            count: 0,
          });
        }

        const record = counts.get(category.slug);
        if (record) {
          record.count += 1;
        }
      });
    });

    return Array.from(counts.values()).sort((a, b) => b.count - a.count);
  }, [normalizedArticles]);

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="eyebrow text-primary">{eyebrow}</p>
          <h2 className="text-3xl font-semibold tracking-tight">{heading}</h2>
          {subcopy && (
            <p className="max-w-2xl text-muted-foreground">{subcopy}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Badge variant="outline" className="rounded-full px-4 py-1">
            {normalizedArticles.length} articles
          </Badge>
          <Badge variant="secondary" className="rounded-full px-4 py-1">
            {keywordSet.size} quirky topics
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card/80 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative w-full min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search titles"
              className="pl-9"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search articles"
            />
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortByOptions)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Newest first</SelectItem>
                <SelectItem value="alphabetical">Alphabetical</SelectItem>
                <SelectItem value="published_at">Publication date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end"
          role="group"
          aria-label="Toggle layout"
        >
          <Button
            type="button"
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            className="gap-2 flex-1 min-w-[140px] sm:min-w-0 sm:flex-none"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button
            type="button"
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            className="gap-2 flex-1 min-w-[140px] sm:min-w-0 sm:flex-none"
            onClick={() => setViewMode("list")}
          >
            <Rows className="h-4 w-4" /> List
          </Button>
        </div>
      </div>

      {showCategoryFilters && categoryOptions.length > 0 && (
        <div className="space-y-2 rounded-2xl border bg-muted/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Filter by category
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={activeCategory === "all" ? "default" : "ghost"}
              onClick={() => setActiveCategory("all")}
            >
              All dispatches
            </Button>
            {categoryOptions.slice(0, 6).map((category) => (
              <Button
                key={category.slug}
                type="button"
                size="sm"
                variant={
                  activeCategory === category.slug ? "default" : "ghost"
                }
                className="gap-1"
                onClick={() => setActiveCategory(category.slug)}
              >
                {category.name}
                <span className="text-muted-foreground">({category.count})</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {featured && <ArticleCard article={featured} variant="featured" />}

      {remainder.length > 0 ? (
        <div
          className={cn(
            "gap-6",
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
              : "flex flex-col"
          )}
        >
          {remainder.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              variant={viewMode === "grid" ? "grid" : "list"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed bg-muted/40 px-6 py-16 text-center">
          <p className="text-lg font-medium text-foreground">
            No additional stories match that filter.
          </p>
          <p className="text-muted-foreground">
            Try clearing the search or selecting another sort option.
          </p>
        </div>
      )}
    </section>
  );
}
