import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProductsByUser } from "@/server/queries/products";
import { ProfileContent } from "@/components/products/profile-content";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const products = await getProductsByUser(session.user.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Omat ilmoitukset</h1>
      <ProfileContent products={products} />
    </div>
  );
}
