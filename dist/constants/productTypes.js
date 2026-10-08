"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PRICE_PER_KG = exports.PRODUCT_TYPES = void 0;
exports.isProductType = isProductType;
// Single source of truth for the marketplace's restricted product catalog.
//
// The app sells only non-perishable tubers. Keeping the list (and the fallback
// prices) here avoids the union drifting across the validator, service,
// controllers, and repository — every site imports from this module.
exports.PRODUCT_TYPES = ["YAM", "SWEET_POTATO", "CASSAVA", "WATER_YAM"];
// Narrowing type guard for untrusted input (e.g. query strings).
function isProductType(value) {
    return (typeof value === "string" &&
        exports.PRODUCT_TYPES.includes(value));
}
// Per-type reference price (per kg) used only as a last resort when no market
// price and no prior product history exist, so a farmer upload never hard-fails.
exports.DEFAULT_PRICE_PER_KG = {
    YAM: 800,
    SWEET_POTATO: 700,
    CASSAVA: 400,
    WATER_YAM: 750,
};
//# sourceMappingURL=productTypes.js.map