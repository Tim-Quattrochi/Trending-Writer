import { NextResponse } from "next/server";
import { editTrends } from "@/app/(dashboard)/actions";
import { createClient } from "@/supabase/server";
import { checkAdminAccess } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { isAdmin, error: authError } = await checkAdminAccess();
  if (!isAdmin) {
    return authError;
  }

  const { id } = await params;
  const body = await req.json();
  const { title, approx_traffic, hash } = body;

  try {
    const { data, error } = await editTrends(
      Number(id),
      title,
      approx_traffic
    );

    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error updating trend:", error);
    return NextResponse.json(
      { error: "Failed to update trend" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { isAdmin, error: authError } = await checkAdminAccess();
  if (!isAdmin) {
    return authError;
  }

  try {
    const supabase = await createClient();

    const { id } = await params;

    const response = await supabase
      .from("trends")
      .delete()
      .eq("id", id);
    const statusCode = response.status;
    const error = response.error;

    if (response.error) {
      return NextResponse.json({ error }, { status: statusCode });
    }

    return NextResponse.json(
      { message: "Trend Deleted." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting trend:", error);
    return NextResponse.json(
      { error: "Failed to delete trend" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // No authentication required for GET requests
  const { id } = params;
  const supabase = await createClient();
  // ...existing code...
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { isAdmin, error: authError } = await checkAdminAccess(
    request
  );
  if (!isAdmin) {
    return authError;
  }

  // ...existing code...
}
