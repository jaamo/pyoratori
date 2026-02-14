export const POSTING_STATUS = {
  ACTIVE: "active",
  EXPIRED: "expired",
  SOLD: "sold",
} as const;

export type PostingStatus = (typeof POSTING_STATUS)[keyof typeof POSTING_STATUS];

export const POSTING_EXPIRY_DAYS = 180; // 6 months

export const IMAGE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
export const IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_DIMENSION = 1200;
export const THUMBNAIL_MAX_DIMENSION = 400;

export const ITEMS_PER_PAGE = 24;
