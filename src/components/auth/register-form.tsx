"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { register } from "@/server/actions/auth";
import Link from "next/link";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await register(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          <p className="font-medium">Tili luotu!</p>
          <p className="mt-1">
            Tarkista sähköpostisi ja klikkaa aktivointilinkkiä ennen kirjautumista.
          </p>
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nimimerkki</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Pyöräilijä123"
          autoComplete="nickname"
        />
      </div>

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
        <Label htmlFor="password">Salasana</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">Vähintään 8 merkkiä</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Vahvista salasana</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Luodaan tiliä..." : "Rekisteröidy"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Onko sinulla jo tili?{" "}
        <Link href="/kirjaudu" className="text-foreground underline">
          Kirjaudu sisään
        </Link>
      </p>
    </form>
  );
}
