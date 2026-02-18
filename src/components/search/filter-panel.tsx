"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAttributesForCategory, categoryGroups } from "@/lib/categories";
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

type FilterPanelProps = {
  categoryId: string | null;
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
  onCategoryChange: (categoryId: string | null) => void;
};

function CollapsibleFilter({
  label,
  defaultOpen = false,
  children,
}: {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-1"
      >
        <span className="text-sm font-semibold">{label}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function CheckboxFilterGroup({
  label,
  options,
  selectedValue,
  onChange,
  showSearch = false,
  multiSelect = false,
}: {
  label: string;
  options: { value: string; label: string }[];
  selectedValue: string;
  onChange: (value: string) => void;
  showSearch?: boolean;
  multiSelect?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");

  const selectedValues = multiSelect && selectedValue
    ? selectedValue.split(",")
    : [];

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
              checked={multiSelect
                ? selectedValues.includes(opt.value)
                : selectedValue === opt.value}
              onCheckedChange={(checked) => {
                if (multiSelect) {
                  const next = checked
                    ? [...selectedValues, opt.value]
                    : selectedValues.filter((v) => v !== opt.value);
                  onChange(next.join(","));
                } else {
                  onChange(checked ? opt.value : "");
                }
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
    <div className="space-y-6">
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
      <div>
        <span className="text-sm font-semibold">Kategoria</span>
        <Select
          value={categoryId || "all"}
          onValueChange={(value) => onCategoryChange(value === "all" ? null : value)}
        >
          <SelectTrigger className="mt-2 w-full text-sm">
            <SelectValue placeholder="Kaikki kategoriat" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Kaikki kategoriat</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hinta */}
      <CollapsibleFilter label="Hinta" defaultOpen>
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
      </CollapsibleFilter>

      {/* Sijainti */}
      <CollapsibleFilter label="Postinumero" defaultOpen>
        <Input
          className="text-sm"
          inputMode="numeric"
          maxLength={5}
          value={filters.location || ""}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 5);
            handleChange("location", val);
          }}
          placeholder="Esim. 00100"
        />
      </CollapsibleFilter>

      {/* Dynamic attribute filters - each individually collapsible */}
      {filterableAttributes.map((attr) => (
        <CollapsibleFilter key={attr.key} label={attr.label} defaultOpen={!!filters[`attr_${attr.key}`]}>
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
              showSearch={!!attr.searchable}
              multiSelect
            />
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
        </CollapsibleFilter>
      ))}

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
      <div className="hidden lg:block">
        <div className="bg-card rounded-2xl p-5">{sidebarContent}</div>
      </div>

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
