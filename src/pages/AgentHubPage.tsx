import { useState, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Zap, Wrench, Radio, Activity } from "lucide-react";
import type { AgentLog, McpToolCall, AgentName, AgentStatus } from "@/types";
import {
  AGENT_CONFIGS,
  MCP_TOOLS,
  AGENT_LABELS,
  AGENT_COLORS,
  AGENT_BG_COLORS,
} from "@/lib/agents";
import { cn } from "@/lib/utils";

const AGENT_ICON_LABELS: Record<AgentName, string> = {
  risk_intelligence: "RI",
  route_guardian: "RG",
  trusted_contact: "TC",
  evidence: "EV",
  emergency_coordinator: "EC",
};

function AgentNode({
  agent,
  status,
  lastAction,
  onClick,
  selected,
}: {
  agent: AgentName;
  status: AgentStatus;
  lastAction?: string;
  onClick: () => void;
  selected: boolean;
}) {
  const cfg = AGENT_CONFIGS.find((a) => a.name === agent)!;
  const dotColor = {
    idle: "bg-muted-foreground",
    active: "bg-safe",
    alert: "bg-warning-custom",
    emergency: "bg-emergency",
  }[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-sm border transition-all cursor-pointer w-full",
        selected
          ? "border-primary/60 bg-primary/5"
          : cn(AGENT_BG_COLORS[agent], "hover:opacity-90"),
      )}
    >
      <div className="relative">
        <div
          className={cn(
            "w-12 h-12 rounded-sm border flex items-center justify-center",
            AGENT_BG_COLORS[agent],
          )}
        >
          <span
            className={cn("font-mono font-bold text-sm", AGENT_COLORS[agent])}
          >
            {AGENT_ICON_LABELS[agent]}
          </span>
        </div>
        <span
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
            dotColor,
            status !== "idle" && "agent-active",
          )}
        />
      </div>
      <p
        className={cn(
          "font-mono text-[10px] font-semibold text-center",
          AGENT_COLORS[agent],
        )}
        style={{ lineHeight: 1.3 }}
      >
        {AGENT_LABELS[agent].toUpperCase()}
      </p>
      <Badge
        variant="outline"
        className={cn(
          "font-mono text-[9px] py-0 border-current/40",
          AGENT_COLORS[agent],
        )}
      >
        {status.toUpperCase()}
      </Badge>
      {lastAction && (
        <p className="font-mono text-[9px] text-muted-foreground text-center line-clamp-2">
          {lastAction}
        </p>
      )}
    </button>
  );
}

// SVG connection lines between agents
function OrchestrationLines() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* EC (center) to others */}
      <line
        x1="200"
        y1="100"
        x2="50"
        y2="50"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <line
        x1="200"
        y1="100"
        x2="150"
        y2="50"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <line
        x1="200"
        y1="100"
        x2="250"
        y2="50"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
      <line
        x1="200"
        y1="100"
        x2="350"
        y2="50"
        stroke="hsl(var(--border))"
        strokeWidth="1"
        strokeDasharray="4 3"
      />
    </svg>
  );
}

export default function AgentHubPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [toolCalls, setToolCalls] = useState<McpToolCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentName | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<
    Record<AgentName, AgentStatus>
  >({
    risk_intelligence: "idle",
    route_guardian: "idle",
    trusted_contact: "idle",
    evidence: "idle",
    emergency_coordinator: "idle",
  });

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [logRes, toolRes] = await Promise.all([
        supabase
          .from("agent_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("mcp_tool_calls")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const logData = (logRes.data as AgentLog[]) || [];
      setLogs(logData);
      setToolCalls((toolRes.data as McpToolCall[]) || []);

      // Derive agent statuses from recent logs
      const statuses = { ...agentStatuses };
      logData.slice(0, 10).forEach((l) => {
        statuses[l.agent] = l.status;
      });
      setAgentStatuses(statuses);
      setLoading(false);
    };
    load();

    const sub = supabase
      .channel("agent-hub-logs")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const log = payload.new as AgentLog;
          setLogs((prev) => [log, ...prev.slice(0, 49)]);
          setAgentStatuses((prev) => ({ ...prev, [log.agent]: log.status }));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mcp_tool_calls" },
        (payload) =>
          setToolCalls((prev) => [
            payload.new as McpToolCall,
            ...prev.slice(0, 29),
          ]),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [user]);

  const selectedConfig = selectedAgent
    ? AGENT_CONFIGS.find((a) => a.name === selectedAgent)
    : null;
  const selectedLogs = selectedAgent
    ? logs.filter((l) => l.agent === selectedAgent)
    : logs;

  // Demo logs for display when no real data
  const DEMO_AGENT_LOGS: AgentLog[] = [
    {
      id: "1",
      user_id: "",
      mission_id: null,
      agent: "risk_intelligence",
      status: "active",
      action: "risk_assess(lat=28.6139, lng=77.2090) → score: 34",
      reasoning:
        "Location is Central Delhi, evening hours, moderate pedestrian density",
      tool_called: "risk_assess",
      tool_params: null,
      tool_result: null,
      metadata: null,
      created_at: new Date(Date.now() - 5000).toISOString(),
    },
    {
      id: "2",
      user_id: "",
      mission_id: null,
      agent: "route_guardian",
      status: "active",
      action: "route_calculate(mode=walking) → 2.3km safe path identified",
      reasoning: "Calculated route avoids 2 flagged zones, estimated 28 min",
      tool_called: "route_calculate",
      tool_params: null,
      tool_result: null,
      metadata: null,
      created_at: new Date(Date.now() - 12000).toISOString(),
    },
    {
      id: "3",
      user_id: "",
      mission_id: null,
      agent: "trusted_contact",
      status: "idle",
      action: "Contact verification: Priya Sharma (+91-9876543210) [ACTIVE]",
      reasoning: "Pre-mission contact validation",
      tool_called: null,
      tool_params: null,
      tool_result: null,
      metadata: null,
      created_at: new Date(Date.now() - 20000).toISOString(),
    },
    {
      id: "4",
      user_id: "",
      mission_id: null,
      agent: "evidence",
      status: "active",
      action: "location_read() → 28.6139, 77.2090 · accuracy: 4m",
      reasoning: null,
      tool_called: "location_read",
      tool_params: null,
      tool_result: null,
      metadata: null,
      created_at: new Date(Date.now() - 28000).toISOString(),
    },
    {
      id: "5",
      user_id: "",
      mission_id: null,
      agent: "emergency_coordinator",
      status: "idle",
      action: "All agents nominal. Monitoring mode active.",
      reasoning: "System health check passed",
      tool_called: null,
      tool_params: null,
      tool_result: null,
      metadata: null,
      created_at: new Date(Date.now() - 35000).toISOString(),
    },
  ];

  const displayLogs =
    logs.length > 0
      ? selectedLogs
      : selectedAgent
        ? DEMO_AGENT_LOGS.filter((l) => l.agent === selectedAgent)
        : DEMO_AGENT_LOGS;

  return (
    <AppLayout
      title="AGENT HUB"
      subtitle="Multi-Agent Orchestration & MCP Tool Architecture"
    >
      <div className="p-4 space-y-4">
        {/* Orchestration Diagram */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-primary" />
              AGENT ORCHESTRATION
              <Badge
                variant="outline"
                className="ml-auto font-mono text-[10px] border-primary/30 text-primary py-0"
              >
                MCP ARCHITECTURE
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {AGENT_CONFIGS.map((cfg) => (
                <AgentNode
                  key={cfg.name}
                  agent={cfg.name}
                  status={agentStatuses[cfg.name]}
                  lastAction={
                    logs.find((l) => l.agent === cfg.name)?.action ||
                    DEMO_AGENT_LOGS.find((l) => l.agent === cfg.name)?.action
                  }
                  onClick={() =>
                    setSelectedAgent((prev) =>
                      prev === cfg.name ? null : cfg.name,
                    )
                  }
                  selected={selectedAgent === cfg.name}
                />
              ))}
            </div>
            {selectedConfig && (
              <div
                className={cn(
                  "mt-3 p-3 rounded-sm border",
                  AGENT_BG_COLORS[selectedConfig.name],
                  "animate-fade-in-up",
                )}
              >
                <p
                  className={cn(
                    "font-mono text-xs font-bold mb-1",
                    AGENT_COLORS[selectedConfig.name],
                  )}
                >
                  {selectedConfig.label}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground mb-2">
                  {selectedConfig.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="font-mono text-[10px] text-muted-foreground mr-1">
                    TOOLS:
                  </span>
                  {selectedConfig.tools.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className={cn(
                        "font-mono text-[9px] py-0 border-current/40",
                        AGENT_COLORS[selectedConfig.name],
                      )}
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="logs">
          <TabsList className="bg-muted/50 font-mono text-xs">
            <TabsTrigger value="logs" className="text-xs">
              AGENT LOGS
              {selectedAgent ? ` · ${AGENT_ICON_LABELS[selectedAgent]}` : ""}
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs">
              MCP TOOLS
            </TabsTrigger>
            <TabsTrigger value="architecture" className="text-xs">
              ARCHITECTURE
            </TabsTrigger>
          </TabsList>

          {/* Agent Logs */}
          <TabsContent value="logs" className="mt-3">
            <Card className="glass-card border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  {selectedAgent
                    ? `${AGENT_LABELS[selectedAgent]} — ACTIVITY LOG`
                    : "ALL AGENTS — ACTIVITY LOG"}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 bg-muted" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-96">
                    {displayLogs.map((log, i) => (
                      <div
                        key={log.id || i}
                        className={cn(
                          "p-3 rounded-sm border",
                          AGENT_BG_COLORS[log.agent],
                          "animate-fade-in-up",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "font-mono text-[10px] font-bold",
                                AGENT_COLORS[log.agent],
                              )}
                            >
                              [{AGENT_ICON_LABELS[log.agent]}]{" "}
                              {AGENT_LABELS[log.agent].toUpperCase()}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[9px] py-0 border-current/30",
                                AGENT_COLORS[log.agent],
                              )}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <span className="font-mono text-[9px] text-muted-foreground shrink-0">
                            {new Date(log.created_at).toLocaleTimeString(
                              "en-US",
                              { hour12: false },
                            )}
                          </span>
                        </div>
                        <p className="font-mono text-xs text-foreground/90">
                          {log.action}
                        </p>
                        {log.reasoning && (
                          <p className="font-mono text-[10px] text-muted-foreground mt-1 italic">
                            {log.reasoning}
                          </p>
                        )}
                        {log.tool_called && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-muted-foreground" />
                            <span className="font-mono text-[10px] text-muted-foreground">
                              tool:{" "}
                            </span>
                            <code className="font-mono text-[10px] text-foreground bg-muted/50 px-1 rounded-sm">
                              {log.tool_called}()
                            </code>
                          </div>
                        )}
                      </div>
                    ))}
                    {displayLogs.length === 0 && (
                      <p className="font-mono text-xs text-muted-foreground text-center py-8">
                        No agent logs yet. Start a journey to see agents in
                        action.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* MCP Tools */}
          <TabsContent value="tools" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MCP_TOOLS.map((tool) => (
                <Card
                  key={tool.name}
                  className="glass-card border-border/60 h-full"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-8 h-8 rounded-sm border border-primary/30 bg-primary/10 flex items-center justify-center shrink-0">
                        <Wrench className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <code className="font-mono text-sm font-bold text-foreground">
                          {tool.name}()
                        </code>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5 text-pretty">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        PARAMETERS:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tool.parameters).map(
                          ([param, type]) => (
                            <code
                              key={param}
                              className="font-mono text-[10px] bg-muted/40 px-1.5 py-0.5 rounded-sm text-foreground/80"
                            >
                              {param}: {type}
                            </code>
                          ),
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="font-mono text-[10px] text-muted-foreground">
                        REGISTERED AGENTS:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tool.agents.map((a) => (
                          <Badge
                            key={a}
                            variant="outline"
                            className={cn(
                              "font-mono text-[9px] py-0 border-current/30",
                              AGENT_COLORS[a],
                            )}
                          >
                            {AGENT_ICON_LABELS[a]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Architecture */}
          <TabsContent value="architecture" className="mt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  title: "SYSTEM ARCHITECTURE",
                  items: [
                    "React + TypeScript Frontend (Vite)",
                    "Supabase PostgreSQL — Mission & Agent Data",
                    "Supabase Edge Functions — Serverless Agent Runners",
                    "Gemini 2.5 Flash — AI Reasoning Engine",
                    "Google Maps APIs — Route & Geospatial",
                    "Supabase Realtime — Live Agent Feeds",
                  ],
                },
                {
                  title: "MCP TOOL ARCHITECTURE",
                  items: [
                    "6 registered MCP tools across 5 agents",
                    "Tool calls logged with params + results",
                    "Agents share location_read tool",
                    "emergency_coordinator has root tool access",
                    "Tools execute via Supabase Edge Functions",
                    "Results stored for forensic evidence chain",
                  ],
                },
                {
                  title: "EVENT-DRIVEN ESCALATION",
                  items: [
                    "Check-in timer fires every N minutes",
                    "Grace period: 2 minutes grace window",
                    "Tier 1: Push reminder via EmergencyCoord",
                    "Tier 2: TrustedContact agent notifies all contacts",
                    "Tier 3: Full emergency + evidence + dispatch",
                    "State managed in safety_missions.escalation_tier",
                  ],
                },
                {
                  title: "DEPLOYMENT ARCHITECTURE",
                  items: [
                    "Google Cloud Run — Frontend container",
                    "Supabase — Managed Postgres + Auth",
                    "Deno Edge Functions — Agent runtime",
                    "Gemini API Gateway — AI inference layer",
                    "Supabase Realtime — WebSocket updates",
                    "Row-Level Security — Per-user data isolation",
                  ],
                },
              ].map(({ title, items }) => (
                <Card
                  key={title}
                  className="glass-card border-border/60 h-full"
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                      <Radio className="w-3.5 h-3.5 text-primary" />
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary font-mono text-[10px] mt-0.5 shrink-0">
                            ›
                          </span>
                          <span className="font-mono text-[11px] text-muted-foreground text-pretty">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
