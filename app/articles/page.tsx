import { Metadata } from "next";
import ArticleList from "@/components/ArticleList";

export const metadata: Metadata = {
  title: "Articles | Trending Writer",
  description:
    "Explore and engage with our AI-generated articles on trending topics.",
};

export default function ArticlesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Trending Articles</h1>
      <ArticleList />
    </div>
  );
}
