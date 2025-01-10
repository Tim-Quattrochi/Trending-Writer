"use client";
import { useState, useEffect, JSX } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Edit,
  Trash2,
  Loader2,
  FilePlus2,
  Loader,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import { revalidateTag } from "next/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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
  const [error, setError] = useState(null);
  const [dialogMode, setDialogMode] = useState<
    "edit" | "delete" | null
  >(null);

  const [editingTrend, setEditingTrend] = useState<TrendItem | null>(
    null
  );
  const [generatingArticle, setGeneratingArticle] = useState<
    string | null
  >(null);

  const pathname = usePathname();

  const { toast } = useToast();
  const router = useRouter();

  const totalPages = Math.ceil(totalItems / pageSize);

  const handlePageChange = (newPage: number) => {
    router.push(`${pathname}?page=${newPage}`);
  };
  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 2;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(currentPage - halfVisible, 1);
    const endPage = Math.min(
      startPage + maxVisiblePages - 1,
      totalPages
    );

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href={`${pathname}?page=${i}`}
            isActive={i === currentPage}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return items;
  };

  const openEditDialog = (trend: TrendItem) => {
    setEditingTrend(trend);
    setDialogMode("edit");
  };

  const openDeleteDialog = (trend: TrendItem) => {
    setEditingTrend(trend);
    setDialogMode("delete");
  };

  const handleDeleteConfirm = async () => {
    if (!editingTrend) return;
    try {
      const res = await fetch(`/api/trends/${editingTrend.id}`, {
        method: "DELETE",
      });
      if (res.status !== 200)
        throw new Error("Failed to delete trend");
      router.refresh();
      toast({
        title: "Trend deleted",
        description: "The trend has been deleted successfully.",
      });
      setEditingTrend(null);
      setDialogMode(null);
    } catch (error) {
      console.error("Error deleting trend:", error);
      toast({
        variant: "destructive",
        title: "Error deleting trend",
        description: `Failed to delete trend: ${
          (error as Error).message
        }`,
      });
    }
  };

  const handleEdit = (trend: TrendItem) => {
    setEditingTrend(trend);
  };

  const handleGenerateArticle = async (trend: TrendItem) => {
    setGeneratingArticle(trend.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VERCEL_URL}/articles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trend_id: trend.id,
            title: trend.title,
            trendData: {
              trend_id: trend.id,
              title: trend.title,
              approx_traffic: trend.approx_traffic,
              published_at: trend.publication_date,
              news_items: trend.news_items,
            },
            image_url: null,
            is_published: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate article");
      }

      const data = await response.json();

      toast({
        title: "Article generated successfully",
        description: "The AI-generated article is now available.",
      });
    } catch (error) {
      console.error("Error generating article:", error);
      toast({
        title: "Error generating article",
        description: `Failed to generate article: ${
          error.message || error
        }`,
      });
    } finally {
      setGeneratingArticle(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/trends/${id}`, {
        method: "DELETE",
      });
      if (res.status !== 200)
        throw new Error("Failed to delete trend");
      // setTrends(trends.filter((t) => t.id !== id));
      router.refresh();
    } catch (error) {
      console.error("Error deleting trend:", error);
    }
  };

  const handleSaveEdit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
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
  console.log(trends && trends);
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trending Topics</CardTitle>
        <CardDescription>
          Explore and manage current trending topics.
        </CardDescription>
      </CardHeader>
      <Separator />

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>id</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Traffic</TableHead>
              <TableHead>Date</TableHead>

              <TableHead>News Items</TableHead>
              <TableHead>Generate Article</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trends.map((trend) => (
              <TableRow key={trend.id}>
                <TableCell>{trend.id}</TableCell>
                <TableCell>{trend.title}</TableCell>
                <TableCell>{trend.approx_traffic}</TableCell>
                <TableCell>
                  {" "}
                  {new Date(
                    trend.publication_date
                  ).toLocaleDateString()}
                </TableCell>

                <TableCell>
                  <ul>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {trend.news_items}
                    </ReactMarkdown>
                  </ul>
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(trend)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openDeleteDialog(trend)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleGenerateArticle(trend)}
                      disabled={generatingArticle === trend.id}
                      variant="outline"
                      size="icon"
                    >
                      {generatingArticle === trend.id ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <FilePlus2
                          stroke="green"
                          className="ml-2 h-4 w-4"
                        />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={`${pathname}?page=${currentPage - 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1)
                      handlePageChange(currentPage - 1);
                  }}
                />
              </PaginationItem>
              {renderPaginationItems()}
              <PaginationItem>
                <PaginationNext
                  href={`${pathname}?page=${currentPage + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages)
                      handlePageChange(currentPage + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </CardContent>
      <Dialog
        open={!!dialogMode}
        onOpenChange={() => setDialogMode(null)}
      >
        <DialogContent>
          {dialogMode === "edit" && (
            <>
              <DialogHeader>
                <DialogTitle>Edit Trend</DialogTitle>
                <DialogDescription>
                  Make changes to the trend here. Click save when
                  you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveEdit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title
                    </Label>
                    <Input
                      id="title"
                      value={editingTrend?.title}
                      onChange={(e) =>
                        setEditingTrend({
                          ...editingTrend!,
                          title: e.target.value,
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label
                      htmlFor="approxTraffic"
                      className="text-right"
                    >
                      Traffic
                    </Label>
                    <Input
                      id="approxTraffic"
                      value={editingTrend?.approx_traffic}
                      onChange={(e) =>
                        setEditingTrend({
                          ...editingTrend!,
                          approx_traffic: e.target.value,
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </>
          )}
          {dialogMode === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the trend titled
                  &quot;
                  {editingTrend?.title}&quot;? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                >
                  Confirm Delete
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
