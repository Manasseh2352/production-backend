"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTransactionsQuerySchema = exports.withdrawSchema = void 0;
const zod_1 = require("zod");
exports.withdrawSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
});
exports.listTransactionsQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().positive().max(50).optional(),
    offset: zod_1.z.coerce.number().int().nonnegative().optional(),
});
//# sourceMappingURL=walletValidator.js.map