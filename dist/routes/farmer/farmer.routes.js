"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const farmerController_1 = require("../../controllers/farmerController");
const orderController_1 = require("../../controllers/orderController");
const notificationController_1 = require("../../controllers/notificationController");
const walletController_1 = require("../../controllers/walletController");
const orderValidator_1 = require("../../validators/orderValidator");
exports.farmerRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
});
exports.farmerRouter.post("/profile", authMiddleware_1.requireAuth, farmerController_1.farmerController.createProfile);
exports.farmerRouter.patch("/profile", authMiddleware_1.requireAuth, farmerController_1.farmerController.updateProfile);
exports.farmerRouter.get("/profile", authMiddleware_1.requireAuth, farmerController_1.farmerController.getProfile);
exports.farmerRouter.post("/profile-image", authMiddleware_1.requireAuth, upload.single("image"), farmerController_1.farmerController.uploadProfileImage);
exports.farmerRouter.post("/product-image", authMiddleware_1.requireAuth, upload.single("image"), farmerController_1.farmerController.uploadProductImage);
exports.farmerRouter.get("/dashboard", authMiddleware_1.requireAuth, farmerController_1.farmerController.dashboard);
exports.farmerRouter.get("/products", authMiddleware_1.requireAuth, farmerController_1.farmerController.listProducts);
exports.farmerRouter.patch("/products/:productId/images", authMiddleware_1.requireAuth, farmerController_1.farmerController.updateProductImages);
exports.farmerRouter.get("/orders", authMiddleware_1.requireAuth, farmerController_1.farmerController.listOrders);
exports.farmerRouter.post("/orders/:orderId/accept", authMiddleware_1.requireAuth, (req, res, next) => {
    try {
        orderValidator_1.acceptRejectOrderParamsSchema.parse({
            orderId: Array.isArray(req.params.orderId)
                ? req.params.orderId[0]
                : req.params.orderId,
        });
        next();
    }
    catch (e) {
        next(e);
    }
}, orderController_1.orderController.acceptOrder);
exports.farmerRouter.post("/orders/:orderId/reject", authMiddleware_1.requireAuth, (req, res, next) => {
    try {
        orderValidator_1.acceptRejectOrderParamsSchema.parse({
            orderId: Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId,
        });
        next();
    }
    catch (e) {
        next(e);
    }
}, orderController_1.orderController.rejectOrder);
exports.farmerRouter.post("/orders/:orderId/advance-status", authMiddleware_1.requireAuth, (req, res, next) => {
    try {
        orderValidator_1.acceptRejectOrderParamsSchema.parse({
            orderId: Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId,
        });
        next();
    }
    catch (e) {
        next(e);
    }
}, orderController_1.orderController.advanceShipmentStatus);
// Notifications (shared controller, keyed on the authenticated user)
exports.farmerRouter.get("/notifications", authMiddleware_1.requireAuth, notificationController_1.notificationController.list);
exports.farmerRouter.get("/notifications/unread-count", authMiddleware_1.requireAuth, notificationController_1.notificationController.unreadCount);
exports.farmerRouter.post("/notifications/read-all", authMiddleware_1.requireAuth, notificationController_1.notificationController.markAllRead);
exports.farmerRouter.post("/notifications/:id/read", authMiddleware_1.requireAuth, notificationController_1.notificationController.markRead);
// Escrow wallet
exports.farmerRouter.get("/wallet", authMiddleware_1.requireAuth, walletController_1.walletController.getWallet);
exports.farmerRouter.get("/wallet/transactions", authMiddleware_1.requireAuth, walletController_1.walletController.listTransactions);
exports.farmerRouter.post("/wallet/withdraw", authMiddleware_1.requireAuth, walletController_1.walletController.requestWithdrawal);
//# sourceMappingURL=farmer.routes.js.map