import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { checkAdminAccess } from "@/lib/auth";
import { updateTrendsFromRSS } from "@/lib/trends-service";

export async function POST(req: Request) {
  // Restore authentication check
  const { isAdmin, error } = await checkAdminAccess(req);

  console.log("isAdmin:", isAdmin);

  if (!isAdmin) {
    return error;
  }

  try {
    const result = await updateTrendsFromRSS();

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Error updating trending news.",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const url = new URL(req.url);

  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 10;
  const start = (page - 1) * limit;
  const end = start + limit - 1;

  try {
    const {
      data: trends,
      error,
      count,
    } = await supabase
      .from("trends")
      .select("*", { count: "exact" })
      .range(start, end)
      .order("publication_date", { ascending: false });

    if (error) {
      console.error("Error fetching trends:", error);
      throw new Error("Error fetching trends");
    }

    return NextResponse.json(
      {
        items: trends,
        total: count,
        page,
        limit,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        message: "Error fetching trends.",
      },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      }
    );
  }
}
