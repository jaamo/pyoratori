import { db } from "@/server/db";
import { postings, images, users, categories, postingAttributes, attributes } from "@/server/db/schema";
import { eq, desc, and, like, gte, lte, sql, or, inArray } from "drizzle-orm";
import { POSTING_STATUS, POSTING_EXPIRY_DAYS, ITEMS_PER_PAGE } from "@/lib/constants";
import type { SearchFilters, PostingWithDetails, PostingWithImages } from "@/types";

function checkExpiry<T extends { status: string; expiresAt: Date; id: string }>(posting: T): T {
  if (
    posting.status === POSTING_STATUS.ACTIVE &&
    posting.expiresAt < new Date()
  ) {
    // Mark as expired on read
    db.update(postings)
      .set({ status: POSTING_STATUS.EXPIRED })
      .where(eq(postings.id, posting.id))
      .run();
    return { ...posting, status: POSTING_STATUS.EXPIRED as T["status"] };
  }
  return posting;
}

async function getAttributesForPostings(
  postingIds: string[]
): Promise<Map<string, Record<string, string>>> {
  if (postingIds.length === 0) return new Map();

  const rows = await db
    .select({
      postingId: postingAttributes.postingId,
      key: attributes.key,
      value: postingAttributes.value,
    })
    .from(postingAttributes)
    .innerJoin(attributes, eq(postingAttributes.attributeId, attributes.id))
    .where(inArray(postingAttributes.postingId, postingIds));

  const map = new Map<string, Record<string, string>>();
  for (const row of rows) {
    if (!map.has(row.postingId)) map.set(row.postingId, {});
    map.get(row.postingId)![row.key] = row.value;
  }
  return map;
}

export async function getPostingById(
  id: string
): Promise<PostingWithDetails | null> {
  const posting = await db.query.postings.findFirst({
    where: eq(postings.id, id),
  });

  if (!posting) return null;

  const checked = checkExpiry(posting);

  const [postingImages, attrsMap, author, category] = await Promise.all([
    db.query.images.findMany({
      where: eq(images.postingId, id),
      orderBy: [images.sortOrder],
    }),
    getAttributesForPostings([id]),
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
    images: postingImages,
    attributes: attrsMap.get(id) || {},
    author,
    category,
  };
}

export async function searchPostings(
  filters: SearchFilters
): Promise<{ postings: PostingWithImages[]; total: number }> {
  const conditions = [eq(postings.status, POSTING_STATUS.ACTIVE)];

  // Only show non-expired
  conditions.push(gte(postings.expiresAt, new Date()));

  if (filters.query) {
    const q = `%${filters.query}%`;
    conditions.push(
      or(like(postings.title, q), like(postings.description, q))!
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
        sql`${postings.categoryId} IN (${sql.join(
          categoryIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );
    } else {
      conditions.push(eq(postings.categoryId, filters.categoryId));
    }
  }

  if (filters.minPrice !== undefined) {
    conditions.push(gte(postings.price, filters.minPrice * 100));
  }

  if (filters.maxPrice !== undefined) {
    conditions.push(lte(postings.price, filters.maxPrice * 100));
  }

  if (filters.location) {
    conditions.push(like(postings.location, `%${filters.location}%`));
  }

  // Attribute filtering using EXISTS subqueries joining through attributes table
  if (filters.attributes) {
    for (const [key, value] of Object.entries(filters.attributes)) {
      if (value !== undefined && value !== "" && value !== null) {
        conditions.push(
          sql`EXISTS (SELECT 1 FROM posting_attributes INNER JOIN attributes ON posting_attributes.attribute_id = attributes.id WHERE posting_attributes.posting_id = ${postings.id} AND attributes.key = ${key} AND posting_attributes.value = ${String(value)})`
        );
      }
    }
  }

  const where = and(...conditions);
  const page = filters.page || 1;
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const results = await db
    .select()
    .from(postings)
    .where(where)
    .orderBy(desc(postings.createdAt))
    .limit(ITEMS_PER_PAGE)
    .offset(offset);

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(postings)
    .where(where);

  const total = countResult[0]?.count || 0;

  // Fetch images and attributes for all postings
  const postingIds = results.map((p) => p.id);
  const attrsMap = await getAttributesForPostings(postingIds);

  const postingsWithImages: PostingWithImages[] = await Promise.all(
    results.map(async (p) => {
      const postingImages = await db.query.images.findMany({
        where: eq(images.postingId, p.id),
        orderBy: [images.sortOrder],
      });
      return { ...p, images: postingImages, attributes: attrsMap.get(p.id) || {} };
    })
  );

  return { postings: postingsWithImages, total };
}

export async function getPostingsByUser(
  userId: string
): Promise<PostingWithImages[]> {
  const results = await db.query.postings.findMany({
    where: eq(postings.authorId, userId),
    orderBy: [desc(postings.createdAt)],
  });

  const postingIds = results.map((p) => p.id);
  const attrsMap = await getAttributesForPostings(postingIds);

  const postingsWithImages: PostingWithImages[] = await Promise.all(
    results.map(async (p) => {
      const checked = checkExpiry(p);
      const postingImages = await db.query.images.findMany({
        where: eq(images.postingId, p.id),
        orderBy: [images.sortOrder],
      });
      return { ...checked, images: postingImages, attributes: attrsMap.get(p.id) || {} };
    })
  );

  return postingsWithImages;
}
