import { db } from "./index";
import { categories } from "./schema";
import { getAllCategories } from "@/lib/categories";

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
