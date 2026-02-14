import { db } from "./index";
import { categories, attributes, categoryAttributes } from "./schema";
import { getAllCategories, getAllAttributes, getCategoryAttributeMappings } from "@/lib/categories";


async function seed() {
  console.log("Seeding categories...");

  const allCategories = getAllCategories();

  for (const cat of allCategories) {
    await db
      .insert(categories)
      .values(cat)
      .onConflictDoUpdate({
        target: categories.id,
        set: {
          name: cat.name,
          slug: cat.slug,
          parentId: cat.parentId,
          groupId: cat.groupId,
          sortOrder: cat.sortOrder,
        },
      });
  }

  console.log(`Seeded ${allCategories.length} categories.`);

  // Seed attributes
  console.log("Seeding attributes...");

  const allAttributes = getAllAttributes();

  for (const attr of allAttributes) {
    await db
      .insert(attributes)
      .values(attr)
      .onConflictDoUpdate({
        target: attributes.key,
        set: {
          label: attr.label,
          type: attr.type,
          options: attr.options,
          filterable: attr.filterable,
          required: attr.required,
          unit: attr.unit,
        },
      });
  }

  console.log(`Seeded ${allAttributes.length} attributes.`);

  // Build key→id lookup from DB
  const dbAttributes = await db.select({ id: attributes.id, key: attributes.key }).from(attributes);
  const keyToId = new Map(dbAttributes.map((a) => [a.key, a.id]));

  // Seed category_attributes
  console.log("Seeding category_attributes...");

  const mappings = getCategoryAttributeMappings();

  for (const mapping of mappings) {
    const attributeId = keyToId.get(mapping.attributeKey);
    if (!attributeId) {
      console.warn(`Attribute key "${mapping.attributeKey}" not found in DB, skipping.`);
      continue;
    }

    await db
      .insert(categoryAttributes)
      .values({
        categoryId: mapping.categoryId,
        attributeId,
        sortOrder: mapping.sortOrder,
      })
      .onConflictDoUpdate({
        target: [categoryAttributes.categoryId, categoryAttributes.attributeId],
        set: {
          sortOrder: mapping.sortOrder,
        },
      });
  }

  console.log(`Seeded ${mappings.length} category-attribute mappings.`);
}

seed()
  .then(() => {
    console.log("Seeding complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
