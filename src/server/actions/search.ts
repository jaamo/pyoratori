"use server";

import { db } from "@/server/db";
import { searchAlerts } from "@/server/db/schema";
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
    name: formData.get("name") as string,
    categoryId: (formData.get("categoryId") as string) || undefined,
    query: (formData.get("query") as string) || undefined,
    filters: JSON.parse((formData.get("filters") as string) || "{}"),
  };

  const result = searchAlertSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await db.insert(searchAlerts).values({
    userId: session.user.id,
    name: result.data.name,
    categoryId: result.data.categoryId || null,
    query: result.data.query || null,
    filters: JSON.stringify(result.data.filters || {}),
  });

  revalidatePath("/profiili");
  return { success: true };
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

  revalidatePath("/profiili");
  return { success: true };
}
