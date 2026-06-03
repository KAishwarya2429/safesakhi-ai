export interface Option {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  withCount?: boolean;
}

// SafeSakhi AI - Type Definitions

export type UserRole = "user" | "admin";
export type TravelMode = "walking" | "driving" | "public_transport" | "cycling";
export type MissionStatus = "active" | "completed" | "emergency" | "cancelled";
export type EscalationTier = "none" | "tier1" | "tier2" | "tier3";
export type AgentName =
  | "risk_intelligence"
  | "route_guardian"
  | "trusted_contact"
  | "evidence"
  | "emergency_coordinator";
export type AgentStatus = "idle" | "active" | "alert" | "emergency";
export type IncidentSeverity = "low" | "medium" | "high" | "critical";
export type CheckInStatus = "pending" | "responded" | "missed" | "escalated";

export interface Profile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  check_in_interval: number;
  created_at: string;
  updated_at: string;
}

export interface TrustedContact {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface SafetyMission {
  id: string;
  user_id: string;
  mission_code: string;
  origin_address: string | null;
  destination_address: string;
  travel_mode: TravelMode;
  expected_duration_minutes: number;
  check_in_interval_minutes: number;
  status: MissionStatus;
  escalation_tier: EscalationTier;
  risk_score: number;
  start_lat: number | null;
  start_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  current_lat: number | null;
  current_lng: number | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  mission_id: string;
  user_id: string;
  status: CheckInStatus;
  scheduled_at: string;
  responded_at: string | null;
  location_lat: number | null;
  location_lng: number | null;
  notes: string | null;
  created_at: string;
}

export interface AgentLog {
  id: string;
  mission_id: string | null;
  user_id: string;
  agent: AgentName;
  status: AgentStatus;
  action: string;
  reasoning: string | null;
  tool_called: string | null;
  tool_params: Record<string, unknown> | null;
  tool_result: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface RiskAssessment {
  id: string;
  mission_id: string | null;
  user_id: string;
  location_lat: number | null;
  location_lng: number | null;
  location_name: string | null;
  risk_score: number;
  time_of_day_multiplier: number;
  weather_impact: number;
  historical_incidents: number;
  factors: Record<string, unknown> | null;
  analysis: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  mission_id: string | null;
  user_id: string;
  severity: IncidentSeverity;
  title: string;
  description: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  evidence_urls: string[] | null;
  escalation_reached: EscalationTier;
  report_generated: boolean;
  report_content: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface McpToolCall {
  id: string;
  mission_id: string | null;
  agent: AgentName;
  tool_name: string;
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  execution_time_ms: number | null;
  success: boolean;
  created_at: string;
}

export interface AgentConfig {
  name: AgentName;
  label: string;
  description: string;
  color: string;
  tools: string[];
}

export interface McpTool {
  name: string;
  description: string;
  parameters: Record<string, string>;
  agents: AgentName[];
}
