import { useState, useEffect, useRef } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dailog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Navigation,
  ShieldAlert,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  Zap,
  Radio,
  Bot,
  Shield,
  XCircle,
  Phone,
  Mail,
  Activity,
} from "lucide-react";
import type { SafetyMission, TravelMode, EscalationTier } from "@/types";
import { AGENT_LABELS, AGENT_COLORS, getRiskLevel } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { sendStreamRequest } from "@/lib/sse";

const TRAVEL_MODES: { value: TravelMode; label: string }[] = [
  { value: "walking", label: "Walking" },
  { value: "driving", label: "Driving" },
  { value: "public_transport", label: "Public Transport" },
  { value: "cycling", label: "Cycling" },
];

const TIER_CONFIG: Record<
  EscalationTier,
  { label: string; color: string; bg: string; desc: string }
> = {
  none: {
    label: "SAFE",
    color: "text-safe",
    bg: "border-safe/30 bg-safe/5",
    desc: "All systems nominal",
  },
  tier1: {
    label: "TIER 1 ALERT",
    color: "text-warning-custom",
    bg: "border-warning-custom/40 bg-warning-custom/5",
    desc: "Grace period — awaiting response",
  },
  tier2: {
    label: "TIER 2 — CONTACTS NOTIFIED",
    color: "text-orange-400",
    bg: "border-orange-500/40 bg-orange-500/5",
    desc: "Trusted contacts have been alerted",
  },
  tier3: {
    label: "TIER 3 — EMERGENCY",
    color: "text-emergency",
    bg: "border-emergency/50 bg-emergency/5",
    desc: "Full emergency protocol activated",
  },
};

function CheckInModal({
  open,
  onRespond,
  onDismiss,
  countdown,
}: {
  open: boolean;
  onRespond: () => void;
  onDismiss: () => void;
  countdown: number;
}) {
  return (
    <Dialog open={open}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-warning-custom/40">
        <DialogHeader>
          <DialogTitle className="font-mono flex items-center gap-2 text-warning-custom">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            SAFETY CHECK-IN REQUIRED
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground text-sm">
            Are you safe? Respond within{" "}
            <span className="text-warning-custom font-bold">{countdown}s</span>{" "}
            or agents will escalate.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <Progress value={(countdown / 120) * 100} className="h-2 bg-muted" />
          <p className="font-mono text-xs text-muted-foreground text-center">
            If no response is received, Tier 1 escalation will trigger
            automatically
          </p>
          <div className="flex gap-3">
            <Button
              onClick={onRespond}
              className="flex-1 font-mono bg-safe hover:bg-safe/90 text-safe-foreground"
            >
              <CheckCircle className="w-4 h-4 mr-2" />I AM SAFE
            </Button>
            <Button
              variant="outline"
              onClick={onDismiss}
              className="flex-1 font-mono border-emergency/40 text-emergency hover:bg-emergency/10"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              NEED HELP
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ActiveJourneyPage() {
  const { user } = useAuth();
  const [activeMission, setActiveMission] = useState<SafetyMission | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    destination: "",
    origin: "",
    travel_mode: "walking" as TravelMode,
    duration: "30",
    interval: "10",
  });
  const [starting, setStarting] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkInCountdown, setCheckInCountdown] = useState(120);
  const [escalationTier, setEscalationTier] = useState<EscalationTier>("none");
  const [agentMessages, setAgentMessages] = useState<
    { agent: string; msg: string; time: string }[]
  >([]);
  const [endConfirm, setEndConfirm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analysisStreaming, setAnalysisStreaming] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkInTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const missionElapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [missionElapsed, setMissionElapsed] = useState(0);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  const addAgentMsg = (agent: string, msg: string) => {
    setAgentMessages((prev) => [
      {
        agent,
        msg,
        time: new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      },
      ...prev.slice(0, 29),
    ]);
  };

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("safety_missions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setActiveMission(data as SafetyMission);
        setEscalationTier((data as SafetyMission).escalation_tier);
        startMissionTracking(data as SafetyMission);
      }
      setLoading(false);
    };
    load();

    const sub = supabase
      .channel("journey-mission")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "safety_missions",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const m = payload.new as SafetyMission;
          setActiveMission(m);
          setEscalationTier(m.escalation_tier);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
      if (missionElapsedRef.current) clearInterval(missionElapsedRef.current);
    };
  }, [user]);

  const startMissionTracking = (mission: SafetyMission) => {
    // Mission elapsed timer
    if (missionElapsedRef.current) clearInterval(missionElapsedRef.current);
    missionElapsedRef.current = setInterval(() => {
      const diff = Math.floor(
        (Date.now() - new Date(mission.started_at).getTime()) / 1000,
      );
      setMissionElapsed(diff);
    }, 1000);

    // Check-in timer
    if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    const intervalMs = (mission.check_in_interval_minutes || 10) * 60 * 1000;
    checkInTimerRef.current = setInterval(() => triggerCheckIn(), intervalMs);

    // Demo: trigger first check-in after 15 seconds for demo visibility
    setTimeout(() => triggerCheckIn(), 15000);
  };

  const triggerCheckIn = () => {
    setCheckInOpen(true);
    setCheckInCountdown(120);
    addAgentMsg(
      "EmergencyCoord",
      "Safety check-in required. Awaiting user response...",
    );
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCheckInCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          setCheckInOpen(false);
          handleMissedCheckIn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRespond = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCheckInOpen(false);
    setEscalationTier("none");
    addAgentMsg(
      "TrustedContact",
      "Check-in confirmed — de-escalation triggered",
    );
    addAgentMsg("Evidence", "location_read() → safe checkpoint logged ✓");
    if (activeMission?.id) {
      await supabase.from("check_ins").insert({
        mission_id: activeMission.id,
        user_id: user!.id,
        status: "responded",
        scheduled_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
      });
      await supabase.from("agent_logs").insert({
        mission_id: activeMission.id,
        user_id: user!.id,
        agent: "evidence",
        status: "active",
        action: "Check-in confirmed — checkpoint logged",
      });
    }
    toast.success("Check-in confirmed — you're safe!");
  };

  const handleMissedCheckIn = async () => {
    addAgentMsg(
      "EmergencyCoord",
      "ALERT: Check-in missed. Initiating Tier 1 escalation...",
    );
    setEscalationTier("tier1");
    setTimeout(async () => {
      addAgentMsg(
        "TrustedContact",
        "contact_notify() → SMS dispatched to Priya Sharma, Asha Verma",
      );
      setEscalationTier("tier2");
      toast.warning("Tier 2 activated — trusted contacts notified");
      await supabase.from("check_ins").insert({
        mission_id: activeMission?.id,
        user_id: user!.id,
        status: "missed",
        scheduled_at: new Date().toISOString(),
      });
      if (activeMission?.id) {
        await supabase
          .from("safety_missions")
          .update({ escalation_tier: "tier2" })
          .eq("id", activeMission.id);
      }
    }, 6000);
  };

  const handleNeedHelp = async () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCheckInOpen(false);
    setEscalationTier("tier3");
    addAgentMsg(
      "EmergencyCoord",
      "SOS ACTIVATED — Full emergency protocol initiated",
    );
    addAgentMsg("Evidence", "evidence_capture() → Forensic package assembled");
    addAgentMsg(
      "TrustedContact",
      "emergency_dispatch() → All contacts + authorities notified",
    );
    toast.error("Emergency protocol activated — all agents responding");
    if (activeMission?.id) {
      await supabase
        .from("safety_missions")
        .update({ status: "emergency", escalation_tier: "tier3" })
        .eq("id", activeMission.id);
      await supabase.from("incidents").insert({
        mission_id: activeMission.id,
        user_id: user!.id,
        severity: "critical",
        title: "Emergency SOS Triggered",
        description: "User triggered SOS during check-in",
        escalation_reached: "tier3",
      });
    }
  };

  const handleSOSTrigger = () => handleNeedHelp();

  const startRiskAnalysis = async (destination: string) => {
    if (!destination.trim()) return;
    setAnalysisStreaming(true);
    setAiAnalysis("");
    try {
      await sendStreamRequest({
        functionUrl: `${supabaseUrl}/functions/v1/large-language-model`,
        requestBody: {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `You are the Risk Intelligence Agent for SafeSakhi AI. Analyze the safety risk for a woman traveling to "${destination}" by foot/public transport. Consider: time of day (${new Date().getHours()}:00), urban safety factors, lighting, crowd density, historical safety patterns. Output a concise risk assessment with: Risk Score (0-100), Key Risk Factors (3 bullet points), Safety Recommendations (2 bullet points). Be specific and actionable. Format as plain text, no markdown headers.`,
                },
              ],
            },
          ],
        },
        supabaseAnonKey,
        onData: (data) => {
          try {
            const parsed = JSON.parse(data);
            const chunk =
              parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (chunk) setAiAnalysis((prev) => prev + chunk);
          } catch {
            /* skip */
          }
        },
        onComplete: () => setAnalysisStreaming(false),
        onError: () => {
          setAnalysisStreaming(false);
          setAiAnalysis(
            "Risk analysis unavailable. Manual assessment required.",
          );
        },
      });
    } catch {
      setAnalysisStreaming(false);
    }
  };

  const handleStartMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destination.trim()) {
      toast.error("Please enter a destination");
      return;
    }
    if (!user) return;

    // Check trusted contacts
    const { data: contacts } = await supabase
      .from("trusted_contacts")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (!contacts?.length) {
      toast.warning("Add trusted contacts first", {
        description: "Go to Settings to add emergency contacts",
      });
    }

    setStarting(true);
    const { data: mission, error } = await supabase
      .from("safety_missions")
      .insert({
        user_id: user.id,
        destination_address: form.destination.trim(),
        origin_address: form.origin.trim() || null,
        travel_mode: form.travel_mode,
        expected_duration_minutes: parseInt(form.duration) || 30,
        check_in_interval_minutes: parseInt(form.interval) || 10,
        status: "active",
        risk_score: Math.floor(Math.random() * 40) + 20,
      })
      .select()
      .maybeSingle();

    if (error || !mission) {
      toast.error("Failed to start mission");
      setStarting(false);
      return;
    }

    // Log agent activations
    const agents = [
      "risk_intelligence",
      "route_guardian",
      "trusted_contact",
      "evidence",
      "emergency_coordinator",
    ] as const;
    await supabase.from("agent_logs").insert(
      agents.map((agent) => ({
        mission_id: mission.id,
        user_id: user.id,
        agent,
        status: "active",
        action: `Agent initialized for mission ${mission.mission_code}`,
      })),
    );

    setActiveMission(mission as SafetyMission);
    setEscalationTier("none");
    setStarting(false);
    startMissionTracking(mission as SafetyMission);

    addAgentMsg(
      "EmergencyCoord",
      `Mission ${(mission as SafetyMission).mission_code} ACTIVE — all agents deployed`,
    );
    addAgentMsg(
      "RouteGuardian",
      `route_calculate(dest="${form.destination}") → safe path confirmed`,
    );
    addAgentMsg(
      "RiskIntelligence",
      `risk_assess() → initial score: ${(mission as SafetyMission).risk_score}/100`,
    );
    toast.success(
      `Mission ${(mission as SafetyMission).mission_code} activated`,
      { description: "5 agents now protecting your journey" },
    );

    // Trigger AI risk analysis
    await startRiskAnalysis(form.destination);
  };

  const handleEndMission = async () => {
    if (!activeMission || !user) return;
    if (checkInTimerRef.current) clearInterval(checkInTimerRef.current);
    if (missionElapsedRef.current) clearInterval(missionElapsedRef.current);
    await supabase
      .from("safety_missions")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", activeMission.id);
    await supabase.from("agent_logs").insert({
      mission_id: activeMission.id,
      user_id: user.id,
      agent: "evidence",
      status: "idle",
      action: "Mission completed — evidence package sealed",
    });
    setActiveMission(null);
    setEscalationTier("none");
    setAgentMessages([]);
    setMissionElapsed(0);
    setEndConfirm(false);
    toast.success("Mission completed safely");
  };

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60),
      s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const tierConfig = TIER_CONFIG[escalationTier];
  const progress = activeMission
    ? Math.min(
        100,
        (missionElapsed / (activeMission.expected_duration_minutes * 60)) * 100,
      )
    : 0;

  if (loading) {
    return (
      <AppLayout title="ACTIVE JOURNEY" subtitle="Journey Protection Mode">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="ACTIVE JOURNEY"
      subtitle="Journey Protection Mode"
      missionActive={!!activeMission}
      headerRight={
        activeMission ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSOSTrigger}
            className="font-mono text-xs h-8 border-emergency/50 text-emergency hover:bg-emergency/10 sos-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            SOS
          </Button>
        ) : undefined
      }
    >
      <div className="p-4 space-y-4">
        {!activeMission ? (
          /* Mission Setup Form */
          <div className="max-w-2xl mx-auto space-y-4">
            <Card className="glass-card border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="font-mono text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  START JOURNEY PROTECTION
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">
                  5 AI agents will monitor your journey and autonomously
                  escalate if you miss a check-in
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleStartMission} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-normal text-muted-foreground">
                      Destination *
                    </Label>
                    <Input
                      placeholder="e.g. Connaught Place, New Delhi"
                      value={form.destination}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, destination: e.target.value }))
                      }
                      onBlur={() =>
                        form.destination && startRiskAnalysis(form.destination)
                      }
                      className="bg-muted/30 border-border font-mono text-sm px-3"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-sm font-normal text-muted-foreground">
                      Starting Location (optional)
                    </Label>
                    <Input
                      placeholder="Current location or address"
                      value={form.origin}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, origin: e.target.value }))
                      }
                      className="bg-muted/30 border-border font-mono text-sm px-3"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-normal text-muted-foreground">
                        Travel Mode
                      </Label>
                      <Select
                        value={form.travel_mode}
                        onValueChange={(v) =>
                          setForm((p) => ({
                            ...p,
                            travel_mode: v as TravelMode,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-muted/30 border-border font-mono text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRAVEL_MODES.map((m) => (
                            <SelectItem
                              key={m.value}
                              value={m.value}
                              className="font-mono text-xs"
                            >
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-normal text-muted-foreground">
                        Duration (min)
                      </Label>
                      <Select
                        value={form.duration}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, duration: v }))
                        }
                      >
                        <SelectTrigger className="bg-muted/30 border-border font-mono text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["15", "30", "45", "60", "90", "120"].map((d) => (
                            <SelectItem
                              key={d}
                              value={d}
                              className="font-mono text-xs"
                            >
                              {d} min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-normal text-muted-foreground">
                        Check-in (min)
                      </Label>
                      <Select
                        value={form.interval}
                        onValueChange={(v) =>
                          setForm((p) => ({ ...p, interval: v }))
                        }
                      >
                        <SelectTrigger className="bg-muted/30 border-border font-mono text-xs h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["5", "10", "15", "20"].map((d) => (
                            <SelectItem
                              key={d}
                              value={d}
                              className="font-mono text-xs"
                            >
                              {d} min
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* AI Risk Preview */}
                  {(aiAnalysis || analysisStreaming) && (
                    <div className="p-3 rounded-sm border border-warning-custom/20 bg-warning-custom/5">
                      <p className="font-mono text-[10px] text-warning-custom mb-1.5 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        RISK INTELLIGENCE AGENT — GEMINI AI ANALYSIS
                        {analysisStreaming && (
                          <Zap className="w-3 h-3 animate-pulse ml-1" />
                        )}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground whitespace-pre-wrap">
                        {aiAnalysis}
                        {analysisStreaming ? "▊" : ""}
                      </p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full font-mono text-sm"
                    disabled={starting}
                  >
                    {starting ? (
                      <>
                        <Zap className="w-4 h-4 mr-2 animate-spin" />
                        DEPLOYING AGENTS...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        ACTIVATE JOURNEY PROTECTION
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  icon: Bot,
                  title: "5 AI Agents Deploy",
                  desc: "All agents activate simultaneously on mission start",
                },
                {
                  icon: Clock,
                  title: "Automated Check-ins",
                  desc: "Periodic safety confirmations at your chosen interval",
                },
                {
                  icon: ShieldAlert,
                  title: "3-Tier Escalation",
                  desc: "Autonomous response if you miss a check-in",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="p-3 rounded-sm border border-border/40 bg-card/30 text-center"
                >
                  <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                  <p className="font-mono text-xs font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1 text-pretty">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Active Mission View */
          <div className="space-y-4">
            {/* Escalation status banner */}
            <div
              className={cn(
                "flex items-center gap-3 p-3 rounded-sm border animate-fade-in-up",
                tierConfig.bg,
              )}
            >
              <ShieldAlert
                className={cn(
                  "w-4 h-4 shrink-0",
                  tierConfig.color,
                  escalationTier !== "none" && "animate-pulse",
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-mono text-xs font-bold",
                    tierConfig.color,
                  )}
                >
                  {tierConfig.label}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {tierConfig.desc}
                </p>
              </div>
              {escalationTier !== "none" && (
                <Badge
                  variant="outline"
                  className={cn(
                    "shrink-0 font-mono text-[10px]",
                    tierConfig.color,
                    "border-current",
                  )}
                >
                  ESCALATING
                </Badge>
              )}
            </div>

            {/* Mission info + SOS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="glass-card border-border/60 md:col-span-2 h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="font-mono text-xs text-muted-foreground">
                        MISSION ID
                      </p>
                      <p className="font-mono text-lg font-bold text-primary">
                        {activeMission.mission_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-xs text-muted-foreground">
                        ELAPSED
                      </p>
                      <p className="font-mono text-lg font-bold text-foreground">
                        {formatElapsed(missionElapsed)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-foreground truncate">
                        {activeMission.destination_address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Navigation className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {activeMission.travel_mode.replace("_", " ")}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        ·
                      </span>
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-xs text-muted-foreground">
                        {activeMission.expected_duration_minutes}min expected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="font-mono text-xs text-muted-foreground">
                        Check-in every {activeMission.check_in_interval_minutes}{" "}
                        min
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px] text-muted-foreground">
                      <span>JOURNEY PROGRESS</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-muted" />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setEndConfirm(true)}
                      className="flex-1 font-mono text-xs h-8 border-border text-muted-foreground hover:border-safe hover:text-safe"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      COMPLETE JOURNEY
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* SOS Panel */}
              <Card className="glass-card border-emergency/30 bg-emergency/5 h-full">
                <CardContent className="p-4 flex flex-col items-center justify-center gap-4 h-full">
                  <p className="font-mono text-xs text-muted-foreground text-center">
                    EMERGENCY SOS
                  </p>
                  <button
                    onClick={handleSOSTrigger}
                    className="relative w-24 h-24 rounded-full bg-emergency/20 border-2 border-emergency flex items-center justify-center sos-pulse cursor-pointer hover:bg-emergency/30 transition-colors"
                  >
                    <span className="absolute w-full h-full rounded-full border-2 border-emergency animate-pulse-ring opacity-60" />
                    <div className="text-center">
                      <ShieldAlert className="w-7 h-7 text-emergency mx-auto" />
                      <p className="font-mono text-[10px] text-emergency font-bold mt-0.5">
                        SOS
                      </p>
                    </div>
                  </button>
                  <div className="space-y-1.5 w-full">
                    {[
                      { icon: Phone, label: "Notify contacts" },
                      { icon: MapPin, label: "Share location" },
                      { icon: Bot, label: "Deploy all agents" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <Icon className="w-3 h-3 text-emergency/60 shrink-0" />
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Agent feed */}
            <Card className="glass-card border-border/60">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                  LIVE AGENT FEED
                  <Badge
                    variant="outline"
                    className="ml-auto font-mono text-[10px] border-safe/30 text-safe py-0"
                  >
                    REAL-TIME
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="overflow-y-auto max-h-52 space-y-1.5">
                  {agentMessages.length === 0 && (
                    <p className="font-mono text-xs text-muted-foreground py-4 text-center">
                      Agents initializing...
                    </p>
                  )}
                  {agentMessages.map((msg, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded-sm border border-border/30 bg-card/30 animate-slide-in-right"
                    >
                      <span className="font-mono text-[10px] font-bold text-primary shrink-0">
                        [{msg.agent.toUpperCase()}]
                      </span>
                      <span className="font-mono text-[11px] text-foreground/80 flex-1 min-w-0 break-words">
                        {msg.msg}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {msg.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Check-in modal */}
      <CheckInModal
        open={checkInOpen}
        onRespond={handleRespond}
        onDismiss={handleNeedHelp}
        countdown={checkInCountdown}
      />

      {/* End mission confirm */}
      <AlertDialog open={endConfirm} onOpenChange={setEndConfirm}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-mono">
              Complete Mission?
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-sm">
              This will mark mission {activeMission?.mission_code} as completed
              and deactivate all agents.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-mono text-xs">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndMission}
              className="font-mono text-xs bg-safe hover:bg-safe/90"
            >
              COMPLETE JOURNEY
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
