import { randomUUID } from "crypto";
import { logger } from "./logger";

export type TaskStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type AgentName = "claude" | "deepseek" | "hermes";
export type Priority = "low" | "medium" | "high" | "critical";
export type AgentStatus = "idle" | "processing" | "error" | "offline";
export type LogLevel = "info" | "warn" | "error" | "debug";

export interface Task {
  id: string;
  payload: string;
  status: TaskStatus;
  agent: AgentName;
  priority: Priority;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: AgentName;
  status: AgentStatus;
  tasksProcessed: number;
  avgLatencyMs: number;
  model: string;
  currentTaskId: string | null;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  agent: AgentName | "system";
  message: string;
}

export interface TelemetrySnapshot {
  cpuPercent: number;
  memoryPercent: number;
  memoryUsedMb: number;
  memoryTotalMb: number;
  uptimeSeconds: number;
  requestsPerSecond: number;
  activeConnections: number;
  timestamp: string;
}

const AGENT_MODELS: Record<AgentName, string> = {
  claude: "claude-3-5-sonnet-20241022",
  deepseek: "deepseek-chat-v3",
  hermes: "hermes-3-llama-3.1-70b",
};

class OrchestratorEngine {
  private tasks: Map<string, Task> = new Map();
  private agents: Map<AgentName, Agent> = new Map();
  private logs: LogEntry[] = [];
  private sseClients: Set<(entry: LogEntry) => void> = new Set();
  private startTime = Date.now();
  private requestCount = 0;
  private activeConnections = 0;
  private telemetry: TelemetrySnapshot;
  private processingQueue: Task[] = [];

  constructor() {
    const agentNames: AgentName[] = ["claude", "deepseek", "hermes"];
    for (const name of agentNames) {
      this.agents.set(name, {
        id: randomUUID(),
        name,
        status: "idle",
        tasksProcessed: Math.floor(Math.random() * 40) + 5,
        avgLatencyMs: Math.floor(Math.random() * 800) + 200,
        model: AGENT_MODELS[name],
        currentTaskId: null,
      });
    }

    this.telemetry = this.generateTelemetry();

    this.seedInitialTasks();
    this.startTelemetryLoop();
    this.startProcessingLoop();
    this.startSimulatedLogStream();
  }

  private generateTelemetry(): TelemetrySnapshot {
    const memTotal = 2048;
    const memPercent = 35 + Math.random() * 45;
    return {
      cpuPercent: Math.max(2, Math.min(98, 20 + Math.random() * 60 + Math.sin(Date.now() / 5000) * 15)),
      memoryPercent: Math.round(memPercent * 10) / 10,
      memoryUsedMb: Math.round((memTotal * memPercent) / 100),
      memoryTotalMb: memTotal,
      uptimeSeconds: (Date.now() - this.startTime) / 1000,
      requestsPerSecond: Math.round((Math.random() * 80 + 10) * 10) / 10,
      activeConnections: this.activeConnections + Math.floor(Math.random() * 8),
      timestamp: new Date().toISOString(),
    };
  }

  private seedInitialTasks() {
    const agents: AgentName[] = ["claude", "deepseek", "hermes"];
    const priorities: Priority[] = ["low", "medium", "high", "critical"];
    const statuses: TaskStatus[] = ["completed", "completed", "completed", "failed", "completed"];
    const payloads = [
      "Summarize Q4 earnings report and extract key financial KPIs",
      "Generate Python unit tests for the authentication module",
      "Analyze customer churn patterns from the last 90 days",
      "Translate product documentation to Spanish",
      "Classify incoming support tickets by urgency",
      "Extract named entities from legal contract batch",
      "Generate synthetic training data for sentiment classifier",
    ];
    for (let i = 0; i < 7; i++) {
      const status = statuses[i % statuses.length];
      const agent = agents[i % agents.length];
      const createdAt = new Date(Date.now() - (7 - i) * 60_000 * 3).toISOString();
      const task: Task = {
        id: randomUUID(),
        payload: payloads[i],
        status,
        agent,
        priority: priorities[i % priorities.length],
        result: status === "completed" ? `Task completed successfully. Processed ${Math.floor(Math.random() * 2000 + 500)} tokens.` : null,
        errorMessage: status === "failed" ? "Context window exceeded. Retry with chunked input." : null,
        createdAt,
        updatedAt: new Date(new Date(createdAt).getTime() + Math.random() * 30_000 + 5_000).toISOString(),
      };
      this.tasks.set(task.id, task);
    }
  }

  private startTelemetryLoop() {
    setInterval(() => {
      this.telemetry = this.generateTelemetry();
    }, 1500);
  }

  private startProcessingLoop() {
    setInterval(() => {
      const queued = [...this.tasks.values()].filter((t) => t.status === "queued");
      for (const task of queued) {
        const agent = this.agents.get(task.agent);
        if (!agent || agent.status !== "idle") continue;
        agent.status = "processing";
        agent.currentTaskId = task.id;
        task.status = "processing";
        task.updatedAt = new Date().toISOString();
        this.pushLog({
          level: "info",
          agent: task.agent,
          message: `[${task.agent.toUpperCase()}] Accepting task ${task.id.slice(0, 8)} — priority: ${task.priority}`,
        });
        const processingMs = this.getProcessingDelay(task.priority);
        setTimeout(() => {
          const success = Math.random() > 0.15;
          task.status = success ? "completed" : "failed";
          task.result = success ? `Processed successfully. Output tokens: ${Math.floor(Math.random() * 1800 + 300)}.` : null;
          task.errorMessage = success ? null : "Model inference error. Rate limit hit upstream.";
          task.updatedAt = new Date().toISOString();
          agent.status = "idle";
          agent.currentTaskId = null;
          agent.tasksProcessed += 1;
          const latency = processingMs + Math.random() * 200;
          agent.avgLatencyMs = Math.round((agent.avgLatencyMs * 0.85 + latency * 0.15) * 10) / 10;
          this.pushLog({
            level: success ? "info" : "error",
            agent: task.agent,
            message: success
              ? `[${task.agent.toUpperCase()}] Task ${task.id.slice(0, 8)} completed in ${Math.round(processingMs)}ms`
              : `[${task.agent.toUpperCase()}] Task ${task.id.slice(0, 8)} FAILED — ${task.errorMessage}`,
          });
        }, processingMs);
      }
    }, 800);
  }

  private getProcessingDelay(priority: Priority): number {
    const base: Record<Priority, number> = { critical: 3000, high: 6000, medium: 10000, low: 15000 };
    return base[priority] + Math.random() * 3000;
  }

  private startSimulatedLogStream() {
    const systemMessages = [
      { level: "debug" as LogLevel, agent: "system" as const, message: "Heartbeat: all agents reachable" },
      { level: "info" as LogLevel, agent: "system" as const, message: "Telemetry collector tick — metrics flushed" },
      { level: "debug" as LogLevel, agent: "system" as const, message: "Queue scan: checking for stale tasks" },
      { level: "info" as LogLevel, agent: "system" as const, message: "Token budget refreshed — rate limits reset" },
      { level: "warn" as LogLevel, agent: "system" as const, message: "Upstream API latency spike detected — monitoring" },
      { level: "debug" as LogLevel, agent: "system" as const, message: "Cache warm — 94% hit rate" },
      { level: "info" as LogLevel, agent: "system" as const, message: "Memory pressure normal — GC cycle complete" },
    ];

    const agentChatter: { level: LogLevel; agent: AgentName; message: string }[] = [
      { level: "debug", agent: "claude", message: "[CLAUDE] Context window utilization: 42%" },
      { level: "info", agent: "deepseek", message: "[DEEPSEEK] Inference engine warmed — batch ready" },
      { level: "debug", agent: "hermes", message: "[HERMES] Tokenizer loaded — vocab size 128k" },
      { level: "info", agent: "claude", message: "[CLAUDE] Sampling temperature: 0.7, top-p: 0.95" },
      { level: "debug", agent: "deepseek", message: "[DEEPSEEK] KV cache utilization: 61%" },
      { level: "info", agent: "hermes", message: "[HERMES] Response streaming enabled" },
    ];

    const allMessages = [...systemMessages, ...agentChatter];
    let idx = 0;
    setInterval(() => {
      const msg = allMessages[idx % allMessages.length];
      idx++;
      this.pushLog(msg);
    }, 2500);
  }

  private pushLog(entry: Omit<LogEntry, "id" | "timestamp">) {
    const full: LogEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(full);
    if (this.logs.length > 500) this.logs.shift();
    for (const cb of this.sseClients) {
      try {
        cb(full);
      } catch {
        this.sseClients.delete(cb);
      }
    }
  }

  incrementRequests() {
    this.requestCount++;
  }

  trackConnection(delta: 1 | -1) {
    this.activeConnections = Math.max(0, this.activeConnections + delta);
  }

  subscribeLogs(cb: (entry: LogEntry) => void) {
    this.sseClients.add(cb);
    return () => this.sseClients.delete(cb);
  }

  getTelemetry(): TelemetrySnapshot {
    return { ...this.telemetry, uptimeSeconds: (Date.now() - this.startTime) / 1000 };
  }

  getAgents(): Agent[] {
    return [...this.agents.values()];
  }

  getAgent(name: AgentName): Agent | undefined {
    return this.agents.get(name);
  }

  listTasks(): Task[] {
    return [...this.tasks.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  dispatchTask(payload: string, agent?: AgentName, priority?: Priority): Task {
    const agents: AgentName[] = ["claude", "deepseek", "hermes"];
    const chosenAgent: AgentName = agent ?? agents[Math.floor(Math.random() * agents.length)];
    const task: Task = {
      id: randomUUID(),
      payload,
      status: "queued",
      agent: chosenAgent,
      priority: priority ?? "medium",
      result: null,
      errorMessage: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.set(task.id, task);
    this.pushLog({
      level: "info",
      agent: "system",
      message: `[DISPATCH] Task ${task.id.slice(0, 8)} queued → ${chosenAgent.toUpperCase()} (${task.priority})`,
    });
    return task;
  }

  cancelTask(id: string): Task | null {
    const task = this.tasks.get(id);
    if (!task) return null;
    if (task.status === "queued" || task.status === "processing") {
      task.status = "cancelled";
      task.updatedAt = new Date().toISOString();
      const agent = this.agents.get(task.agent);
      if (agent && agent.currentTaskId === id) {
        agent.status = "idle";
        agent.currentTaskId = null;
      }
      this.pushLog({
        level: "warn",
        agent: "system",
        message: `[CANCEL] Task ${id.slice(0, 8)} cancelled by operator`,
      });
    }
    return task;
  }

  getStatsSummary() {
    const tasks = this.listTasks();
    const counts = { completed: 0, failed: 0, queued: 0, processing: 0, cancelled: 0 };
    for (const t of tasks) {
      if (t.status in counts) counts[t.status as keyof typeof counts]++;
    }
    const agents = this.getAgents();
    const topAgent = agents.reduce((best, a) => (a.tasksProcessed > best.tasksProcessed ? a : best), agents[0]);
    const avgThroughput = Math.round((this.telemetry.requestsPerSecond ?? 20) * 10) / 10;
    return {
      totalTasks: tasks.length,
      completedTasks: counts.completed,
      failedTasks: counts.failed,
      queuedTasks: counts.queued,
      processingTasks: counts.processing,
      avgThroughput,
      topAgent: topAgent?.name ?? "claude",
    };
  }

  getRecentLogs(limit = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }
}

export const engine = new OrchestratorEngine();
