export const PRODUCT_STATUS = {
  PUBLIC: "public",
  EXPIRED: "expired",
  SOLD: "sold",
  DELETED: "deleted",
} as const;

export type ProductStatus = (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

export const PRODUCT_EXPIRY_DAYS = 180; // 6 months

export const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_DIMENSION = 1200;
export const THUMBNAIL_MAX_DIMENSION = 400;

export const ITEMS_PER_PAGE = 24;
