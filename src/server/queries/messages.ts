import { db } from "@/server/db";
import {
  conversations,
  messages,
  products,
  users,
  images,
} from "@/server/db/schema";
import { eq, and, or, desc, ne, isNull } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { ConversationWithDetails, MessageWithSender, ProductThread } from "@/types";

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
    const product = await db.query.products.findFirst({
      where: eq(products.id, convo.productId),
      columns: { id: true, title: true, price: true, location: true },
    });

    const firstImage = await db.query.images.findFirst({
      where: eq(images.productId, convo.productId),
      orderBy: [images.sortOrder],
      columns: { filename: true },
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

    if (product && otherUser) {
      result.push({
        ...convo,
        product,
        productImage: firstImage
          ? firstImage.filename.replace(".webp", "-thumb.webp")
          : null,
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

  const product = await db.query.products.findFirst({
    where: eq(products.id, convo.productId),
    columns: { id: true, title: true, price: true, location: true },
  });

  const firstImage = await db.query.images.findFirst({
    where: eq(images.productId, convo.productId),
    orderBy: [images.sortOrder],
    columns: { filename: true },
  });

  const otherUserId =
    convo.buyerId === userId ? convo.sellerId : convo.buyerId;
  const otherUser = await db.query.users.findFirst({
    where: eq(users.id, otherUserId),
    columns: { id: true, name: true },
  });

  if (!product || !otherUser) return null;

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
      product,
      productImage: firstImage
        ? firstImage.filename.replace(".webp", "-thumb.webp")
        : null,
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

export async function getInboxGroupedByProduct(
  userId: string
): Promise<ProductThread[]> {
  const allConversations = await getInbox(userId);

  const grouped = new Map<string, ProductThread>();

  for (const convo of allConversations) {
    const key = convo.product.id;
    const existing = grouped.get(key);

    if (existing) {
      existing.conversations.push(convo);
      existing.totalUnread += convo.unreadCount;
      const msgDate = convo.lastMessage?.createdAt
        ? new Date(convo.lastMessage.createdAt)
        : null;
      if (msgDate && (!existing.latestMessageAt || msgDate > existing.latestMessageAt)) {
        existing.latestMessageAt = msgDate;
      }
    } else {
      grouped.set(key, {
        product: convo.product,
        productImage: convo.productImage,
        conversations: [convo],
        totalUnread: convo.unreadCount,
        latestMessageAt: convo.lastMessage?.createdAt
          ? new Date(convo.lastMessage.createdAt)
          : null,
      });
    }
  }

  // Sort threads by latest message date, newest first
  return Array.from(grouped.values()).sort((a, b) => {
    if (!a.latestMessageAt && !b.latestMessageAt) return 0;
    if (!a.latestMessageAt) return 1;
    if (!b.latestMessageAt) return -1;
    return b.latestMessageAt.getTime() - a.latestMessageAt.getTime();
  });
}
