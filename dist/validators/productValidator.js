"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProductSchema = void 0;
const zod_1 = require("zod");
// Matches the existing Prisma Product fields (subset) and computes pricing snapshot.
exports.createProductSchema = zod_1.z.object({
    // RestrictedProductType: YAM, TOMATO, POTATO
    productName: zod_1.z.enum(["YAM", "TOMATO", "POTATO"]),
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
});
//# sourceMappingURL=productValidator.js.map