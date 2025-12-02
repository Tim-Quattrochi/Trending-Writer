"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
export async function deleteTrend(trendId: number) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("trends")
      .delete()
      .eq("id", trendId);

    if (error) {
      console.error("Error while deleting trend:", error);
      return { error: "Error while deleting trend." };
    }
    revalidateTag("trends");
    revalidatePath("/trends");

    return { message: "Trend successfully deleted." };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "Something went wrong while deleting trend." };
  }
}
