// Single source of truth for the marketplace's restricted product catalog.
//
// The app sells only non-perishable tubers. Keeping the list (and the fallback
// prices) here avoids the union drifting across the validator, service,
// controllers, and repository — every site imports from this module.
export const PRODUCT_TYPES = ["YAM", "SWEET_POTATO", "CASSAVA", "WATER_YAM"] as const;

export type ProductTypeName = (typeof PRODUCT_TYPES)[number];

// Narrowing type guard for untrusted input (e.g. query strings).
export function isProductType(value: unknown): value is ProductTypeName {
  return (
    typeof value === "string" &&
    (PRODUCT_TYPES as readonly string[]).includes(value)
  );
}

// Per-type reference price (per kg) used only as a last resort when no market
// price and no prior product history exist, so a farmer upload never hard-fails.
export const DEFAULT_PRICE_PER_KG: Record<ProductTypeName, number> = {
  YAM: 800,
  SWEET_POTATO: 700,
  CASSAVA: 400,
  WATER_YAM: 750,
};
