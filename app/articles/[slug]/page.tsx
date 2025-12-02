import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ClientMarkdown } from "@/components/Markdown";
import { Article } from "@/app/api/articles/article.types";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarIcon, Clock, Facebook, Tag } from "lucide-react";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateStaticParams() {
  try {
    const res = await fetch(`${baseUrl}/articles`);
    if (!res.ok) {
      console.error("Failed to fetch article slugs: ", res.status);
      return [];
    }
    const data = await res.json();
    const articles: Article[] = data.items;

    return articles.map((article) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}

async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${baseUrl}/articles?slug=${slug}`);

    if (!res.ok) {
      console.error("Error fetching article: ", res.status);
      return null;
    }

    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      console.error("Article not found");
      return null;
    }

    const article: Article = data.items[0];

    return article;
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

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://trending-writer.vercel.app"
    }/articles/${slug}`
  )}`;

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link
          href="/articles"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all articles
        </Link>

        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={fbShareUrl} target="_blank" rel="noopener noreferrer">
            <Facebook className="h-4 w-4" />
            Share
          </a>
        </Button>
      </div>

      <article className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-sm">
        <header className="border-b bg-gradient-to-b from-muted/80 via-background to-background px-5 py-7 md:px-8 md:py-9">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                Daily Oddities
              </p>
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                {article.title}
              </h1>
            </div>

            {article.summary && (
              <p className="max-w-2xl text-sm md:text-base text-muted-foreground">
                {article.summary}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1">
                <CalendarIcon className="h-3 w-3" />
                <time dateTime={article.created_at}>
                  {article.created_at &&
                    new Date(article.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                </time>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border bg-background/60 px-3 py-1">
                <Clock className="h-3 w-3" />
                <span>{readingTime} min read</span>
              </div>
              {article.meta_keywords && article.meta_keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {article.meta_keywords.slice(0, 3).map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="rounded-full text-[11px] font-normal"
                    >
                      {keyword}
                    </Badge>
                  ))}
                  {article.meta_keywords.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">
                      +{article.meta_keywords.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {article.image_url && (
          <div className="relative h-[260px] w-full overflow-hidden border-b bg-muted/40 md:h-[360px]">
            <Image
              src={article.image_url || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
              priority
            />
          </div>
        )}

        <div className="px-5 py-7 md:px-8 md:py-8">
          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none leading-relaxed">
            <ClientMarkdown
              content={article.content}
              className="article-content"
            />
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            {article.meta_keywords && article.meta_keywords.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  <Tag className="mr-2 h-3 w-3" />
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.meta_keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="rounded-full px-3 py-1 text-xs font-normal"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 md:justify-end">
              <Button asChild variant="outline" size="sm" className="gap-2">
                <a href={fbShareUrl} target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-4 w-4" />
                  Share on Facebook
                </a>
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
