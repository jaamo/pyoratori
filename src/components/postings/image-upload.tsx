"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadImage, deleteImage } from "@/server/actions/images";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

type UploadedImage = {
  id: string;
  filename: string;
  originalName: string;
};

type ImageUploadProps = {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxImages?: number;
};

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      if (images.length >= maxImages) break;

      const formData = new FormData();
      formData.set("file", file);

      const result = await uploadImage(formData);
      if (result.image) {
        onChange([
          ...images,
          {
            id: result.image.id,
            filename: result.image.filename,
            originalName: result.image.originalName,
          },
        ]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    await deleteImage(imageId);
    onChange(images.filter((img) => img.id !== imageId));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
        {images.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-md border"
          >
            <Image
              src={`/api/uploads/${img.filename}`}
              alt={img.originalName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
            />
            <button
              type="button"
              onClick={() => handleRemove(img.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed hover:border-foreground/50 hover:bg-accent">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
                <span className="mt-1 text-xs text-muted-foreground">
                  Lisää kuva
                </span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Enintään {maxImages} kuvaa. JPEG, PNG tai WebP, max 10 MB / kuva.
      </p>
    </div>
  );
}
