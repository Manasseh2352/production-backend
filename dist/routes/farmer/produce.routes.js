"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.produceRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const farmerController_1 = require("../../controllers/farmerController");
const productValidator_1 = require("../../validators/productValidator");
exports.produceRouter = (0, express_1.Router)();
// Multer for future image uploads (optional for now)
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// Farmer uploads produce => create Product + set pricePerKg/totalValue from latest MarketPrice
exports.produceRouter.post("/products", authMiddleware_1.requireAuth, 
// upload.array("images", 5),
(req, res, next) => {
    try {
        // attach parsed body for controller
        req.validatedBody = productValidator_1.createProductSchema.parse(req.body);
        next();
    }
    catch (e) {
        next(e);
    }
}, farmerController_1.farmerController.createProduct);
//# sourceMappingURL=produce.routes.js.map