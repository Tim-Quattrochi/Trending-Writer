import ArticleList from "@/components/ArticleList";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
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

  const article: Article = data.items;

  return article;
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  //https://nextjs.org/docs/messages/sync-dynamic-apis
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const parsedContent = article.content
    ? JSON.parse(article.content)
    : { sections: [] };

  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    `https://trending-writer.vercel.app/articles/${slug}`
  )}`;
  return (
    <Card className="max-w-4xl mx-auto my-8 bg-card text-card-foreground shadow-lg rounded-xl hover:shadow-xl transition-shadow duration-200 ease-in-out">
      <CardHeader className="p-6 border-b border-gray-200">
        <CardTitle className="text-3xl font-bold mb-2 text-primary">
          {article.title}
        </CardTitle>
        <div className="flex items-center text-muted-foreground mb-4">
          <CalendarIcon className="w-4 h-4 mr-2" />
          <span>
            {new Date(article.created_at).toLocaleDateString()}
          </span>
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
        <a
          href={fbShareUrl}
          // onClick={() => window.open(fbShareUrl, "_blank")}
          type="button"
          className="flex items-center  text-primary hover:text-primary-foreground transition-colors duration-200 ease-in-out"
        >
          <FacebookIcon className="w-4 h-4 mr-2" />
          Share on Facebook
        </a>
      </CardContent>
    </Card>
  );
}
