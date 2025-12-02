"use server";

import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";

export async function editTrends(
  trendId: number,
  title: string,
  approx_traffic: string
) {
  const supabase = await createClient();

  if (!title || !approx_traffic) {
    return { error: "All fields are required." };
  }

  try {
    const { data, error } = await supabase
      .from("trends")
      .update({ title, approx_traffic })
      .eq("id", trendId)
      .select();

    if (error) {
      console.error("Error while updating trend:", error);
      return { error: "Error while updating trend." };
    }
    revalidateTag("trends");

    return { data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "Something went wrong while updating trend." };
  }
}

export async function getAllArticles() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase.from("articles").select("*");

    if (error) {
      console.error("Error while querying for all articles:", error);
      return { error: "Error while querying for all articles." };
    }

    return { data };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "Something went wrong while querying articles." };
  }
}

import { updateTrendsFromRSS } from "@/lib/trends-service";

export async function refreshTrendsAction() {
  const supabase = await createClient();

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  console.log("Action Auth User:", user);
  if (!user) {
    return { error: "Unauthorized" };
  }

  const { data: userProfile, error: profileError } = await supabase
    .from("users")
    .select("is_admin, role")
    .eq("id", user.id)
    .single();

  console.log("Action User Profile Error:", profileError);
  console.log("Action User Profile:", userProfile);

  const isAdmin = userProfile?.is_admin || userProfile?.role === "admin";

  if (!isAdmin) {
    return { error: "Admin access required" };
  }

  try {
    const result = await updateTrendsFromRSS();
    return { data: result };
  } catch (error) {
    console.error("Error refreshing trends:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to update trends",
    };
  }
}
