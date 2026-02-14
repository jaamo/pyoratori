import { Suspense } from "react";
import { searchPostings } from "@/server/queries/postings";
import { HomeContent } from "@/components/search/home-content";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  const categoryId =
    typeof params.kategoria === "string" ? params.kategoria : undefined;
  const page =
    typeof params.sivu === "string" ? parseInt(params.sivu, 10) : 1;
  const minPrice =
    typeof params.minHinta === "string"
      ? parseFloat(params.minHinta)
      : undefined;
  const maxPrice =
    typeof params.maxHinta === "string"
      ? parseFloat(params.maxHinta)
      : undefined;
  const location =
    typeof params.sijainti === "string" ? params.sijainti : undefined;

  // Extract attribute filters (prefixed with attr_)
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("attr_") && typeof value === "string" && value) {
      attributes[key.replace("attr_", "")] = value;
    }
  }

  const { postings, total } = await searchPostings({
    query,
    categoryId,
    page,
    minPrice,
    maxPrice,
    location,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <Suspense>
        <HomeContent
          initialPostings={postings}
          initialTotal={total}
          initialQuery={query || ""}
          initialCategoryId={categoryId || null}
          initialPage={page}
          initialFilters={{
            ...(minPrice !== undefined ? { minPrice: String(minPrice) } : {}),
            ...(maxPrice !== undefined ? { maxPrice: String(maxPrice) } : {}),
            ...(location ? { location } : {}),
            ...Object.fromEntries(
              Object.entries(attributes).map(([k, v]) => [`attr_${k}`, v])
            ),
          }}
        />
      </Suspense>
    </div>
  );
}
