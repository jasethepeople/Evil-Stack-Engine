import { Router, type IRouter } from "express";
import { engine } from "../lib/engine";
import { ListAgentsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/agents", async (_req, res): Promise<void> => {
  const agents = engine.getAgents();
  res.json(ListAgentsResponse.parse(agents));
});

export default router;
