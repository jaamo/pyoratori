import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "../server/db/index";
import {
  products,
  productAttributes,
  attributes,
  attributeValues,
} from "../server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAttributesForCategory } from "../lib/categories";
import { classifyProduct } from "../lib/classifier";

async function main() {
  const args = process.argv.slice(2);
  const saveMode = args.includes("--save");
  const productId = args.find((a) => !a.startsWith("--"));

  if (!productId) {
    console.error("Usage: tsx src/scripts/classify-product.ts <product-id> [--save]");
    process.exit(1);
  }

  // Load product
  const product = await db
    .select({
      id: products.id,
      title: products.title,
      description: products.description,
      categoryId: products.categoryId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (product.length === 0) {
    console.error(`Product not found: ${productId}`);
    process.exit(1);
  }

  const p = product[0];
  console.log("=== Product ===");
  console.log(`ID:       ${p.id}`);
  console.log(`Title:    ${p.title}`);
  console.log(`Category: ${p.categoryId}`);
  console.log(`Description:\n${p.description.slice(0, 500)}${p.description.length > 500 ? "..." : ""}\n`);

  // Get attribute definitions for the category
  const attrDefs = getAttributesForCategory(p.categoryId);
  if (attrDefs.length === 0) {
    console.error(`No attributes defined for category: ${p.categoryId}`);
    process.exit(1);
  }

  // Load current attributes from DB
  const currentAttrs = await db
    .select({
      attributeId: productAttributes.attributeId,
      attributeValueId: productAttributes.attributeValueId,
      value: productAttributes.value,
    })
    .from(productAttributes)
    .where(eq(productAttributes.productId, p.id));

  // Build attribute ID → key map
  const allAttrs = await db
    .select({ id: attributes.id, key: attributes.key })
    .from(attributes);
  const attrIdToKey = new Map(allAttrs.map((a) => [a.id, a.key]));
  const attrKeyToId = new Map(allAttrs.map((a) => [a.key, a.id]));

  // Build current attribute values map (key → value)
  const currentMap: Record<string, string> = {};
  for (const ca of currentAttrs) {
    const key = attrIdToKey.get(ca.attributeId);
    if (!key) continue;

    if (ca.attributeValueId) {
      // Look up the display value
      const av = await db
        .select({ value: attributeValues.value })
        .from(attributeValues)
        .where(eq(attributeValues.id, ca.attributeValueId))
        .limit(1);
      if (av.length > 0) {
        currentMap[key] = av[0].value;
      }
    } else if (ca.value) {
      currentMap[key] = ca.value;
    }
  }

  // Run classifier
  console.log("Running LLM classifier...\n");
  const detected = await classifyProduct({
    title: p.title,
    description: p.description,
    attributes: attrDefs,
  });

  // Display comparison
  console.log("=== Attribute Comparison ===");
  console.log(
    `${"Attribute".padEnd(20)} ${"Current".padEnd(25)} ${"LLM Detected".padEnd(25)} Status`
  );
  console.log("-".repeat(85));

  for (const attr of attrDefs) {
    const current = currentMap[attr.key] || "-";
    const llm = detected[attr.key] || "-";
    let status = "";

    if (current === "-" && llm !== "-") {
      status = "NEW";
    } else if (current !== "-" && llm !== "-" && current !== llm) {
      status = "CHANGED";
    } else if (current === llm && current !== "-") {
      status = "MATCH";
    }

    console.log(
      `${attr.key.padEnd(20)} ${current.padEnd(25)} ${llm.padEnd(25)} ${status}`
    );
  }

  if (!saveMode) {
    console.log("\nDry run — no changes saved. Use --save to write to DB.");
    return;
  }

  // Save detected attributes to DB
  console.log("\nSaving detected attributes to DB...");
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
          eq(productAttributes.productId, p.id),
          eq(productAttributes.attributeId, attributeId)
        )
      );

    await db.insert(productAttributes).values({
      productId: p.id,
      attributeId,
      attributeValueId,
      value: attributeValueId ? null : value,
    });

    saved++;
  }

  console.log(`Saved ${saved} attributes.`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Classification failed:", err);
    process.exit(1);
  });
