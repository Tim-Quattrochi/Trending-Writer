import { notFound } from "next/navigation";

interface Article {
  id: number;
  title: string;
  content: string;
  slug: string;
  created_at: string;
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

console.log(baseUrl);

export async function generateStaticParams() {
  const res = await fetch(`${baseUrl}/articles`);
  const articles: Article[] = await res.json();

  console.log("articles", articles);
  return articles.items.map((article) => ({
    slug: article.slug,
  }));
}

async function getArticle(slug: string): Promise<Article | null> {
  const res = await fetch(`${baseUrl}/articles?slug=${slug}`);
  const articles: Article[] = await res.json();

  if (articles.length === 0) {
    console.error("Error fetching article: Article not found");
    return null;
  }

  return articles[0];
}

export default async function Page({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  return (
    <div>
      <h1>{article.title}</h1>
      <div
        dangerouslySetInnerHTML={{ __html: article.content }}
      ></div>
    </div>
  );
}
