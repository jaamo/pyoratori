import { sqliteTable, text, integer, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ─── Auth.js tables ──────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  passwordHash: text("passwordHash"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

// ─── Application tables ──────────────────────────────────────────

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: text("parentId"),
  groupId: text("groupId").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
});

export const attributes = sqliteTable("attributes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull(), // "select" | "number" | "text" | "boolean"
  filterable: integer("filterable", { mode: "boolean" }).notNull().default(false),
  required: integer("required", { mode: "boolean" }).notNull().default(false),
  unit: text("unit"),
});

export const attributeValues = sqliteTable("attribute_values", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  attributeId: text("attributeId")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
}, (table) => [
  uniqueIndex("attribute_values_attr_value").on(table.attributeId, table.value),
]);

export const categoryAttributes = sqliteTable("category_attributes", {
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  attributeId: text("attributeId")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  sortOrder: integer("sortOrder").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.categoryId, table.attributeId] }),
]);

export const postings = sqliteTable("postings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  authorId: text("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // cents
  location: text("location").notNull(),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  status: text("status").notNull().default("active"),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const postingAttributes = sqliteTable("posting_attributes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postingId: text("posting_id").notNull().references(() => postings.id, { onDelete: "cascade" }),
  attributeId: text("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  attributeValueId: text("attribute_value_id").references(() => attributeValues.id),
  value: text("value"),
}, (table) => [
  uniqueIndex("posting_attributes_posting_attr").on(table.postingId, table.attributeId),
  index("posting_attributes_attr_value").on(table.attributeId, table.value),
  index("posting_attributes_attr_value_id").on(table.attributeValueId),
]);

export const images = sqliteTable("images", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postingId: text("postingId").references(() => postings.id, {
    onDelete: "cascade",
  }),
  filename: text("filename").notNull(),
  originalName: text("originalName").notNull(),
  mimeType: text("mimeType").notNull(),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("sizeBytes"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const conversations = sqliteTable("conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  postingId: text("postingId")
    .notNull()
    .references(() => postings.id, { onDelete: "cascade" }),
  buyerId: text("buyerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: text("sellerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const messages = sqliteTable("messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversationId")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: text("senderId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  readAt: integer("readAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const searchAlerts = sqliteTable("searchAlerts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  categoryId: text("categoryId"),
  query: text("query"),
  filters: text("filters").notNull().default("{}"), // JSON
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  lastNotifiedAt: integer("lastNotifiedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const passwordResetTokens = sqliteTable("passwordResetTokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
  usedAt: integer("usedAt", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
