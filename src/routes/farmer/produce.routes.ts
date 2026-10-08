import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../../middleware/authMiddleware";
import { farmerController } from "../../controllers/farmerController";
import { createProductSchema } from "../../validators/productValidator";



export const produceRouter = Router();

// Multer for future image uploads (optional for now)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Farmer uploads produce => create Product + set pricePerKg/totalValue from latest MarketPrice
produceRouter.post(
  "/products",
  requireAuth,
  // upload.array("images", 5),
  (req, res, next) => {
    try {
      // attach parsed body for controller
      (req as any).validatedBody = createProductSchema.parse(req.body);
      next();
    } catch (e) {
      next(e);
    }
  },
  farmerController.createProduct
);



