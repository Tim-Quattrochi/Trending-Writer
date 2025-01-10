import ArticleList from "@/components/ArticleList";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import {
  CalendarIcon,
  HashIcon,
  FacebookIcon,
  TagIcon,
} from "lucide-react";
import { Article } from "@/app/api/articles/article.types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateStaticParams() {
  try {
    console.log("Fetching articles from:", baseUrl);
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

  const article: Article[] = data.items.filter(
    (article: Article) => article.slug === slug
  );

  return article[0];
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    `https://trending-writer.vercel.app/articles/${slug}`
  )}`;
  return (
    <Card className="max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle className="text-3xl font-bold mb-2">
          {article.title}
        </CardTitle>
        <div className="flex items-center text-muted-foreground mb-4">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>{article.created_at}</span>
        </div>
      </CardHeader>
      <CardContent>
        {article.image_url && (
          <div className="mb-6">
            <Image
              src={article.image_url}
              alt={article.title}
              width={800}
              height={400}
              className="rounded-lg object-cover w-full"
            />
          </div>
        )}
        <div className="prose max-w-none dark:prose-invert mb-6">
          {article.content}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <TagIcon className="w-4 h-4 text-muted-foreground" />
          {article?.meta_keywords?.map((keyword, index) => (
            <Badge key={index} variant="secondary">
              {keyword}
            </Badge>
          ))}
        </div>
        {/* <Button
          variant="link"
          onClick={() => window.open(fbShareUrl, "_blank")}
          type="button"
          className="flex items-center"
        >
          <FacebookIcon className="w-4 h-4 mr-2" />
          Share on Facebook
        </Button> */}
      </CardContent>
    </Card>
  );
}
