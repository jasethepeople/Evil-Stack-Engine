import { Router, type IRouter } from "express";
import { engine } from "../lib/engine";
import { GetStatsSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const summary = engine.getStatsSummary();
  res.json(GetStatsSummaryResponse.parse(summary));
});

export default router;
