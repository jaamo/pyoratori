import { db } from "@/server/db";
import {
  conversations,
  messages,
  postings,
  users,
} from "@/server/db/schema";
import { eq, and, or, desc, ne, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { ConversationWithDetails, MessageWithSender } from "@/types";

export async function getInbox(
  userId: string
): Promise<ConversationWithDetails[]> {
  const convos = await db.query.conversations.findMany({
    where: or(
      eq(conversations.buyerId, userId),
      eq(conversations.sellerId, userId)
    ),
    orderBy: [desc(conversations.updatedAt)],
  });

  const result: ConversationWithDetails[] = [];

  for (const convo of convos) {
    const posting = await db.query.postings.findFirst({
      where: eq(postings.id, convo.postingId),
      columns: { id: true, title: true },
    });

    const otherUserId =
      convo.buyerId === userId ? convo.sellerId : convo.buyerId;
    const otherUser = await db.query.users.findFirst({
      where: eq(users.id, otherUserId),
      columns: { id: true, name: true },
    });

    const lastMessage = await db.query.messages.findFirst({
      where: eq(messages.conversationId, convo.id),
      orderBy: [desc(messages.createdAt)],
      columns: { content: true, createdAt: true, senderId: true },
    });

    // Count unread messages from the other user
    const unreadResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, convo.id),
          ne(messages.senderId, userId),
          isNull(messages.readAt)
        )
      );

    if (posting && otherUser) {
      result.push({
        ...convo,
        posting,
        otherUser,
        lastMessage: lastMessage || null,
        unreadCount: unreadResult[0]?.count || 0,
      });
    }
  }

  return result;
}

export async function getConversation(
  conversationId: string,
  userId: string
): Promise<{
  conversation: ConversationWithDetails;
  messages: MessageWithSender[];
} | null> {
  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!convo) return null;

  if (convo.buyerId !== userId && convo.sellerId !== userId) {
    return null;
  }

  const posting = await db.query.postings.findFirst({
    where: eq(postings.id, convo.postingId),
    columns: { id: true, title: true },
  });

  const otherUserId =
    convo.buyerId === userId ? convo.sellerId : convo.buyerId;
  const otherUser = await db.query.users.findFirst({
    where: eq(users.id, otherUserId),
    columns: { id: true, name: true },
  });

  if (!posting || !otherUser) return null;

  const allMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
    orderBy: [messages.createdAt],
  });

  const messagesWithSenders: MessageWithSender[] = await Promise.all(
    allMessages.map(async (msg) => {
      const sender = await db.query.users.findFirst({
        where: eq(users.id, msg.senderId),
        columns: { id: true, name: true },
      });
      return { ...msg, sender: sender! };
    })
  );

  return {
    conversation: {
      ...convo,
      posting,
      otherUser,
      lastMessage: null,
      unreadCount: 0,
    },
    messages: messagesWithSenders,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const convos = await db.query.conversations.findMany({
    where: or(
      eq(conversations.buyerId, userId),
      eq(conversations.sellerId, userId)
    ),
  });

  let total = 0;
  for (const convo of convos) {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, convo.id),
          ne(messages.senderId, userId),
          isNull(messages.readAt)
        )
      );
    total += result[0]?.count || 0;
  }

  return total;
}
