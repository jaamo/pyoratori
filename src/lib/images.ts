import sharp from "sharp";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import {
  IMAGE_MAX_DIMENSION,
  THUMBNAIL_MAX_DIMENSION,
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_SIZE,
} from "./constants";

const uploadsDir = path.join(process.cwd(), "uploads");
const originalDir = path.join(uploadsDir, "original");
const optimizedDir = path.join(uploadsDir, "optimized");

function ensureDirs() {
  for (const dir of [originalDir, optimizedDir]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

export type ProcessedImage = {
  filename: string;
  originalName: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: number;
};

export async function processImage(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<ProcessedImage> {
  if (!IMAGE_ALLOWED_TYPES.includes(mimeType)) {
    throw new Error("Tiedostotyyppi ei ole sallittu. Käytä JPEG, PNG tai WebP.");
  }

  if (buffer.length > IMAGE_MAX_SIZE) {
    throw new Error("Tiedosto on liian suuri. Maksimikoko on 10 MB.");
  }

  ensureDirs();

  const id = uuid();
  const filename = `${id}.webp`;
  const thumbFilename = `${id}-thumb.webp`;

  // Save original
  const originalPath = path.join(originalDir, `${id}-original`);
  fs.writeFileSync(originalPath, buffer);

  // Process main image
  const mainImage = await sharp(buffer)
    .resize(IMAGE_MAX_DIMENSION, IMAGE_MAX_DIMENSION, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toFile(path.join(optimizedDir, filename));

  // Process thumbnail
  await sharp(buffer)
    .resize(THUMBNAIL_MAX_DIMENSION, THUMBNAIL_MAX_DIMENSION, {
      fit: "cover",
    })
    .webp({ quality: 75 })
    .toFile(path.join(optimizedDir, thumbFilename));

  return {
    filename,
    originalName,
    mimeType: "image/webp",
    width: mainImage.width,
    height: mainImage.height,
    sizeBytes: mainImage.size,
  };
}

export function deleteImageFiles(filename: string) {
  const id = filename.replace(".webp", "");
  const paths = [
    path.join(originalDir, `${id}-original`),
    path.join(optimizedDir, filename),
    path.join(optimizedDir, `${id}-thumb.webp`),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
}

export function getImagePath(filename: string): string | null {
  const filePath = path.join(optimizedDir, filename);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
