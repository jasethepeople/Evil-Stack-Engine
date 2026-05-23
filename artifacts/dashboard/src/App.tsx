import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Shell } from "@/components/layout/shell";
import { useEffect } from "react";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Agents from "@/pages/agents";

const queryClient = new QueryClient();

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/agents" component={Agents} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  // Force dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
