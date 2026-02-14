import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPostingById } from "@/server/queries/postings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostingForm } from "@/components/postings/posting-form";

export default async function EditPostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const { id } = await params;
  const posting = await getPostingById(id);

  if (!posting) {
    notFound();
  }

  if (posting.authorId !== session.user.id) {
    redirect("/");
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Muokkaa ilmoitusta</CardTitle>
          <CardDescription>Päivitä ilmoituksesi tiedot</CardDescription>
        </CardHeader>
        <CardContent>
          <PostingForm posting={posting} />
        </CardContent>
      </Card>
    </div>
  );
}
