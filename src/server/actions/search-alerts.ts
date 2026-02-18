"use server";

import { db } from "@/server/db";
import { searchAlerts, notifications } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { searchAlertSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export async function createSearchAlert(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const raw = {
    name: (formData.get("name") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    query: (formData.get("query") as string) || undefined,
    filters: JSON.parse((formData.get("filters") as string) || "{}"),
    productIds: JSON.parse((formData.get("productIds") as string) || "[]"),
  };

  const result = searchAlertSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // Auto-generate name if not provided
  const name = result.data.name?.trim() || generateAlertName(result.data);

  await db.insert(searchAlerts).values({
    userId: session.user.id,
    name,
    categoryId: result.data.categoryId || null,
    query: result.data.query || null,
    filters: JSON.stringify(result.data.filters || {}),
    productIds: JSON.stringify(result.data.productIds || []),
  });

  revalidatePath("/hakuvahdit");
  return { success: true };
}

function generateAlertName(data: {
  query?: string;
  categoryId?: string;
}): string {
  const parts: string[] = [];
  if (data.query) parts.push(data.query);
  if (data.categoryId) parts.push(data.categoryId);
  if (parts.length === 0) return "Hakuvahti";
  return parts.join(" — ");
}

export async function deleteSearchAlert(alertId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  await db
    .delete(searchAlerts)
    .where(
      and(
        eq(searchAlerts.id, alertId),
        eq(searchAlerts.userId, session.user.id)
      )
    );

  revalidatePath("/hakuvahdit");
  return { success: true };
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  if (notificationIds.length === 0) return { success: true };

  for (const id of notificationIds) {
    await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.userId, session.user.id)
        )
      );
  }

  revalidatePath("/hakuvahdit");
  return { success: true };
}
