import { db } from "@/server/db";
import { products, images, users, categories, productAttributes, attributes, attributeValues } from "@/server/db/schema";
import { eq, desc, asc, and, like, gte, lte, sql, or, inArray } from "drizzle-orm";
import { PRODUCT_STATUS, PRODUCT_EXPIRY_DAYS, ITEMS_PER_PAGE } from "@/lib/constants";
import type { SearchFilters, ProductWithDetails, ProductWithImages } from "@/types";

async function checkExpiry<T extends { status: string; expiresAt: Date; id: string }>(product: T): Promise<T> {
  if (
    product.status === PRODUCT_STATUS.PUBLIC &&
    product.expiresAt < new Date()
  ) {
    // Mark as expired on read
    await db.update(products)
      .set({ status: PRODUCT_STATUS.EXPIRED })
      .where(eq(products.id, product.id));
    return { ...product, status: PRODUCT_STATUS.EXPIRED as T["status"] };
  }
  return product;
}

async function getAttributesForProducts(
  productIds: string[]
): Promise<Map<string, Record<string, string>>> {
  if (productIds.length === 0) return new Map();

  const rows = await db
    .select({
      productId: productAttributes.productId,
      key: attributes.key,
      value: sql<string>`COALESCE(${attributeValues.value}, ${productAttributes.value})`.as("value"),
    })
    .from(productAttributes)
    .innerJoin(attributes, eq(productAttributes.attributeId, attributes.id))
    .leftJoin(attributeValues, eq(productAttributes.attributeValueId, attributeValues.id))
    .where(inArray(productAttributes.productId, productIds));

  const map = new Map<string, Record<string, string>>();
  for (const row of rows) {
    if (!row.value) continue;
    if (!map.has(row.productId)) map.set(row.productId, {});
    map.get(row.productId)![row.key] = row.value;
  }
  return map;
}

export async function getProductById(
  id: string
): Promise<ProductWithDetails | null> {
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) return null;

  const checked = await checkExpiry(product);

  const [productImages, attrsMap, author, category] = await Promise.all([
    db.query.images.findMany({
      where: eq(images.productId, id),
      orderBy: [images.sortOrder],
    }),
    getAttributesForProducts([id]),
    db.query.users.findFirst({
      where: eq(users.id, checked.authorId),
      columns: { id: true, name: true, email: true },
    }),
    db.query.categories.findFirst({
      where: eq(categories.id, checked.categoryId),
    }),
  ]);

  if (!author || !category) return null;

  return {
    ...checked,
    images: productImages,
    attributes: attrsMap.get(id) || {},
    author,
    category,
  };
}

export async function searchProducts(
  filters: SearchFilters
): Promise<{ products: ProductWithImages[]; total: number }> {
  const conditions = [eq(products.status, PRODUCT_STATUS.PUBLIC)];

  // Only show non-expired
  conditions.push(gte(products.expiresAt, new Date()));

  if (filters.query) {
    const q = `%${filters.query}%`;
    conditions.push(
      or(like(products.title, q), like(products.description, q))!
    );
  }

  if (filters.categoryId) {
    // Check if this is a parent category
    const childCategories = await db.query.categories.findMany({
      where: eq(categories.parentId, filters.categoryId),
    });

    if (childCategories.length > 0) {
      const categoryIds = [
        filters.categoryId,
        ...childCategories.map((c) => c.id),
      ];
      conditions.push(
        sql`${products.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    } else {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(products.price, filters.minPrice * 100));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(products.price, filters.maxPrice * 100));
  }

  if (filters.location) {
    conditions.push(like(products.location, `%${filters.location}%`));
  }

  // Attribute filtering using EXISTS subqueries joining through attributes table
  if (filters.attributes) {
    for (const [key, value] of Object.entries(filters.attributes)) {
      if (value !== undefined && value !== "" && value !== null) {
        conditions.push(
          sql`EXISTS (SELECT 1 FROM product_attributes INNER JOIN attributes ON product_attributes.attribute_id = attributes.id LEFT JOIN attribute_values ON product_attributes.attribute_value_id = attribute_values.id WHERE product_attributes.product_id = ${products.id} AND attributes.key = ${key} AND COALESCE(attribute_values.value, product_attributes.value) = ${String(value)})`
        );
      }
    }
  }

  const where = and(...conditions);
  const page = filters.page || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  let orderByClause;
  switch (filters.sort) {
    case "price_asc":
      orderByClause = asc(products.price);
      break;
    case "price_desc":
      orderByClause = desc(products.price);
      break;
    default:
      orderByClause = desc(products.createdAt);
  }

  const results = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(orderByClause)
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .where(where);

  const total = countResult[0]?.count || 0;

  // Fetch images and attributes for all products
  const productIds = results.map((p) => p.id);
  const attrsMap = await getAttributesForProducts(productIds);

  const productsWithImages: ProductWithImages[] = await Promise.all(
    results.map(async (p) => {
      const productImages = await db.query.images.findMany({
        where: eq(images.productId, p.id),
        orderBy: [images.sortOrder],
      });
      return { ...p, images: productImages, attributes: attrsMap.get(p.id) || {} };
    })
  );

  return { products: productsWithImages, total };
}

export async function getLatestProducts(
  limit: number = 4
): Promise<ProductWithImages[]> {
  const results = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, PRODUCT_STATUS.PUBLIC),
        gte(products.expiresAt, new Date())
      )
    )
    .orderBy(desc(products.createdAt))
    .limit(limit);

  const productIds = results.map((p) => p.id);
  const attrsMap = await getAttributesForProducts(productIds);

  const productsWithImages: ProductWithImages[] = await Promise.all(
    results.map(async (p) => {
      const productImages = await db.query.images.findMany({
        where: eq(images.productId, p.id),
        orderBy: [images.sortOrder],
      });
      return { ...p, images: productImages, attributes: attrsMap.get(p.id) || {} };
    })
  );

  return productsWithImages;
}

export async function getProductsByUser(
  userId: string
): Promise<ProductWithImages[]> {
  const results = await db.query.products.findMany({
    where: eq(products.authorId, userId),
    orderBy: [desc(products.createdAt)],
  });

  const productIds = results.map((p) => p.id);
  const attrsMap = await getAttributesForProducts(productIds);

  const productsWithImages: ProductWithImages[] = await Promise.all(
    results.map(async (p) => {
      const checked = await checkExpiry(p);
      const productImages = await db.query.images.findMany({
        where: eq(images.productId, p.id),
        orderBy: [images.sortOrder],
      });
      return { ...checked, images: productImages, attributes: attrsMap.get(p.id) || {} };
    })
  );

  return productsWithImages;
}
