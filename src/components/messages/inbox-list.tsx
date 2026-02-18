import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { ProductThread } from "@/types";

type InboxListProps = {
  threads: ProductThread[];
  currentUserId: string;
};

export function InboxList({ threads, currentUserId }: InboxListProps) {
  if (threads.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg text-muted-foreground">Ei viestejä</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aloita keskustelu lähettämällä viesti myyjälle ilmoitussivulta.
        </p>
      </div>
    );
  }

  const rows = threads.flatMap((thread) =>
    thread.conversations.map((convo) => ({ convo, product: thread.product }))
  );

  return (
    <div className="divide-y rounded-lg border">
      {rows.map(({ convo, product }) => (
        <Link
          key={convo.id}
          href={`/viestit/${convo.id}`}
          className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent"
        >
          <span className="truncate font-medium">{product.title}</span>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {convo.unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {convo.unreadCount}
              </Badge>
            )}
            <span className="text-sm text-muted-foreground">
              {convo.otherUser.name || "Tuntematon"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
