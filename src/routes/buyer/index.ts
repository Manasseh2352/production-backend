import { Router } from "express";

import { buyerRouter } from "./buyer.routes";

export const buyerIndexRouter = Router();
buyerIndexRouter.use("/", buyerRouter);

