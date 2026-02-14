import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { PostingWithImages } from "@/types";
import { POSTING_STATUS } from "@/lib/constants";

type PostingCardProps = {
  posting: PostingWithImages;
};

export function PostingCard({ posting }: PostingCardProps) {
  const thumbnail = posting.images[0];
  const thumbFilename = thumbnail
    ? thumbnail.filename.replace(".webp", "-thumb.webp")
    : null;

  return (
    <Link href={`/ilmoitus/${posting.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {thumbFilename ? (
            <Image
              src={`/api/uploads/${thumbFilename}`}
              alt={posting.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Ei kuvaa
            </div>
          )}
          {posting.status === POSTING_STATUS.SOLD && (
            <Badge className="absolute left-2 top-2" variant="destructive">
              Myyty
            </Badge>
          )}
          {posting.status === POSTING_STATUS.EXPIRED && (
            <Badge className="absolute left-2 top-2" variant="secondary">
              Vanhentunut
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="line-clamp-2 text-sm font-medium leading-tight">
            {posting.title}
          </h3>
          <p className="mt-1 text-lg font-bold">
            {(posting.price / 100).toLocaleString("fi-FI", {
              style: "currency",
              currency: "EUR",
            })}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {posting.location}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
