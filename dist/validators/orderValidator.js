"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptRejectOrderParamsSchema = exports.placeOrderSchema = void 0;
const zod_1 = require("zod");
// NOTE: These validators are for a minimal MVP.
// We snapshot pricing at order creation time and store it on ShipmentItem.
const placeOrderItemSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    // quantity in kg (or unit configured in product; MVP stores unit as kg)
    quantityKg: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().positive(),
});
exports.placeOrderSchema = zod_1.z.object({
    notes: zod_1.z.string().min(1).optional(),
    // Single destination / shipment group for MVP.
    destinationName: zod_1.z.string().min(1).optional(),
    destinationAddress: zod_1.z.string().min(1).optional(),
    destinationPhone: zod_1.z.string().min(1).optional(),
    deliveryMethod: zod_1.z.enum(["AIR", "FLIGHT"]).default("AIR"),
    items: zod_1.z.array(placeOrderItemSchema).min(1).max(50),
    // Taxes/shipping can be computed later; for now allow optional overrides.
    currency: zod_1.z.string().min(1).optional().default("USD"),
    subtotalAmount: zod_1.z.number().nonnegative().optional(),
    taxAmount: zod_1.z.number().nonnegative().optional(),
    shippingAmount: zod_1.z.number().nonnegative().optional(),
    totalAmount: zod_1.z.number().nonnegative().optional(),
});
exports.acceptRejectOrderParamsSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
});
//# sourceMappingURL=orderValidator.js.map