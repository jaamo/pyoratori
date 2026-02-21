"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { activateAccount } from "@/server/actions/auth";
import Link from "next/link";

export function ActivationResult({ token }: { token?: string }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setStatus("error");
      setErrorMessage("Virheellinen aktivointilinkki");
      return;
    }

    activateAccount(token).then((result) => {
      if (result.error) {
        setStatus("error");
        setErrorMessage(result.error);
      } else {
        setStatus("success");
      }
    });
  }, [token]);

  if (status === "loading") {
    return <p className="text-sm text-muted-foreground">Aktivoidaan tiliä...</p>;
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
        <Link href="/kirjaudu">
          <Button variant="outline" className="w-full">
            Siirry kirjautumissivulle
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
        Tilisi on aktivoitu! Voit nyt kirjautua sisään.
      </div>
      <Link href="/kirjaudu">
        <Button className="w-full">Kirjaudu sisään</Button>
      </Link>
    </div>
  );
}
