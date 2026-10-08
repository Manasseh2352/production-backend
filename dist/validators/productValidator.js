"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
const zod_1 = require("zod");
const productTypes_1 = require("../constants/productTypes");
const imageUrlSchema = zod_1.z.string().url();
const imageListSchema = zod_1.z.preprocess((value) => {
    if (value === undefined || value === null)
        return undefined;
    if (typeof value === "string")
        return [value];
    if (Array.isArray(value))
        return value;
    return value;
}, zod_1.z.array(imageUrlSchema).max(10).optional());
// Matches the existing Prisma Product fields (subset) and computes pricing snapshot.
exports.createProductSchema = zod_1.z.object({
    // RestrictedProductType — non-perishable tubers (see constants/productTypes).
    productName: zod_1.z.enum(productTypes_1.PRODUCT_TYPES),
    // Pricing
    state: zod_1.z.string().min(1).optional(), // maps to MarketPrice.region
    // These are required to compute totalValue
    quantityKg: zod_1.z.number().positive(),
    unitPriceOverride: zod_1.z.number().positive().optional(),
    // Product metadata
    quantityTonnes: zod_1.z.number().positive().optional(),
    description: zod_1.z.string().min(1).optional(),
    location: zod_1.z.string().min(1).optional(),
    destinationCountry: zod_1.z.string().min(1).optional(),
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
//# sourceMappingURL=productValidator.js.map