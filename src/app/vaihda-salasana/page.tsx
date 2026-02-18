import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/kirjaudu");
  }

  return (
    <div className="container mx-auto flex max-w-md justify-center px-4 py-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Vaihda salasana</CardTitle>
          <CardDescription>
            Syötä nykyinen salasanasi ja valitse uusi salasana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
