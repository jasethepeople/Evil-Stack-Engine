import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Activity, Server, LayoutDashboard, Terminal } from "lucide-react";
import { useHealthCheck } from "@workspace/api-client-react";

export function Sidebar() {
  const [location] = useLocation();
  const { data: health } = useHealthCheck({ query: { refetchInterval: 10000 } });

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tasks", label: "Tasks", icon: Terminal },
    { path: "/agents", label: "Agents", icon: Server },
  ];

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 text-primary font-mono font-bold tracking-tight">
          <Activity className="h-5 w-5" />
          <span>ORCHESTRATOR</span>
        </div>
      </div>
      
      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                  location === item.path
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground font-mono">SYSTEM STATUS</div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${health?.status === 'ok' ? 'bg-accent animate-pulse' : 'bg-destructive'}`} />
            <span className={`text-xs font-mono font-medium ${health?.status === 'ok' ? 'text-accent' : 'text-destructive'}`}>
              {health?.status === 'ok' ? 'ONLINE' : 'ERROR'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground dark">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden terminal-scrollbar">
        {children}
      </main>
    </div>
  );
}
