"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { CategoryPills } from "./category-pills";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import { SearchResults } from "./search-results";
import type { PostingWithImages } from "@/types";

type HomeContentProps = {
  initialPostings: PostingWithImages[];
  initialTotal: number;
  initialQuery: string;
  initialCategoryId: string | null;
  initialPage: number;
  initialFilters: Record<string, string>;
};

export function HomeContent({
  initialPostings,
  initialTotal,
  initialQuery,
  initialCategoryId,
  initialPage,
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
      router.push(qs ? `/?${qs}` : "/");
    },
    [router, initialQuery, initialCategoryId, initialPage, initialFilters]
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

  function handlePageChange(page: number) {
    updateUrl({ sivu: page > 1 ? String(page) : null });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Etsi polkupyöriä ja osia</h1>
        <SearchBar defaultValue={initialQuery} onSearch={handleSearch} />
      </div>

      <CategoryPills
        selectedCategoryId={initialCategoryId}
        onSelect={handleCategorySelect}
      />

      <FilterPanel
        categoryId={initialCategoryId}
        filters={initialFilters}
        onFilterChange={handleFilterChange}
        onCategoryChange={handleCategorySelect}
      />

      <SearchResults
        postings={initialPostings}
        total={initialTotal}
        page={initialPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
