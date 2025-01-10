import { Metadata } from "next";
import ArticleList from "@/components/ArticleList";
import { getAllArticles } from "../(dashboard)/actions";

export const metadata: Metadata = {
  title: "Articles | Trending Writer",
  description:
    "Explore and engage with our AI-generated articles on trending topics.",
};

export default async function ArticlesPage() {
  const response = await getAllArticles();

  if (response.error) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Error:</h1>
        <p>{response.error}</p>
      </div>
    );
  }

  const { data } = response;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Trending Articles</h1>
      <ArticleList articles={data} />
    </div>
  );
}
