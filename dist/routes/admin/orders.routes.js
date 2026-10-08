"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOrdersRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminOrderController_1 = require("../../controllers/adminOrderController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminOrdersRouter = (0, express_1.Router)();
exports.adminOrdersRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminOrderQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminOrderController_1.adminOrderController.list);
//# sourceMappingURL=orders.routes.js.map