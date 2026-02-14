"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import { SearchResults } from "./search-results";
import type { ProductWithImages } from "@/types";

type HomeContentProps = {
  initialProducts: ProductWithImages[];
  initialTotal: number;
  initialQuery: string;
  initialCategoryId: string | null;
  initialPage: number;
  initialSort: string;
  initialFilters: Record<string, string>;
};

export function HomeContent({
  initialProducts,
  initialTotal,
  initialQuery,
  initialCategoryId,
  initialPage,
  initialSort,
  initialFilters,
}: HomeContentProps) {
  const router = useRouter();

  const updateUrl = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams();

      // Start from current state
      const current: Record<string, string> = {};
      if (initialQuery) current.q = initialQuery;
      if (initialCategoryId) current.kategoria = initialCategoryId;
      if (initialPage > 1) current.sivu = String(initialPage);
      if (initialSort && initialSort !== "newest")
        current.jarjestys = initialSort;
      for (const [k, v] of Object.entries(initialFilters)) {
        if (k === "minPrice") current.minHinta = v;
        else if (k === "maxPrice") current.maxHinta = v;
        else if (k === "location") current.sijainti = v;
        else current[k] = v;
      }

      // Apply updates
      for (const [key, value] of Object.entries({ ...current, ...updates })) {
        if (value !== null && value !== "" && value !== undefined) {
          params.set(key, value);
        }
      }

      // Reset page on filter changes unless explicitly set
      if (!("sivu" in updates)) {
        params.delete("sivu");
      }

      const qs = params.toString();
      router.push(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [
      router,
      initialQuery,
      initialCategoryId,
      initialPage,
      initialSort,
      initialFilters,
    ]
  );

  function handleSearch(query: string) {
    updateUrl({ q: query || null });
  }

  function handleCategorySelect(categoryId: string | null) {
    updateUrl({ kategoria: categoryId });
  }

  function handleFilterChange(filters: Record<string, string>) {
    const updates: Record<string, string | null> = {};

    // Clear old filter params
    for (const key of Object.keys(initialFilters)) {
      if (key === "minPrice") updates.minHinta = null;
      else if (key === "maxPrice") updates.maxHinta = null;
      else if (key === "location") updates.sijainti = null;
      else updates[key] = null;
    }

    // Set new filter params
    for (const [key, value] of Object.entries(filters)) {
      if (key === "minPrice") updates.minHinta = value;
      else if (key === "maxPrice") updates.maxHinta = value;
      else if (key === "location") updates.sijainti = value;
      else updates[key] = value;
    }

    updateUrl(updates);
  }

  function handleSortChange(sort: string) {
    updateUrl({
      jarjestys: sort === "newest" ? null : sort,
    });
  }

  function handlePageChange(page: number) {
    updateUrl({ sivu: page > 1 ? String(page) : null });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Etsi polkupyöriä ja osia</h1>
        <SearchBar defaultValue={initialQuery} onSearch={handleSearch} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar */}
        <FilterPanel
          categoryId={initialCategoryId}
          filters={initialFilters}
          onFilterChange={handleFilterChange}
          onCategoryChange={handleCategorySelect}
        />

        {/* Main content */}
        <SearchResults
          products={initialProducts}
          total={initialTotal}
          page={initialPage}
          sort={initialSort}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
}
