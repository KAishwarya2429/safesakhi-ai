import { useState, useEffect } from "react";
import { supabase } from "@/db/supabase";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layouts/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Map,
  Search,
  AlertTriangle,
  CheckCircle,
  Zap,
  Bot,
  TrendingUp,
} from "lucide-react";
import type { RiskAssessment } from "@/types";
import { getRiskLevel } from "@/lib/agents";
import { cn } from "@/lib/utils";
import { sendStreamRequest } from "@/lib/sse";

const DEMO_LOCATIONS = [
  {
    name: "Connaught Place, Delhi",
    lat: 28.6315,
    lng: 77.2167,
    risk: 38,
    time: "09:00",
  },
  {
    name: "Lajpat Nagar Market, Delhi",
    lat: 28.5665,
    lng: 77.2431,
    risk: 52,
    time: "19:30",
  },
  {
    name: "Karol Bagh, Delhi",
    lat: 28.6519,
    lng: 77.1909,
    risk: 67,
    time: "21:00",
  },
  {
    name: "South Extension, Delhi",
    lat: 28.57,
    lng: 77.2206,
    risk: 29,
    time: "10:00",
  },
  {
    name: "Lal Kuan Bazar, Delhi",
    lat: 28.6562,
    lng: 77.234,
    risk: 78,
    time: "22:30",
  },
  {
    name: "Nehru Place, Delhi",
    lat: 28.5483,
    lng: 77.2513,
    risk: 44,
    time: "14:00",
  },
];

const RISK_FACTORS = [
  { factor: "Historical incidents", value: 34, weight: "30%" },
  { factor: "Lighting quality", value: 55, weight: "20%" },
  { factor: "Crowd density", value: 72, weight: "15%" },
  { factor: "Proximity to police", value: 61, weight: "15%" },
  { factor: "Time of day", value: 48, weight: "20%" },
];

export default function RiskMapPage() {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [analysisStreaming, setAnalysisStreaming] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<
    (typeof DEMO_LOCATIONS)[0] | null
  >(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  useEffect(() => {
    if (!user) return;
    supabase
      .from("risk_assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        setAssessments((data as RiskAssessment[]) || []);
        setLoading(false);
      });
  }, [user]);

  const analyzeLocation = async (location: string) => {
    if (!location.trim()) return;
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
                  text: `You are the Risk Intelligence Agent for SafeSakhi AI. Provide a detailed safety risk analysis for: "${location}"\n\nAnalyze:\n1. Overall Risk Score (0-100) with justification\n2. Time-based risk patterns (morning/afternoon/evening/night)\n3. Top 3 safety concerns specific to this location\n4. Safe zones and landmarks within 500m\n5. Recommended safety precautions\n\nBe specific, data-driven, and actionable. Keep it under 200 words.`,
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
          setAiAnalysis("Analysis unavailable. Check connection.");
        },
      });
    } catch {
      setAnalysisStreaming(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) analyzeLocation(searchQuery);
  };

  const handleSelectDemo = (loc: (typeof DEMO_LOCATIONS)[0]) => {
    setSelectedLocation(loc);
    setSearchQuery(loc.name);
    analyzeLocation(loc.name);
  };

  return (
    <AppLayout
      title="RISK MAP"
      subtitle="Location Intelligence & Safety Heatmap"
    >
      <div className="p-4 space-y-4">
        {/* Search */}
        <Card className="glass-card border-border/60">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search any location for risk analysis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-muted/30 border-border font-mono text-sm px-3 flex-1"
              />
              <Button
                type="submit"
                className="shrink-0 font-mono text-xs h-9"
                disabled={analysisStreaming}
              >
                <Search className="w-3.5 h-3.5 mr-1.5" />
                {analysisStreaming ? "ANALYZING..." : "ANALYZE"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Map Embed */}
          <Card className="glass-card border-border/60 lg:col-span-2 h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <Map className="w-3.5 h-3.5 text-primary" />
                GEOSPATIAL VIEW
                {selectedLocation && (
                  <Badge
                    variant="outline"
                    className="ml-auto font-mono text-[10px] border-border py-0"
                  >
                    {selectedLocation.name}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="w-full min-w-0 overflow-hidden rounded-sm border border-border">
                <iframe
                  width="100%"
                  height="320"
                  frameBorder="0"
                  style={{ border: 0 }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyB_LJOYJL-84SMuxNB7LtRGhxEQLjswvy0&q=${encodeURIComponent(selectedLocation?.name || "New+Delhi,+India")}&language=en&region=in`}
                  allowFullScreen
                  title="Risk Map"
                />
              </div>
              {/* Risk overlay legend */}
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {[
                  { label: "SAFE (0–33)", color: "bg-safe" },
                  { label: "MODERATE (34–66)", color: "bg-warning-custom" },
                  { label: "HIGH RISK (67–100)", color: "bg-emergency" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Score Panel */}
          <Card className="glass-card border-border/60 h-full">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                RISK FACTORS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {selectedLocation && (
                <div className="text-center mb-3">
                  {(() => {
                    const { label, color } = getRiskLevel(
                      selectedLocation.risk,
                    );
                    return (
                      <>
                        <p
                          className={cn("font-mono text-4xl font-bold", color)}
                        >
                          {selectedLocation.risk}
                        </p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-mono text-[10px] mt-1",
                            selectedLocation.risk <= 33
                              ? "border-safe/30 text-safe"
                              : selectedLocation.risk <= 66
                                ? "border-warning-custom/30 text-warning-custom"
                                : "border-emergency/30 text-emergency",
                          )}
                        >
                          {label}
                        </Badge>
                      </>
                    );
                  })()}
                </div>
              )}
              {RISK_FACTORS.map(({ factor, value, weight }) => (
                <div key={factor} className="space-y-1">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-muted-foreground">{factor}</span>
                    <span className="text-muted-foreground">{weight}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          value <= 33
                            ? "bg-safe"
                            : value <= 66
                              ? "bg-warning-custom"
                              : "bg-emergency",
                        )}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground w-6 text-right">
                      {value}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* AI Analysis */}
          {(aiAnalysis || analysisStreaming) && (
            <Card className="glass-card border-primary/20 bg-primary/5">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  GEMINI AI RISK ANALYSIS
                  {analysisStreaming && (
                    <Zap className="w-3.5 h-3.5 text-primary animate-pulse" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis}
                  {analysisStreaming ? "▊" : ""}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Demo location grid */}
          <Card
            className={cn(
              "glass-card border-border/60",
              aiAnalysis ? "" : "lg:col-span-2",
            )}
          >
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-primary" />
                LOCATION RISK INDEX
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div
                className={cn(
                  "grid gap-2",
                  aiAnalysis
                    ? "grid-cols-1"
                    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                )}
              >
                {DEMO_LOCATIONS.map((loc) => {
                  const { label, color } = getRiskLevel(loc.risk);
                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectDemo(loc)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-sm border text-left transition-colors",
                        selectedLocation?.name === loc.name
                          ? "border-primary/40 bg-primary/5"
                          : "border-border/40 hover:border-border bg-card/30",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          loc.risk <= 33
                            ? "bg-safe"
                            : loc.risk <= 66
                              ? "bg-warning-custom"
                              : "bg-emergency",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs text-foreground truncate">
                          {loc.name}
                        </p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {loc.time} hours
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn("font-mono text-sm font-bold", color)}>
                          {loc.risk}
                        </p>
                        <p className={cn("font-mono text-[9px]", color)}>
                          {label}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal risk history */}
        {!loading && assessments.length > 0 && (
          <Card className="glass-card border-border/60">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="font-mono text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                MY RISK ASSESSMENTS
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-border">
                      {["Location", "Score", "Multiplier", "Date"].map((h) => (
                        <th
                          key={h}
                          className="text-left font-mono text-[10px] text-muted-foreground pb-2 pr-4 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => {
                      const { label, color } = getRiskLevel(a.risk_score);
                      return (
                        <tr
                          key={a.id}
                          className="border-b border-border/30 last:border-0"
                        >
                          <td className="py-2 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
                            {a.location_name || "Unknown"}
                          </td>
                          <td className="py-2 pr-4 whitespace-nowrap">
                            <span
                              className={cn(
                                "font-mono text-xs font-bold",
                                color,
                              )}
                            >
                              {a.risk_score}
                            </span>
                            <span
                              className={cn(
                                "font-mono text-[10px] ml-1",
                                color,
                              )}
                            >
                              ({label})
                            </span>
                          </td>
                          <td className="py-2 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {a.time_of_day_multiplier}x
                          </td>
                          <td className="py-2 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(a.created_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
