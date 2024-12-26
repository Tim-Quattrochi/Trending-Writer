"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
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
}

export default function TrendList({ trends }: TrendListProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingTrend, setEditingTrend] = useState<TrendItem | null>(
    null
  );
  const [generatingArticle, setGeneratingArticle] = useState<
    string | null
  >(null);

  const { toast } = useToast();
  const router = useRouter();

  const handleEdit = (trend: TrendItem) => {
    setEditingTrend(trend);
  };

  const handleGenerateArticle = async (trend: TrendItem) => {
    setGeneratingArticle(trend.id);
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          trend_id: trend.id,
          title: trend.title,
          trendData: {
            tend_id: trend.id,
            title: trend.title,
            approxTraffic: trend.approxTraffic,
            pubDate: trend.pubDate,
            newsItems: trend.newsItems,
          },
          image_url: null,
          is_published: false,
        }),
      });

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
      if (!res.ok) throw new Error("Failed to delete trend");
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTrend),
      });
      if (!res.ok) throw new Error("Failed to update trend");
      setTrends(
        trends.map((t) =>
          t.id === editingTrend.id ? editingTrend : t
        )
      );
      setEditingTrend(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating trend:", error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Trending Topics</CardTitle>
        <CardDescription>
          Explore and manage current trending topics.
        </CardDescription>
      </CardHeader>
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
                <TableCell>
                  <Button
                    onClick={() => handleGenerateArticle(trend)}
                    disabled={generatingArticle === trend.id}
                  >
                    {generatingArticle === trend.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Article"
                    )}
                  </Button>
                </TableCell>
                <TableCell>{trend.title}</TableCell>
                <TableCell>{trend.approxTraffic}</TableCell>
                <TableCell>
                  {new Date(trend.pubDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <ul>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {trend.newsItems}
                    </ReactMarkdown>
                  </ul>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(trend)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      //   onClick={() => handleDelete(trend.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog
        open={!!editingTrend}
        onOpenChange={() => setEditingTrend(null)}
      >
        <DialogContent>
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
                <Label htmlFor="approxTraffic" className="text-right">
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
        </DialogContent>
      </Dialog>
    </Card>
  );
}
