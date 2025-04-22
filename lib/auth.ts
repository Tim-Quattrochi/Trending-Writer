"use server";

import { createClient } from "@/supabase/server";
import { NextResponse } from "next/server";

export async function checkAdminAccess() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      isAdmin: false,
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const { data: userProfile, error } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (error || !userProfile || !userProfile.is_admin) {
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
