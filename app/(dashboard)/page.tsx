import TrendList from "@/components/TrendList";
import { TrendItem } from "@/types/trend";
import { ArticleDisplay } from "@/components/ArticleDisplay";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { GetAllTrendsResult } from "./dashboard.types";
import UpdateTrendsButton from "@/components/UpdateTrendsBtn";

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

async function updateTrends(): Promise<
  { newItems: TrendItem[] } | { error: string }
> {
  const res = await fetch(`${baseUrl}/trends`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return { error: errorData.message || "Failed to update trends" };
  }

  const data = await res.json();

  return { newItems: data.newItems };
}

async function getAllTrends(
  page: number = 1,
  pageSize: number = 10
): Promise<GetAllTrendsResult> {
  const res = await fetch(
    `${baseUrl}/trends?page=${page}&pageSize=${pageSize}`,
    {
      next: { tags: ["trends"] },
    }
  );

  if (!res.ok) {
    const errorData = await res.json();
    const errorMessage =
      errorData.message || "Failed to retrieve trends";
    console.error("Error fetching trends:", errorMessage); // Log the error
    return { error: errorMessage };
  }

  const data = await res.json();

  const trends: TrendItem[] = data.items.map((item: TrendItem) => ({
    id: item.id,
    title: item.title,
    approx_traffic: item.approx_traffic,
    publication_date: item.publication_date,
    news_items: item.news_items,
    hash: item.hash,
  }));

  return { trends, total: data.total };
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const { page } = await searchParams;
  const pageIdx = Number(page) || 1;
  const pageSize = 10;

  const result = await getAllTrends(pageIdx, pageSize);

  if ("error" in result) {
    console.error(result.error);
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const { trends, total } = result;
  if (trends.length === 0) {
    await updateTrends();
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTitle>No Trends Found</AlertTitle>
          <AlertDescription>
            There are currently no trending topics. Please check back
            later or click the &quot;Check for new Trends&quot; button
            to manually refresh.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-4">
        <UpdateTrendsButton />
        Trending Topics Dashboard
      </h1>

      <TrendList
        trends={trends}
        currentPage={pageIdx}
        totalItems={total}
        pageSize={pageSize}
      />

      <ArticleDisplay />
    </div>
  );
}
