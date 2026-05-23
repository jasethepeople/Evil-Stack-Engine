import { useGetStatsSummary, useGetTelemetrySnapshot, useListAgents, useListTasks, getGetTelemetrySnapshotQueryKey } from "@workspace/api-client-react";
import { Cpu, MemoryStick, Activity, Network, CheckCircle2, Clock, AlertTriangle, PlayCircle, Loader2 } from "lucide-react";
import { useLogStream } from "@/hooks/use-log-stream";
import { SiAnthropic } from "react-icons/si";

export default function Dashboard() {
  const { data: telemetry } = useGetTelemetrySnapshot({
    query: { refetchInterval: 2000, queryKey: getGetTelemetrySnapshotQueryKey() }
  });
  
  const { data: stats } = useGetStatsSummary({
    query: { refetchInterval: 5000 }
  });

  const { data: agents } = useListAgents({
    query: { refetchInterval: 3000 }
  });

  const { data: tasks } = useListTasks({
    query: { refetchInterval: 3000 }
  });

  const { logs, containerRef, isAutoScroll, setIsAutoScroll } = useLogStream(100);

  const recentTasks = tasks?.slice(0, 5) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">System Overview</h1>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
          <span className="text-xs text-primary font-mono tracking-wider">LIVE TELEMETRY</span>
        </div>
      </div>

      {/* Telemetry Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <TelemetryCard 
          title="CPU Usage" 
          value={`${telemetry?.cpuPercent.toFixed(1) ?? '--'}%`}
          icon={Cpu}
          progress={telemetry?.cpuPercent}
          color="bg-primary"
        />
        <TelemetryCard 
          title="Memory" 
          value={`${telemetry?.memoryPercent.toFixed(1) ?? '--'}%`}
          subValue={`${telemetry?.memoryUsedMb ?? 0} / ${telemetry?.memoryTotalMb ?? 0} MB`}
          icon={MemoryStick}
          progress={telemetry?.memoryPercent}
          color="bg-accent"
        />
        <TelemetryCard 
          title="Req/Sec" 
          value={telemetry?.requestsPerSecond.toString() ?? '--'}
          icon={Activity}
          color="bg-purple-500"
        />
        <TelemetryCard 
          title="Connections" 
          value={telemetry?.activeConnections.toString() ?? '--'}
          icon={Network}
          color="bg-blue-500"
        />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatTile title="Total Tasks" value={stats?.totalTasks} icon={LayoutDashboard} color="text-foreground" />
        <StatTile title="Queued" value={stats?.queuedTasks} icon={Clock} color="text-yellow-500" />
        <StatTile title="Processing" value={stats?.processingTasks} icon={PlayCircle} color="text-primary" />
        <StatTile title="Completed" value={stats?.completedTasks} icon={CheckCircle2} color="text-accent" />
        <StatTile title="Failed" value={stats?.failedTasks} icon={AlertTriangle} color="text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agent Status Panel */}
        <div className="glass-panel rounded-xl p-5 border border-border flex flex-col space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono">Agent Fleet</h2>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {agents?.map(agent => (
              <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/50">
                <div className="flex items-center gap-3">
                  <AgentIcon name={agent.name} />
                  <div>
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{agent.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${getStatusColor(agent.status)} ${agent.status === 'processing' ? 'animate-pulse' : ''}`} />
                  <span className="text-xs font-mono uppercase text-muted-foreground">{agent.status}</span>
                </div>
              </div>
            ))}
            {!agents?.length && (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm font-mono">
                No agents online
              </div>
            )}
          </div>
        </div>

        {/* Live Logs */}
        <div className="lg:col-span-2 glass-panel rounded-xl border border-border overflow-hidden flex flex-col h-[400px]">
          <div className="p-3 border-b border-border/50 flex items-center justify-between bg-card/40">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground font-mono flex items-center gap-2">
              <Terminal className="w-4 h-4" /> Event Stream
            </h2>
            <button 
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`text-xs font-mono px-2 py-1 rounded transition-colors ${isAutoScroll ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}
            >
              {isAutoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            </button>
          </div>
          <div 
            ref={containerRef}
            className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-1 terminal-scrollbar bg-black/40"
          >
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 hover:bg-white/5 px-2 py-1 rounded">
                <span className="text-muted-foreground shrink-0 w-20">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                <span className={`shrink-0 w-12 ${getLogLevelColor(log.level)}`}>[{log.level.toUpperCase()}]</span>
                <span className="text-primary shrink-0 w-24 truncate">{log.agent}</span>
                <span className="text-foreground/80 break-all">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Waiting for events...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryCard({ title, value, subValue, icon: Icon, progress, color }: any) {
  return (
    <div className="glass-panel p-5 rounded-xl flex flex-col justify-between space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground font-mono">{title}</span>
        <Icon className={`w-4 h-4 text-muted-foreground`} />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono tracking-tight">{value}</div>
        {subValue && <div className="text-xs text-muted-foreground mt-1 font-mono">{subValue}</div>}
      </div>
      {progress !== undefined && (
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500 ease-in-out`} style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

import { LayoutDashboard, Terminal } from "lucide-react";

function StatTile({ title, value = 0, icon: Icon, color }: any) {
  return (
    <div className="glass-panel p-4 rounded-xl flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-secondary/50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</div>
      </div>
    </div>
  );
}

function AgentIcon({ name }: { name: string }) {
  const n = name.toLowerCase();
  if (n.includes('claude')) return <SiAnthropic className="text-[#D97757] w-5 h-5" />;
  // Fallbacks
  return <Server className="w-5 h-5 text-muted-foreground" />;
}

import { Server } from "lucide-react";

function getStatusColor(status: string) {
  switch (status) {
    case 'idle': return 'bg-yellow-500';
    case 'processing': return 'bg-primary';
    case 'error': return 'bg-destructive';
    case 'offline': return 'bg-muted-foreground';
    default: return 'bg-muted';
  }
}

function getLogLevelColor(level: string) {
  switch (level) {
    case 'info': return 'text-primary';
    case 'warn': return 'text-yellow-500';
    case 'error': return 'text-destructive';
    case 'debug': return 'text-muted-foreground';
    default: return 'text-foreground';
  }
}
