import { notFound } from "next/navigation";
import { getPostingById } from "@/server/queries/postings";
import { PostingDetail } from "@/components/postings/posting-detail";

export default async function PostingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const posting = await getPostingById(id);

  if (!posting) {
    notFound();
  }

  return <PostingDetail posting={posting} />;
}
