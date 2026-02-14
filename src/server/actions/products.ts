"use server";

import { db } from "@/server/db";
import { products, images, productAttributes, attributes } from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { productSchema } from "@/lib/validators";
import { PRODUCT_EXPIRY_DAYS, PRODUCT_STATUS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteImageFiles } from "@/lib/images";

export async function createProduct(formData: FormData) {
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

  const result = productSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, price, location, categoryId, attributes: productAttrs, imageIds } =
    result.data;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PRODUCT_EXPIRY_DAYS);

  const [product] = await db
    .insert(products)
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

  // Insert attribute rows — look up attributeId from key
  const attrEntries = Object.entries(productAttrs).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (attrEntries.length > 0) {
    const attrKeys = attrEntries.map(([key]) => key);
    const attrRows = await db
      .select({ id: attributes.id, key: attributes.key })
      .from(attributes)
      .where(inArray(attributes.key, attrKeys));
    const keyToId = new Map(attrRows.map((a) => [a.key, a.id]));

    await db.insert(productAttributes).values(
      attrEntries
        .filter(([key]) => keyToId.has(key))
        .map(([key, value]) => ({
          productId: product.id,
          attributeId: keyToId.get(key)!,
          value: String(value),
        }))
    );
  }

  // Link uploaded images to this product
  if (imageIds.length > 0) {
    for (let i = 0; i < imageIds.length; i++) {
      await db
        .update(images)
        .set({ productId: product.id, sortOrder: i })
        .where(eq(images.id, imageIds[i]));
    }
  }

  revalidatePath("/");
  redirect(`/ilmoitus/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, productId),
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

  const result = productSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, price, location, categoryId, attributes: productAttrs, imageIds } =
    result.data;

  await db
    .update(products)
    .set({
      title,
      description,
      price: Math.round(price * 100),
      location,
      categoryId,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  // Update attributes: delete old, insert new with attributeId lookup
  await db.delete(productAttributes).where(eq(productAttributes.productId, productId));
  const attrEntries = Object.entries(productAttrs).filter(
    ([, v]) => v !== undefined && v !== null && v !== ""
  );
  if (attrEntries.length > 0) {
    const attrKeys = attrEntries.map(([key]) => key);
    const attrRows = await db
      .select({ id: attributes.id, key: attributes.key })
      .from(attributes)
      .where(inArray(attributes.key, attrKeys));
    const keyToId = new Map(attrRows.map((a) => [a.key, a.id]));

    await db.insert(productAttributes).values(
      attrEntries
        .filter(([key]) => keyToId.has(key))
        .map(([key, value]) => ({
          productId,
          attributeId: keyToId.get(key)!,
          value: String(value),
        }))
    );
  }

  // Update image associations
  // First, unlink all images from this product
  const currentImages = await db.query.images.findMany({
    where: eq(images.productId, productId),
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
      .set({ productId: productId, sortOrder: i })
      .where(eq(images.id, imageIds[i]));
  }

  revalidatePath(`/ilmoitus/${productId}`);
  revalidatePath("/");
  redirect(`/ilmoitus/${productId}`);
}

export async function deleteProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!existing || existing.authorId !== session.user.id) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  // Delete image files
  const productImages = await db.query.images.findMany({
    where: eq(images.productId, productId),
  });
  for (const img of productImages) {
    deleteImageFiles(img.filename);
  }

  await db.delete(products).where(eq(products.id, productId));

  revalidatePath("/");
  redirect("/profiili");
}

export async function markAsSold(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.authorId, session.user.id)
    ),
  });

  if (!existing) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  await db
    .update(products)
    .set({ status: PRODUCT_STATUS.SOLD, updatedAt: new Date() })
    .where(eq(products.id, productId));

  revalidatePath(`/ilmoitus/${productId}`);
  revalidatePath("/profiili");
  return { success: true };
}

export async function reactivateProduct(productId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const existing = await db.query.products.findFirst({
    where: and(
      eq(products.id, productId),
      eq(products.authorId, session.user.id)
    ),
  });

  if (!existing) {
    return { error: "Ilmoitusta ei löytynyt tai sinulla ei ole oikeuksia" };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + PRODUCT_EXPIRY_DAYS);

  await db
    .update(products)
    .set({
      status: PRODUCT_STATUS.ACTIVE,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(products.id, productId));

  revalidatePath(`/ilmoitus/${productId}`);
  revalidatePath("/profiili");
  return { success: true };
}
