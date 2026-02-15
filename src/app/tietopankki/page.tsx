import type { Metadata } from "next";
import { getAllArticles } from "@/lib/tietopankki";
import { ArticleCard } from "@/components/tietopankki/article-card";

export const metadata: Metadata = {
  title: "Tietopankki – pyoratori.com",
  description:
    "Artikkelit ja oppaat polkupyörien huoltoon, korjaukseen ja valintaan.",
};

export default function TietopankkiPage() {
  const articles = getAllArticles();

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Tietopankki</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </main>
  );
}
