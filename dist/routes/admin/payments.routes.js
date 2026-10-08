"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminPaymentsRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminPaymentController_1 = require("../../controllers/adminPaymentController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminPaymentsRouter = (0, express_1.Router)();
exports.adminPaymentsRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminPaymentQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminPaymentController_1.adminPaymentController.list);
//# sourceMappingURL=payments.routes.js.map