import { Router } from "express";

import { aiRouter } from "./ai.routes";

export const aiIndexRouter = Router();
aiIndexRouter.use("/", aiRouter);
