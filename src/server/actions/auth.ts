"use server";

import { hash } from "bcryptjs";
import { db } from "@/server/db";
import { users, passwordResetTokens } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema, passwordResetRequestSchema, passwordResetSchema } from "@/lib/validators";
import { v4 as uuid } from "uuid";
import { writeFileSync } from "fs";
import { join } from "path";

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

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existing) {
    return { error: "Sähköpostiosoite on jo käytössä" };
  }

  const passwordHash = await hash(password, 12);

  await db.insert(users).values({
    name,
    email,
    passwordHash,
  });

  return { success: true };
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
    const logPath = join(process.cwd(), "data/password-reset.log");
    writeFileSync(logPath, `[${new Date().toISOString()}] No user found for: ${result.data.email}\n`, { flag: "a" });
    return { success: true };
  }

  const token = uuid();
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expires,
  });

  // V1: Log reset link to file (email integration later)
  const resetUrl = `http://localhost:3000/unohtunut-salasana?token=${token}`;
  const logLine = `[${new Date().toISOString()}] ${user.email}: ${resetUrl}\n`;
  const logPath = join(process.cwd(), "data/password-reset.log");
  writeFileSync(logPath, logLine, { flag: "a" });

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
