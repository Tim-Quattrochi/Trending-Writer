import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;

  const supabase = await createClient();
  const { id } = params;
  const { title, content } = await request.json();

  const { data, error } = await supabase
    .from("articles")
    .update({ title, content })
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function GET(
  req: Request,
  props: { params: Promise<{ slug: string }> }
) {
  const params = await props.params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq(
      "slug",
      "zion-williamson-stats-exploring-the-powerhouses-impact-on-the-nba"
    );

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
