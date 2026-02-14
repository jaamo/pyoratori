import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getConversation } from "@/server/queries/messages";
import { markAsRead } from "@/server/actions/messages";
import { ChatView } from "@/components/messages/chat-view";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const { id } = await params;
  const data = await getConversation(id, session.user.id);

  if (!data) {
    notFound();
  }

  // Mark messages as read
  await markAsRead(id);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <ChatView
        conversation={data.conversation}
        messages={data.messages}
        currentUserId={session.user.id}
      />
    </div>
  );
}
