import { Router, type IRouter } from "express";
import { engine } from "../lib/engine";
import { GetTelemetrySnapshotResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/telemetry/snapshot", async (_req, res): Promise<void> => {
  const snapshot = engine.getTelemetry();
  res.json(GetTelemetrySnapshotResponse.parse(snapshot));
});

router.get("/logs/stream", (req, res): void => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  engine.trackConnection(1);

  const recent = engine.getRecentLogs(50);
  for (const entry of recent) {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  }

  const unsubscribe = engine.subscribeLogs((entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 20000);

  req.on("close", () => {
    unsubscribe();
    clearInterval(keepAlive);
    engine.trackConnection(-1);
  });
});

export default router;
