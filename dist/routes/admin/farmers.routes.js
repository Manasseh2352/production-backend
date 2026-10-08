"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminFarmersRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminFarmerController_1 = require("../../controllers/adminFarmerController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminFarmersRouter = (0, express_1.Router)();
exports.adminFarmersRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminPaginationQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminFarmerController_1.adminFarmerController.list);
//# sourceMappingURL=farmers.routes.js.map