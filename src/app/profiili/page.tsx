import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostingsByUser } from "@/server/queries/postings";
import { ProfileContent } from "@/components/postings/profile-content";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const postings = await getPostingsByUser(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Omat ilmoitukset</h1>
      <ProfileContent postings={postings} />
    </div>
  );
}
