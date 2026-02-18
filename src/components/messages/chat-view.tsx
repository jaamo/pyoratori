"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, MapPin } from "lucide-react";
import { sendMessage } from "@/server/actions/messages";
import { MessageBubble } from "./message-bubble";
import { getCityByPostalCode } from "@/lib/postal-codes";
import type { ConversationWithDetails, MessageWithSender } from "@/types";

type ChatViewProps = {
  conversation: ConversationWithDetails;
  messages: MessageWithSender[];
  currentUserId: string;
};

export function ChatView({
  conversation,
  messages: initialMessages,
  currentUserId,
}: ChatViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/viestit/${conversation.id}/poll`
        );
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages);
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [conversation.id]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;

    setSending(true);
    const formData = new FormData();
    formData.set("content", content);

    const result = await sendMessage(conversation.id, formData);
    if (!result.error) {
      setContent("");
      // Optimistic update
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          conversationId: conversation.id,
          senderId: currentUserId,
          content,
          readAt: null,
          createdAt: new Date(),
          sender: { id: currentUserId, name: "Sinä" },
        },
      ]);
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3 mb-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/viestit">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <p className="font-medium">
            {conversation.otherUser.name || "Tuntematon"}
          </p>
        </div>
        <Link
          href={`/ilmoitus/${conversation.product.id}`}
          className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
        >
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
            {conversation.productImage ? (
              <Image
                src={`/api/uploads/${conversation.productImage}`}
                alt={conversation.product.title}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                Ei kuvaa
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <p className="text-sm font-medium leading-tight line-clamp-1">
              {conversation.product.title}
            </p>
            <p className="text-sm font-bold">
              {(conversation.product.price / 100).toLocaleString("fi-FI", {
                style: "currency",
                currency: "EUR",
              })}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {getCityByPostalCode(conversation.product.location) || conversation.product.location}
            </div>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 py-4">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 border-t pt-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Kirjoita viesti..."
          rows={1}
          className="min-h-[2.5rem] resize-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={sending || !content.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
