import { useState, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dailog";
import {
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Bot,
  Eye,
  Shield,
} from "lucide-react";
import type { Incident, IncidentSeverity, EscalationTier } from "@/types";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG: Record<
  IncidentSeverity,
  { label: string; color: string; bg: string }
> = {
  low: { label: "LOW", color: "text-safe", bg: "border-safe/30 bg-safe/5" },
  medium: {
    label: "MEDIUM",
    color: "text-warning-custom",
    bg: "border-warning-custom/30 bg-warning-custom/5",
  },
  high: {
    label: "HIGH",
    color: "text-orange-400",
    bg: "border-orange-500/30 bg-orange-500/5",
  },
  critical: {
    label: "CRITICAL",
    color: "text-emergency",
    bg: "border-emergency/40 bg-emergency/5",
  },
};

const TIER_LABELS: Record<EscalationTier, string> = {
  none: "No Escalation",
  tier1: "Tier 1 — Reminder",
  tier2: "Tier 2 — Contacts Notified",
  tier3: "Tier 3 — Emergency",
};

const DEMO_INCIDENTS: Incident[] = [
  {
    id: "1",
    user_id: "",
    mission_id: null,
    severity: "medium",
    title: "Missed Check-in — Auto Escalation",
    description:
      "User missed scheduled check-in at 21:30. Tier 2 escalation triggered. Trusted contacts notified. User confirmed safe after 8 minutes.",
    location_lat: 28.5665,
    location_lng: 77.2431,
    location_address: "Lajpat Nagar, Delhi",
    evidence_urls: null,
    escalation_reached: "tier2",
    report_generated: true,
    report_content:
      "INCIDENT REPORT — MSN-7K2P4\n\nTimestamp: 2026-06-01T21:30:00Z\nLocation: Lajpat Nagar Market, New Delhi\nMission: MSN-7K2P4\n\nEvents:\n21:30:00 — Check-in triggered\n21:32:00 — Grace period expired, Tier 1 activated\n21:33:00 — TrustedContact agent notified Priya Sharma (+91-9876543210)\n21:34:00 — TrustedContact agent notified Asha Verma (+91-8765432109)\n21:38:00 — User confirmed safe via emergency callback\n\nEvidence Package: 14 GPS waypoints logged\nStatus: RESOLVED",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_at: new Date(Date.now() - 3100000).toISOString(),
  },
  {
    id: "2",
    user_id: "",
    mission_id: null,
    severity: "low",
    title: "Route Deviation Detected",
    description:
      "Route Guardian Agent detected 340m deviation from planned route. User confirmed intentional detour.",
    location_lat: 28.6315,
    location_lng: 77.2167,
    location_address: "Connaught Place, Delhi",
    evidence_urls: null,
    escalation_reached: "none",
    report_generated: true,
    report_content:
      "ROUTE DEVIATION REPORT — MSN-4B9X2\n\nTimestamp: 2026-06-01T19:15:00Z\nDeviation: 340 meters from planned route\nResolution: User confirmed intentional detour\nStatus: CLOSED",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 86000000).toISOString(),
  },
];

export default function IncidentHistoryPage() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null,
  );

  useEffect(() => {
    if (!user) return;
    supabase
      .from("incidents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setIncidents((data as Incident[]) || []);
        setLoading(false);
      });
  }, [user]);

  const displayIncidents = incidents.length > 0 ? incidents : DEMO_INCIDENTS;

  const stats = {
    total: displayIncidents.length,
    resolved: displayIncidents.filter((i) => i.resolved_at).length,
    critical: displayIncidents.filter((i) => i.severity === "critical").length,
    reportsGenerated: displayIncidents.filter((i) => i.report_generated).length,
  };

  return (
    <AppLayout
      title="INCIDENT HISTORY"
      subtitle="Evidence Archive & Forensic Reports"
    >
      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "Total Incidents",
              value: stats.total,
              icon: FileText,
              color: "text-primary",
            },
            {
              label: "Resolved",
              value: stats.resolved,
              icon: CheckCircle,
              color: "text-safe",
            },
            {
              label: "Critical",
              value: stats.critical,
              icon: AlertTriangle,
              color: "text-emergency",
            },
            {
              label: "Reports",
              value: stats.reportsGenerated,
              icon: Shield,
              color: "text-cyan-400",
            },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass-card border-border/60 h-full">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <Icon className={cn("w-4 h-4", color)} />
                  <span className={cn("font-mono text-xl font-bold", color)}>
                    {value}
                  </span>
                </div>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {label.toUpperCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Incident list */}
        <Card className="glass-card border-border/60">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" />
              INCIDENT LOG
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {displayIncidents.map((incident) => {
                  const sev = SEVERITY_CONFIG[incident.severity];
                  return (
                    <div
                      key={incident.id}
                      className={cn("p-4 rounded-sm border", sev.bg)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px] py-0",
                                sev.color,
                                "border-current/40",
                              )}
                            >
                              {sev.label}
                            </Badge>
                            {incident.resolved_at ? (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] py-0 border-safe/30 text-safe"
                              >
                                RESOLVED
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="font-mono text-[10px] py-0 border-warning-custom/30 text-warning-custom"
                              >
                                OPEN
                              </Badge>
                            )}
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {TIER_LABELS[incident.escalation_reached]}
                            </span>
                          </div>
                          <p className="font-mono text-sm font-semibold text-foreground text-balance">
                            {incident.title}
                          </p>
                          {incident.description && (
                            <p className="font-mono text-xs text-muted-foreground mt-1 text-pretty">
                              {incident.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            {incident.location_address && (
                              <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {incident.location_address}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(incident.created_at).toLocaleString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )}
                            </span>
                            {incident.report_generated && (
                              <span className="flex items-center gap-1 font-mono text-[10px] text-cyan-400">
                                <Bot className="w-3 h-3" />
                                Report generated
                              </span>
                            )}
                          </div>
                        </div>
                        {incident.report_content && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedIncident(incident)}
                            className="shrink-0 font-mono text-[10px] h-7 border-border hover:border-primary/40"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            REPORT
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {displayIncidents.length === 0 && (
                  <div className="text-center py-10">
                    <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="font-mono text-xs text-muted-foreground">
                      No incidents recorded. Your journeys have been safe.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Modal */}
        <Dialog
          open={!!selectedIncident}
          onOpenChange={() => setSelectedIncident(null)}
        >
          <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-mono text-sm flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" />
                EVIDENCE AGENT — INCIDENT REPORT
              </DialogTitle>
              <DialogDescription className="font-mono text-xs text-muted-foreground">
                Automatically generated by Evidence Agent
              </DialogDescription>
            </DialogHeader>
            {selectedIncident && (
              <div className="space-y-3">
                <div className="p-3 rounded-sm border border-border bg-muted/20">
                  <pre className="font-mono text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {selectedIncident.report_content}
                  </pre>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-mono text-[10px]",
                      SEVERITY_CONFIG[selectedIncident.severity].color,
                      "border-current/40",
                    )}
                  >
                    {SEVERITY_CONFIG[selectedIncident.severity].label} SEVERITY
                  </Badge>
                  {selectedIncident.evidence_urls?.length && (
                    <Badge
                      variant="outline"
                      className="font-mono text-[10px] border-cyan-500/30 text-cyan-400"
                    >
                      {selectedIncident.evidence_urls.length} EVIDENCE FILES
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] border-border text-muted-foreground"
                  >
                    {TIER_LABELS[selectedIncident.escalation_reached]}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
