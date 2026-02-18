import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getInboxGroupedByProduct } from "@/server/queries/messages";
import { InboxList } from "@/components/messages/inbox-list";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const threads = await getInboxGroupedByProduct(session.user.id);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Viestit</h1>
      <InboxList threads={threads} currentUserId={session.user.id} />
    </div>
  );
}
