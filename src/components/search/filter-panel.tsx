"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAttributesForCategory, categoryGroups } from "@/lib/categories";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

type FilterPanelProps = {
  categoryId: string | null;
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onCategoryChange: (categoryId: string | null) => void;
};

export function FilterPanel({
  categoryId,
  filters,
  onFilterChange,
  onCategoryChange,
}: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const categoryAttributes = categoryId
    ? getAttributesForCategory(categoryId)
    : [];
  const filterableAttributes = categoryAttributes.filter(
    (a) => a.filterable && a.key !== "electric"
  );

  function handleChange(key: string, value: string) {
    const newFilters = { ...filters };
    if (value) {
      newFilters[key] = value;
    } else {
      delete newFilters[key];
    }
    onFilterChange(newFilters);
  }

  function clearFilters() {
    onFilterChange({});
    onCategoryChange(null);
  }

  const hasActiveFilters =
    Object.keys(filters).length > 0 || categoryId !== null;

  const allCategories = categoryGroups.flatMap((g) => g.categories);

  const sidebarContent = (
    <div className="space-y-5">
      {/* Sähköpyörä */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Sähköpyörä</Label>
        <div className="flex flex-col gap-1">
          {["Kyllä", "Ei"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                handleChange(
                  "attr_electric",
                  filters.attr_electric === opt ? "" : opt
                )
              }
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
                filters.attr_electric === opt
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`h-3.5 w-3.5 rounded-full border-2 flex items-center justify-center ${
                  filters.attr_electric === opt
                    ? "border-primary"
                    : "border-muted-foreground/40"
                }`}
              >
                {filters.attr_electric === opt && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Kategoria */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Kategoria</Label>
        <Select
          value={categoryId || "__all__"}
          onValueChange={(v) => onCategoryChange(v === "__all__" ? null : v)}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Kaikki" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Kaikki</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hinta */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Hinta</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="text-sm"
            value={filters.minPrice || ""}
            onChange={(e) => handleChange("minPrice", e.target.value)}
            placeholder="Min €"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            className="text-sm"
            value={filters.maxPrice || ""}
            onChange={(e) => handleChange("maxPrice", e.target.value)}
            placeholder="Max €"
          />
        </div>
      </div>

      {/* Sijainti */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Sijainti</Label>
        <Input
          className="text-sm"
          value={filters.location || ""}
          onChange={(e) => handleChange("location", e.target.value)}
          placeholder="Esim. Helsinki"
        />
      </div>

      {/* Dynamic attribute filters */}
      {filterableAttributes.length > 0 && (
        <>
          <div className="border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Tarkemmat suodattimet
            </p>
          </div>
          {filterableAttributes.map((attr) => (
            <div key={attr.key} className="space-y-2">
              <Label className="text-sm font-semibold">{attr.label}</Label>
              {attr.type === "select" && attr.options ? (
                <Select
                  value={filters[`attr_${attr.key}`] || "__all__"}
                  onValueChange={(v) =>
                    handleChange(
                      `attr_${attr.key}`,
                      v === "__all__" ? "" : v
                    )
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Kaikki" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Kaikki</SelectItem>
                    {attr.options.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  className="text-sm"
                  type={attr.type === "number" ? "number" : "text"}
                  value={filters[`attr_${attr.key}`] || ""}
                  onChange={(e) =>
                    handleChange(`attr_${attr.key}`, e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </>
      )}

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="w-full"
        >
          <X className="mr-1 h-3 w-3" />
          Tyhjennä suodattimet
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{sidebarContent}</div>

      {/* Mobile toggle + collapsible */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Suodattimet
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {Object.keys(filters).length + (categoryId ? 1 : 0)}
            </span>
          )}
        </Button>
        {mobileOpen && (
          <div className="mt-3 rounded-lg border p-4">{sidebarContent}</div>
        )}
      </div>
    </>
  );
}
