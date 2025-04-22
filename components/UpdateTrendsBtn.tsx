"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function UpdateTrendsButton() {
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  async function handleClick() {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VERCEL_URL}/api/trends`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            "Failed to update trends"
        );
      }
      const data = await response.json();

      const getUpdateDescription = (data: any) => {
        const newCount = data.insertedTrendsCount || 0;
        const updatedCount = data.updatedTrendsCount || 0;

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
        variant:
          data.insertedTrendsCount > 0 ? "default" : "destructive",
      });

      router.refresh();
    } catch (error) {
      console.error("Error updating trends:", error);
      toast({
        title: "Error updating trends",
        description:
          error instanceof Error ? error.message : String(error),
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
      <RefreshCw
        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
      />
      {isLoading ? "Updating..." : "Check for new Trends"}
    </Button>
  );
}
