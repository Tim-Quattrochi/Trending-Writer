import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { revalidateTag } from "next/cache";
import { checkAdminAccess } from "@/lib/auth";

/**
 * GET /api/categories
 *
 * Retrieves all categories or filters by optional query parameters
 * Optional query parameters:
 * - name: Filter categories by name (case-insensitive)
 * - sortBy: Sort by name, created_at, or updated_at (default: name)
 * - sortOrder: asc or desc (default: asc)
 * - articleId: If provided, only returns categories associated with this article
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);

  // Parse optional query parameters
  const name = url.searchParams.get("name");
  const sortBy = url.searchParams.get("sortBy") || "name";
  const articleId = url.searchParams.get("articleId");
  const sortOrder =
    url.searchParams.get("sortOrder") === "desc"
      ? { ascending: false }
      : { ascending: true };

  try {
    let categories;

    // If articleId is provided, get categories for this specific article
    if (articleId) {
      const { data, error } = await supabase
        .from("article_categories")
        .select(
          `
          category_id,
          categories:category_id(*)
        `
        )
        .eq("article_id", articleId);

      if (error) {
        console.error("Error fetching article categories:", error);
        return NextResponse.json(
          { message: "Error fetching categories for article" },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            },
          }
        );
      }

      // Extract categories from the join query
      categories = data.map((item) => item.categories);
    } else {
      // Standard category query
      let query = supabase.from("categories").select("*");

      // Apply filters if provided
      if (name) {
        query = query.ilike("name", `%${name}%`);
      }

      // Apply sorting
      if (["name", "created_at", "updated_at"].includes(sortBy)) {
        query = query.order(sortBy, sortOrder);
      } else {
        query = query.order("name", sortOrder);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json(
          { message: "Error fetching categories" },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            },
          }
        );
      }

      categories = data;
    }

    // Return the categories
    return NextResponse.json(
      { items: categories },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  }
}

/**
 * POST /api/categories
 *
 * Creates a new category (admin only)
 */
export async function POST(req: Request) {
  // Check admin access
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  try {
    const supabase = await createClient();
    const body = await req.json();

    // Check if this is an article-category association request
    if (body.articleId && body.categoryId) {
      // Associate article with category
      const { error } = await supabase
        .from("article_categories")
        .insert([
          {
            article_id: body.articleId,
            category_id: body.categoryId,
          },
        ]);

      if (error) {
        // If the error is a duplicate key error, it's not a problem
        if (error.code === "23505") {
          // PostgreSQL unique violation code
          return NextResponse.json(
            { message: "Association already exists" },
            {
              status: 200,
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods":
                  "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers":
                  "Content-Type, Authorization",
              },
            }
          );
        }

        console.error(
          "Error associating article with category:",
          error
        );
        return NextResponse.json(
          {
            message: "Error associating article with category",
            error: error.message,
          },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            },
          }
        );
      }

      revalidateTag("categories");
      revalidateTag("articles");

      return NextResponse.json(
        { message: "Article associated with category successfully" },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Standard category creation
    // Validate request body
    if (!body.name) {
      return NextResponse.json(
        { message: "Category name is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Generate slug if not provided
    const slug =
      body.slug || body.name.toLowerCase().replace(/\s+/g, "-");

    // Create the category
    const { data: category, error } = await supabase
      .from("categories")
      .insert([
        {
          name: body.name,
          description: body.description || null,
          slug,
          is_active:
            body.is_active !== undefined ? body.is_active : true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json(
        { message: "Error creating category", error: error.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Revalidate cache for categories
    revalidateTag("categories");

    return NextResponse.json(
      { message: "Category created successfully", category },
      {
        status: 201,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  }
}

/**
 * PATCH /api/categories
 *
 * Updates a category (admin only)
 */
export async function PATCH(req: Request) {
  // Check admin access
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  try {
    const supabase = await createClient();
    const body = await req.json();

    // Validate request body
    if (!body.id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Prepare update data
    const updateData: Record<string, any> = {};

    // Only include fields that should be updated
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.is_active !== undefined)
      updateData.is_active = body.is_active;

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the category
    const { data: category, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return NextResponse.json(
        { message: "Error updating category", error: error.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Revalidate cache for categories
    revalidateTag("categories");

    return NextResponse.json(
      { message: "Category updated successfully", category },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  }
}

/**
 * DELETE /api/categories
 *
 * Deletes a category (admin only)
 * Can also be used to remove an article-category association
 */
export async function DELETE(req: Request) {
  // Check admin access
  const { isAdmin, error: authError } = await checkAdminAccess(req);
  if (!isAdmin) {
    return authError;
  }

  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const articleId = url.searchParams.get("articleId");
    const categoryId = url.searchParams.get("categoryId");

    // Check if this is a removal of article-category association
    if (articleId && categoryId) {
      const { error } = await supabase
        .from("article_categories")
        .delete()
        .eq("article_id", articleId)
        .eq("category_id", categoryId);

      if (error) {
        console.error(
          "Error removing article-category association:",
          error
        );
        return NextResponse.json(
          {
            message: "Error removing article-category association",
            error: error.message,
          },
          {
            status: 500,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET, POST, PUT, DELETE, OPTIONS",
              "Access-Control-Allow-Headers":
                "Content-Type, Authorization",
            },
          }
        );
      }

      revalidateTag("categories");
      revalidateTag("articles");

      return NextResponse.json(
        {
          message:
            "Article-category association removed successfully",
        },
        {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Standard category deletion
    // Validate request
    if (!id) {
      return NextResponse.json(
        { message: "Category ID is required" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Delete the category
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json(
        { message: "Error deleting category", error: error.message },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods":
              "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers":
              "Content-Type, Authorization",
          },
        }
      );
    }

    // Revalidate cache for categories
    revalidateTag("categories");

    return NextResponse.json(
      { message: "Category deleted successfully" },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type, Authorization",
        },
      }
    );
  }
}

/**
 * OPTIONS /api/categories
 *
 * Handles preflight requests for CORS
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}
