import { z } from "zod";
import { PRODUCT_TYPES } from "../constants/productTypes";

const imageUrlSchema = z.string().url();

const imageListSchema = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value;
  return value;
}, z.array(imageUrlSchema).max(10).optional());

// Matches the existing Prisma Product fields (subset) and computes pricing snapshot.
export const createProductSchema = z.object({
  // RestrictedProductType — non-perishable tubers (see constants/productTypes).
  productName: z.enum(PRODUCT_TYPES),

  // Pricing
  state: z.string().min(1).optional(), // maps to MarketPrice.region
  // These are required to compute totalValue
  quantityKg: z.number().positive(),
  unitPriceOverride: z.number().positive().optional(),

  // Product metadata
  quantityTonnes: z.number().positive().optional(),
  description: z.string().min(1).optional(),
  location: z.string().min(1).optional(),
  destinationCountry: z.string().min(1).optional(),
  imageUrl: imageUrlSchema.optional(),

  // Optional image URLs (e.g. from client upload or ImageKit).
  images: imageListSchema,
}).transform((data) => {
  const images = [...new Set([
    ...(Array.isArray(data.images) ? data.images : []),
    ...(data.imageUrl ? [data.imageUrl] : []),
  ])];

  return {
    ...data,
    images: images.length > 0 ? images : undefined,
  };
});

