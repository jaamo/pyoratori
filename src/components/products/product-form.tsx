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
import {
  categoryGroups,
  getAttributesForCategory,
  getCategoryById,
} from "@/lib/categories";
import { createProduct, updateProduct } from "@/server/actions/products";
import type { ProductWithImages } from "@/types";
import { Check } from "lucide-react";
import Image from "next/image";

type UploadedImage = {
  id: string;
  filename: string;
  originalName: string;
};

type ProductFormProps = {
  product?: ProductWithImages;
};

const STEPS = [
  { label: "Kategoria" },
  { label: "Tarkemmat tiedot" },
  { label: "Perustiedot" },
  { label: "Esikatselu" },
];

export function ProductForm({ product }: ProductFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [categoryId, setCategoryId] = useState(product?.categoryId || "");
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(
    product ? String(product.price / 100) : ""
  );
  const [location, setLocation] = useState(product?.location || "");
  const [attributes, setAttributes] = useState<
    Record<string, string | number | boolean>
  >(product ? product.attributes : {});
  const [images, setImages] = useState<UploadedImage[]>(
    product?.images.map((img) => ({
      id: img.id,
      filename: img.filename,
      originalName: img.originalName,
    })) || []
  );
  const [error, setError] = useState("");
  const [stepError, setStepError] = useState("");
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

  function validateStep(step: number): boolean {
    switch (step) {
      case 0:
        if (!categoryId) {
          setStepError("Valitse kategoria ennen jatkamista.");
          return false;
        }
        return true;
      case 1: {
        const requiredAttrs = categoryAttributes.filter((a) => a.required);
        for (const attr of requiredAttrs) {
          const val = attributes[attr.key];
          if (val === undefined || val === "" || val === null) {
            setStepError(`${attr.label} on pakollinen.`);
            return false;
          }
        }
        return true;
      }
      case 2:
        if (!title.trim()) {
          setStepError("Otsikko on pakollinen.");
          return false;
        }
        if (!description.trim()) {
          setStepError("Kuvaus on pakollinen.");
          return false;
        }
        if (!price || Number(price) < 0) {
          setStepError("Hinta on pakollinen.");
          return false;
        }
        if (!location.trim()) {
          setStepError("Sijainti on pakollinen.");
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  function goNext() {
    setStepError("");
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(s + 1, 3));
    }
  }

  function goPrev() {
    setStepError("");
    setCurrentStep((s) => Math.max(s - 1, 0));
  }

  function goToStep(step: number) {
    setStepError("");
    setCurrentStep(step);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.set("title", title);
    formData.set("description", description);
    formData.set("price", price);
    formData.set("location", location);
    formData.set("categoryId", categoryId);
    formData.set("attributes", JSON.stringify(attributes));
    formData.set("imageIds", JSON.stringify(images.map((img) => img.id)));

    try {
      const result = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

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

  // Resolve category name for review
  const categoryInfo = getCategoryById(categoryId);

  // Filled attribute entries for review
  const filledAttributes = categoryAttributes.filter(
    (attr) =>
      attributes[attr.key] !== undefined &&
      attributes[attr.key] !== "" &&
      attributes[attr.key] !== null
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <nav aria-label="Lomakkeen vaiheet" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, i) => (
            <li
              key={i}
              className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : ""}`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                    i < currentStep
                      ? "border-primary bg-primary text-primary-foreground"
                      : i === currentStep
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-muted text-muted-foreground"
                  }`}
                >
                  {i < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`mt-1 text-xs ${
                    i <= currentStep
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-0.5 flex-1 ${
                    i < currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {stepError && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {stepError}
        </div>
      )}

      {/* Step 0: Category */}
      {currentStep === 0 && (
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
      )}

      {/* Step 1: Attributes */}
      {currentStep === 1 && (
        <div>
          {categoryAttributes.length > 0 ? (
            <DynamicAttributes
              attributes={categoryAttributes}
              values={attributes}
              onChange={handleAttributeChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Tälle kategorialle ei ole tarkempia tietoja.
            </p>
          )}
        </div>
      )}

      {/* Step 2: Details */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Otsikko</Label>
            <Input
              id="title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Esim. Trek Fuel EX 8 2023"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Kuvaus</Label>
            <Textarea
              id="description"
              name="description"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Sijainti</Label>
              <Input
                id="location"
                name="location"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Esim. Helsinki"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Kuvat</Label>
            <ImageUpload images={images} onChange={setImages} />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Category */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Kategoria
              </h3>
              <button
                type="button"
                onClick={() => goToStep(0)}
                className="text-sm text-primary hover:underline"
              >
                Muokkaa
              </button>
            </div>
            <p>{categoryInfo?.name || "-"}</p>
          </section>

          <hr />

          {/* Details */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Perustiedot
              </h3>
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="text-sm text-primary hover:underline"
              >
                Muokkaa
              </button>
            </div>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Otsikko</dt>
                <dd>{title}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Kuvaus</dt>
                <dd className="whitespace-pre-wrap">{description}</dd>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Hinta</dt>
                  <dd>{price} &euro;</dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Sijainti</dt>
                  <dd>{location}</dd>
                </div>
              </div>
              {images.length > 0 && (
                <div>
                  <dt className="text-sm text-muted-foreground mb-2">Kuvat</dt>
                  <dd className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="relative aspect-square overflow-hidden rounded-md border"
                      >
                        <Image
                          src={`/api/uploads/${img.filename}`}
                          alt={img.originalName}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 25vw, 20vw"
                        />
                      </div>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {/* Attributes */}
          {filledAttributes.length > 0 && (
            <>
              <hr />
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Tarkemmat tiedot
                  </h3>
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="text-sm text-primary hover:underline"
                  >
                    Muokkaa
                  </button>
                </div>
                <dl className="grid gap-2 sm:grid-cols-2">
                  {filledAttributes.map((attr) => (
                    <div key={attr.key}>
                      <dt className="text-sm text-muted-foreground">
                        {attr.label}
                      </dt>
                      <dd>
                        {attr.type === "boolean"
                          ? attributes[attr.key]
                            ? "Kyll\u00e4"
                            : "Ei"
                          : String(attributes[attr.key])}
                        {attr.unit ? ` ${attr.unit}` : ""}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            </>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
          >
            Edellinen
          </Button>
        )}
        <div className="flex-1" />
        {currentStep < 3 && (
          <Button type="button" onClick={goNext}>
            Seuraava
          </Button>
        )}
        {currentStep === 3 && (
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? product
                ? "P\u00e4ivitet\u00e4\u00e4n..."
                : "Julkaistaan..."
              : product
                ? "P\u00e4ivit\u00e4 ilmoitus"
                : "Julkaise ilmoitus"}
          </Button>
        )}
      </div>
    </form>
  );
}
