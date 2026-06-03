import { type AgentConfig, type AgentName, type McpTool } from "@/types";

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: "risk_intelligence",
    label: "Risk Intelligence Agent",
    description:
      "Analyzes location risk scores, time-of-day patterns, and environmental factors using Gemini AI",
    color: "hsl(38 90% 55%)",
    tools: ["location_read", "risk_assess", "weather_check"],
  },
  {
    name: "route_guardian",
    label: "Route Guardian Agent",
    description:
      "Monitors journey progress, detects route deviations, and calculates safe alternatives",
    color: "hsl(185 100% 55%)",
    tools: ["route_calculate", "location_read", "deviation_detect"],
  },
  {
    name: "trusted_contact",
    label: "Trusted Contact Agent",
    description:
      "Manages trusted contacts and orchestrates emergency notification cascades",
    color: "hsl(270 100% 70%)",
    tools: ["contact_notify", "escalation_trigger"],
  },
  {
    name: "evidence",
    label: "Evidence Agent",
    description:
      "Captures timestamped location logs, incident evidence, and generates forensic reports",
    color: "hsl(210 100% 65%)",
    tools: ["evidence_capture", "location_read", "report_generate"],
  },
  {
    name: "emergency_coordinator",
    label: "Emergency Coordinator",
    description:
      "Orchestrates full emergency response, coordinates all agents, and manages escalation",
    color: "hsl(0 80% 60%)",
    tools: [
      "emergency_dispatch",
      "contact_notify",
      "evidence_capture",
      "escalation_trigger",
    ],
  },
];

export const MCP_TOOLS: McpTool[] = [
  {
    name: "location_read",
    description: "Reads current GPS coordinates with accuracy metadata",
    parameters: { accuracy: "string", timestamp: "string" },
    agents: ["risk_intelligence", "route_guardian", "evidence"],
  },
  {
    name: "risk_assess",
    description:
      "Computes composite risk score for given coordinates using Gemini AI",
    parameters: {
      lat: "number",
      lng: "number",
      time: "string",
      context: "string",
    },
    agents: ["risk_intelligence"],
  },
  {
    name: "route_calculate",
    description: "Calculates optimal safe route between two points",
    parameters: { origin: "string", destination: "string", mode: "string" },
    agents: ["route_guardian"],
  },
  {
    name: "contact_notify",
    description:
      "Sends emergency notification to trusted contacts via SMS/email simulation",
    parameters: { contacts: "array", message: "string", mission_id: "string" },
    agents: ["trusted_contact", "emergency_coordinator"],
  },
  {
    name: "evidence_capture",
    description:
      "Captures and stores timestamped location + route evidence for incident record",
    parameters: { mission_id: "string", type: "string", metadata: "object" },
    agents: ["evidence", "emergency_coordinator"],
  },
  {
    name: "emergency_dispatch",
    description:
      "Initiates full emergency protocol and coordinates all agent responses",
    parameters: {
      mission_id: "string",
      severity: "string",
      location: "object",
    },
    agents: ["emergency_coordinator"],
  },
  {
    name: "escalation_trigger",
    description:
      "Advances escalation to next tier with automated agent actions",
    parameters: { mission_id: "string", tier: "string", reason: "string" },
    agents: ["trusted_contact", "emergency_coordinator"],
  },
  {
    name: "weather_check",
    description: "Retrieves weather conditions to factor into risk assessment",
    parameters: { lat: "number", lng: "number" },
    agents: ["risk_intelligence"],
  },
];

export const AGENT_LABELS: Record<AgentName, string> = {
  risk_intelligence: "Risk Intelligence",
  route_guardian: "Route Guardian",
  trusted_contact: "Trusted Contact",
  evidence: "Evidence Agent",
  emergency_coordinator: "Emergency Coordinator",
};

export const AGENT_COLORS: Record<AgentName, string> = {
  risk_intelligence: "text-yellow-400",
  route_guardian: "text-cyan-400",
  trusted_contact: "text-purple-400",
  evidence: "text-blue-400",
  emergency_coordinator: "text-red-400",
};

export const AGENT_BG_COLORS: Record<AgentName, string> = {
  risk_intelligence: "bg-yellow-500/10 border-yellow-500/30",
  route_guardian: "bg-cyan-500/10 border-cyan-500/30",
  trusted_contact: "bg-purple-500/10 border-purple-500/30",
  evidence: "bg-blue-500/10 border-blue-500/30",
  emergency_coordinator: "bg-red-500/10 border-red-500/30",
};

export function getRiskLevel(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score <= 33)
    return {
      label: "SAFE",
      color: "text-safe",
      bgColor: "bg-safe/10 border-safe/30",
    };
  if (score <= 66)
    return {
      label: "MODERATE",
      color: "text-warning-custom",
      bgColor: "bg-warning-custom/10 border-warning-custom/30",
    };
  return {
    label: "HIGH RISK",
    color: "text-emergency",
    bgColor: "bg-emergency/10 border-emergency/30",
  };
}

export function formatMissionTime(startedAt: string): string {
  const diff = Date.now() - new Date(startedAt).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

export function generateDemoAgentLog(agent: AgentName, missionId: string) {
  const actions: Record<AgentName, string[]> = {
    risk_intelligence: [
      "Analyzing location risk vectors",
      "Calling tool: risk_assess — computing threat index",
      "Risk score updated: 42/100 (MODERATE)",
      "Time-of-day multiplier: 1.3x (evening hours)",
    ],
    route_guardian: [
      "Monitoring route deviation threshold",
      "Calling tool: route_calculate — fetching safe path",
      "Route deviation detected — recalculating",
      "Journey progress: 67% complete",
    ],
    trusted_contact: [
      "Trusted contacts verified: 2 active",
      "Preparing Tier 2 notification cascade",
      "Calling tool: contact_notify — alerting Priya Sharma",
      "Emergency SMS dispatched to all contacts",
    ],
    evidence: [
      "Capturing timestamped location snapshot",
      "Calling tool: evidence_capture — logging route history",
      "Evidence package assembled: 12 waypoints recorded",
      "Incident report generation initiated",
    ],
    emergency_coordinator: [
      "Emergency protocol ACTIVATED",
      "Coordinating all agent responses",
      "Calling tool: emergency_dispatch",
      "All agents in EMERGENCY mode",
    ],
  };
  const agentActions = actions[agent];
  return agentActions[Math.floor(Math.random() * agentActions.length)];
}
