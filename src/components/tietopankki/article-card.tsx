import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Article } from "@/lib/tietopankki";

export function ArticleCard({ article }: { article: Article }) {
  const formattedDate = new Date(article.date).toLocaleDateString("fi-FI", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/tietopankki/${article.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <CardTitle>{article.title}</CardTitle>
          <CardDescription>{article.description}</CardDescription>
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </CardHeader>
      </Card>
    </Link>
  );
}
