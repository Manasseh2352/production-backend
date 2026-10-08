"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUsersRouter = void 0;
const express_1 = require("express");
const adminAuth_1 = require("../../admin/adminAuth");
const adminUserController_1 = require("../../controllers/adminUserController");
const adminCommon_1 = require("../../validators/adminCommon");
exports.adminUsersRouter = (0, express_1.Router)();
exports.adminUsersRouter.get("/", adminAuth_1.requireAdmin, (req, _res, next) => {
    try {
        req.validatedQuery = adminCommon_1.adminPaginationQuerySchema.parse(req.query);
        return next();
    }
    catch (e) {
        return next(e);
    }
}, adminUserController_1.adminUserController.list);
//# sourceMappingURL=users.routes.js.map