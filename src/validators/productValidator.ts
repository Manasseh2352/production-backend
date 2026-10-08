import { z } from "zod";
import { PRODUCT_TYPES } from "../constants/productTypes";

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

  // Optional image URLs (e.g. from client upload or ImageKit).
  images: z.array(z.string().url()).max(10).optional(),
});

