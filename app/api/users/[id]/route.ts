import { type NextRequest } from "next/server";
import { createClient } from "@/supabase/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (user.id !== id) {
    return new Response("Forbidden", { status: 403 });
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting user:", error);
    return new Response(
      JSON.stringify({ error: "Failed to delete user" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  await supabase.auth.signOut();

  return new Response(null, { status: 204 });
}
