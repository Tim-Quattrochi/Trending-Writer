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
    const { data, error } = await supabase
      .from("articles")
      .select("*");

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
