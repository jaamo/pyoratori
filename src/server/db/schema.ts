import { pgTable, text, integer, boolean, timestamp, uuid, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";

// ─── Auth.js tables ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  passwordHash: text("passwordHash"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
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

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verificationTokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
});

// ─── Application tables ──────────────────────────────────────────

export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  parentId: text("parentId"),
  groupId: text("groupId").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
});

export const attributes = pgTable("attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  label: text("label").notNull(),
  type: text("type").notNull(), // "select" | "number" | "text" | "boolean"
  filterable: boolean("filterable").notNull().default(false),
  required: boolean("required").notNull().default(false),
  unit: text("unit"),
});

export const attributeValues = pgTable("attribute_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  attributeId: uuid("attributeId")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  sortOrder: integer("sortOrder").notNull().default(0),
}, (table) => [
  uniqueIndex("attribute_values_attr_value").on(table.attributeId, table.value),
]);

export const categoryAttributes = pgTable("category_attributes", {
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  attributeId: uuid("attributeId")
    .notNull()
    .references(() => attributes.id, { onDelete: "cascade" }),
  sortOrder: integer("sortOrder").notNull().default(0),
}, (table) => [
  primaryKey({ columns: [table.categoryId, table.attributeId] }),
]);

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("authorId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // cents
  location: text("location").notNull(),
  categoryId: text("categoryId")
    .notNull()
    .references(() => categories.id),
  externalUrl: text("externalUrl"),
  status: text("status").notNull().default("public"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  expiresAt: timestamp("expiresAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  classifiedAt: timestamp("classifiedAt"),
});

export const productAttributes = pgTable("product_attributes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  attributeId: uuid("attribute_id").notNull().references(() => attributes.id, { onDelete: "cascade" }),
  attributeValueId: uuid("attribute_value_id").references(() => attributeValues.id),
  value: text("value"),
}, (table) => [
  uniqueIndex("product_attributes_product_attr").on(table.productId, table.attributeId),
  index("product_attributes_attr_value").on(table.attributeId, table.value),
  index("product_attributes_attr_value_id").on(table.attributeValueId),
]);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("productId").references(() => products.id, {
    onDelete: "cascade",
  }),
  filename: text("filename").notNull(),
  originalName: text("originalName").notNull(),
  mimeType: text("mimeType").notNull(),
  width: integer("width"),
  height: integer("height"),
  sizeBytes: integer("sizeBytes"),
  sortOrder: integer("sortOrder").notNull().default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("productId")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  buyerId: uuid("buyerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: uuid("sellerId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversationId")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  senderId: uuid("senderId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const searchAlerts = pgTable("search_alerts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  categoryId: text("categoryId"),
  query: text("query"),
  filters: text("filters").notNull().default("{}"), // JSON string
  productIds: text("productIds").notNull().default("[]"), // JSON array of product IDs
  isActive: boolean("isActive").notNull().default(true),
  lastCheckedAt: timestamp("lastCheckedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  searchAlertId: uuid("searchAlertId")
    .notNull()
    .references(() => searchAlerts.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  productIds: text("productIds").notNull().default("[]"), // JSON array of new product IDs
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("passwordResetTokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
  usedAt: timestamp("usedAt"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
