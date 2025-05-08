import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createClient } from "@/supabase/server";
import { checkAdminAccess } from "@/lib/auth";

export async function POST(req: Request) {
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  const supabase = await createClient();
  const body = await req.json();
  const { trend_id, title, trendData, is_published, content } = body;
  try {
    const { error } = await supabase.from("articles").insert([
      {
        trend_id,
        title,
        trend_data: trendData,
        image_url: null,
        is_published,
        content,
      },
    ]);

    if (error) {
      console.error("Error generating article:", error);
      return NextResponse.json(
        { error: "Failed to generate article" },
        { status: 500 }
      );
    }

    revalidateTag("trends");
    revalidateTag("articles");

    return NextResponse.json({
      message: "Article generated successfully",
    });
  } catch (error) {
    console.error("Error generating article:", error);
    return NextResponse.json(
      { error: "Failed to generate article" },
      { status: 500 }
    );
  }
}
