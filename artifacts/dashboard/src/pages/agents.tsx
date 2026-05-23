import { useListAgents } from "@workspace/api-client-react";
import { Server, Activity, Clock, Target } from "lucide-react";
import { SiAnthropic } from "react-icons/si";

export default function Agents() {
  const { data: agents, isLoading } = useListAgents({ query: { refetchInterval: 3000 } });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Fleet</h1>
          <p className="text-sm text-muted-foreground mt-1">Status and performance metrics of available models.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center text-muted-foreground py-12">Loading fleet status...</div>
        ) : (
          agents?.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}

function AgentCard({ agent }: { agent: any }) {
  return (
    <div className="glass-panel p-5 rounded-xl border border-border flex flex-col h-full space-y-4 relative overflow-hidden group">
      {/* Decorative background glow based on status */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10 rounded-full ${getStatusColor(agent.status)} pointer-events-none transition-all duration-1000 group-hover:opacity-20`} />

      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/50 rounded-lg">
            <AgentIcon name={agent.name} />
          </div>
          <div>
            <h3 className="font-semibold text-lg leading-tight">{agent.name}</h3>
            <p className="text-xs text-muted-foreground font-mono">{agent.model}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium flex items-center gap-1.5 bg-background/50 border border-border`}>
          <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)} ${agent.status === 'processing' ? 'animate-pulse' : ''}`} />
          <span className="uppercase">{agent.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/50">
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Target className="w-3 h-3" /> Processed</div>
          <div className="font-mono text-lg">{agent.tasksProcessed}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Avg Latency</div>
          <div className="font-mono text-lg">{agent.avgLatencyMs}ms</div>
        </div>
      </div>

      {agent.currentTaskId && (
        <div className="mt-auto pt-4 border-t border-border/50">
          <div className="text-xs text-muted-foreground mb-1">Current Task</div>
          <div className="font-mono text-xs bg-black/30 p-2 rounded border border-white/5 truncate">
            {agent.currentTaskId}
          </div>
        </div>
      )}
    </div>
  );
}

function AgentIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('claude')) return <SiAnthropic className="text-[#D97757] w-6 h-6" />;
  return <Server className="w-6 h-6 text-primary" />;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'idle': return 'bg-yellow-500';
    case 'processing': return 'bg-primary';
    case 'error': return 'bg-destructive';
    case 'offline': return 'bg-muted-foreground';
    default: return 'bg-muted';
  }
}
