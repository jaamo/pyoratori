import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getConversation } from "@/server/queries/messages";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await getConversation(id, session.user.id);

  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    messages: data.messages,
  });
}
