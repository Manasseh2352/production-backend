import { Router } from "express";
import { marketPriceRouter } from "./marketPrice.routes";

export const marketPriceIndexRouter = Router();
marketPriceIndexRouter.use("/market-prices", marketPriceRouter);

