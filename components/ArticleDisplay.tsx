"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import Link from "next/link";
import {
  Loader2,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Facebook,
} from "lucide-react";
import { EditArticle } from "./EditArticle";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";
import { Article } from "@/app/api/articles/article.types";

export const ARTICLE_GENERATED_EVENT = "article-generated";

interface ArticlesResponse {
  items: Article[];
}

export function ArticleDisplay() {
  const [articles, setArticles] = useState<ArticlesResponse>({
    items: [],
  });
  const [selectedArticle, setSelectedArticle] =
    useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] =
    useState<Article | null>(null);

  const { toast } = useToast();

  const router = useRouter();

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/articles");
      if (!res.ok) {
        throw new Error("Failed to fetch articles");
      }
      const data: ArticlesResponse = await res.json();
      setArticles(data);
      if (data.items.length > 0 && !selectedArticle) {
        setSelectedArticle(data.items[0]);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      setError(
        (error as Error).message || "Failed to fetch articles"
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch articles",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();

    const handleArticleGenerated = () => {
      fetchArticles();
    };

    window.addEventListener(
      ARTICLE_GENERATED_EVENT,
      handleArticleGenerated
    );

    return () => {
      window.removeEventListener(
        ARTICLE_GENERATED_EVENT,
        handleArticleGenerated
      );
    };
  }, []);

  const handleViewAllArticles = () => {
    router.push("/articles");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={fetchArticles} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const handleSaveArticle = async (updatedArticle: Article) => {
    try {
      const response = await fetch(
        `/api/articles/${updatedArticle.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedArticle),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update article");
      }

      setArticles({
        items: articles.items.map((a) =>
          a.id === updatedArticle.id ? updatedArticle : a
        ),
      });

      setSelectedArticle(updatedArticle);
      setEditingArticle(null);
      toast({
        title: "Article updated",
        description: "Your changes have been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating article:", error);
      toast({
        title: "Error updating article",
        description:
          "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditArticle = (article: Article) => {
    setEditingArticle(article);
  };

  /**
   * @Tim-Quattrochi WIP - Post to Facebook
   */

  const handlePostToFacebook = async (article: Article) => {
    try {
      const response = await fetch(`/api/post-to-facebook`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(article),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to post to Facebook"
        );
      }

      const data = await response.json();

      toast({
        title: "Posted to Facebook",
        description:
          "Your article has been successfully posted to Facebook.",
      });
    } catch (error) {
      console.error("Error posting to Facebook:", error);
      toast({
        title: "Error posting to Facebook",
        description: `${
          error instanceof Error
            ? error.message
            : "There was a problem posting your article to Facebook. Please try again."
        }`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generated Articles</h2>
        <Button onClick={handleViewAllArticles} variant="outline">
          <Eye className="h-4 w-4 mr-2" />
          View All Articles
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card className="h-full border-none shadow-md">
            <CardHeader className="bg-muted/50">
              <CardTitle className="text-lg">
                Recent Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                <div className="space-y-1 p-2">
                  {articles &&
                    articles.items.map((article) => (
                      <Button
                        key={article.id}
                        variant={
                          selectedArticle?.id === article.id
                            ? "default"
                            : "ghost"
                        }
                        className="w-full justify-start text-left h-auto py-3"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <div className="truncate">
                          <p className="font-medium truncate">
                            {article.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(
                              article.created_at || ""
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </Button>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedArticle && (
            <Card className="h-full border-none shadow-md">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedArticle.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(
                        selectedArticle.created_at
                          ? new Date(
                              selectedArticle.created_at
                            ).toLocaleDateString()
                          : "Unknown Date"
                      ).toLocaleDateString()}
                    </Badge>
                    {selectedArticle.meta_keywords && (
                      <Badge variant="secondary">
                        {selectedArticle.meta_keywords}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[450px] pr-4">
                  <div className="prose dark:prose-invert max-w-none">
                    {selectedArticle.content
                      .split("\n")
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                </ScrollArea>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {selectedArticle?.likes || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {selectedArticle?.comments || 0}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `/articles/${selectedArticle.slug}`
                        )
                      }
                    >
                      Read Full Article
                    </Button>
                    {selectedArticle && (
                      <Button
                        onClick={() =>
                          handlePostToFacebook(selectedArticle)
                        }
                        variant="default"
                        size="sm"
                      >
                        <Facebook className="h-4 w-4 mr-2" />
                        Share on Facebook
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
