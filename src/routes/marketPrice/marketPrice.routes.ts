import { Router } from "express";

import { marketPriceController } from "../../controllers/marketPriceController";
import { requireAuth } from "../../middleware/authMiddleware";

export const marketPriceRouter = Router();

// For now, keep these protected (typically admin-only in real systems).
marketPriceRouter.post("/", requireAuth, marketPriceController.add);
marketPriceRouter.patch("/:id", requireAuth, marketPriceController.update);
marketPriceRouter.get("/current", requireAuth, marketPriceController.getCurrent);

