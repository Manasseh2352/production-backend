"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImageSchema = exports.updateFarmerProfileSchema = exports.createFarmerProfileSchema = void 0;
const zod_1 = require("zod");
exports.createFarmerProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100),
    farmName: zod_1.z.string().min(1).max(120).optional(),
    location: zod_1.z.string().min(1).max(200).optional(),
});
exports.updateFarmerProfileSchema = zod_1.z.object({
    displayName: zod_1.z.string().min(1).max(100).optional(),
    farmName: zod_1.z.string().min(1).max(120).nullable().optional(),
    location: zod_1.z.string().min(1).max(200).nullable().optional(),
});
exports.uploadProfileImageSchema = zod_1.z.object({
// multer handles file
// (we keep this so controller can validate other metadata in future)
});
//# sourceMappingURL=farmerValidator.js.map