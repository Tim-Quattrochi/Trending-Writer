"use client";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { EditArticle } from "./EditArticle";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";

interface Article {
  id: string;
  title: string;
  content: string;
  trendId: string;
}

interface ArticlesResponse {
  items: Article[];
}

export function ArticleDisplay() {
  const [articles, setArticles] = useState<ArticlesResponse>({
    items: [],
  });
  const [selectedArticle, setSelectedArticle] =
    useState<Article | null>(null);
  const [editingArticle, setEditingArticle] =
    useState<Article | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/articles");
        if (!response.ok) {
          throw new Error("Failed to fetch articles");
        }
        const data: ArticlesResponse = await response.json();
        setArticles(data);
      } catch (error) {
        console.error("Error fetching articles:", error);
      }
    };
    fetchArticles();
  }, []);

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

  //   const handlePostToFacebook = async (article: Article) => {
  //     try {
  //       const response = await fetch(`/api/post-to-facebook`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify(article),
  //       });

  //       if (!response.ok) {
  //         throw new Error("Failed to post to Facebook");
  //       }

  //       toast({
  //         title: "Posted to Facebook",
  //         description:
  //           "Your article has been successfully posted to Facebook.",
  //       });
  //     } catch (error) {
  //       console.error("Error posting to Facebook:", error);
  //       toast({
  //         title: "Error posting to Facebook",
  //         description:
  //           "There was a problem posting your article to Facebook. Please try again.",
  //         variant: "destructive",
  //       });
  //     }
  //   };

  return (
    <Card className="w-full mt-8">
      <CardHeader>
        <CardTitle>Generated Articles</CardTitle>
      </CardHeader>
      <CardContent className="flex">
        <div className="w-1/3 pr-4 border-r">
          <ScrollArea className="h-[500px]">
            {articles.items.map((article: Article) => (
              <Button
                key={article.id}
                variant="ghost"
                className="w-full justify-start mb-2"
                onClick={() => setSelectedArticle(article)}
              >
                {article.title}
              </Button>
            ))}
          </ScrollArea>
        </div>
        <div className="w-2/3 pl-4">
          {selectedArticle ? (
            <ScrollArea className="h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">
                  {selectedArticle.title}
                </h2>
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mr-2"
                    onClick={() => handleEditArticle(selectedArticle)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePostToFacebook(selectedArticle)
                    }
                  >
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>Facebook</title>
                      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
                    </svg>
                    Post to Facebook
                  </Button>
                </div>
              </div>
              <div
                dangerouslySetInnerHTML={{
                  __html: selectedArticle.content,
                }}
              />
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground">
              Select an article to view its content
            </p>
          )}
        </div>
      </CardContent>
      {editingArticle && (
        <EditArticle
          article={editingArticle}
          onSave={handleSaveArticle}
          onCancel={() => setEditingArticle(null)}
        />
      )}
    </Card>
  );
}
