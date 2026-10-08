"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerController = void 0;
const zod_1 = require("zod");
const buyerService_1 = require("../services/buyerService");
const buyerValidator_1 = require("../validators/buyerValidator");
const createBuyerProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2).max(100),
});
exports.buyerController = {
    async createProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = createBuyerProfileSchema.parse(req.body);
            const profile = await buyerService_1.buyerService.createProfile({
                userId,
                displayName: body.displayName,
            });
            return res.status(201).json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = req.body;
            const profile = await buyerService_1.buyerService.updateProfile({
                userId,
                displayName: body.displayName,
            });
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const profile = await buyerService_1.buyerService.getProfile(userId);
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async dashboard(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const metrics = await buyerService_1.buyerService.dashboard(userId);
            return res.json({ ok: true, dashboard: metrics });
        }
        catch (err) {
            next(err);
        }
    },
    async addSavedProduct(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const { productId } = req.body;
            const item = await buyerService_1.buyerService.addSavedProduct(userId, productId);
            return res.status(201).json({ ok: true, item });
        }
        catch (err) {
            next(err);
        }
    },
    async removeSavedProduct(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const { productId } = (0, buyerValidator_1.parseProductIdParam)(req);
            await buyerService_1.buyerService.removeSavedProduct(userId, productId);
            return res.json({ ok: true });
        }
        catch (err) {
            next(err);
        }
    },
    async listSavedProducts(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const items = await buyerService_1.buyerService.listSavedProducts(userId);
            return res.json({ ok: true, items });
        }
        catch (err) {
            next(err);
        }
    },
    async addWishlistItem(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const { productId } = req.body;
            const item = await buyerService_1.buyerService.addWishlistItem(userId, productId);
            return res.status(201).json({ ok: true, item });
        }
        catch (err) {
            next(err);
        }
    },
    async removeWishlistItem(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const { productId } = (0, buyerValidator_1.parseProductIdParam)(req);
            await buyerService_1.buyerService.removeWishlistItem(userId, productId);
            return res.json({ ok: true });
        }
        catch (err) {
            next(err);
        }
    },
    async listWishlist(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const items = await buyerService_1.buyerService.listWishlist(userId);
            return res.json({ ok: true, items });
        }
        catch (err) {
            next(err);
        }
    },
    async listOrders(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const limit = req.query.limit ? Number(req.query.limit) : undefined;
            const offset = req.query.offset ? Number(req.query.offset) : undefined;
            const orders = await buyerService_1.buyerService.listOrders(userId, { limit, offset });
            return res.json({ ok: true, orders });
        }
        catch (err) {
            next(err);
        }
    },
    async getOrder(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const orderId = Array.isArray(req.params.orderId)
                ? req.params.orderId[0]
                : req.params.orderId;
            const order = await buyerService_1.buyerService.getOrder(userId, orderId);
            return res.json({ ok: true, order });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=buyerController.js.map