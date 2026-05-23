import { Router, type IRouter } from "express";
import { engine } from "../lib/engine";
import type { AgentName, Priority } from "../lib/engine";
import {
  ListTasksResponse,
  DispatchTaskBody,
  GetTaskParams,
  GetTaskResponse,
  CancelTaskParams,
  CancelTaskResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tasks", async (_req, res): Promise<void> => {
  const tasks = engine.listTasks();
  res.json(ListTasksResponse.parse(tasks));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = DispatchTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { payload, agent, priority } = parsed.data;
  const task = engine.dispatchTask(
    payload,
    agent as AgentName | undefined,
    priority as Priority | undefined
  );
  res.status(201).json(GetTaskResponse.parse(task));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTaskParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const task = engine.getTask(params.data.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(GetTaskResponse.parse(task));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = CancelTaskParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const task = engine.cancelTask(params.data.id);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  res.json(CancelTaskResponse.parse(task));
});

export default router;
