"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { getAttributesForCategory, categoryGroups } from "@/lib/categories";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type FilterPanelProps = {
  categoryId: string | null;
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onCategoryChange: (categoryId: string | null) => void;
};

function CheckboxFilterGroup({
  label,
  options,
  selectedValue,
  onChange,
  showSearch = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  showSearch?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  const visibleOptions = expanded
    ? filteredOptions
    : filteredOptions.slice(0, 5);
  const hasMore = filteredOptions.length > 5;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      {showSearch && (
        <Input
          className="text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Kirjoita hakua varten"
        />
      )}
      <div className="space-y-0.5">
        {visibleOptions.map((opt) => (
          <label
            key={opt.value}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
          >
            <Checkbox
              checked={selectedValue === opt.value}
              onCheckedChange={(checked) => {
                onChange(checked ? opt.value : "");
              }}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {hasMore && !search && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-primary hover:underline px-2 py-1"
        >
          {expanded ? "Näytä vähemmän" : "Näytä enemmän"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      )}
    </div>
  );
}

export function FilterPanel({
  categoryId,
  filters,
  onFilterChange,
  onCategoryChange,
}: FilterPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [additionalFiltersOpen, setAdditionalFiltersOpen] = useState(false);

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
      {/* Sähköpyörä / Luomupyörä toggle pills */}
      <div className="flex gap-2">
        {(["Luomupyörä", "Sähköpyörä"] as const).map((pill) => {
          const isElectric = pill === "Sähköpyörä";
          const electricValue = filters.attr_electric;
          const isActive = isElectric
            ? electricValue === "Kyllä"
            : electricValue !== "Kyllä";
          return (
            <button
              key={pill}
              type="button"
              onClick={() =>
                handleChange("attr_electric", isElectric ? "Kyllä" : "")
              }
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {pill}
            </button>
          );
        })}
      </div>

      {/* Kategoria */}
      <CheckboxFilterGroup
        label="Kategoria"
        options={allCategories.map((cat) => ({
          value: cat.id,
          label: cat.name,
        }))}
        selectedValue={categoryId || ""}
        onChange={(value) => onCategoryChange(value || null)}
        showSearch={allCategories.length > 5}
      />

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

      {/* Dynamic attribute filters - collapsed by default */}
      {filterableAttributes.length > 0 && (
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setAdditionalFiltersOpen(!additionalFiltersOpen)}
            className="flex items-center justify-between w-full text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            <span>Tarkemmat suodattimet</span>
            {additionalFiltersOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {additionalFiltersOpen && (
            <div className="mt-4 space-y-5">
              {filterableAttributes.map((attr) => (
                <div key={attr.key}>
                  {attr.type === "select" && attr.options ? (
                    <CheckboxFilterGroup
                      label={attr.label}
                      options={attr.options.map((opt) => ({
                        value: opt,
                        label: opt,
                      }))}
                      selectedValue={filters[`attr_${attr.key}`] || ""}
                      onChange={(value) =>
                        handleChange(`attr_${attr.key}`, value)
                      }
                      showSearch={attr.options.length > 5}
                    />
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">
                        {attr.label}
                      </Label>
                      <Input
                        className="text-sm"
                        type={attr.type === "number" ? "number" : "text"}
                        value={filters[`attr_${attr.key}`] || ""}
                        onChange={(e) =>
                          handleChange(`attr_${attr.key}`, e.target.value)
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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
