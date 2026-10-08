"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminBuyersRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminBuyerController_1 = require("../../controllers/adminBuyerController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminBuyersRouter = (0, express_1.Router)();
exports.adminBuyersRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminPaginationQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminBuyerController_1.adminBuyerController.list);
//# sourceMappingURL=buyers.routes.js.map