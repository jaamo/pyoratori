"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send } from "lucide-react";
import { sendMessage } from "@/server/actions/messages";
import { MessageBubble } from "./message-bubble";
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
      <div className="flex items-center gap-3 border-b pb-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/viestit">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <p className="font-medium">
            {conversation.otherUser.name || "Tuntematon"}
          </p>
          <Link
            href={`/ilmoitus/${conversation.posting.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            {conversation.posting.title}
          </Link>
        </div>
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
