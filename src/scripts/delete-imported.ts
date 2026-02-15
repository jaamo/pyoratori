import { db } from "../server/db/index";
import { products, images } from "../server/db/schema";
import { eq, isNotNull } from "drizzle-orm";
import { deleteImageFiles } from "../lib/images";

async function main() {
  // Find all imported products (those with externalUrl)
  const imported = await db
    .select({ id: products.id, title: products.title })
    .from(products)
    .where(isNotNull(products.externalUrl));

  if (imported.length === 0) {
    console.log("No imported products found.");
    return;
  }

  console.log(`Found ${imported.length} imported product(s) to delete.\n`);

  for (const p of imported) {
    // Delete image files from disk
    const productImages = await db
      .select({ filename: images.filename })
      .from(images)
      .where(eq(images.productId, p.id));

    for (const img of productImages) {
      deleteImageFiles(img.filename);
    }

    // Delete product (cascades to product_attributes and images in DB)
    await db.delete(products).where(eq(products.id, p.id));

    console.log(`  Deleted: ${p.title} (${productImages.length} images)`);
  }

  console.log(`\nDeleted ${imported.length} imported product(s).`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Delete failed:", err);
    process.exit(1);
  });
