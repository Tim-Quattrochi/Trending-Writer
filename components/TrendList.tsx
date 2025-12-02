"use client";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Loader2, FilePlus2, Loader } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendItem } from "@/types/trend";

import { ARTICLE_GENERATED_EVENT } from "./ArticleDisplay";

interface TrendListProps {
  trends: TrendItem[];
  currentPage: number;
  totalItems: number;
  pageSize: number;
}

export default function TrendList({
  trends,
  currentPage,
  totalItems,
  pageSize,
}: TrendListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogMode, setDialogMode] = useState<"edit" | "delete" | null>(null);

  const [editingTrend, setEditingTrend] = useState<TrendItem | null>(null);
  const [generatingArticle, setGeneratingArticle] = useState<string | null>(
    null
  );

  const pathname = usePathname();

  const { toast } = useToast();
  const router = useRouter();

  const totalPages = Math.ceil(totalItems / pageSize);

  const handleDeleteClick = (trend: TrendItem) => {
    setEditingTrend(trend);
    setDialogMode("delete");
  };

  const handleEditClick = (trend: TrendItem) => {
    setEditingTrend(trend);
    setDialogMode("edit");
  };

  const handleGenerateArticle = async (trend: TrendItem) => {
    setGeneratingArticle(trend.id);
    try {
      const response = await fetch(`/api/articles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trend.title,
          trendData: {
            trend_id: trend.id,
            title: trend.title,
            approx_traffic: trend.approx_traffic,
            published_at: trend.publication_date,
            news_items: trend.news_items,
          },
          approxTraffic: trend.approx_traffic,
          pubDate: trend.publication_date,
          newsItems: trend.news_items,
          image_url: trend.stored_image_url || null,
          is_published: false,
        }),
      });

      console.log("Response status:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.log("Error response:", errorData);
        throw new Error(
          errorData.error || errorData.message || "Failed to generate article"
        );
      }

      await response.json();

      toast({
        title: "Article generated successfully",
        description: "The AI-generated article is now available.",
      });

      const event = new CustomEvent(ARTICLE_GENERATED_EVENT);
      window.dispatchEvent(event);
    } catch (error) {
      setError(error);
      console.error("Error generating article:", error);
      toast({
        title: "Error generating article",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setGeneratingArticle(null);
      setLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTrend) return;

    try {
      const res = await fetch(`/api/trends/${editingTrend.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingTrend.title,
          approx_traffic: editingTrend.approx_traffic,
          hash: editingTrend.hash,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update trend");
      }
      router.refresh();
      setEditingTrend(null);
      toast({
        title: "Trend updated",
        description: "The trend has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating trend:", error);
      toast({
        variant: "destructive",
        title: "Error updating trend",
        description: `Failed to update trend: ${
          (error as Error).message || error
        }`,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingTrend) return;

    try {
      const res = await fetch(`/api/trends/${editingTrend.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete trend");
      }
      router.refresh();
      setEditingTrend(null);
      setDialogMode(null);
      toast({
        title: "Trend deleted",
        description: "The trend has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting trend:", error);
      toast({
        variant: "destructive",
        title: "Error deleting trend",
        description: `Failed to delete trend: ${
          (error as Error).message || error
        }`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/50 pb-4">
          <CardTitle>Trending Topics</CardTitle>
          <CardDescription>
            Explore and manage current trending topics
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Traffic</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>News Items</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends?.map((trend) => (
                    <TableRow key={trend.id}>
                      <TableCell className="font-medium">
                        {trend.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trend.approx_traffic}</Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(trend.publication_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <ScrollArea className="h-24 rounded-md border p-2">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {trend.news_items}
                          </ReactMarkdown>
                        </ScrollArea>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(trend)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(trend)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleGenerateArticle(trend)}
                            disabled={generatingArticle === trend.id}
                          >
                            {generatingArticle === trend.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FilePlus2 className="h-4 w-4 mr-1" />
                            )}
                            <span className="hidden sm:inline">Generate</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="space-y-4 p-4 md:hidden">
            {trends?.map((trend) => (
              <div
                key={trend.id}
                className="rounded-2xl border bg-card/90 p-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-semibold">{trend.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(trend.publication_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline">{trend.approx_traffic}</Badge>
                    {trend.hash && (
                      <span className="rounded-full bg-muted/60 px-2 py-1">
                        {trend.hash.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border bg-muted/40 p-3 text-sm">
                    <ScrollArea className="max-h-48">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {trend.news_items}
                      </ReactMarkdown>
                    </ScrollArea>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    onClick={() => handleEditClick(trend)}
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    onClick={() => handleDeleteClick(trend)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    onClick={() => handleGenerateArticle(trend)}
                    disabled={generatingArticle === trend.id}
                  >
                    {generatingArticle === trend.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FilePlus2 className="h-4 w-4" />
                    )}
                    <span className="ml-2">Generate</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PaginationContent className="flex flex-wrap justify-center gap-1">
            <PaginationItem>
              <PaginationPrevious
                href={`${pathname}?page=${Math.max(1, currentPage - 1)}`}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href={`${pathname}?page=${page}`}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }

              if (
                (page === 2 && currentPage > 3) ||
                (page === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <PaginationItem key={page + "-ellipsis"}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}
          </PaginationContent>
          <PaginationContent className="flex justify-center">
            {currentPage < totalPages && (
              <PaginationItem>
                <PaginationNext
                  href={`${pathname}?page=${Math.min(
                    totalPages,
                    currentPage + 1
                  )}`}
                />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      )}

      <Dialog
        open={dialogMode === "edit"}
        onOpenChange={() => setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Trend</DialogTitle>
            <DialogDescription>
              Make changes to the trend information.
            </DialogDescription>
          </DialogHeader>
          {editingTrend && (
            <form onSubmit={handleSaveEdit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={editingTrend.title}
                    onChange={(e) =>
                      setEditingTrend({
                        ...editingTrend,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="traffic">Approximate Traffic</Label>
                  <Input
                    id="traffic"
                    value={editingTrend.approx_traffic}
                    onChange={(e) =>
                      setEditingTrend({
                        ...editingTrend,
                        approx_traffic: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={dialogMode === "delete"}
        onOpenChange={() => setDialogMode(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Trend</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this trend? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
