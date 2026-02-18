import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { ProductWithImages } from "@/types";
import { PRODUCT_STATUS } from "@/lib/constants";
import { getCityByPostalCode } from "@/lib/postal-codes";

type ProductCardProps = {
  product: ProductWithImages;
};

export function ProductCard({ product }: ProductCardProps) {
  const thumbnail = product.images[0];
  const thumbFilename = thumbnail
    ? thumbnail.filename.replace(".webp", "-thumb.webp")
    : null;

  return (
    <Link href={`/ilmoitus/${product.id}`}>
      <Card className="group overflow-hidden rounded-2xl border py-0 gap-0 shadow-none transition-colors hover:bg-muted/50">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {thumbFilename ? (
            <Image
              src={`/api/uploads/${thumbFilename}`}
              alt={product.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Ei kuvaa
            </div>
          )}
          {product.status === PRODUCT_STATUS.SOLD && (
            <Badge className="absolute left-2 top-2" variant="destructive">
              Myyty
            </Badge>
          )}
          {product.status === PRODUCT_STATUS.EXPIRED && (
            <Badge className="absolute left-2 top-2" variant="secondary">
              Vanhentunut
            </Badge>
          )}
          {product.externalUrl && (
            <Badge className="absolute right-2 top-2 bg-primary text-primary-foreground hover:bg-primary/90">
              Fillaritori
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
            {product.title}
          </h3>
          <p className="mt-1 text-lg font-bold">
            {(product.price / 100).toLocaleString("fi-FI", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {getCityByPostalCode(product.location) || product.location}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
