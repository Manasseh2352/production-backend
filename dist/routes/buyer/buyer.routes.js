"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerRouter = void 0;
const express_1 = require("express");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const buyerController_1 = require("../../controllers/buyerController");
const buyerValidator_1 = require("../../validators/buyerValidator");
const orderController_1 = require("../../controllers/orderController");
const orderValidator_1 = require("../../validators/orderValidator");
exports.buyerRouter = (0, express_1.Router)();
// Profile
exports.buyerRouter.post("/profile", authMiddleware_1.requireAuth, buyerController_1.buyerController.createProfile);
exports.buyerRouter.patch("/profile", authMiddleware_1.requireAuth, buyerValidator_1.updateBuyerProfileValidator, buyerController_1.buyerController.updateProfile);
exports.buyerRouter.get("/profile", authMiddleware_1.requireAuth, buyerController_1.buyerController.getProfile);
// Dashboard
exports.buyerRouter.get("/dashboard", authMiddleware_1.requireAuth, buyerController_1.buyerController.dashboard);
// Saved Products
exports.buyerRouter.get("/saved-products", authMiddleware_1.requireAuth, buyerController_1.buyerController.listSavedProducts);
exports.buyerRouter.post("/saved-products", authMiddleware_1.requireAuth, buyerValidator_1.addSavedProductValidator, buyerController_1.buyerController.addSavedProduct);
exports.buyerRouter.delete("/saved-products/:productId", authMiddleware_1.requireAuth, buyerController_1.buyerController.removeSavedProduct);
// Wishlist
exports.buyerRouter.get("/wishlist", authMiddleware_1.requireAuth, buyerController_1.buyerController.listWishlist);
exports.buyerRouter.post("/wishlist", authMiddleware_1.requireAuth, buyerValidator_1.addWishlistItemValidator, buyerController_1.buyerController.addWishlistItem);
exports.buyerRouter.delete("/wishlist/:productId", authMiddleware_1.requireAuth, buyerController_1.buyerController.removeWishlistItem);
// Orders
exports.buyerRouter.post("/orders", authMiddleware_1.requireAuth, (req, res, next) => {
    try {
        req.validatedBody = orderValidator_1.placeOrderSchema.parse(req.body);
        next();
    }
    catch (e) {
        next(e);
    }
}, orderController_1.orderController.placeOrder);
exports.buyerRouter.get("/orders", authMiddleware_1.requireAuth, buyerController_1.buyerController.listOrders);
exports.buyerRouter.get("/orders/:orderId", authMiddleware_1.requireAuth, buyerController_1.buyerController.getOrder);
//# sourceMappingURL=buyer.routes.js.map