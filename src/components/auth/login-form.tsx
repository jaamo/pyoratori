"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { checkLoginEligibility, resendActivation } from "@/server/actions/auth";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [notActivated, setNotActivated] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotActivated(false);
    setResendSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    // Pre-validate before signIn
    const eligibility = await checkLoginEligibility(formData);

    if (eligibility.error) {
      if (eligibility.error === "NOT_ACTIVATED") {
        setNotActivated(true);
      } else {
        setError("Virheellinen sähköposti tai salasana");
      }
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Virheellinen sähköposti tai salasana");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  async function handleResend() {
    const form = document.querySelector("form") as HTMLFormElement | null;
    if (!form) return;

    const formData = new FormData(form);
    const email = formData.get("email") as string;
    if (!email) return;

    setResending(true);
    const resendData = new FormData();
    resendData.set("email", email);
    await resendActivation(resendData);
    setResendSuccess(true);
    setResending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {notActivated && (
        <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <p>Tilisi ei ole vielä aktivoitu. Tarkista sähköpostisi aktivointilinkin varalta.</p>
          {resendSuccess ? (
            <p className="mt-2 font-medium">Uusi aktivointilinkki lähetetty!</p>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              disabled={resending}
              onClick={handleResend}
            >
              {resending ? "Lähetetään..." : "Lähetä aktivointilinkki uudelleen"}
            </Button>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Sähköposti</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="nimi@esimerkki.fi"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Salasana</Label>
          <Link
            href="/unohtunut-salasana"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Unohtuiko salasana?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Eikö sinulla ole tiliä?{" "}
        <Link href="/rekisteroidy" className="text-foreground underline">
          Rekisteröidy
        </Link>
      </p>
    </form>
  );
}
