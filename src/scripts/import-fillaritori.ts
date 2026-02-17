import { config } from "dotenv";
config({ path: ".env.local" });

import * as cheerio from "cheerio";
import { db } from "../server/db/index";
import {
  users,
  products,
  productAttributes,
  attributes,
  attributeValues,
  images,
} from "../server/db/schema";
import { eq, and } from "drizzle-orm";
import { PRODUCT_EXPIRY_DAYS } from "../lib/constants";
import { processImage, deleteImageFiles } from "../lib/images";
import { classifyCategory } from "../lib/classifier";

// ─── Configuration ──────────────────────────────────────────────

const IMPORTER_EMAIL = "importer@fillaritori.com";
const IMPORTER_NAME = "Fillaritori Import";

interface CategoryUrlEntry {
  url: string;
  categoryId?: string;
  candidateCategories?: Array<{ id: string; name: string }>;
  forceAttributes?: Record<string, string>;
}

const CATEGORY_URLS: CategoryUrlEntry[] = [
  // ── Static mappings ──
  {
    url: "https://www.fillaritori.com/forum/54-maantie/",
    categoryId: "maantie",
  },
  {
    url: "https://www.fillaritori.com/forum/69-triathlonaika-ajo/",
    categoryId: "aika-ajo-triathlon",
  },
  {
    url: "https://www.fillaritori.com/forum/99-rata/",
    categoryId: "ratapyora",
  },
  {
    url: "https://www.fillaritori.com/forum/57-joustamattomat/",
    categoryId: "taysjaykka-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/58-etujousitetut/",
    categoryId: "etujousitettu-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/72-t%C3%A4ysjousitetut-80-125mm/",
    categoryId: "taysjousto-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/74-t%C3%A4ysjousitetut-130-155mm/",
    categoryId: "taysjousto-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/75-t%C3%A4ysjousitetut-160-185mm/",
    categoryId: "taysjousto-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/112-t%C3%A4ysjousitetut-190-210mm/",
    categoryId: "taysjousto-maasto",
  },
  {
    url: "https://www.fillaritori.com/forum/70-fatbiket/",
    categoryId: "fatbike",
  },
  {
    url: "https://www.fillaritori.com/forum/5-lasten/",
    categoryId: "lasten-potkupyora",
  },
  {
    url: "https://www.fillaritori.com/forum/52-fiksit/",
    categoryId: "fiksi-sinkula",
  },
  {
    url: "https://www.fillaritori.com/forum/51-bmx/",
    categoryId: "bmx-dirt",
  },
  {
    url: "https://www.fillaritori.com/forum/79-dirtstreet/",
    categoryId: "bmx-dirt",
  },
  {
    url: "https://www.fillaritori.com/forum/77-tavarapy%C3%B6r%C3%A4t/",
    categoryId: "tavarapyora",
  },
  {
    url: "https://www.fillaritori.com/forum/53-muille-osastoille-sopimattomat/",
    categoryId: "muu",
  },

  // ── AI-classified (ambiguous forums) ──
  {
    url: "https://www.fillaritori.com/forum/55-cyclocrossgravel/",
    candidateCategories: [
      { id: "cyclocross", name: "Cyclocross" },
      { id: "gravel", name: "Gravel" },
    ],
  },
  {
    url: "https://www.fillaritori.com/forum/56-hybridfitness/",
    candidateCategories: [
      { id: "hybridi", name: "Hybridi" },
      { id: "fitness", name: "Fitness" },
    ],
  },
  {
    url: "https://www.fillaritori.com/forum/63-yksivaihteiset/",
    candidateCategories: [
      { id: "fiksi-sinkula", name: "Fiksi / Sinkula" },
      { id: "hybridi", name: "Hybridi" },
      { id: "muu", name: "Muu" },
    ],
  },
  {
    url: "https://www.fillaritori.com/forum/61-napavaihteiset/",
    candidateCategories: [
      { id: "hybridi", name: "Hybridi" },
      { id: "muu", name: "Muu" },
    ],
  },
  {
    url: "https://www.fillaritori.com/forum/62-ketjuvaihteiset/",
    candidateCategories: [
      { id: "hybridi", name: "Hybridi" },
      { id: "muu", name: "Muu" },
    ],
  },
  {
    url: "https://www.fillaritori.com/forum/60-vintageretro/",
    candidateCategories: [
      { id: "maantie", name: "Maantie" },
      { id: "hybridi", name: "Hybridi" },
      { id: "fiksi-sinkula", name: "Fiksi / Sinkula" },
      { id: "muu", name: "Muu" },
    ],
  },

  // ── E-bike forums (AI-classified + force electric attribute) ──
  {
    url: "https://www.fillaritori.com/forum/84-tasamaa/",
    candidateCategories: [
      { id: "maantie", name: "Maantie" },
      { id: "gravel", name: "Gravel" },
      { id: "hybridi", name: "Hybridi" },
      { id: "fitness", name: "Fitness" },
      { id: "muu", name: "Muu" },
    ],
    forceAttributes: { electric: "Kyllä" },
  },
  {
    url: "https://www.fillaritori.com/forum/85-maasto/",
    candidateCategories: [
      { id: "taysjaykka-maasto", name: "Täysjäykkä maasto" },
      { id: "etujousitettu-maasto", name: "Etujousitettu maasto" },
      { id: "taysjousto-maasto", name: "Täysjousto maasto" },
      { id: "fatbike", name: "Fatbike" },
    ],
    forceAttributes: { electric: "Kyllä" },
  },
  {
    url: "https://www.fillaritori.com/forum/86-muut/",
    candidateCategories: [
      { id: "hybridi", name: "Hybridi" },
      { id: "tavarapyora", name: "Tavarapyörä" },
      { id: "muu", name: "Muu" },
    ],
    forceAttributes: { electric: "Kyllä" },
  },
];

const FETCH_DELAY_MS = 1000; // be polite to the server

// ─── Types ──────────────────────────────────────────────────────

interface ParsedListing {
  title: string;
  description: string;
  price: number; // cents
  location: string;
  sourceUrl: string;
  imageUrls: string[];
  attributes: Record<string, string>;
}

// ─── Helpers ────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PyoratoriImporter/1.0)",
      Accept: "text/html",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

// JPEG starts with FF D8, PNG with 89 50 4E 47, WebP with 52 49 46 46 ... 57 45 42 50
function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47)
    return "image/png";
  if (
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  )
    return "image/webp";
  return null;
}

async function fetchImageBuffer(
  url: string,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PyoratoriImporter/1.0)",
        Accept: "image/*",
      },
    });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    // Verify the response is actually an image by checking magic bytes
    const mimeType = detectImageMime(buffer);
    if (!mimeType) return null;
    return { buffer, mimeType };
  } catch {
    return null;
  }
}

// ─── Parse topic links from category page ───────────────────────

function parseTopicLinks(
  html: string,
): Array<{ url: string; title: string; tag: string }> {
  const $ = cheerio.load(html);
  const topics: Array<{ url: string; title: string; tag: string }> = [];

  // Invision Community forum: topic links are inside <a> tags with /topic/ in href
  $('a[href*="/topic/"]').each((_, el) => {
    const href = $(el).attr("href");
    const title = $(el).text().trim();
    if (!href || !title) return;
    // Skip non-listing links (pagination, etc)
    if (title.length < 5) return;
    // Skip links inside user profile areas, pagination, breadcrumbs
    const parent = $(el).parent();
    const parentTag = parent.prop("tagName")?.toLowerCase();
    // Topic titles are typically in h4 elements or similar heading elements
    if (
      parentTag !== "h4" &&
      parentTag !== "span" &&
      !parent.hasClass("ipsType_break")
    ) {
      // Also check grandparent
      const grandparent = parent.parent();
      const gpTag = grandparent.prop("tagName")?.toLowerCase();
      if (gpTag !== "h4") return;
    }

    // Extract tag from nearby badge element (e.g. "Myydään", "Myyty", "Ostetaan")
    // Walk up to the topic row container and look for the badge
    // Note: "Myydään"/"Myyty" use class="ipsBadge", others use class="ipsTag_prefix"
    let tag = "";
    const topicRow = $(el).closest("li, tr, [data-role='topic']");
    if (topicRow.length) {
      const badge = topicRow
        .find("a.ipsBadge span, a.ipsTag_prefix span")
        .first();
      if (badge.length) {
        tag = badge.text().trim();
      }
    }

    topics.push({ url: href, title, tag });
  });

  return topics;
}

// ─── Parse first post content from topic page ───────────────────

function parseFirstPost(
  html: string,
  topicTitle: string,
): ParsedListing | null {
  const $ = cheerio.load(html);

  // Find the first post content - Invision Community uses various selectors
  // Try common Invision Community selectors
  let postContent = "";

  // Try data-role attribute first (Invision 4+)
  const commentContent = $('[data-role="commentContent"]').first();
  if (commentContent.length) {
    postContent = commentContent.html() || "";
  }

  // Fallback: look for the first post body area
  if (!postContent) {
    const postBody = $(".cPost_contentWrap .ipsType_normal").first();
    if (postBody.length) {
      postContent = postBody.html() || "";
    }
  }

  // Fallback: look for article content
  if (!postContent) {
    const article = $("article").first();
    if (article.length) {
      const contentDiv = article
        .find('[data-role="commentContent"], .ipsType_normal, .ipsContained')
        .first();
      if (contentDiv.length) {
        postContent = contentDiv.html() || "";
      }
    }
  }

  // Last resort: find the largest text block that contains field labels
  if (!postContent) {
    $("div, td").each((_, el) => {
      const text = $(el).html() || "";
      if (
        text.includes("Merkki:") ||
        text.includes("Hinta:") ||
        text.includes("Paikkakunta:")
      ) {
        if (text.length > postContent.length) {
          postContent = text;
        }
      }
    });
  }

  if (!postContent) {
    console.warn(`  Could not find post content for: ${topicTitle}`);
    return null;
  }

  // Extract first image URL — look for <a> links where href starts with //cdn2.fillaritori.com
  let imageUrl: string | null = null;
  $("a").each((_, el) => {
    if (imageUrl) return;
    const href = $(el).attr("href");
    if (!href) return;
    // Only match hrefs that point directly to cdn2 (not embedded in query params)
    if (
      href.startsWith("//cdn2.fillaritori.com/") ||
      href.startsWith("https://cdn2.fillaritori.com/")
    ) {
      imageUrl = href.startsWith("//") ? `https:${href}` : href;
    }
  });
  // Fallback: look for <img> tags from cdn2 inside the post content
  if (!imageUrl) {
    const postEl = cheerio.load(postContent);
    postEl("img").each((_, el) => {
      if (imageUrl) return;
      const src = postEl(el).attr("src");
      if (!src) return;
      if (
        src.startsWith("//cdn2.fillaritori.com/") ||
        src.startsWith("https://cdn2.fillaritori.com/")
      ) {
        imageUrl = src.startsWith("//") ? `https:${src}` : src;
      }
    });
  }
  const imageUrls = imageUrl ? [imageUrl] : [];

  // Convert HTML to text for field extraction
  const textContent = htmlToText(postContent);

  // Parse structured fields
  const fields = parseFields(textContent);
  const titleParsed = parseTitleFields(topicTitle);

  // Extract price
  const priceStr = fields["Hinta"] || fields["hinta"] || "";
  const price = parsePrice(priceStr);
  if (price === null) {
    console.warn(`  No valid price found for: ${topicTitle}`);
    return null;
  }

  // Extract location
  const location =
    fields["Paikkakunta"] ||
    fields["paikkakunta"] ||
    titleParsed.location ||
    "Ei tiedossa";

  // Extract description
  const description =
    fields["Kuvaus"] ||
    fields["kuvaus"] ||
    fields["Lyhyt kuvaus"] ||
    fields["lyhyt kuvaus"] ||
    textContent.slice(0, 2000);

  // Build attributes
  const attrs: Record<string, string> = {};

  const brand = fields["Merkki"] || fields["merkki"] || titleParsed.brand;
  if (brand) attrs["bikeBrand"] = mapBrand(brand);

  const frameSize =
    fields["Rungon koko"] || fields["rungon koko"] || titleParsed.frameSize;
  if (frameSize) attrs["frameSize"] = frameSize;

  return {
    title: topicTitle,
    description,
    price,
    location,
    sourceUrl: "",
    imageUrls,
    attributes: attrs,
  };
}

function htmlToText(html: string): string {
  // Replace <br> and block elements with newlines
  let text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n");
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  text = text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#160;/g, " ");
  // Replace non-breaking spaces (U+00A0) with regular spaces
  text = text.replace(/\u00a0/g, " ");
  // Normalize whitespace (but keep newlines)
  text = text.replace(/[ \t]+/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function parseFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const fieldLabels = [
    "Merkki",
    "Malli",
    "Lyhyt kuvaus",
    "Rungon koko",
    "Kuvaus",
    "Hinta",
    "Paikkakunta",
    "Maakunta",
    "Yhteystiedot",
    "Vuosimalli",
    "Materiaali",
    "Kunto",
  ];
  // Match field labels with optional leading whitespace and flexible separator (colon + any space/nbsp)
  const labelPattern = fieldLabels.join("|");
  const fieldPattern = new RegExp(
    `(?:^|\\n)\\s*(${labelPattern})\\s*[:：]\\s*(.+)`,
    "gi",
  );

  let match;
  while ((match = fieldPattern.exec(text)) !== null) {
    const key = match[1].trim();
    let value = match[2].trim();
    // For multi-line fields like Kuvaus, grab until the next field label
    if (key.toLowerCase() === "kuvaus") {
      const rest = text.slice(match.index + match[0].length);
      const nextFieldPattern = new RegExp(
        `\\n\\s*(${labelPattern})\\s*[:：]`,
        "i",
      );
      const nextFieldIdx = rest.search(nextFieldPattern);
      if (nextFieldIdx > 0) {
        value = (value + rest.slice(0, nextFieldIdx)).trim();
      }
    }
    fields[key] = value;
  }

  return fields;
}

function parseTitleFields(title: string): {
  brand: string;
  frameSize: string;
  location: string;
} {
  // Typical title format: "Brand Model description, size, location"
  // e.g. "Colnago Consept Aero maantiepyörä, 52, Järvenpää"
  const parts = title.split(",").map((p) => p.trim());

  let location = "";
  let frameSize = "";

  if (parts.length >= 3) {
    location = parts[parts.length - 1];
    frameSize = parts[parts.length - 2];
  } else if (parts.length === 2) {
    // Could be "Brand Model, location" or "Brand Model, size"
    const last = parts[1];
    if (/^\d+$/.test(last) || /^(XXS|XS|S|M|L|XL|XXL)$/i.test(last)) {
      frameSize = last;
    } else {
      location = last;
    }
  }

  // Extract brand (first word of title, ignoring tag prefix)
  let brand = "";
  const firstPart = parts[0] || title;
  // Remove common tag prefixes like [Myydään], [MYYTY] etc
  const cleanTitle = firstPart.replace(/^\[.*?\]\s*/, "").trim();
  const words = cleanTitle.split(/\s+/);
  if (words.length > 0) {
    brand = words[0];
  }

  return { brand, frameSize, location };
}

function parsePrice(priceStr: string): number | null {
  if (!priceStr) return null;
  // Remove currency symbols and whitespace, handle comma as decimal
  const cleaned = priceStr
    .replace(/[€$\s]/g, "")
    .replace(/,/g, ".")
    .replace(/[^\d.]/g, "");
  const num = parseFloat(cleaned);
  if (isNaN(num) || num <= 0) return null;
  return Math.round(num * 100); // convert to cents
}

const KNOWN_BRANDS = [
  "Bianchi",
  "BMC",
  "Cannondale",
  "FOCUS",
  "Giant",
  "Lapierre",
  "Liv",
  "Orbea",
  "SCOTT",
  "Simplon",
  "Specialized",
  "Trek",
  "Wilier",
];

function mapBrand(brand: string): string {
  const lower = brand.toLowerCase();
  const match = KNOWN_BRANDS.find((b) => b.toLowerCase() === lower);
  return match || "Muu";
}

// ─── Database operations ────────────────────────────────────────

async function ensureImporterUser(): Promise<string> {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, IMPORTER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    return existing[0].id;
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    name: IMPORTER_NAME,
    email: IMPORTER_EMAIL,
  });

  console.log(`Created importer user: ${IMPORTER_NAME} (${id})`);
  return id;
}

async function getAttributeKeyToId(): Promise<Map<string, string>> {
  const rows = await db
    .select({ id: attributes.id, key: attributes.key })
    .from(attributes);
  return new Map(rows.map((r) => [r.key, r.id]));
}

async function productExistsByExternalUrl(url: string): Promise<boolean> {
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.externalUrl, url))
    .limit(1);
  return existing.length > 0;
}

interface ExistingProduct {
  product: typeof products.$inferSelect;
  attrs: Record<string, string>;
  imageRows: (typeof images.$inferSelect)[];
}

async function getProductByExternalUrl(
  url: string,
): Promise<ExistingProduct | null> {
  const product = await db
    .select()
    .from(products)
    .where(eq(products.externalUrl, url))
    .limit(1);

  if (product.length === 0) return null;

  const p = product[0];

  // Fetch attributes with keys
  const attrRows = await db
    .select({
      key: attributes.key,
      value: productAttributes.value,
      avValue: attributeValues.value,
    })
    .from(productAttributes)
    .innerJoin(attributes, eq(productAttributes.attributeId, attributes.id))
    .leftJoin(
      attributeValues,
      eq(productAttributes.attributeValueId, attributeValues.id),
    )
    .where(eq(productAttributes.productId, p.id));

  const attrs: Record<string, string> = {};
  for (const row of attrRows) {
    const val = row.avValue || row.value;
    if (val) attrs[row.key] = val;
  }

  // Fetch images
  const imageRows = await db
    .select()
    .from(images)
    .where(eq(images.productId, p.id));

  return { product: p, attrs, imageRows };
}

async function markProductAsSoldByExternalUrl(url: string): Promise<boolean> {
  const existing = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.externalUrl, url))
    .limit(1);
  if (existing.length === 0) return false;

  await db
    .update(products)
    .set({ status: "sold", updatedAt: new Date() })
    .where(eq(products.externalUrl, url));
  return true;
}

async function insertProduct(
  listing: ParsedListing,
  authorId: string,
  categoryId: string,
  attrKeyToId: Map<string, string>,
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + PRODUCT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );

  await db.insert(products).values({
    id,
    authorId,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    categoryId,
    externalUrl: listing.sourceUrl || null,
    status: "public",
    expiresAt,
  });

  // Download and import images
  for (let i = 0; i < listing.imageUrls.length; i++) {
    const imgUrl = listing.imageUrls[i];
    try {
      await sleep(FETCH_DELAY_MS);
      const imgData = await fetchImageBuffer(imgUrl);
      if (!imgData) {
        console.warn(`    Image ${i + 1} failed to download: ${imgUrl}`);
        continue;
      }

      const originalName =
        imgUrl.split("/").pop()?.split("?")[0] || `image-${i}.jpg`;
      const processed = await processImage(
        imgData.buffer,
        originalName,
        imgData.mimeType,
      );

      await db.insert(images).values({
        productId: id,
        filename: processed.filename,
        originalName: processed.originalName,
        mimeType: processed.mimeType,
        width: processed.width,
        height: processed.height,
        sizeBytes: processed.sizeBytes,
        sortOrder: i,
      });

      console.log(
        `    Image ${i + 1}/${listing.imageUrls.length}: ${originalName}`,
      );
    } catch (err) {
      console.warn(`    Image ${i + 1} processing failed: ${err}`);
    }
  }

  // Insert attributes
  for (const [key, value] of Object.entries(listing.attributes)) {
    const attributeId = attrKeyToId.get(key);
    if (!attributeId) {
      console.warn(`  Attribute key "${key}" not found in DB, skipping`);
      continue;
    }

    // Look up attribute_value for select-type attributes
    const avRow = await db
      .select({ id: attributeValues.id })
      .from(attributeValues)
      .where(
        and(
          eq(attributeValues.attributeId, attributeId),
          eq(attributeValues.value, value),
        ),
      )
      .limit(1);

    if (avRow.length > 0) {
      await db.insert(productAttributes).values({
        productId: id,
        attributeId,
        attributeValueId: avRow[0].id,
        value: null,
      });
    } else {
      await db.insert(productAttributes).values({
        productId: id,
        attributeId,
        attributeValueId: null,
        value,
      });
    }
  }

  return id;
}

// ─── Update existing product ────────────────────────────────────

async function updateProductFromListing(
  existing: ExistingProduct,
  listing: ParsedListing,
  categoryId: string,
  attrKeyToId: Map<string, string>,
): Promise<boolean> {
  const { product: p, attrs: existingAttrs, imageRows } = existing;
  let changed = false;

  // Compare product fields
  const fieldUpdates: Partial<{
    title: string;
    description: string;
    price: number;
    location: string;
    categoryId: string;
    updatedAt: Date;
  }> = {};
  if (p.title !== listing.title) fieldUpdates.title = listing.title;
  if (p.description !== listing.description)
    fieldUpdates.description = listing.description;
  if (p.price !== listing.price) fieldUpdates.price = listing.price;
  if (p.location !== listing.location) fieldUpdates.location = listing.location;
  if (p.categoryId !== categoryId) fieldUpdates.categoryId = categoryId;

  if (Object.keys(fieldUpdates).length > 0) {
    fieldUpdates.updatedAt = new Date();
    await db.update(products).set(fieldUpdates).where(eq(products.id, p.id));
    changed = true;
  }

  // Compare attributes
  const attrsEqual =
    Object.keys(existingAttrs).length ===
      Object.keys(listing.attributes).length &&
    Object.entries(listing.attributes).every(
      ([k, v]) => existingAttrs[k] === v,
    );

  if (!attrsEqual) {
    // Delete old attributes
    await db
      .delete(productAttributes)
      .where(eq(productAttributes.productId, p.id));

    // Insert new attributes (same logic as insertProduct)
    for (const [key, value] of Object.entries(listing.attributes)) {
      const attributeId = attrKeyToId.get(key);
      if (!attributeId) {
        console.warn(`  Attribute key "${key}" not found in DB, skipping`);
        continue;
      }

      const avRow = await db
        .select({ id: attributeValues.id })
        .from(attributeValues)
        .where(
          and(
            eq(attributeValues.attributeId, attributeId),
            eq(attributeValues.value, value),
          ),
        )
        .limit(1);

      if (avRow.length > 0) {
        await db.insert(productAttributes).values({
          productId: p.id,
          attributeId,
          attributeValueId: avRow[0].id,
          value: null,
        });
      } else {
        await db.insert(productAttributes).values({
          productId: p.id,
          attributeId,
          attributeValueId: null,
          value,
        });
      }
    }
    changed = true;
  }

  // Compare images by originalName
  const existingOriginalNames = imageRows.map((img) => img.originalName).sort();
  const newOriginalNames = listing.imageUrls
    .map((url) => url.split("/").pop()?.split("?")[0] || "")
    .sort();

  const imagesEqual =
    existingOriginalNames.length === newOriginalNames.length &&
    existingOriginalNames.every((name, i) => name === newOriginalNames[i]);

  if (!imagesEqual) {
    // Delete old image files from disk and DB
    for (const img of imageRows) {
      deleteImageFiles(img.filename);
    }
    await db.delete(images).where(eq(images.productId, p.id));

    // Download and process new images
    for (let i = 0; i < listing.imageUrls.length; i++) {
      const imgUrl = listing.imageUrls[i];
      try {
        await sleep(FETCH_DELAY_MS);
        const imgData = await fetchImageBuffer(imgUrl);
        if (!imgData) {
          console.warn(`    Image ${i + 1} failed to download: ${imgUrl}`);
          continue;
        }

        const originalName =
          imgUrl.split("/").pop()?.split("?")[0] || `image-${i}.jpg`;
        const processed = await processImage(
          imgData.buffer,
          originalName,
          imgData.mimeType,
        );

        await db.insert(images).values({
          productId: p.id,
          filename: processed.filename,
          originalName: processed.originalName,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          sizeBytes: processed.sizeBytes,
          sortOrder: i,
        });

        console.log(
          `    Image ${i + 1}/${listing.imageUrls.length}: ${originalName}`,
        );
      } catch (err) {
        console.warn(`    Image ${i + 1} processing failed: ${err}`);
      }
    }
    changed = true;
  }

  return changed;
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const skipUpdates = args.includes("--skip-updates");

  console.log(
    `=== Fillaritori.com Importer ===${limit < Infinity ? ` (limit: ${limit})` : ""}${skipUpdates ? " (skip-updates)" : ""}\n`,
  );

  const authorId = await ensureImporterUser();
  const attrKeyToId = await getAttributeKeyToId();

  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  let totalMarkedSold = 0;
  let totalUpdated = 0;
  let totalUnchanged = 0;

  for (const entry of CATEGORY_URLS) {
    const { url } = entry;
    console.log(`\nFetching category: ${url}`);

    let categoryHtml: string;
    try {
      categoryHtml = await fetchPage(url);
    } catch (err) {
      console.error(`  Failed to fetch category page: ${err}`);
      continue;
    }

    const topics = parseTopicLinks(categoryHtml);
    console.log(`  Found ${topics.length} topics`);

    for (const topic of topics) {
      if (totalImported >= limit) break;

      // Filter by listing tag
      if (topic.tag === "Myyty") {
        // Check if this sold listing exists in our DB and mark it as sold
        if (await productExistsByExternalUrl(topic.url)) {
          const updated = await markProductAsSoldByExternalUrl(topic.url);
          if (updated) {
            console.log(`  MARKED SOLD: ${topic.title}`);
            totalMarkedSold++;
          }
        } else {
          console.log(`  SKIP (sold, not in DB): ${topic.title}`);
          totalSkipped++;
        }
        continue;
      }

      if (topic.tag !== "Myydään" && topic.tag !== "") {
        console.log(`  SKIP (tag: ${topic.tag}): ${topic.title}`);
        totalSkipped++;
        continue;
      }

      // Check if product already exists
      const existing = await getProductByExternalUrl(topic.url);

      if (existing && skipUpdates) {
        console.log(`  SKIP (exists, updates disabled): ${topic.title}`);
        totalSkipped++;
        continue;
      }

      // Fetch topic page
      await sleep(FETCH_DELAY_MS);

      let topicHtml: string;
      try {
        topicHtml = await fetchPage(topic.url);
      } catch (err) {
        console.error(`  Failed to fetch topic: ${topic.url} - ${err}`);
        totalFailed++;
        continue;
      }

      // Parse listing
      const listing = parseFirstPost(topicHtml, topic.title);
      if (!listing) {
        console.warn(`  SKIP (parse failed): ${topic.title}`);
        totalFailed++;
        continue;
      }

      listing.sourceUrl = topic.url;

      // Resolve category
      let resolvedCategoryId: string;
      if (entry.categoryId) {
        resolvedCategoryId = entry.categoryId;
      } else if (entry.candidateCategories) {
        try {
          resolvedCategoryId = await classifyCategory({
            title: listing.title,
            description: listing.description,
            candidates: entry.candidateCategories,
          });
          console.log(`  AI classified category: ${resolvedCategoryId}`);
        } catch (err) {
          resolvedCategoryId = entry.candidateCategories[0].id;
          console.warn(
            `  Category classification failed, using fallback "${resolvedCategoryId}": ${err}`,
          );
        }
      } else {
        resolvedCategoryId = "muu";
      }

      // Apply forced attributes (e.g., electric: "Kyllä" for e-bike forums)
      if (entry.forceAttributes) {
        Object.assign(listing.attributes, entry.forceAttributes);
      }

      if (existing) {
        // Update existing product if changed
        try {
          const wasUpdated = await updateProductFromListing(
            existing,
            listing,
            resolvedCategoryId,
            attrKeyToId,
          );
          if (wasUpdated) {
            console.log(`  UPDATED: ${listing.title}`);
            totalUpdated++;
          } else {
            console.log(`  UNCHANGED: ${listing.title}`);
            totalUnchanged++;
          }
        } catch (err) {
          console.error(`  FAILED to update: ${listing.title} - ${err}`);
          totalFailed++;
        }
      } else {
        // Insert new product
        try {
          const productId = await insertProduct(
            listing,
            authorId,
            resolvedCategoryId,
            attrKeyToId,
          );
          console.log(
            `  IMPORTED: ${listing.title} (${listing.price / 100}€, ${listing.imageUrls.length} images) → ${productId}`,
          );
          totalImported++;
        } catch (err) {
          console.error(`  FAILED to insert: ${listing.title} - ${err}`);
          totalFailed++;
        }
      }
    }
  }

  console.log("\n=== Import Summary ===");
  console.log(`  Imported: ${totalImported}`);
  console.log(`  Updated: ${totalUpdated}`);
  console.log(`  Unchanged: ${totalUnchanged}`);
  console.log(`  Marked sold: ${totalMarkedSold}`);
  console.log(`  Skipped: ${totalSkipped}`);
  console.log(`  Failed: ${totalFailed}`);
}

main()
  .then(() => {
    console.log("\nDone.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
