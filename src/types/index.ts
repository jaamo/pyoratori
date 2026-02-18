import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  products,
  images,
  categories,
  conversations,
  messages,
  searchAlerts,
} from "@/server/db/schema";

export type User = InferSelectModel<typeof users>;
export type Product = InferSelectModel<typeof products>;
export type Image = InferSelectModel<typeof images>;
export type Category = InferSelectModel<typeof categories>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;
export type SearchAlert = InferSelectModel<typeof searchAlerts>;

export type ProductWithImages = Product & {
  images: Image[];
  attributes: Record<string, string>;
};

export type ProductWithDetails = ProductWithImages & {
  author: Pick<User, "id" | "name" | "email">;
  category: Category;
};

export type ConversationWithDetails = Conversation & {
  product: Pick<Product, "id" | "title" | "price" | "location">;
  productImage: string | null;
  otherUser: Pick<User, "id" | "name">;
  lastMessage: Pick<Message, "content" | "createdAt" | "senderId"> | null;
  unreadCount: number;
};

export type MessageWithSender = Message & {
  sender: Pick<User, "id" | "name">;
};

export type ProductThread = {
  product: Pick<Product, "id" | "title" | "price" | "location">;
  productImage: string | null;
  conversations: ConversationWithDetails[];
  totalUnread: number;
  latestMessageAt: Date | null;
};

export type AttributeType = "select" | "number" | "text" | "boolean";

export type AttributeDefinition = {
  key: string;
  label: string;
  type: AttributeType;
  options?: string[];
  filterable?: boolean;
  searchable?: boolean;
  required?: boolean;
  unit?: string;
  min?: number;
  max?: number;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
  attributes?: AttributeDefinition[];
};

export type CategoryGroup = {
  id: string;
  name: string;
  categories: CategoryNode[];
};

export type SearchFilters = {
  query?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  attributes?: Record<string, string | number | boolean>;
  page?: number;
  sort?: string;
};
