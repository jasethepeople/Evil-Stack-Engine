import { useListTasks, useDispatchTask, useCancelTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Play, Clock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function Tasks() {
  const { data: tasks, isLoading } = useListTasks({ query: { refetchInterval: 3000 } });
  const dispatchTask = useDispatchTask();
  const cancelTask = useCancelTask();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [payload, setPayload] = useState("");
  const [agent, setAgent] = useState<"claude" | "deepseek" | "hermes" | "">("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical" | "">("");

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload.trim()) return;
    
    dispatchTask.mutate(
      { data: { payload, agent: agent || undefined, priority: priority || undefined } },
      {
        onSuccess: () => {
          setPayload("");
          toast({ title: "Task dispatched", description: "Payload added to queue." });
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        },
        onError: (err) => {
          toast({ variant: "destructive", title: "Failed to dispatch", description: err.error || "Unknown error" });
        }
      }
    );
  };

  const handleCancel = (id: string) => {
    cancelTask.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Task cancelled" });
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Task Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and monitor payload execution.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Dispatch Panel */}
        <div className="glass-panel p-5 rounded-xl border border-border h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Dispatch Payload
          </h2>
          <form onSubmit={handleDispatch} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Payload</label>
              <textarea 
                className="w-full bg-background border border-border rounded-md p-2 text-sm font-mono min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder={'{ "command": "analyze" }'}
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Agent</label>
                <select 
                  className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={agent}
                  onChange={(e) => setAgent(e.target.value as any)}
                >
                  <option value="">Auto-assign</option>
                  <option value="claude">Claude</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="hermes">Hermes</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <select 
                  className="w-full bg-background border border-border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                >
                  <option value="">Normal</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <button 
              type="submit"
              disabled={dispatchTask.isPending || !payload.trim()}
              className="w-full bg-primary text-primary-foreground font-medium py-2 rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {dispatchTask.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              EXECUTE
            </button>
          </form>
        </div>

        {/* Task Table */}
        <div className="lg:col-span-3 glass-panel rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground font-mono uppercase bg-card/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading tasks...</td>
                  </tr>
                ) : tasks?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Terminal className="w-8 h-8 opacity-20" />
                        <span className="font-mono">No tasks in queue. Ready for dispatch.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tasks?.map(task => (
                    <tr key={task.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-3 font-mono text-xs">{task.id.slice(0, 8)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs uppercase text-muted-foreground">{task.agent}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        <span className={`${task.priority === 'critical' ? 'text-destructive font-bold' : task.priority === 'high' ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(task.createdAt).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-right">
                        {(task.status === 'queued' || task.status === 'processing') && (
                          <button 
                            onClick={() => handleCancel(task.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Cancel task"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Terminal } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  switch(status) {
    case 'completed': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20"><CheckCircle2 className="w-3 h-3" /> Completed</span>;
    case 'processing': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"><RefreshCw className="w-3 h-3 animate-spin" /> Processing</span>;
    case 'queued': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock className="w-3 h-3" /> Queued</span>;
    case 'failed': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20"><AlertTriangle className="w-3 h-3" /> Failed</span>;
    case 'cancelled': return <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"><X className="w-3 h-3" /> Cancelled</span>;
    default: return <span>{status}</span>;
  }
}
