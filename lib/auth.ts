"use server";

import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function checkAdminAccess(req?: Request) {
  // If the request is provided, check if it's for a public or trusted API endpoint
  if (req) {
    const url = new URL(req.url);

    // List of API endpoints that should be public (no login required)
    const publicEndpoints = [
      "/api/articles", // GET articles endpoint
      "/api/trends", // GET trends endpoint
      "/api/categories", // GET categories endpoint
    ];

    // Allow unauthenticated GET access to specific public endpoints
    if (
      req.method === "GET" &&
      publicEndpoints.some((endpoint) => url.pathname.startsWith(endpoint))
    ) {
      return { isAdmin: true, user: null, error: null };
    }

    // Allow trusted automation (e.g. n8n) to call POST /api/articles
    const n8nApiKey = req.headers.get("x-n8n-api-key");
    if (
      req.method === "POST" &&
      url.pathname.startsWith("/api/articles") &&
      n8nApiKey &&
      process.env.N8N_ARTICLE_API_KEY &&
      n8nApiKey === process.env.N8N_ARTICLE_API_KEY
    ) {
      console.log(n8nApiKey);
      return { isAdmin: true, user: null, error: null };
    }
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      isAdmin: false,
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: userProfile, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  // Convert snake_case from database to camelCase for application use
  const isAdmin = userProfile?.is_admin ?? false;

  if (error || !userProfile || !isAdmin) {
    return {
      isAdmin: false,
      user,
      error: NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { isAdmin: true, user, error: null };
}
