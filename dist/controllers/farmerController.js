"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.farmerController = void 0;
const farmerValidator_1 = require("../validators/farmerValidator");
const farmerService_1 = require("../services/farmerService");
const cloudinary_1 = require("cloudinary");
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY ?? "",
        api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
    });
}
const productService_1 = require("../services/productService");
exports.farmerController = {
    async createProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = farmerValidator_1.createFarmerProfileSchema.parse(req.body);
            const profile = await farmerService_1.farmerService.createProfile({
                userId,
                displayName: body.displayName,
                farmName: body.farmName,
                location: body.location,
            });
            return res.status(201).json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async updateProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = farmerValidator_1.updateFarmerProfileSchema.parse(req.body);
            // Convert undefined->undefined; null allowed for farmName/location
            const profile = await farmerService_1.farmerService.updateProfile({
                userId,
                displayName: body.displayName,
                farmName: body.farmName,
                location: body.location,
            });
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async getProfile(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const profile = await farmerService_1.farmerService.getProfile(userId);
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async uploadProfileImage(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            farmerValidator_1.uploadProfileImageSchema.parse({});
            const file = req.file;
            if (!file?.buffer) {
                return res.status(400).json({ error: "Missing file" });
            }
            const uploadResult = await cloudinary_1.v2.uploader.upload_stream;
            // We will stream via a Promise wrapper
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary_1.v2.uploader.upload_stream({ folder: "farmers/profile-images" }, (error, upload) => {
                    if (error || !upload)
                        return reject(error);
                    resolve({ secure_url: upload.secure_url, public_id: upload.public_id });
                });
                stream.end(file.buffer);
            });
            const profile = await farmerService_1.farmerService.updateProfileImage({
                userId,
                profileImageUrl: result.secure_url,
                profileImagePublicId: result.public_id,
            });
            return res.json({ ok: true, profile });
        }
        catch (err) {
            next(err);
        }
    },
    async dashboard(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const metrics = await farmerService_1.farmerService.getDashboard(userId);
            return res.json({ ok: true, dashboard: metrics });
        }
        catch (err) {
            next(err);
        }
    },
    async createProduct(req, res, next) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return res.status(401).json({ error: "Unauthorized" });
            const body = req.validatedBody;
            const profile = await farmerService_1.farmerService.getProfile(userId);
            if (!profile) {
                return res.status(404).json({ error: "Farmer profile not found" });
            }
            const created = await productService_1.productService.createFromFarmerUpload({
                farmerProfileId: profile.id,
                productName: body.productName,
                state: body.state,
                quantityKg: body.quantityKg,
                unitPriceOverride: body.unitPriceOverride,
                description: body.description,
                location: body.location,
                destinationCountry: body.destinationCountry,
            });
            return res.status(201).json({ ok: true, product: created });
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=farmerController.js.map