"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buyerRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const buyerController_1 = require("../../controllers/buyerController");
const buyerValidator_1 = require("../../validators/buyerValidator");
const orderController_1 = require("../../controllers/orderController");
const orderValidator_1 = require("../../validators/orderValidator");
const notificationController_1 = require("../../controllers/notificationController");
exports.buyerRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
// Profile
exports.buyerRouter.post("/profile", authMiddleware_1.requireAuth, buyerController_1.buyerController.createProfile);
exports.buyerRouter.patch("/profile", authMiddleware_1.requireAuth, buyerValidator_1.updateBuyerProfileValidator, buyerController_1.buyerController.updateProfile);
exports.buyerRouter.get("/profile", authMiddleware_1.requireAuth, buyerController_1.buyerController.getProfile);
exports.buyerRouter.post("/profile-image", authMiddleware_1.requireAuth, upload.single("image"), buyerController_1.buyerController.uploadProfileImage);
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
// Product catalog (buyer browses ACTIVE products)
exports.buyerRouter.get("/products", authMiddleware_1.requireAuth, buyerController_1.buyerController.listProducts);
exports.buyerRouter.get("/products/:productId", authMiddleware_1.requireAuth, buyerController_1.buyerController.getProduct);
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
exports.buyerRouter.delete("/orders/:orderId", authMiddleware_1.requireAuth, buyerController_1.buyerController.deleteOrder);
// Payment (simulated gateway)
exports.buyerRouter.post("/orders/:orderId/pay", authMiddleware_1.requireAuth, buyerController_1.buyerController.payOrder);
// Buyer confirms goods received → releases farmer escrow
exports.buyerRouter.post("/orders/:orderId/confirm-received", authMiddleware_1.requireAuth, orderController_1.orderController.confirmReceived);
// Notifications
exports.buyerRouter.get("/notifications", authMiddleware_1.requireAuth, notificationController_1.notificationController.list);
exports.buyerRouter.get("/notifications/unread-count", authMiddleware_1.requireAuth, notificationController_1.notificationController.unreadCount);
exports.buyerRouter.post("/notifications/read-all", authMiddleware_1.requireAuth, notificationController_1.notificationController.markAllRead);
exports.buyerRouter.post("/notifications/:id/read", authMiddleware_1.requireAuth, notificationController_1.notificationController.markRead);
// Lightweight "added to cart" notification (no server-side cart)
exports.buyerRouter.post("/notifications/cart", authMiddleware_1.requireAuth, notificationController_1.notificationController.notifyCartItem);
//# sourceMappingURL=buyer.routes.js.map