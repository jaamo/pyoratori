"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { AttributeDefinition } from "@/types";

type DynamicAttributesProps = {
  attributes: AttributeDefinition[];
  values: Record<string, string | number | boolean>;
  onChange: (key: string, value: string | number | boolean) => void;
};

export function DynamicAttributes({
  attributes,
  values,
  onChange,
}: DynamicAttributesProps) {
  if (attributes.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Tarkemmat tiedot</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {attributes.map((attr) => (
          <div key={attr.key} className="space-y-2">
            <Label htmlFor={attr.key}>
              {attr.label}
              {attr.required && <span className="text-destructive"> *</span>}
            </Label>

            {attr.type === "select" && attr.options && (
              <Select
                value={(values[attr.key] as string) || ""}
                onValueChange={(v) => onChange(attr.key, v)}
              >
                <SelectTrigger id={attr.key}>
                  <SelectValue placeholder="Valitse..." />
                </SelectTrigger>
                <SelectContent>
                  {attr.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {attr.type === "number" && (
              <div className="flex items-center gap-2">
                <Input
                  id={attr.key}
                  type="number"
                  min={attr.min}
                  max={attr.max}
                  value={(values[attr.key] as number) || ""}
                  onChange={(e) =>
                    onChange(attr.key, e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder={
                    attr.min !== undefined && attr.max !== undefined
                      ? `${attr.min}–${attr.max}`
                      : ""
                  }
                />
                {attr.unit && (
                  <span className="text-sm text-muted-foreground">
                    {attr.unit}
                  </span>
                )}
              </div>
            )}

            {attr.type === "text" && (
              <Input
                id={attr.key}
                value={(values[attr.key] as string) || ""}
                onChange={(e) => onChange(attr.key, e.target.value)}
              />
            )}

            {attr.type === "boolean" && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={attr.key}
                  checked={(values[attr.key] as boolean) || false}
                  onCheckedChange={(checked) =>
                    onChange(attr.key, checked === true)
                  }
                />
                <Label htmlFor={attr.key} className="font-normal">
                  Kyllä
                </Label>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
