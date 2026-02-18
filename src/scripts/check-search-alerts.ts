import { db } from "../server/db/index";
import { searchAlerts, notifications } from "../server/db/schema";
import { eq } from "drizzle-orm";
import { searchProducts } from "../server/queries/products";
import type { SearchFilters } from "../types";

async function main() {
  console.log("Checking search alerts...\n");

  const alerts = await db
    .select()
    .from(searchAlerts)
    .where(eq(searchAlerts.isActive, true));

  if (alerts.length === 0) {
    console.log("No active search alerts found.");
    return;
  }

  console.log(`Found ${alerts.length} active alert(s).\n`);

  let totalNotifications = 0;

  for (const alert of alerts) {
    console.log(`Checking alert: "${alert.name}" (${alert.id})`);

    // Parse stored filters
    let storedFilters: Record<string, string> = {};
    try {
      storedFilters = JSON.parse(alert.filters);
    } catch {
      console.log("  Warning: Invalid filters JSON, skipping.");
      continue;
    }

    // Parse stored product IDs
    let storedProductIds: string[] = [];
    try {
      storedProductIds = JSON.parse(alert.productIds);
    } catch {
      storedProductIds = [];
    }

    // Build search filters matching the web search logic
    const searchFilters: SearchFilters = {};
    if (alert.query) searchFilters.query = alert.query;
    if (alert.categoryId) searchFilters.categoryId = alert.categoryId;

    // Map stored filter keys to SearchFilters
    if (storedFilters.minPrice)
      searchFilters.minPrice = parseFloat(storedFilters.minPrice);
    if (storedFilters.maxPrice)
      searchFilters.maxPrice = parseFloat(storedFilters.maxPrice);
    if (storedFilters.location)
      searchFilters.location = storedFilters.location;

    // Extract attribute filters (attr_ prefixed)
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(storedFilters)) {
      if (key.startsWith("attr_") && value) {
        attributes[key.replace("attr_", "")] = value;
      }
    }
    if (Object.keys(attributes).length > 0) {
      searchFilters.attributes = attributes;
    }

    // Execute search (fetch all pages to get full result set)
    const { products: currentProducts } = await searchProducts(searchFilters);
    const currentProductIds = currentProducts.map((p) => p.id);

    // Find new products not in the stored snapshot
    const storedSet = new Set(storedProductIds);
    const newProductIds = currentProductIds.filter(
      (id) => !storedSet.has(id)
    );

    console.log(
      `  Current: ${currentProductIds.length} products, Stored: ${storedProductIds.length}, New: ${newProductIds.length}`
    );

    if (newProductIds.length > 0) {
      // Create notification
      const count = newProductIds.length;
      await db.insert(notifications).values({
        userId: alert.userId,
        searchAlertId: alert.id,
        title: `${count} uutta ilmoitusta`,
        message: `Hakuvahti "${alert.name}" löysi ${count} uutta ilmoitusta.`,
        productIds: JSON.stringify(newProductIds),
      });

      totalNotifications++;
      console.log(`  Created notification for ${count} new product(s).`);
    }

    // Update snapshot and last checked time
    await db
      .update(searchAlerts)
      .set({
        productIds: JSON.stringify(currentProductIds),
        lastCheckedAt: new Date(),
      })
      .where(eq(searchAlerts.id, alert.id));
  }

  console.log(
    `\nDone. Created ${totalNotifications} notification(s) for ${alerts.length} alert(s).`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
