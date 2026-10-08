"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentQuerySchema = exports.adminShipmentQuerySchema = exports.adminOrderQuerySchema = exports.adminProductQuerySchema = exports.adminPaginationQuerySchema = void 0;
const zod_1 = require("zod");
exports.adminPaginationQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().optional(),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional(),
    q: zod_1.z.string().trim().optional(),
    status: zod_1.z.string().trim().optional(),
});
exports.adminProductQuerySchema = exports.adminPaginationQuerySchema.extend({
    productName: zod_1.z.string().trim().optional(),
    farmerId: zod_1.z.string().trim().optional(),
});
exports.adminOrderQuerySchema = exports.adminPaginationQuerySchema.extend({
    status: zod_1.z.string().trim().optional(),
    buyerId: zod_1.z.string().trim().optional(),
});
exports.adminShipmentQuerySchema = exports.adminPaginationQuerySchema.extend({
    orderId: zod_1.z.string().trim().optional(),
    status: zod_1.z.string().trim().optional(),
});
exports.adminPaymentQuerySchema = exports.adminPaginationQuerySchema.extend({
    orderId: zod_1.z.string().trim().optional(),
    method: zod_1.z.string().trim().optional(),
});
//# sourceMappingURL=adminCommon.js.map