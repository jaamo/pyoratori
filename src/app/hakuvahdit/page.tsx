import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSearchAlertsByUser } from "@/server/queries/search-alerts";
import { SearchAlertsContent } from "@/components/search-alerts/search-alerts-content";

export default async function HakuvahditPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  const alerts = await getSearchAlertsByUser(session.user.id);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Hakuvahdit</h1>
      <SearchAlertsContent alerts={alerts} />
    </div>
  );
}
