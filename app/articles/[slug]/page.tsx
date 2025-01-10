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
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { CalendarDaysIcon, HashIcon } from "lucide-react";
import { Article } from "@/app/api/articles/article.types";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function generateStaticParams() {
  const res = await fetch(`${baseUrl}/articles`);
  const data = await res.json();
  const articles: Article[] = data.items;

  const slugs = articles.map((article) => ({
    slug: article.slug,
  }));

  return slugs;
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
    (article) => article.slug === slug
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
  console.log(article);
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1>{article.title}</h1>
      <Card className="overflow-hidden shadow-lg">
        {article.image_url && (
          <div className="relative w-full h-64 md:h-96">
            <Image
              src={article.image_url}
              alt={article.title}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
        )}
        <CardContent className="p-6">
          <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <CalendarDaysIcon className="w-4 h-4 mr-2" />
            <time dateTime={article.created_at}>
              {article.created_at}
            </time>
          </div>
          <div className="prose max-w-none"> {article.content}</div>
        </CardContent>
        <CardFooter className="bg-gray-50 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <HashIcon className="w-4 h-4 text-gray-500" />
            {article.meta_keywords?.map((keyword, index) => (
              <Badge key={index} variant="secondary">
                {keyword}
              </Badge>
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
