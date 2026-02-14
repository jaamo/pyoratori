import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import type { ConversationWithDetails } from "@/types";

type InboxListProps = {
  conversations: ConversationWithDetails[];
  currentUserId: string;
};

export function InboxList({ conversations, currentUserId }: InboxListProps) {
  if (conversations.length === 0) {
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

  return (
    <div className="divide-y rounded-lg border">
      {conversations.map((convo) => (
        <Link
          key={convo.id}
          href={`/viestit/${convo.id}`}
          className="flex items-center gap-3 p-4 transition-colors hover:bg-accent"
        >
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {convo.otherUser.name || "Tuntematon"}
              </span>
              {convo.unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {convo.unreadCount}
                </Badge>
              )}
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {convo.posting.title}
            </p>
            {convo.lastMessage && (
              <p className="mt-0.5 truncate text-sm">
                {convo.lastMessage.senderId === currentUserId && (
                  <span className="text-muted-foreground">Sinä: </span>
                )}
                {convo.lastMessage.content}
              </p>
            )}
          </div>
          {convo.lastMessage && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(convo.lastMessage.createdAt).toLocaleDateString(
                "fi-FI",
                { day: "numeric", month: "numeric" }
              )}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
