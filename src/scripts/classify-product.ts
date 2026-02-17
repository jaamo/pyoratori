import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../server/db/index";
import {
  products,
  productAttributes,
  attributes,
  attributeValues,
} from "../server/db/schema";
import { eq, and, isNotNull, or, isNull, ne } from "drizzle-orm";
import { getAttributesForCategory } from "../lib/categories";
import { classifyProduct } from "../lib/classifier";

async function saveAttributes(
  productId: string,
  detected: Record<string, string>,
  attrKeyToId: Map<string, string>
) {
  let saved = 0;

  for (const [key, value] of Object.entries(detected)) {
    const attributeId = attrKeyToId.get(key);
    if (!attributeId) {
      console.warn(`  Attribute key "${key}" not found in DB, skipping`);
      continue;
    }

    // Look up attribute_value_id for select-type attributes
    const avRow = await db
      .select({ id: attributeValues.id })
      .from(attributeValues)
      .where(
        and(
          eq(attributeValues.attributeId, attributeId),
          eq(attributeValues.value, value)
        )
      )
      .limit(1);

    const attributeValueId = avRow.length > 0 ? avRow[0].id : null;

    // Upsert: delete existing then insert
    await db
      .delete(productAttributes)
      .where(
        and(
          eq(productAttributes.productId, productId),
          eq(productAttributes.attributeId, attributeId)
        )
      );

    await db.insert(productAttributes).values({
      productId,
      attributeId,
      attributeValueId,
      value: attributeValueId ? null : value,
    });

    saved++;
  }

  return saved;
}

async function main() {
  // Load imported products that need classification:
  // - classifiedAt is null (never classified), OR
  // - classifiedAt differs from updatedAt (data changed since last classification)
  const importedProducts = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      categoryId: products.categoryId,
      externalUrl: products.externalUrl,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .where(
      and(
        isNotNull(products.externalUrl),
        or(
          isNull(products.classifiedAt),
          ne(products.classifiedAt, products.updatedAt)
        )
      )
    );

  if (importedProducts.length === 0) {
    console.log("No imported products found (no products with externalUrl).");
    return;
  }

  console.log(`Found ${importedProducts.length} imported product(s) to classify.\n`);

  // Build attribute key <-> id maps once
  const allAttrs = await db
    .select({ id: attributes.id, key: attributes.key })
    .from(attributes);
  const attrKeyToId = new Map(allAttrs.map((a) => [a.key, a.id]));

  let totalClassified = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const p of importedProducts) {
    console.log(`--- ${p.title} (${p.id}) ---`);

    // Get attribute definitions for the category
    const attrDefs = getAttributesForCategory(p.categoryId);
    if (attrDefs.length === 0) {
      console.log(`  SKIP: no attributes defined for category "${p.categoryId}"`);
      totalSkipped++;
      continue;
    }

    try {
      const detected = await classifyProduct({
        title: p.title,
        description: p.description,
        attributes: attrDefs,
      });

      const keys = Object.keys(detected);
      if (keys.length === 0) {
        console.log("  No attributes detected.");
        totalSkipped++;
        continue;
      }

      // Save to DB
      const saved = await saveAttributes(p.id, detected, attrKeyToId);

      // Mark as classified by storing updatedAt into classifiedAt
      await db
        .update(products)
        .set({ classifiedAt: p.updatedAt })
        .where(eq(products.id, p.id));

      console.log(`  Saved ${saved} attributes: ${keys.join(", ")}`);
      totalClassified++;
    } catch (err) {
      console.error(`  FAILED: ${err}`);
      totalFailed++;
    }
  }

  console.log("\n=== Classification Summary ===");
  console.log(`  Classified: ${totalClassified}`);
  console.log(`  Skipped:    ${totalSkipped}`);
  console.log(`  Failed:     ${totalFailed}`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Classification failed:", err);
    process.exit(1);
  });
