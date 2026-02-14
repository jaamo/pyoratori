"use client";

import { Badge } from "@/components/ui/badge";
import { categoryGroups } from "@/lib/categories";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

type CategoryPillsProps = {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function CategoryPills({
  selectedCategoryId,
  onSelect,
}: CategoryPillsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex gap-2 pb-2">
        <Badge
          variant={selectedCategoryId === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelect(null)}
        >
          Kaikki
        </Badge>
        {categoryGroups.map((group) => (
          <Badge
            key={group.id}
            variant={selectedCategoryId === group.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() =>
              onSelect(selectedCategoryId === group.id ? null : group.id)
            }
          >
            {group.name}
          </Badge>
        ))}
        {categoryGroups.map((group) =>
          group.categories.map((cat) => {
            if (!cat.children) return null;
            return (
              <Badge
                key={cat.id}
                variant={selectedCategoryId === cat.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() =>
                  onSelect(selectedCategoryId === cat.id ? null : cat.id)
                }
              >
                {cat.name}
              </Badge>
            );
          })
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
