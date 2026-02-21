"use server";

import { hash, compare } from "bcryptjs";
import { db } from "@/server/db";
import { users, passwordResetTokens, verificationTokens } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema, passwordResetRequestSchema, passwordResetSchema, changePasswordSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { v4 as uuid } from "uuid";
import { sendActivationEmail, sendPasswordResetEmail } from "@/server/mail";

export async function register(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = registerSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, email, password } = result.data;
  const passwordHash = await hash(password, 12);

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    if (existing.emailVerified) {
      return { error: "Sähköpostiosoite on jo käytössä" };
    }

    // Re-registration with unverified email: update details and reissue token
    await db
      .update(users)
      .set({ name, passwordHash })
      .where(eq(users.id, existing.id));

    // Delete old activation tokens
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));
  } else {
    await db.insert(users).values({
      name,
      email,
      passwordHash,
    });
  }

  // Generate activation token (24h expiry)
  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  await sendActivationEmail(email, name, token);

  return { success: true, needsActivation: true };
}

export async function requestPasswordReset(formData: FormData) {
  const raw = { email: formData.get("email") as string };

  const result = passwordResetRequestSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, result.data.email),
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return { success: true };
  }

  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expires,
  });

  await sendPasswordResetEmail(user.email, user.name || "", token);

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const raw = {
    token: formData.get("token") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = passwordResetSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, result.data.token),
  });

  if (!resetToken) {
    return { error: "Virheellinen tai vanhentunut linkki" };
  }

  if (resetToken.usedAt) {
    return { error: "Tämä linkki on jo käytetty" };
  }

  if (resetToken.expires < new Date()) {
    return { error: "Linkki on vanhentunut" };
  }

  const passwordHash = await hash(result.data.password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, resetToken.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, resetToken.id));

  return { success: true };
}

export async function checkLoginEligibility(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.passwordHash) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) {
    return { error: "INVALID_CREDENTIALS" as const };
  }

  if (!user.emailVerified) {
    return { error: "NOT_ACTIVATED" as const };
  }

  return { ok: true };
}

export async function activateAccount(token: string) {
  if (!token) {
    return { error: "Virheellinen aktivointilinkki" };
  }

  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
  });

  if (!record) {
    return { error: "Virheellinen aktivointilinkki" };
  }

  if (record.expires < new Date()) {
    return { error: "Aktivointilinkki on vanhentunut. Pyydä uusi linkki kirjautumissivulta." };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, record.identifier),
  });

  if (!user) {
    return { error: "Käyttäjää ei löytynyt" };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.id, user.id));

  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, record.identifier));

  return { success: true };
}

export async function resendActivation(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    return { success: true };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always return success to prevent email enumeration
  if (!user || user.emailVerified) {
    return { success: true };
  }

  // Delete old activation tokens
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));

  // Generate new token (24h expiry)
  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  await sendActivationEmail(email, user.name || "", token);

  return { success: true };
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Et ole kirjautunut sisään" };
  }

  const raw = {
    currentPassword: formData.get("currentPassword") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = changePasswordSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.passwordHash) {
    return { error: "Käyttäjää ei löytynyt" };
  }

  const isValid = await compare(result.data.currentPassword, user.passwordHash);
  if (!isValid) {
    return { error: "Nykyinen salasana on virheellinen" };
  }

  const passwordHash = await hash(result.data.password, 12);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, session.user.id));

  return { success: true };
}
