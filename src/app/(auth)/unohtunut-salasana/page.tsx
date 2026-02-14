import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PasswordResetRequestForm,
  PasswordResetForm,
} from "@/components/auth/password-reset-form";

function PasswordResetContent({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const hasToken = !!searchParams.token;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {hasToken ? "Vaihda salasana" : "Unohtunut salasana"}
        </CardTitle>
        <CardDescription>
          {hasToken
            ? "Syötä uusi salasana"
            : "Syötä sähköpostiosoitteesi ja lähetämme sinulle palautuslinkin"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense>
          {hasToken ? <PasswordResetForm /> : <PasswordResetRequestForm />}
        </Suspense>
      </CardContent>
    </Card>
  );
}

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <PasswordResetContent searchParams={params} />;
}
