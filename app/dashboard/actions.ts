"use server";

import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { ARTICLE_WITH_CATEGORIES, mapArticles } from "@/lib/article-helpers";
import { Article } from "@/app/api/articles/article.types";
import { Database } from "@/types/types_db";

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
      .select(ARTICLE_WITH_CATEGORIES);

    if (error) {
      console.error("Error while querying for all articles:", error);
      return { error: "Error while querying for all articles." };
    }

    return { data: mapArticles(data) };
  } catch (error) {
    console.error("Unexpected error:", error);
    return { error: "Something went wrong while querying articles." };
  }
}

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

type CategoryArticlesResponse =
  | { category: CategoryRow; data: Article[]; error?: undefined }
  | { error: string; category?: undefined; data?: undefined };

export async function getCategoryArticles(
  categorySlug: string
): Promise<CategoryArticlesResponse> {
  const supabase = await createClient();
  const normalizedSlug = categorySlug?.toLowerCase().trim();

  if (!normalizedSlug) {
    return { error: "Category slug is required" };
  }

  try {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", normalizedSlug)
      .maybeSingle();

    if (categoryError) {
      console.error("Error fetching category:", categoryError);
      return { error: "Error fetching category" };
    }

    if (!category) {
      return { error: "Category not found" };
    }

    const { data: relations, error: relationsError } = await supabase
      .from("article_categories")
      .select("article_id")
      .eq("category_id", category.id);

    if (relationsError) {
      console.error("Error fetching article relations:", relationsError);
      return { error: "Error fetching category articles" };
    }

    const articleIds = Array.from(
      new Set(
        (relations ?? [])
          .map((relation) => relation.article_id)
          .filter((id): id is number => typeof id === "number")
      )
    );

    if (articleIds.length === 0) {
      return { category, data: [] };
    }

    const { data: articles, error: articlesError } = await supabase
      .from("articles")
      .select(ARTICLE_WITH_CATEGORIES)
      .in("id", articleIds)
      .order("created_at", { ascending: false });

    if (articlesError) {
      console.error("Error fetching articles by category:", articlesError);
      return { error: "Error fetching articles" };
    }

    return { category, data: mapArticles(articles) };
  } catch (error) {
    console.error("Unexpected error while fetching category articles:", error);
    return { error: "Unexpected error fetching category articles" };
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
