"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerController = void 0;
const farmerValidator_1 = require("../validators/farmerValidator");
const farmerService_1 = require("../services/farmerService");
const productService_1 = require("../services/productService");
const imagekit_1 = require("../lib/imagekit");
exports.farmerController = {
    async createProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = farmerValidator_1.createFarmerProfileSchema.parse(req.body);
            const profile = await farmerService_1.farmerService.createProfile({
                userId,
                displayName: body.displayName,
                farmName: body.farmName,
                location: body.location,
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
            const body = farmerValidator_1.updateFarmerProfileSchema.parse(req.body);
            // Convert undefined->undefined; null allowed for farmName/location
            const profile = await farmerService_1.farmerService.updateProfile({
                userId,
                displayName: body.displayName,
                farmName: body.farmName,
                location: body.location,
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
            const profile = await farmerService_1.farmerService.getProfile(userId);
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async uploadProfileImage(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            farmerValidator_1.uploadProfileImageSchema.parse({});
            const file = req.file;
            if (!file?.buffer) {
                return res.status(400).json({ error: "Missing file" });
            }
            const { url, publicId } = await (0, imagekit_1.uploadBufferToImageKit)(file.buffer, "farmers/profile-images");
            const profile = await farmerService_1.farmerService.updateProfileImage({
                userId,
                profileImageUrl: url,
                profileImagePublicId: publicId,
            });
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async uploadProductImage(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const file = req.file;
            if (!file?.buffer) {
                return res.status(400).json({ error: "Missing file" });
            }
            const { url, publicId } = await (0, imagekit_1.uploadBufferToImageKit)(file.buffer, "farmers/products");
            return res.json({ ok: true, url, publicId });
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
            const metrics = await farmerService_1.farmerService.getDashboard(userId);
            return res.json({ ok: true, dashboard: metrics });
        }
        catch (err) {
            next(err);
        }
    },
    async createProduct(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = req.validatedBody;
            const normalizedImages = Array.isArray(body.images)
                ? body.images.filter(Boolean)
                : body.imageUrl
                    ? [body.imageUrl]
                    : undefined;
            const profile = await farmerService_1.farmerService.getProfile(userId);
            if (!profile) {
                return res.status(404).json({ error: "Farmer profile not found" });
            }
            const created = await productService_1.productService.createFromFarmerUpload({
                farmerProfileId: profile.id,
                productName: body.productName,
                state: body.state,
                quantityKg: body.quantityKg,
                unitPriceOverride: body.unitPriceOverride,
                description: body.description,
                location: body.location,
                destinationCountry: body.destinationCountry,
                images: normalizedImages,
            });
            return res.status(201).json({ ok: true, product: created });
        }
        catch (err) {
            next(err);
        }
    },
    async listProducts(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const products = await farmerService_1.farmerService.listProducts(userId);
            return res.json({ ok: true, products });
        }
        catch (err) {
            next(err);
        }
    },
    async updateProductImages(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const productId = Array.isArray(req.params.productId)
                ? req.params.productId[0]
                : req.params.productId;
            const body = req.body;
            const images = Array.isArray(body.images)
                ? body.images
                : body.imageUrl
                    ? [body.imageUrl]
                    : [];
            const normalized = [...new Set(images.filter(Boolean))].slice(0, 10);
            if (normalized.length === 0) {
                return res.status(400).json({ error: "At least one valid image URL is required" });
            }
            const product = await farmerService_1.farmerService.updateProductImages(userId, productId, normalized);
            return res.json({ ok: true, product });
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
            const orders = await farmerService_1.farmerService.listOrders({ userId, limit, offset });
            return res.json({ ok: true, orders });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=farmerController.js.map