"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { FilterPanel } from "./filter-panel";
import { SearchResults } from "./search-results";
import { SearchBar } from "./search-bar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProductWithImages } from "@/types";
import { SaveSearchAlertButton } from "./save-search-alert-button";

const STORAGE_KEY = "pyoratori-search-filters";

const SORT_OPTIONS = [
  { value: "automatic", label: "Automaattinen" },
  { value: "newest", label: "Uusimmat" },
  { value: "price_asc", label: "Hinta: halvin ensin" },
  { value: "price_desc", label: "Hinta: kallein ensin" },
];

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
  const restoredRef = useRef(false);

  // Restore filters from localStorage on first load with empty URL
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const hasParams =
      initialQuery ||
      initialCategoryId ||
      initialPage > 1 ||
      (initialSort && initialSort !== "automatic") ||
      Object.keys(initialFilters).length > 0;

    if (hasParams) return;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, string>;
      if (Object.keys(saved).length === 0) return;

      const params = new URLSearchParams(saved);
      router.replace(`/haku?${params.toString()}`, { scroll: false });
    } catch {
      // ignore invalid data
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      // Save filter-related params to localStorage
      const toSave: Record<string, string> = {};
      for (const [key, value] of params.entries()) {
        if (key !== "q" && key !== "sivu") {
          toSave[key] = value;
        }
      }
      if (Object.keys(toSave).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      const qs = params.toString();
      router.push(qs ? `/haku?${qs}` : "/haku", { scroll: false });
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

  function handleClearAll() {
    const updates: Record<string, string | null> = { kategoria: null };

    for (const key of Object.keys(initialFilters)) {
      if (key === "minPrice") updates.minHinta = null;
      else if (key === "maxPrice") updates.maxHinta = null;
      else if (key === "location") updates.sijainti = null;
      else updates[key] = null;
    }

    updateUrl(updates);
  }

  function handleSortChange(sort: string) {
    updateUrl({
      jarjestys: sort === "automatic" ? null : sort,
    });
  }

  function handlePageChange(page: number) {
    updateUrl({ sivu: page > 1 ? String(page) : null });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      {/* Sidebar */}
      <div className="space-y-3">
        <FilterPanel
          categoryId={initialCategoryId}
          filters={initialFilters}
          onFilterChange={handleFilterChange}
          onCategoryChange={handleCategorySelect}
          onClearAll={handleClearAll}
        />
        <SaveSearchAlertButton
          categoryId={initialCategoryId}
          query={initialQuery}
          filters={initialFilters}
          productIds={initialProducts.map((p) => p.id)}
        />
      </div>

      {/* Main content */}
      <div className="space-y-6">
        {/* Search + sort bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card rounded-2xl p-4">
          <div className="flex-1">
            <SearchBar defaultValue={initialQuery} onSearch={handleSearch} />
          </div>
          <Select value={initialSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full sm:w-[200px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <SearchResults
          products={initialProducts}
          total={initialTotal}
          page={initialPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
