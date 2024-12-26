"use client";

import {
  useState,
  useEffect,
  ChangeEvent,
  ChangeEventHandler,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";
import ArticleCard from "./ArticleCard";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  title: string;
  content: string;
  created_at: string;
  likes?: number;
  comments?: number;
  keyWords?: string;
}

type SortByOptions =
  | "created_at"
  | "meta_keyword"
  | "published_at"
  | "is_published";

export default function ArticleList() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [sortBy, setSortBy] = useState<SortByOptions>("created_at");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/articles?sortBy=${sortBy}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch articles");
        }
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
        toast({
          title: "Error fetching articles",
          description:
            "There was a problem loading the articles. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchArticles();
  }, [sortBy]);

  const handleSelectChange: ChangeEventHandler<HTMLSelectElement> = (
    event
  ) => {
    const { name, value } = event.target;
    setSortBy(value as SortByOptions);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Articles</CardTitle>
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
              <SelectItem value="created_at">Latest</SelectItem>
              <SelectItem value="meta_keyword">By Keyword</SelectItem>
              <SelectItem value="is_published">Published</SelectItem>
              <SelectItem value="published_at">
                Published Date
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles?.items?.map((article: Article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
