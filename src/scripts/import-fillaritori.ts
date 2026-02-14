import * as cheerio from "cheerio";
import { db } from "../server/db/index";
import { users, postings, postingAttributes, attributes } from "../server/db/schema";
import { eq } from "drizzle-orm";
import { POSTING_EXPIRY_DAYS } from "../lib/constants";

// ─── Configuration ──────────────────────────────────────────────

const IMPORTER_EMAIL = "importer@fillaritori.com";
const IMPORTER_NAME = "Fillaritori Import";

const CATEGORY_URLS: Array<{ url: string; categoryId: string }> = [
  { url: "https://www.fillaritori.com/forum/54-maantie/", categoryId: "tasamaa-maantie" },
];

const FETCH_DELAY_MS = 1000; // be polite to the server

// ─── Types ──────────────────────────────────────────────────────

interface ParsedListing {
  title: string;
  description: string;
  price: number; // cents
  location: string;
  sourceUrl: string;
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

// ─── Parse topic links from category page ───────────────────────

function parseTopicLinks(html: string): Array<{ url: string; title: string; tag: string }> {
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
    if (parentTag !== "h4" && parentTag !== "span" && !parent.hasClass("ipsType_break")) {
      // Also check grandparent
      const grandparent = parent.parent();
      const gpTag = grandparent.prop("tagName")?.toLowerCase();
      if (gpTag !== "h4") return;
    }

    topics.push({ url: href, title, tag: "" });
  });

  // Try to extract tags (Myydään/Ostetaan) from nearby elements
  // But we'll filter for "Myydään" topics primarily
  return topics;
}

// ─── Parse first post content from topic page ───────────────────

function parseFirstPost(html: string, topicTitle: string): ParsedListing | null {
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
      const contentDiv = article.find('[data-role="commentContent"], .ipsType_normal, .ipsContained').first();
      if (contentDiv.length) {
        postContent = contentDiv.html() || "";
      }
    }
  }

  // Last resort: find the largest text block that contains field labels
  if (!postContent) {
    $("div, td").each((_, el) => {
      const text = $(el).html() || "";
      if (text.includes("Merkki:") || text.includes("Hinta:") || text.includes("Paikkakunta:")) {
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
    fields["Paikkakunta"] || fields["paikkakunta"] || titleParsed.location || "Ei tiedossa";

  // Extract description
  const description =
    fields["Kuvaus"] || fields["kuvaus"] || fields["Lyhyt kuvaus"] || fields["lyhyt kuvaus"] || textContent.slice(0, 2000);

  // Build attributes
  const attrs: Record<string, string> = {};

  const brand = fields["Merkki"] || fields["merkki"] || titleParsed.brand;
  if (brand) attrs["bikeBrand"] = mapBrand(brand);

  const frameSize = fields["Rungon koko"] || fields["rungon koko"] || titleParsed.frameSize;
  if (frameSize) attrs["frameSize"] = frameSize;

  return {
    title: topicTitle,
    description,
    price,
    location,
    sourceUrl: "",
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
    "Merkki", "Malli", "Lyhyt kuvaus", "Rungon koko", "Kuvaus",
    "Hinta", "Paikkakunta", "Maakunta", "Yhteystiedot",
    "Vuosimalli", "Materiaali", "Kunto",
  ];
  // Match field labels with optional leading whitespace and flexible separator (colon + any space/nbsp)
  const labelPattern = fieldLabels.join("|");
  const fieldPattern = new RegExp(
    `(?:^|\\n)\\s*(${labelPattern})\\s*[:：]\\s*(.+)`, "gi"
  );

  let match;
  while ((match = fieldPattern.exec(text)) !== null) {
    const key = match[1].trim();
    let value = match[2].trim();
    // For multi-line fields like Kuvaus, grab until the next field label
    if (key.toLowerCase() === "kuvaus") {
      const rest = text.slice(match.index + match[0].length);
      const nextFieldPattern = new RegExp(`\\n\\s*(${labelPattern})\\s*[:：]`, "i");
      const nextFieldIdx = rest.search(nextFieldPattern);
      if (nextFieldIdx > 0) {
        value = (value + rest.slice(0, nextFieldIdx)).trim();
      }
    }
    fields[key] = value;
  }

  return fields;
}

function parseTitleFields(title: string): { brand: string; frameSize: string; location: string } {
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
  "Bianchi", "BMC", "Cannondale", "FOCUS", "Giant", "Lapierre", "Liv",
  "Orbea", "SCOTT", "Simplon", "Specialized", "Trek", "Wilier",
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
  const rows = await db.select({ id: attributes.id, key: attributes.key }).from(attributes);
  return new Map(rows.map((r) => [r.key, r.id]));
}

async function postingExistsByTitle(title: string): Promise<boolean> {
  const existing = await db
    .select({ id: postings.id })
    .from(postings)
    .where(eq(postings.title, title))
    .limit(1);
  return existing.length > 0;
}

async function insertPosting(
  listing: ParsedListing,
  authorId: string,
  categoryId: string,
  attrKeyToId: Map<string, string>
): Promise<string> {
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + POSTING_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(postings).values({
    id,
    authorId,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    location: listing.location,
    categoryId,
    status: "active",
    expiresAt,
  });

  // Insert attributes
  for (const [key, value] of Object.entries(listing.attributes)) {
    const attributeId = attrKeyToId.get(key);
    if (!attributeId) {
      console.warn(`  Attribute key "${key}" not found in DB, skipping`);
      continue;
    }
    await db.insert(postingAttributes).values({
      postingId: id,
      attributeId,
      value,
    });
  }

  return id;
}

// ─── Main ───────────────────────────────────────────────────────

async function main() {
  console.log("=== Fillaritori.com Importer ===\n");

  const authorId = await ensureImporterUser();
  const attrKeyToId = await getAttributeKeyToId();

  let totalImported = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  for (const { url, categoryId } of CATEGORY_URLS) {
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
      // Check for duplicate
      if (await postingExistsByTitle(topic.title)) {
        console.log(`  SKIP (duplicate): ${topic.title}`);
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

      // Insert into DB
      try {
        const postingId = await insertPosting(listing, authorId, categoryId, attrKeyToId);
        console.log(`  IMPORTED: ${listing.title} (${listing.price / 100}€) → ${postingId}`);
        totalImported++;
      } catch (err) {
        console.error(`  FAILED to insert: ${listing.title} - ${err}`);
        totalFailed++;
      }
    }
  }

  console.log("\n=== Import Summary ===");
  console.log(`  Imported: ${totalImported}`);
  console.log(`  Skipped (duplicates): ${totalSkipped}`);
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
