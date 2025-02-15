"use client";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function UpdateTrendsButton() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_VERCEL_URL}/trends`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        return (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Something went wrong ...
            </AlertDescription>
          </Alert>
        );
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant="ghost"
      className="font-bold text-md mx-auto text-center"
    >
      {isLoading && <Loader2 className="animate-spin" />}
      {isLoading ? "Loading..." : "Check for new Trends"}
    </Button>
  );
}
