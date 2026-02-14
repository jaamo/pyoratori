"use server";

import { db } from "@/server/db";
import { postings, images, postingAttributes } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { postingSchema } from "@/lib/validators";
import { POSTING_EXPIRY_DAYS, POSTING_STATUS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImageFiles } from "@/lib/images";

export async function createPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään luodaksesi ilmoituksen" };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    location: formData.get("location") as string,
    categoryId: formData.get("categoryId") as string,
    attributes: JSON.parse((formData.get("attributes") as string) || "{}"),
    imageIds: JSON.parse((formData.get("imageIds") as string) || "[]"),
  };

  const result = postingSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, price, location, categoryId, attributes, imageIds } =
    result.data;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + POSTING_EXPIRY_DAYS);

  const [posting] = await db
    .insert(postings)
    .values({
      authorId: session.user.id,
      title,
      description,
      price: Math.round(price * 100), // Convert to cents
      location,
      categoryId,
      expiresAt,
    })
    .returning();

  // Insert attribute rows into EAV table
  const attrEntries = Object.entries(attributes).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (attrEntries.length > 0) {
    await db.insert(postingAttributes).values(
      attrEntries.map(([key, value]) => ({
        postingId: posting.id,
        key,
        value: String(value),
      }))
    );
  }

  // Link uploaded images to this posting
  if (imageIds.length > 0) {
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(images)
        .set({ postingId: posting.id, sortOrder: i })
        .where(eq(images.id, imageIds[i]));
    }
  }

  revalidatePath("/");
  redirect(`/ilmoitus/${posting.id}`);
}

export async function updatePosting(postingId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.postings.findFirst({
    where: eq(postings.id, postingId),
  });

  if (!existing || existing.authorId !== session.user.id) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  const raw = {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    price: Number(formData.get("price")),
    location: formData.get("location") as string,
    categoryId: formData.get("categoryId") as string,
    attributes: JSON.parse((formData.get("attributes") as string) || "{}"),
    imageIds: JSON.parse((formData.get("imageIds") as string) || "[]"),
  };

  const result = postingSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, price, location, categoryId, attributes, imageIds } =
    result.data;

  await db
    .update(postings)
    .set({
      title,
      description,
      price: Math.round(price * 100),
      location,
      categoryId,
      updatedAt: new Date(),
    })
    .where(eq(postings.id, postingId));

  // Update attributes: delete old, insert new
  await db.delete(postingAttributes).where(eq(postingAttributes.postingId, postingId));
  const attrEntries = Object.entries(attributes).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (attrEntries.length > 0) {
    await db.insert(postingAttributes).values(
      attrEntries.map(([key, value]) => ({
        postingId,
        key,
        value: String(value),
      }))
    );
  }

  // Update image associations
  // First, unlink all images from this posting
  const currentImages = await db.query.images.findMany({
    where: eq(images.postingId, postingId),
  });

  for (const img of currentImages) {
    if (!imageIds.includes(img.id)) {
      // Delete images that are no longer associated
      deleteImageFiles(img.filename);
      await db.delete(images).where(eq(images.id, img.id));
    }
  }

  // Link new images
  for (let i = 0; i < imageIds.length; i++) {
    await db
      .update(images)
      .set({ postingId: postingId, sortOrder: i })
      .where(eq(images.id, imageIds[i]));
  }

  revalidatePath(`/ilmoitus/${postingId}`);
  revalidatePath("/");
  redirect(`/ilmoitus/${postingId}`);
}

export async function deletePosting(postingId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.postings.findFirst({
    where: eq(postings.id, postingId),
  });

  if (!existing || existing.authorId !== session.user.id) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  // Delete image files
  const postingImages = await db.query.images.findMany({
    where: eq(images.postingId, postingId),
  });
  for (const img of postingImages) {
    deleteImageFiles(img.filename);
  }

  await db.delete(postings).where(eq(postings.id, postingId));

  revalidatePath("/");
  redirect("/profiili");
}

export async function markAsSold(postingId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.postings.findFirst({
    where: and(
      eq(postings.id, postingId),
      eq(postings.authorId, session.user.id)
    ),
  });

  if (!existing) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  await db
    .update(postings)
    .set({ status: POSTING_STATUS.SOLD, updatedAt: new Date() })
    .where(eq(postings.id, postingId));

  revalidatePath(`/ilmoitus/${postingId}`);
  revalidatePath("/profiili");
  return { success: true };
}

export async function reactivatePosting(postingId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.postings.findFirst({
    where: and(
      eq(postings.id, postingId),
      eq(postings.authorId, session.user.id)
    ),
  });

  if (!existing) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + POSTING_EXPIRY_DAYS);

  await db
    .update(postings)
    .set({
      status: POSTING_STATUS.ACTIVE,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(postings.id, postingId));

  revalidatePath(`/ilmoitus/${postingId}`);
  revalidatePath("/profiili");
  return { success: true };
}
