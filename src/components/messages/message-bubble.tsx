import { cn } from "@/lib/utils";
import type { MessageWithSender } from "@/types";

type MessageBubbleProps = {
  message: MessageWithSender;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2",
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {!isOwn && (
          <p className="mb-0.5 text-xs font-medium">
            {message.sender.name || "Tuntematon"}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString("fi-FI", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
