import { Router, type IRouter } from "express";
import healthRouter from "./health";
import telemetryRouter from "./telemetry";
import tasksRouter from "./tasks";
import agentsRouter from "./agents";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(telemetryRouter);
router.use(tasksRouter);
router.use(agentsRouter);
router.use(statsRouter);

export default router;
