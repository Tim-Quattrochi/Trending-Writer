import ArticleList from "@/components/ArticleList";
import { notFound } from "next/navigation";
import { ClientMarkdown } from "@/components/Markdown";
import { Article } from "@/app/api/articles/article.types";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  CalendarIcon,
  Clock,
  Facebook,
  Share2,
  Tag,
  ArrowLeft,
} from "lucide-react";

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
    <div className="container max-w-4xl mx-auto py-8 px-4 md:px-0">
      <Link
        href="/articles"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to all articles
      </Link>

      <article className="bg-card rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-8 md:px-10 md:py-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-2" />
              <time dateTime={article.created_at}>
                {article.created_at &&
                  new Date(article.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </time>
            </div>

            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              <span>{readingTime} min read</span>
            </div>
          </div>
        </div>

        {article.image_url && (
          <div className="w-full h-[300px] md:h-[400px] relative">
            <Image
              src={article.image_url || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        <div className="px-6 py-8 md:px-10">
          {article.summary && (
            <div className="mb-8">
              <p className="text-lg font-medium italic text-muted-foreground border-l-4 border-primary/50 pl-4 py-2">
                {article.summary}
              </p>
            </div>
          )}

          <ClientMarkdown
            content={article.content}
            className="article-content"
          />

          <Separator className="my-8" />
          <div className="flex flex-col gap-6">
            {article.meta_keywords && article.meta_keywords.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {article.meta_keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mx-auto flex max-w-2xl items-center justify-between">
              {/* <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Share this article
                </span>
              </div> */}

              <div className="flex gap-2">
                <a
                  href={fbShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Share on Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
