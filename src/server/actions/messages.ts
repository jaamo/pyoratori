"use server";

import { db } from "@/server/db";
import { conversations, messages, products } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { messageSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function startConversation(productId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    return { error: "Ilmoitusta ei löytynyt" };
  }

  if (product.authorId === session.user.id) {
    return { error: "Et voi lähettää viestiä omaan ilmoitukseesi" };
  }

  // Check for existing conversation
  const existing = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.productId, productId),
      eq(conversations.buyerId, session.user.id)
    ),
  });

  if (existing) {
    // Add message to existing conversation
    await db.insert(messages).values({
      conversationId: existing.id,
      senderId: session.user.id,
      content,
    });

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, existing.id));

    revalidatePath("/viestit");
    return { success: true, conversationId: existing.id };
  }

  // Create new conversation
  const [conversation] = await db
    .insert(conversations)
    .values({
      productId,
      buyerId: session.user.id,
      sellerId: product.authorId,
    })
    .returning();

  await db.insert(messages).values({
    conversationId: conversation.id,
    senderId: session.user.id,
    content,
  });

  revalidatePath("/viestit");
  return { success: true, conversationId: conversation.id };
}

export async function sendMessage(conversationId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const raw = { content: formData.get("content") as string };
  const result = messageSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!conversation) {
    return { error: "Keskustelua ei löytynyt" };
  }

  if (
    conversation.buyerId !== session.user.id &&
    conversation.sellerId !== session.user.id
  ) {
    return { error: "Ei oikeuksia" };
  }

  await db.insert(messages).values({
    conversationId,
    senderId: session.user.id,
    content: result.data.content,
  });

  await db
    .update(conversations)
    .set({ updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));

  revalidatePath(`/viestit/${conversationId}`);
  return { success: true };
}

export async function markAsRead(conversationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });

  if (!conversation) {
    return { error: "Keskustelua ei löytynyt" };
  }

  if (
    conversation.buyerId !== session.user.id &&
    conversation.sellerId !== session.user.id
  ) {
    return { error: "Ei oikeuksia" };
  }

  // Mark all messages from the OTHER user as read
  const allMessages = await db.query.messages.findMany({
    where: eq(messages.conversationId, conversationId),
  });

  for (const msg of allMessages) {
    if (msg.senderId !== session.user.id && !msg.readAt) {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(eq(messages.id, msg.id));
    }
  }

  return { success: true };
}
