"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminProductsRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminProductController_1 = require("../../controllers/adminProductController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminProductsRouter = (0, express_1.Router)();
exports.adminProductsRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminProductQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminProductController_1.adminProductController.list);
//# sourceMappingURL=products.routes.js.map