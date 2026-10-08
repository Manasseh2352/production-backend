import { Router } from "express";

import { farmerRouter } from "./farmer.routes";
import { produceRouter } from "./produce.routes";

export const farmerIndexRouter = Router();
farmerIndexRouter.use("/", farmerRouter);
farmerIndexRouter.use("/", produceRouter);



