import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getNotificationsByUser } from "@/server/queries/search-alerts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await getNotificationsByUser(session.user.id);

  // Return the 10 most recent
  return NextResponse.json({ notifications: notifications.slice(0, 10) });
}
