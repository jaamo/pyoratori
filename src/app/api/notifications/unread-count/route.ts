import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/server/queries/search-alerts";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadCount = await getUnreadNotificationCount(session.user.id);

  return NextResponse.json({ unreadCount });
}
