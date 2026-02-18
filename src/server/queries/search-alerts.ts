import { db } from "@/server/db";
import { searchAlerts, notifications } from "@/server/db/schema";
import { eq, desc, isNull, and, count } from "drizzle-orm";
import type { SearchAlertWithNotifications, Notification } from "@/types";

export async function getSearchAlertsByUser(
  userId: string
): Promise<SearchAlertWithNotifications[]> {
  const alerts = await db
    .select()
    .from(searchAlerts)
    .where(eq(searchAlerts.userId, userId))
    .orderBy(desc(searchAlerts.createdAt));

  if (alerts.length === 0) return [];

  const notificationRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));

  const notifsByAlert = new Map<string, Notification[]>();
  for (const n of notificationRows) {
    if (!notifsByAlert.has(n.searchAlertId)) {
      notifsByAlert.set(n.searchAlertId, []);
    }
    notifsByAlert.get(n.searchAlertId)!.push(n);
  }

  return alerts.map((alert) => ({
    ...alert,
    notifications: notifsByAlert.get(alert.id) || [],
  }));
}

export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt))
    );

  return result[0]?.count || 0;
}

export async function getNotificationsByUser(
  userId: string
): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}
