"use client";

import {
  useState,
  useEffect,
  ChangeEvent,
  ChangeEventHandler,
} from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Calendar,
  ThumbsUp,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import ArticleCard from "./ArticleCard";

import { useToast } from "@/hooks/use-toast";

interface Article {
  id: number;
  title: string;
  content: string;
  created_at: string;
  likes?: number;
  comments?: number;
  keyWords?: string;
  slug: string;
}

type SortByOptions =
  | "created_at"
  | "meta_keyword"
  | "published_at"
  | "is_published";

export default function ArticleList({
  articles,
}: {
  articles: Article[];
}) {
  const [sortBy, setSortBy] = useState<SortByOptions>("created_at");

  const { toast } = useToast();

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === "created_at") {
      return (
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      );
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">All Articles</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Sort by:
          </span>
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as SortByOptions)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Date Created</SelectItem>
              <SelectItem value="meta_keyword">Keyword</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedArticles.map((article) => (
          <Card
            key={article.id}
            className="flex flex-col h-full border-none shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader className="bg-muted/50 pb-4">
              <CardTitle className="line-clamp-2">
                {article.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Calendar className="h-3 w-3" />
                  {new Date(article.created_at).toLocaleDateString()}
                </Badge>
                {article.keyWords && (
                  <Badge variant="secondary">
                    {article.keyWords}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground line-clamp-4">
                {article.content.substring(0, 200)}...
              </p>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <span className="flex items-center text-sm text-muted-foreground">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {article.likes || 0}
                </span>
                <span className="flex items-center text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {article.comments || 0}
                </span>
              </div>
              <Link href={`/articles/${article.slug}`} passHref>
                <Button variant="ghost" size="sm" className="gap-1">
                  Read <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
