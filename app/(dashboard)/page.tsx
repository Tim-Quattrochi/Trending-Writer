import TrendList from "@/components/TrendList";
import { TrendItem } from "@/types/trend";
import { ArticleDisplay } from "@/components/ArticleDisplay";

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

async function getAllTrends(): Promise<TrendItem[]> {
  const res = await fetch(`${baseUrl}/trends`);

  const data = await res.json();

  const trends: TrendItem[] = data.items.map((item: any) => {
    return {
      id: item.id,
      title: item.title,
      approxTraffic: item.approx_traffic,
      pubDate: item.publication_date,
      newsItems: item.news_items,
      hash: item.hash,
    };
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to fetch trends");
  }

  return trends;
}

export default async function Dashboard() {
  const trendsData = await getAllTrends();

  console.log("trendsData", trendsData);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">
        {" "}
        Trending Topics Dashboard
      </h1>
      {trendsData ? (
        <>
          <TrendList trends={trendsData} />
          <ArticleDisplay />
        </>
      ) : (
        <div>Error: {trendsData.error}</div>
      )}
    </div>
  );
}
