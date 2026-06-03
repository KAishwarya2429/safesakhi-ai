import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldAlert,
  Navigation,
  Zap,
  Radio,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  MapPin,
  Activity,
  Plus,
  ChevronRight,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import type { SafetyMission, AgentLog, AgentName } from "@/types";
import {
  AGENT_LABELS,
  AGENT_COLORS,
  getRiskLevel,
  formatMissionTime,
} from "@/lib/agents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const DEMO_LOGS: { agent: AgentName; action: string; delay: number }[] = [
  {
    agent: "risk_intelligence",
    action: "Initializing risk vector analysis for sector 7G...",
    delay: 0,
  },
  {
    agent: "route_guardian",
    action: "route_calculate() → optimal safe path identified",
    delay: 1200,
  },
  {
    agent: "evidence",
    action: "location_read() → GPS snapshot logged at 08:42:17 UTC",
    delay: 2400,
  },
  {
    agent: "trusted_contact",
    action: "Contact verification: Priya Sharma [ACTIVE]",
    delay: 3600,
  },
  {
    agent: "emergency_coordinator",
    action: "All subsystems nominal. Standby mode active.",
    delay: 4800,
  },
  {
    agent: "risk_intelligence",
    action: "risk_assess() → score: 34/100 (MODERATE)",
    delay: 6000,
  },
  {
    agent: "route_guardian",
    action: "Deviation threshold monitoring: within bounds",
    delay: 7200,
  },
  {
    agent: "evidence",
    action: "Waypoint #8 logged — evidence chain: 8 entries",
    delay: 8400,
  },
];

function RiskGauge({ score }: { score: number }) {
  const { label, color } = getRiskLevel(score);
  const rotation = (score / 100) * 180 - 90;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-16 overflow-hidden">
        {/* Arc track */}
        <svg viewBox="0 0 120 60" className="w-32 h-16">
          <path
            d="M 10 58 A 50 50 0 0 1 110 58"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M 10 58 A 50 50 0 0 1 110 58"
            fill="none"
            stroke={
              score <= 33
                ? "hsl(var(--safe))"
                : score <= 66
                  ? "hsl(var(--warning))"
                  : "hsl(var(--emergency))"
            }
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`}
          />
          {/* Needle */}
          <line
            x1="60"
            y1="58"
            x2="60"
            y2="20"
            stroke="hsl(var(--foreground))"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation} 60 58)`}
          />
          <circle cx="60" cy="58" r="4" fill="hsl(var(--foreground))" />
        </svg>
      </div>
      <div className="text-center">
        <p className={cn("font-mono text-3xl font-bold", color)}>{score}</p>
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px] mt-1",
            score <= 33
              ? "border-safe/30 text-safe"
              : score <= 66
                ? "border-warning-custom/30 text-warning-custom"
                : "border-emergency/30 text-emergency",
          )}
        >
          {label}
        </Badge>
      </div>
    </div>
  );
}

function AgentStatusRow({
  agent,
  status,
  lastAction,
}: {
  agent: AgentName;
  status: "idle" | "active" | "alert" | "emergency";
  lastAction?: string;
}) {
  const dotColor = {
    idle: "bg-muted-foreground",
    active: "bg-safe",
    alert: "bg-warning-custom",
    emergency: "bg-emergency",
  }[status];
  const textColor = AGENT_COLORS[agent];

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div
        className={cn(
          "w-2 h-2 rounded-full shrink-0 mt-1",
          dotColor,
          status !== "idle" && "agent-active",
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("font-mono text-xs font-semibold", textColor)}>
            {AGENT_LABELS[agent]}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] font-mono py-0 border-border/50"
          >
            {status.toUpperCase()}
          </Badge>
        </div>
        {lastAction && (
          <p className="text-[11px] text-muted-foreground font-mono truncate mt-0.5">
            {lastAction}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<SafetyMission[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveRisk, setLiveRisk] = useState(34);
  const [demoLogIndex, setDemoLogIndex] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [missRes, logRes] = await Promise.all([
        supabase
          .from("safety_missions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("agent_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setMissions((missRes.data as SafetyMission[]) || []);
      setAgentLogs((logRes.data as AgentLog[]) || []);
      setLoading(false);
    };
    load();

    // Realtime subscriptions
    const missionSub = supabase
      .channel("dashboard-missions")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "safety_missions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new)
            setMissions((prev) => [
              payload.new as SafetyMission,
              ...prev.slice(0, 4),
            ]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "agent_logs",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new)
            setAgentLogs((prev) => [
              payload.new as AgentLog,
              ...prev.slice(0, 19),
            ]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(missionSub);
    };
  }, [user]);

  // Animate demo logs if no real logs
  useEffect(() => {
    if (agentLogs.length > 0) return;
    if (demoLogIndex >= DEMO_LOGS.length) return;
    const item = DEMO_LOGS[demoLogIndex];
    const t = setTimeout(
      () => setDemoLogIndex((i) => i + 1),
      item.delay + 1200,
    );
    return () => clearTimeout(t);
  }, [agentLogs.length, demoLogIndex]);

  // Drift risk score gently
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveRisk((prev) =>
        Math.min(95, Math.max(5, prev + Math.round((Math.random() - 0.5) * 8))),
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll feed
  useEffect(() => {
    if (feedRef.current)
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [agentLogs, demoLogIndex]);

  const activeMission = missions.find((m) => m.status === "active");
  const displayLogs =
    agentLogs.length > 0
      ? agentLogs
      : DEMO_LOGS.slice(0, demoLogIndex).map((d, i) => ({
          id: String(i),
          user_id: "",
          mission_id: null,
          agent: d.agent,
          status: "active" as const,
          action: d.action,
          reasoning: null,
          tool_called: null,
          tool_params: null,
          tool_result: null,
          metadata: null,
          created_at: new Date(
            Date.now() - (DEMO_LOGS.length - i) * 1200,
          ).toISOString(),
        }));

  const agentStatuses: Record<
    AgentName,
    "idle" | "active" | "alert" | "emergency"
  > = {
    risk_intelligence: activeMission ? "active" : "idle",
    route_guardian: activeMission ? "active" : "idle",
    trusted_contact:
      activeMission?.escalation_tier !== "none" ? "alert" : "idle",
    evidence: activeMission ? "active" : "idle",
    emergency_coordinator:
      activeMission?.status === "emergency" ? "emergency" : "idle",
  };

  return (
    <AppLayout
      title="COMMAND CENTER"
      subtitle="Autonomous Women's Safety Operations"
      missionActive={!!activeMission}
      headerRight={
        <Button
          size="sm"
          onClick={() => navigate("/journey")}
          className="font-mono text-xs h-8"
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          NEW MISSION
        </Button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Mission alert banner */}
        {activeMission && (
          <div className="flex items-center gap-3 p-3 rounded-sm border border-safe/30 bg-safe/5 animate-fade-in-up">
            <Radio className="w-4 h-4 text-safe shrink-0 animate-pulse" />
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs font-semibold text-safe">
                ACTIVE MISSION: {activeMission.mission_code}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground truncate">
                → {activeMission.destination_address} ·{" "}
                {formatMissionTime(activeMission.started_at)} elapsed
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/journey")}
              className="shrink-0 font-mono text-xs h-7 border-safe/30 text-safe hover:bg-safe/10"
            >
              MONITOR <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Active Missions",
              value: missions.filter((m) => m.status === "active").length,
              icon: Navigation,
              color: "text-primary",
            },
            {
              label: "Total Journeys",
              value: missions.length,
              icon: Shield,
              color: "text-cyan-400",
            },
            {
              label: "Incidents",
              value: 0,
              icon: AlertTriangle,
              color: "text-warning-custom",
            },
            {
              label: "Agents Online",
              value: 5,
              icon: Bot,
              color: "text-purple-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass-card border-border/60 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className={cn("w-4 h-4", color)} />
                  {loading ? (
                    <Skeleton className="h-6 w-8 bg-muted" />
                  ) : (
                    <span className={cn("font-mono text-xl font-bold", color)}>
                      {value}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {label.toUpperCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk Meter */}
          <Card className="glass-card border-border/60 h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                LIVE RISK SCORE
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col items-center gap-4">
              <RiskGauge score={activeMission?.risk_score ?? liveRisk} />
              <div className="w-full space-y-2">
                {[
                  { label: "Time of Day", val: 72, color: "bg-warning-custom" },
                  { label: "Location", val: 45, color: "bg-primary" },
                  { label: "Weather", val: 20, color: "bg-safe" },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground w-20 shrink-0">
                      {label}
                    </span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          color,
                        )}
                        style={{ width: `${val}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Agent Activity Feed */}
          <Card className="glass-card border-border/60 h-full lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                AGENT ACTIVITY FEED
                <Badge
                  variant="outline"
                  className="ml-auto font-mono text-[10px] border-safe/30 text-safe py-0"
                >
                  LIVE
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div
                ref={feedRef}
                className="overflow-y-auto max-h-56 space-y-1.5 pr-1"
              >
                {displayLogs.length === 0 && (
                  <p className="font-mono text-xs text-muted-foreground py-4 text-center">
                    Awaiting agent activity...
                  </p>
                )}
                {displayLogs.map((log, i) => (
                  <div
                    key={log.id || i}
                    className="flex items-start gap-2 p-2 rounded-sm border border-border/30 bg-card/30 animate-fade-in-up"
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold shrink-0 mt-0.5",
                        AGENT_COLORS[log.agent],
                      )}
                    >
                      [{AGENT_LABELS[log.agent].split(" ")[0].toUpperCase()}]
                    </span>
                    <span className="font-mono text-[11px] text-foreground/80 flex-1 min-w-0 break-words">
                      {log.action}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {new Date(log.created_at).toLocaleTimeString("en-US", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Agent Status */}
          <Card className="glass-card border-border/60 h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Bot className="w-3.5 h-3.5 text-primary" />
                AGENT STATUS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {(
                Object.entries(agentStatuses) as [
                  AgentName,
                  (typeof agentStatuses)[AgentName],
                ][]
              ).map(([agent, status]) => (
                <AgentStatusRow
                  key={agent}
                  agent={agent}
                  status={status}
                  lastAction={
                    displayLogs.find((l) => l.agent === agent)?.action
                  }
                />
              ))}
            </CardContent>
          </Card>

          {/* Recent Missions */}
          <Card className="glass-card border-border/60 h-full lg:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  RECENT MISSIONS
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/journey")}
                  className="font-mono text-[10px] text-muted-foreground hover:text-foreground h-6 px-2"
                >
                  NEW <Plus className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 bg-muted" />
                  ))}
                </div>
              ) : missions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <ShieldAlert className="w-10 h-10 text-muted-foreground/30" />
                  <p className="font-mono text-xs text-muted-foreground text-center">
                    No missions yet. Start your first journey protection.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/journey")}
                    className="font-mono text-xs"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    START MISSION
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {missions.map((mission) => {
                    const { label: riskLabel, color: riskColor } = getRiskLevel(
                      mission.risk_score,
                    );
                    return (
                      <div
                        key={mission.id}
                        onClick={() => navigate("/journey")}
                        className="flex items-center gap-3 p-2.5 rounded-sm border border-border/40 bg-card/30 hover:border-border cursor-pointer transition-colors"
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            {
                              active: "bg-safe animate-pulse",
                              completed: "bg-muted-foreground",
                              emergency: "bg-emergency animate-pulse",
                              cancelled: "bg-muted-foreground",
                            }[mission.status],
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {mission.mission_code}
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] py-0 border-border/50"
                            >
                              {mission.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground truncate">
                            {mission.destination_address}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={cn(
                              "font-mono text-xs font-bold",
                              riskColor,
                            )}
                          >
                            {mission.risk_score}
                          </span>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {riskLabel}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Start Mission",
              icon: Navigation,
              path: "/journey",
              color: "border-primary/30 hover:border-primary/60 text-primary",
            },
            {
              label: "View Agents",
              icon: Bot,
              path: "/agents",
              color:
                "border-purple-500/30 hover:border-purple-500/60 text-purple-400",
            },
            {
              label: "Risk Map",
              icon: TrendingUp,
              path: "/risk-map",
              color:
                "border-cyan-500/30 hover:border-cyan-500/60 text-cyan-400",
            },
            {
              label: "Contacts",
              icon: Users,
              path: "/settings",
              color:
                "border-border hover:border-border/80 text-muted-foreground",
            },
          ].map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-2 p-3 rounded-sm border bg-card/30 transition-colors",
                color,
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="font-mono text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
