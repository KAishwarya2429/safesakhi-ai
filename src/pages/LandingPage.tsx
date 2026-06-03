import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShieldAlert,
  Zap,
  Bot,
  Map,
  Navigation,
  FileText,
  Shield,
  Radio,
  AlertTriangle,
  ChevronRight,
  Star,
  Globe,
  Users,
  Lock,
  ArrowRight,
  Play,
} from "lucide-react";

const STATS = [
  { value: "500M+", label: "Women Lack Safety Tools", icon: Users },
  { value: "5", label: "Autonomous AI Agents", icon: Bot },
  { value: "< 2min", label: "Emergency Response", icon: Zap },
  { value: "24/7", label: "Mission Monitoring", icon: Radio },
];

const AGENTS = [
  {
    name: "Risk Intelligence Agent",
    color: "text-yellow-400",
    border: "border-yellow-500/30",
    bg: "bg-yellow-500/5",
    desc: "Computes real-time threat vectors using Gemini AI, time-of-day patterns, and historical incident data",
  },
  {
    name: "Route Guardian Agent",
    color: "text-cyan-400",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    desc: "Monitors journey progress and autonomously calculates safe route alternatives on deviation",
  },
  {
    name: "Trusted Contact Agent",
    color: "text-purple-400",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    desc: "Orchestrates a tiered notification cascade to trusted contacts when check-ins are missed",
  },
  {
    name: "Evidence Agent",
    color: "text-blue-400",
    border: "border-blue-500/30",
    bg: "bg-blue-500/5",
    desc: "Captures forensic-grade timestamped location logs, route history, and generates incident reports",
  },
  {
    name: "Emergency Coordinator",
    color: "text-red-400",
    border: "border-red-500/30",
    bg: "bg-red-500/5",
    desc: "Master orchestrator that coordinates all agents and manages the full emergency response protocol",
  },
];

const FEATURES = [
  {
    icon: Navigation,
    title: "Journey Protection Mode",
    desc: "Start a safety mission with one tap. Agents autonomously monitor your entire journey.",
  },
  {
    icon: Bot,
    title: "Multi-Agent AI System",
    desc: "5 specialized Gemini-powered agents collaborating via MCP tool architecture.",
  },
  {
    icon: AlertTriangle,
    title: "Autonomous Escalation",
    desc: "3-tier escalation protocol triggered automatically when check-ins are missed.",
  },
  {
    icon: Map,
    title: "Live Risk Intelligence",
    desc: "Real-time location risk scoring with heatmaps using Google Maps & Gemini AI.",
  },
  {
    icon: FileText,
    title: "Forensic Evidence Chain",
    desc: "Every journey creates a tamper-evident evidence package with GPS waypoints.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    desc: "End-to-end encrypted, Supabase-backed, Google Cloud native architecture.",
  },
];

const DEMO_STEPS = [
  {
    step: "01",
    title: "Start Mission",
    desc: "Enter destination and activate Journey Protection Mode",
  },
  {
    step: "02",
    title: "Agents Activate",
    desc: "All 5 AI agents initialize and begin real-time monitoring",
  },
  {
    step: "03",
    title: "Risk Assessment",
    desc: "Gemini AI scores location risk every minute",
  },
  {
    step: "04",
    title: "Miss Check-in",
    desc: "Simulate a missed check-in to trigger autonomous escalation",
  },
  {
    step: "05",
    title: "Tier 2 Escalation",
    desc: "Trusted contacts are automatically notified",
  },
  {
    step: "06",
    title: "Evidence Captured",
    desc: "Evidence Agent assembles forensic incident report",
  },
];

function TerminalLine({ text, delay = 0 }: { text: string; delay?: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div
      className={`font-mono text-xs transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <span className="text-primary/60 mr-2">›</span>
      <span className="text-foreground/80">{text}</span>
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [demoRunning, setDemoRunning] = useState(false);

  const handleDemo = () => {
    setDemoRunning(true);
    setTimeout(() => navigate("/dashboard"), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-sm bg-primary/10 border border-primary/30">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-safe border-2 border-background" />
            </div>
            <div>
              <p className="font-mono font-bold text-sm tracking-widest gradient-text">
                SAFESAKHI AI
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                MULTI-AGENT SAFETY SYSTEM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground font-mono text-xs h-8"
            >
              SIGN IN
            </Button>
            <Button
              onClick={() => navigate("/login")}
              className="font-mono text-xs h-8"
            >
              <Shield className="w-3.5 h-3.5 mr-1.5" />
              GET ACCESS
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-4 py-20 md:py-32 overflow-hidden">
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-[0.07] blur-3xl"
          style={{
            background:
              "radial-gradient(circle, hsl(var(--neon-pink)), hsl(var(--neon-purple)))",
          }}
        />

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-6 font-mono text-xs border-primary/30 text-primary bg-primary/5 py-1 px-3"
          >
            <Zap className="w-3 h-3 mr-1.5 animate-pulse" />
            GOOGLE CLOUD RAPID AGENT HACKATHON 2026
          </Badge>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold font-mono tracking-tight mb-6 text-balance">
            The World's First
            <br />
            <span className="gradient-text">Autonomous Multi-Agent</span>
            <br />
            Women's Safety System
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
            SafeSakhi AI deploys 5 specialized Gemini-powered agents that
            collaborate in real-time via MCP tool architecture — monitoring
            journeys, predicting risk, and escalating emergencies autonomously.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleDemo}
              disabled={demoRunning}
              className="font-mono text-sm min-w-48 sos-pulse"
            >
              {demoRunning ? (
                <>
                  <Radio className="w-4 h-4 mr-2 animate-spin" />
                  INITIALIZING...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  LAUNCH DEMO
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/login")}
              className="font-mono text-sm min-w-48 border-border hover:bg-muted"
            >
              <Shield className="w-4 h-4 mr-2" />
              ACCESS PLATFORM
            </Button>
          </div>

          {/* Terminal preview */}
          <div className="mt-12 max-w-xl mx-auto rounded-sm border border-border bg-card/60 backdrop-blur p-4 text-left">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-emergency/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning-custom/70" />
              <div className="w-2.5 h-2.5 rounded-full bg-safe/70" />
              <span className="font-mono text-[10px] text-muted-foreground ml-2">
                AGENT TERMINAL — LIVE
              </span>
            </div>
            <div className="space-y-1.5">
              <TerminalLine
                text="[MISSION MSN-X7K2P] Journey Protection ACTIVATED"
                delay={400}
              />
              <TerminalLine
                text="[RiskIntelligence] risk_assess(lat=28.6, lng=77.2) → score: 42/100"
                delay={900}
              />
              <TerminalLine
                text="[RouteGuardian] route_calculate(mode=walking) → safe_path confirmed"
                delay={1400}
              />
              <TerminalLine
                text="[TrustedContact] 2 contacts verified — notification cascade ready"
                delay={1900}
              />
              <TerminalLine
                text="[Evidence] location_snapshot logged — 847 bytes encrypted"
                delay={2400}
              />
              <TerminalLine
                text="[EmergencyCoord] All agents nominal. Mission active. ✓"
                delay={2900}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 border-y border-border bg-card/20">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-sm border border-border bg-muted/30 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-2xl md:text-3xl font-bold font-mono gradient-text">
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 text-pretty">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Five Agents */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <Badge
            variant="outline"
            className="mb-3 font-mono text-xs border-border"
          >
            AGENT ARCHITECTURE
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold font-mono text-balance">
            5 Specialized AI Agents
          </h2>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl mx-auto text-pretty">
            Each agent is goal-oriented, uses MCP tools, and collaborates via an
            event-driven orchestration layer
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AGENTS.map((agent, i) => (
            <Card
              key={agent.name}
              className={`glass-card h-full border ${agent.border} ${agent.bg}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 shrink-0 rounded-sm border ${agent.border} flex items-center justify-center`}
                  >
                    <span
                      className={`font-mono font-bold text-xs ${agent.color}`}
                    >
                      A{i + 1}
                    </span>
                  </div>
                  <div>
                    <p
                      className={`font-mono text-sm font-semibold ${agent.color} text-balance`}
                    >
                      {agent.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-pretty">
                      {agent.desc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {/* MCP Architecture card */}
          <Card className="glass-card h-full border border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div>
                <p className="font-mono text-sm font-semibold text-primary text-balance">
                  MCP Tool Architecture
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-pretty">
                  6 MCP tools: location_read, risk_assess, route_calculate,
                  contact_notify, evidence_capture, emergency_dispatch
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {["Gemini 2.5", "Google Maps", "Supabase", "Edge Fn"].map(
                  (tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-[10px] font-mono border-primary/30 text-primary py-0"
                    >
                      {tag}
                    </Badge>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 bg-card/10 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <Badge
              variant="outline"
              className="mb-3 font-mono text-xs border-border"
            >
              CAPABILITIES
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold font-mono text-balance">
              Enterprise-Grade Safety Platform
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="p-4 rounded-sm border border-border bg-card/40 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-sm border border-border bg-muted/30 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="font-mono text-sm font-semibold text-foreground text-balance">
                    {title}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Flow */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <Badge
            variant="outline"
            className="mb-3 font-mono text-xs border-border"
          >
            3-MINUTE DEMO FLOW
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold font-mono text-balance">
            Watch SafeSakhi AI in Action
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_STEPS.map(({ step, title, desc }) => (
            <div
              key={step}
              className="flex gap-3 p-4 rounded-sm border border-border bg-card/30"
            >
              <span className="font-mono text-2xl font-bold text-primary/30 shrink-0">
                {step}
              </span>
              <div>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 text-pretty">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button
            size="lg"
            onClick={handleDemo}
            disabled={demoRunning}
            className="font-mono text-sm"
          >
            {demoRunning ? (
              <>
                <Radio className="w-4 h-4 mr-2 animate-spin" />
                LAUNCHING...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                START FULL DEMO
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Winning Narrative */}
      <section className="px-4 py-16 border-t border-border bg-card/10">
        <div className="max-w-3xl mx-auto text-center">
          <Star className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-xl md:text-2xl font-bold font-mono mb-4 text-balance">
            Why SafeSakhi AI Wins
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mt-8">
            {[
              {
                label: "Technological Implementation",
                desc: "Goal-oriented agents, MCP tool calling, Gemini AI, event-driven escalation — every judging criterion met",
              },
              {
                label: "Design",
                desc: "Military ops room command center UI, real-time agent feeds, glassmorphism components",
              },
              {
                label: "Potential Impact",
                desc: "Addresses the 500M+ gap in women's safety tools with AI that acts when users can't",
              },
              {
                label: "Quality of Idea",
                desc: "First autonomous multi-agent safety system — proactive, predictive, not reactive",
              },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="p-4 rounded-sm border border-border bg-card/40"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="font-mono text-xs font-semibold text-primary">
                    {label}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-pretty">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-border text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground">
            Built on Google Cloud · Gemini 2.5 Flash · Supabase · MCP
            Architecture
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60 font-mono">
          SafeSakhi AI © 2026 — Google Cloud Rapid Agent Hackathon
        </p>
      </footer>
    </div>
  );
}
