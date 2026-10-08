"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseProductIdParam = exports.addWishlistItemValidator = exports.addSavedProductValidator = exports.updateBuyerProfileValidator = void 0;
const zod_1 = require("zod");
const updateBuyerProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(2).max(100),
});
const productIdParamSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
});
const addProductSchema = zod_1.z.object({
    productId: zod_1.z.string().min(1),
});
const updateBuyerProfileValidator = (req, res, next) => {
    try {
        req.body = updateBuyerProfileSchema.parse(req.body);
        next();
    }
    catch (err) {
        return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
    }
};
exports.updateBuyerProfileValidator = updateBuyerProfileValidator;
const addSavedProductValidator = (req, res, next) => {
    try {
        req.body = addProductSchema.parse(req.body);
        next();
    }
    catch (err) {
        return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
    }
};
exports.addSavedProductValidator = addSavedProductValidator;
const addWishlistItemValidator = (req, res, next) => {
    try {
        req.body = addProductSchema.parse(req.body);
        next();
    }
    catch (err) {
        return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
    }
};
exports.addWishlistItemValidator = addWishlistItemValidator;
const parseProductIdParam = (req) => {
    return productIdParamSchema.parse(req.params);
};
exports.parseProductIdParam = parseProductIdParam;
//# sourceMappingURL=buyerValidator.js.map