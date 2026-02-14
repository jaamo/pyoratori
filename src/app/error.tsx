"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="text-4xl font-bold">Virhe</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Jotain meni pieleen. Yritä uudelleen.
      </p>
      <Button onClick={reset} className="mt-6">
        Yritä uudelleen
      </Button>
    </div>
  );
}
