import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Define allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://kzmkhpkkti91htegmxrh.lite.vusercontent.net",
  "https://kzmnj2sokxyquh2srxhd.lite.vusercontent.net",
  "https://www.trendingwriters.com",
  "https://v0-ai-blog-qfzvje7t8-timquattrochis-projects.vercel.app/",
];

// Define CORS options to be applied to responses
const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function middleware(request: NextRequest) {
  // Get the origin from request headers
  const origin = request.headers.get("origin") || "";
  const isAllowedOrigin = allowedOrigins.includes(origin);

  // Handle preflight requests (OPTIONS)
  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      ...(isAllowedOrigin
        ? { "Access-Control-Allow-Origin": origin }
        : {}),
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle authentication with Supabase
  const authResponse = await updateSession(request);

  // For normal requests, add CORS headers to the auth response
  if (isAllowedOrigin) {
    authResponse.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Add the rest of the CORS headers
  Object.entries(corsOptions).forEach(([key, value]) => {
    authResponse.headers.set(key, value);
  });

  return authResponse;
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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)/articles",
    // Add API routes pattern specifically for CORS
    "/api/:path*",
  ],
};
