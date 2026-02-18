"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { ProductCard } from "@/components/products/product-card";
import { Button } from "@/components/ui/button";
import type { ProductWithImages } from "@/types";
import { ITEMS_PER_PAGE } from "@/lib/constants";

type SearchResultsProps = {
  products: ProductWithImages[];
  total: number;
  page: number;
  onPageChange: (page: number) => void;
};

export function SearchResults({
  products,
  total,
  page,
  onPageChange,
}: SearchResultsProps) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const [showFloatingBar, setShowFloatingBar] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const prevTotalRef = useRef(total);

  useEffect(() => {
    const el = resultsTopRef.current;
    if (!el) return;

    function handleScroll() {
      const rect = el!.getBoundingClientRect();
      setShowFloatingBar(rect.bottom < 0);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (prevTotalRef.current === total) return;
    prevTotalRef.current = total;
    if (!showFloatingBar) return;

    setIsPulsing(true);
    const timer = setTimeout(() => setIsPulsing(false), 300);
    return () => clearTimeout(timer);
  }, [total, showFloatingBar]);

  function scrollToTop() {
    resultsTopRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      <div ref={resultsTopRef}>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "ilmoitus" : "ilmoitusta"}
        </p>
      </div>

      {/* Floating results count - desktop only */}
      <div
        className="fixed top-4 left-1/2 z-50 hidden items-center gap-3 rounded-full bg-primary px-5 py-2.5 text-primary-foreground shadow-lg lg:flex"
        style={{
          transform: `translateX(-50%) translateY(${showFloatingBar ? "0" : "-4rem"}) scale(${isPulsing ? 1.2 : 1})`,
          opacity: showFloatingBar ? 1 : 0,
          pointerEvents: showFloatingBar ? "auto" : "none",
          transition: isPulsing
            ? "transform 100ms ease-out, opacity 300ms ease"
            : "transform 200ms ease-in, opacity 300ms ease",
        }}
      >
        <span className="text-sm font-medium">
          {total} {total === 1 ? "ilmoitus" : "ilmoitusta"}
        </span>
        <button
          onClick={scrollToTop}
          className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
        >
          <ArrowUp className="h-3.5 w-3.5" />
          Ylös
        </button>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg text-muted-foreground">
            Ei ilmoituksia hakuehdoilla.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Kokeile laajentaa hakuasi tai selaa kaikkia ilmoituksia.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
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
        </>
      )}
    </div>
  );
}
