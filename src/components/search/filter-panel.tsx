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
import {
  Select as SelectGroup,
  SelectGroup as SGroup,
  SelectLabel,
} from "@/components/ui/select";
import { getAttributesForCategory, categoryGroups } from "@/lib/categories";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";
import type { AttributeDefinition } from "@/types";

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
  const [showFilters, setShowFilters] = useState(false);

  const categoryAttributes = categoryId
    ? getAttributesForCategory(categoryId)
    : [];
  const filterableAttributes = categoryAttributes.filter(
    (a) => a.filterable
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
  }

  // Build subcategory options for the selected parent category
  const subcategories: { id: string; name: string }[] = [];
  if (categoryId) {
    for (const group of categoryGroups) {
      for (const cat of group.categories) {
        if (cat.id === categoryId && cat.children) {
          for (const child of cat.children) {
            subcategories.push({ id: child.id, name: child.name });
          }
        }
      }
    }
  }

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Suodattimet
          {hasActiveFilters && (
            <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
              {Object.keys(filters).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-3 w-3" />
            Tyhjennä
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {/* Subcategory filter */}
            {subcategories.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Alakategoria</Label>
                <Select
                  value={categoryId || ""}
                  onValueChange={(v) => onCategoryChange(v || null)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Kaikki" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Price range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Hinta min (&euro;)</Label>
              <Input
                type="number"
                className="h-9 text-xs"
                value={filters.minPrice || ""}
                onChange={(e) => handleChange("minPrice", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hinta max (&euro;)</Label>
              <Input
                type="number"
                className="h-9 text-xs"
                value={filters.maxPrice || ""}
                onChange={(e) => handleChange("maxPrice", e.target.value)}
                placeholder="10000"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-xs">Sijainti</Label>
              <Input
                className="h-9 text-xs"
                value={filters.location || ""}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Esim. Helsinki"
              />
            </div>

            {/* Dynamic attribute filters */}
            {filterableAttributes.map((attr) => (
              <div key={attr.key} className="space-y-1.5">
                <Label className="text-xs">{attr.label}</Label>
                {attr.type === "select" && attr.options ? (
                  <Select
                    value={filters[`attr_${attr.key}`] || ""}
                    onValueChange={(v) =>
                      handleChange(`attr_${attr.key}`, v === "__all__" ? "" : v)
                    }
                  >
                    <SelectTrigger className="h-9 text-xs">
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
                    className="h-9 text-xs"
                    type={attr.type === "number" ? "number" : "text"}
                    value={filters[`attr_${attr.key}`] || ""}
                    onChange={(e) =>
                      handleChange(`attr_${attr.key}`, e.target.value)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
