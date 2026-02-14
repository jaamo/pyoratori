"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { DynamicAttributes } from "./dynamic-attributes";
import { ImageUpload } from "./image-upload";
import { categoryGroups, getAttributesForCategory } from "@/lib/categories";
import { createPosting, updatePosting } from "@/server/actions/postings";
import type { PostingWithImages } from "@/types";

type UploadedImage = {
  id: string;
  filename: string;
  originalName: string;
};

type PostingFormProps = {
  posting?: PostingWithImages;
};

export function PostingForm({ posting }: PostingFormProps) {
  const [categoryId, setCategoryId] = useState(posting?.categoryId || "");
  const [attributes, setAttributes] = useState<
    Record<string, string | number | boolean>
  >(posting ? JSON.parse(posting.attributes) : {});
  const [images, setImages] = useState<UploadedImage[]>(
    posting?.images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
    })) || []
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categoryAttributes = getAttributesForCategory(categoryId);

  function handleCategoryChange(value: string) {
    setCategoryId(value);
    setAttributes({});
  }

  function handleAttributeChange(
    key: string,
    value: string | number | boolean
  ) {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("categoryId", categoryId);
    formData.set("attributes", JSON.stringify(attributes));
    formData.set("imageIds", JSON.stringify(images.map((img) => img.id)));

    try {
      const result = posting
        ? await updatePosting(posting.id, formData)
        : await createPosting(formData);

      if (result?.error) {
        setError(result.error);
        setLoading(false);
      }
      // Redirect happens in the server action on success
    } catch {
      setLoading(false);
    }
  }

  // Build category options grouped by parent
  const categoryOptions: {
    groupName: string;
    parentName: string;
    items: { id: string; name: string }[];
  }[] = [];

  for (const group of categoryGroups) {
    for (const cat of group.categories) {
      if (cat.children) {
        categoryOptions.push({
          groupName: group.name,
          parentName: cat.name,
          items: cat.children.map((c) => ({ id: c.id, name: c.name })),
        });
      } else {
        categoryOptions.push({
          groupName: group.name,
          parentName: "",
          items: [{ id: cat.id, name: cat.name }],
        });
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Otsikko</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={posting?.title}
          placeholder="Esim. Trek Fuel EX 8 2023"
          maxLength={200}
        />
      </div>

      <div className="space-y-2">
        <Label>Kategoria</Label>
        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Valitse kategoria..." />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((group, i) => (
              <SelectGroup key={i}>
                <SelectLabel>
                  {group.parentName
                    ? `${group.groupName} / ${group.parentName}`
                    : group.groupName}
                </SelectLabel>
                {group.items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {categoryAttributes.length > 0 && (
        <DynamicAttributes
          attributes={categoryAttributes}
          values={attributes}
          onChange={handleAttributeChange}
        />
      )}

      <div className="space-y-2">
        <Label>Kuvat</Label>
        <ImageUpload images={images} onChange={setImages} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Kuvaus</Label>
        <Textarea
          id="description"
          name="description"
          required
          defaultValue={posting?.description}
          placeholder="Kerro tuotteesta tarkemmin..."
          rows={6}
          maxLength={5000}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Hinta (&euro;)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            max="999999"
            required
            defaultValue={posting ? posting.price / 100 : undefined}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Sijainti</Label>
          <Input
            id="location"
            name="location"
            required
            defaultValue={posting?.location}
            placeholder="Esim. Helsinki"
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? posting
            ? "Päivitetään..."
            : "Julkaistaan..."
          : posting
            ? "Päivitä ilmoitus"
            : "Julkaise ilmoitus"}
      </Button>
    </form>
  );
}
