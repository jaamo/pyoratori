"use client";

import { PostingCard } from "@/components/postings/posting-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PostingWithImages } from "@/types";
import { ITEMS_PER_PAGE } from "@/lib/constants";

type SearchResultsProps = {
  postings: PostingWithImages[];
  total: number;
  page: number;
  sort: string;
  onPageChange: (page: number) => void;
  onSortChange: (sort: string) => void;
};

const SORT_OPTIONS = [
  { value: "newest", label: "Uusimmat" },
  { value: "price_asc", label: "Hinta: halvin ensin" },
  { value: "price_desc", label: "Hinta: kallein ensin" },
];

export function SearchResults({
  postings,
  total,
  page,
  sort,
  onPageChange,
  onSortChange,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  if (postings.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-lg text-muted-foreground">
          Ei ilmoituksia hakuehdoilla.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Kokeile laajentaa hakuasi tai selaa kaikkia ilmoituksia.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "ilmoitus" : "ilmoitusta"}
        </p>
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[200px] text-sm">
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {postings.map((posting) => (
          <PostingCard key={posting.id} posting={posting} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Edellinen
          </Button>
          <span className="text-sm text-muted-foreground">
            Sivu {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Seuraava
          </Button>
        </div>
      )}
    </div>
  );
}
