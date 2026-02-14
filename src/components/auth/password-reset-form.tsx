"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset, resetPassword } from "@/server/actions/auth";
import Link from "next/link";

export function PasswordResetRequestForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await requestPasswordReset(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">
          Jos sähköpostiosoitteella on tili, lähetimme sinulle salasanan
          palautusohjeet.
        </p>
        <Link href="/kirjaudu" className="text-sm underline">
          Takaisin kirjautumiseen
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
        <Label htmlFor="email">Sähköposti</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="nimi@esimerkki.fi"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Lähetetään..." : "Lähetä palautuslinkki"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/kirjaudu" className="text-foreground underline">
          Takaisin kirjautumiseen
        </Link>
      </p>
    </form>
  );
}

export function PasswordResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("token", token);
    const result = await resetPassword(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">Salasana on vaihdettu onnistuneesti.</p>
        <Link href="/kirjaudu" className="text-sm underline">
          Kirjaudu sisään
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
        <Label htmlFor="password">Uusi salasana</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
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
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Vaihdetaan..." : "Vaihda salasana"}
      </Button>
    </form>
  );
}
