import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  // Handle session update first
  const response = await updateSession(request);

  // Setup CORS headers
  const origin = request.headers.get("origin") || "";
  const allowedOrigins = [
    "http://localhost:3000",
    "https://kzmkhpkkti91htegmxrh.lite.vusercontent.net",
    "https://www.trendingwriters.com",
    "https://v0-ai-blog-qfzvje7t8-timquattrochis-projects.vercel.app/",
  ];

  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Apply CORS headers to the response
  if (isAllowedOrigin) {
    // Clone the response to modify headers
    const corsResponse = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Add CORS headers
    corsResponse.headers.set("Access-Control-Allow-Origin", origin);
    corsResponse.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    corsResponse.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    corsResponse.headers.set(
      "Access-Control-Allow-Credentials",
      "true"
    );

    // For preflight requests
    if (request.method === "OPTIONS") {
      return corsResponse;
    }

    // Copy headers from session response to CORS response
    response.headers.forEach((value, key) => {
      corsResponse.headers.set(key, value);
    });

    return corsResponse;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    // Add API routes pattern specifically for CORS
    "/api/:path*",
  ],
};
