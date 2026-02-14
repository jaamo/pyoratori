import { db } from "@/server/db";
import { categories } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getCategoryTree() {
  const allCategories = await db.query.categories.findMany({
    orderBy: [categories.sortOrder],
  });

  // Build tree structure
  const parents = allCategories.filter((c) => !c.parentId);
  const tree = parents.map((parent) => ({
    ...parent,
    children: allCategories.filter((c) => c.parentId === parent.id),
  }));

  return tree;
}

export async function getTopLevelCategories() {
  return db.query.categories.findMany({
    where: eq(categories.parentId, ""),
    orderBy: [categories.sortOrder],
  });
}
