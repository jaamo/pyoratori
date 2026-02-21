import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivationResult } from "@/components/auth/activation-result";

export default async function ActivationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tilin aktivointi</CardTitle>
      </CardHeader>
      <CardContent>
        <Suspense>
          <ActivationResult token={params.token} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
