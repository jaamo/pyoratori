"use server";

import { db } from "@/server/db";
import { images } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { processImage, deleteImageFiles } from "@/lib/images";

export async function uploadImage(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { error: "Tiedosto puuttuu" };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const processed = await processImage(buffer, file.name, file.type);

    const [image] = await db
      .insert(images)
      .values({
        filename: processed.filename,
        originalName: processed.originalName,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
      })
      .returning();

    return { success: true, image };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Kuvan lataaminen epäonnistui",
    };
  }
}

export async function deleteImage(imageId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Kirjaudu sisään" };
  }

  const image = await db.query.images.findFirst({
    where: eq(images.id, imageId),
  });

  if (!image) {
    return { error: "Kuvaa ei löytynyt" };
  }

  deleteImageFiles(image.filename);
  await db.delete(images).where(eq(images.id, imageId));

  return { success: true };
}
