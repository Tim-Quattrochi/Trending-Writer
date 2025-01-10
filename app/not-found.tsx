import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
        <div className="flex justify-center">
          <AlertCircle
            className="h-16 w-16 text-red-500"
            aria-hidden="true"
          />
        </div>
        <h1
          className="text-3xl font-bold text-gray-900"
          id="not-found-title"
        >
          Page Not Found
        </h1>
        <p
          className="text-lg text-gray-600"
          id="not-found-description"
        >
          We&apos;re sorry, but we couldn&apos;t find the page
          you&apos;re looking for. It might have been removed, had its
          name changed, or is temporarily unavailable.
        </p>
        <div className="mt-6">
          <Link href="/" passHref>
            <Button
              className="inline-flex items-center"
              variant="default"
            >
              <ArrowLeft
                className="mr-2 h-4 w-4"
                aria-hidden="true"
              />
              Return to Homepage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
