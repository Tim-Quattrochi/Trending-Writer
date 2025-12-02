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
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

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
      setError((error as Error).message || "Failed to fetch articles");
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

    window.addEventListener(ARTICLE_GENERATED_EVENT, handleArticleGenerated);

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
      const response = await fetch(`/api/articles/${updatedArticle.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedArticle),
      });

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
        throw new Error(errorData.error || "Failed to post to Facebook");
      }

      const data = await response.json();

      toast({
        title: "Posted to Facebook",
        description: "Your article has been successfully posted to Facebook.",
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">
            Generated Articles
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and preview the latest AI-written pieces from your trends
          </p>
        </div>
        <Button
          onClick={handleViewAllArticles}
          variant="outline"
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View all articles
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar list */}
        <div className="lg:col-span-1">
          <Card className="h-full border-border/60 bg-card/50 backdrop-blur">
            <CardHeader className="border-b bg-muted/40 py-3">
              <CardTitle className="text-sm font-medium tracking-wide text-muted-foreground">
                Recent articles
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[520px]">
                <div className="flex flex-col gap-1 p-2">
                  {articles &&
                    articles.items.map((article) => {
                      const isActive = selectedArticle?.id === article.id;
                      return (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => setSelectedArticle(article)}
                          className={`flex w-full items-start gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-muted/70 ${
                            isActive ? "bg-muted/80 ring-1 ring-primary/30" : ""
                          }`}
                        >
                          <div className="mt-0.5 h-2 w-2 rounded-full bg-primary/60" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {article.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {article.created_at
                                ? new Date(
                                    article.created_at
                                  ).toLocaleDateString()
                                : "Unknown date"}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Main article preview */}
        <div className="lg:col-span-2">
          {selectedArticle && (
            <Card className="h-full border-border/60 bg-card/60 shadow-sm">
              <CardHeader className="space-y-4 border-b bg-gradient-to-r from-background via-background to-muted/40 pb-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-semibold leading-tight">
                      {selectedArticle.title}
                    </CardTitle>
                    {selectedArticle.meta_description && (
                      <p className="text-sm text-muted-foreground max-w-2xl">
                        {selectedArticle.meta_description}
                      </p>
                    )}
                    {typeof selectedArticle.meta_keywords === "string" && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {selectedArticle.meta_keywords
                          .split(",")
                          .map((kw: string) => kw.trim())
                          .filter(Boolean)
                          .map((kw: string) => (
                            <Badge
                              key={kw}
                              variant="secondary"
                              className="text-[11px] font-normal"
                            >
                              {kw}
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <Calendar className="h-3 w-3" />
                      {selectedArticle.created_at
                        ? new Date(
                            selectedArticle.created_at
                          ).toLocaleDateString()
                        : "Unknown date"}
                    </Badge>
                  </div>
                </div>

                {selectedArticle.image_url && (
                  <div className="relative mt-2 overflow-hidden rounded-lg border bg-muted/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedArticle.image_url}
                      alt={selectedArticle.title || "Article image"}
                      className="h-56 w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <ScrollArea className="h-[420px] pr-4">
                  <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none leading-relaxed">
                    {selectedArticle.content
                      .split("\n")
                      .filter((p) => p.trim().length > 0)
                      .map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                  </div>
                </ScrollArea>
                <Separator className="my-2" />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 px-2 text-xs"
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {selectedArticle?.likes || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 px-2 text-xs"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {selectedArticle?.comments || 0}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/articles/${selectedArticle.slug}`)
                      }
                      className="gap-1"
                    >
                      Read full article
                    </Button>
                    {selectedArticle && (
                      <Button
                        onClick={() => handlePostToFacebook(selectedArticle)}
                        variant="default"
                        size="sm"
                        className="gap-1"
                      >
                        <Facebook className="h-4 w-4" />
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
