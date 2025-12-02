"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { refreshTrendsAction } from "@/app/(dashboard)/actions";

export default function UpdateTrendsButton() {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  async function handleClick() {
    setIsLoading(true);
    try {
      const result = await refreshTrendsAction();

      if (result.error) {
        throw new Error(result.error);
      }

      const data = result.data;

      const getUpdateDescription = (data: any) => {
        const newCount = data.insertedTrendsCount || 0;
        const updatedCount = data.updatedTrendsCount || 0;

        if (data.message && data.skipped) {
          return data.message;
        }

        if (newCount === 0 && updatedCount === 0) {
          return "No new or updated trends found.";
        } else if (newCount > 0 && updatedCount > 0) {
          return `${newCount} new ${
            newCount === 1 ? "trend" : "trends"
          } added and ${updatedCount} ${
            updatedCount === 1 ? "trend" : "trends"
          } updated.`;
        } else if (newCount > 0) {
          return `${newCount} new ${
            newCount === 1 ? "trend" : "trends"
          } added.`;
        } else {
          return `${updatedCount} ${
            updatedCount === 1 ? "trend" : "trends"
          } updated.`;
        }
      };

      toast({
        title: "Trends Updated",
        description: getUpdateDescription(data),
        variant: "default",
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating trends:", error);
      toast({
        title: "Error updating trends",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Updating..." : "Check for new Trends"}
    </Button>
  );
}
