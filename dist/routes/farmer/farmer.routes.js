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
exports.farmerRouter.get("/dashboard", authMiddleware_1.requireAuth, farmerController_1.farmerController.dashboard);
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
//# sourceMappingURL=farmer.routes.js.map