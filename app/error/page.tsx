"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-2xl font-bold text-destructive">
            <AlertCircle className="w-8 h-8 mr-2" />
            Oops! Something went wrong
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            We apologize for the inconvenience. An unexpected error
            has occurred.
          </p>
          {error.message && (
            <p
              className="mt-4 p-4 bg-muted rounded-md text-sm"
              role="alert"
            >
              Error details: {error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button
            variant="outline"
            onClick={() => reset()}
            className="flex items-center"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try again
          </Button>
          <Button
            variant="default"
            onClick={() => router.push("/")}
            className="flex items-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Return home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
