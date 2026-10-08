import { Request, Response, NextFunction } from "express";
import { z } from "zod";

const updateBuyerProfileSchema = z.object({
  displayName: z.string().min(2).max(100),
});

const productIdParamSchema = z.object({
  productId: z.string().min(1),
});

const addProductSchema = z.object({
  productId: z.string().min(1),
});

export const updateBuyerProfileValidator = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = updateBuyerProfileSchema.parse(req.body);
    next();
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
  }
};

export const addSavedProductValidator = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = addProductSchema.parse(req.body);
    next();
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
  }
};

export const addWishlistItemValidator = (req: Request, res: Response, next: NextFunction) => {
  try {
    req.body = addProductSchema.parse(req.body);
    next();
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid request body", details: err?.errors ?? err?.message });
  }
};

export const parseProductIdParam = (req: Request) => {
  return productIdParamSchema.parse(req.params);
};

