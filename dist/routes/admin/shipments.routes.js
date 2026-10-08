"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminShipmentsRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminShipmentController_1 = require("../../controllers/adminShipmentController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminShipmentsRouter = (0, express_1.Router)();
exports.adminShipmentsRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminShipmentQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminShipmentController_1.adminShipmentController.list);
//# sourceMappingURL=shipments.routes.js.map