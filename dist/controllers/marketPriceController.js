"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketPriceController = void 0;
const zod_1 = require("zod");
const marketPriceService_1 = require("../services/marketPriceService");
const addMarketPriceSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
    recordedAt: zod_1.z
        .string()
        .datetime()
        .optional()
        .default(() => new Date().toISOString()),
    price: zod_1.z.number().positive(),
    currency: zod_1.z.string().min(1).optional(),
    source: zod_1.z
        .enum(["USER_REPORTED", "FEED", "MANUAL_ENTRY", "EXTERNAL_PROVIDER"])
        .optional(),
    state: zod_1.z.string().min(1).optional(), // maps to MarketPrice.region
    quality: zod_1.z.string().min(1).optional(),
    notes: zod_1.z.string().min(1).optional(),
});
const updateMarketPriceSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1).optional(),
    recordedAt: zod_1.z.string().datetime().optional(),
    price: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().min(1).optional(),
    source: zod_1.z
        .enum(["USER_REPORTED", "FEED", "MANUAL_ENTRY", "EXTERNAL_PROVIDER"])
        .optional(),
    state: zod_1.z.string().min(1).optional(),
    quality: zod_1.z.string().min(1).optional(),
    notes: zod_1.z.string().min(1).optional(),
});
exports.marketPriceController = {
    async add(req, res, next) {
        try {
            const body = addMarketPriceSchema.parse(req.body);
            const created = await marketPriceService_1.marketPriceService.addMarketPrice({
                productId: body.productId,
                recordedAt: new Date(body.recordedAt),
                price: body.price,
                currency: body.currency,
                source: body.source,
                region: body.state ?? null,
                quality: body.quality ?? null,
                notes: body.notes ?? null,
            });
            return res.status(201).json({ ok: true, marketPrice: created });
        }
        catch (err) {
            next(err);
        }
    },
    async update(req, res, next) {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const body = updateMarketPriceSchema.parse(req.body);
            const updated = await marketPriceService_1.marketPriceService.updateMarketPrice(id, {
                productId: body.productId,
                recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
                price: body.price,
                currency: body.currency,
                source: body.source,
                region: body.state ?? undefined,
                quality: body.quality ?? undefined,
                notes: body.notes ?? undefined,
            });
            return res.json({ ok: true, marketPrice: updated });
        }
        catch (err) {
            next(err);
        }
    },
    async getCurrent(req, res, next) {
        try {
            const querySchema = zod_1.z.object({
                productId: zod_1.z.string().min(1),
                state: zod_1.z.string().min(1).optional(),
            });
            const q = querySchema.parse(req.query);
            const current = await marketPriceService_1.marketPriceService.getCurrentPrice({
                productId: Array.isArray(q.productId) ? q.productId[0] : q.productId,
                region: q.state ? (Array.isArray(q.state) ? q.state[0] : q.state) : undefined,
            });
            return res.json({ ok: true, currentPrice: current ?? null });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=marketPriceController.js.map