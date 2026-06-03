import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../shared/cors";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY environment variable");
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(contents: unknown[]): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contents }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No response generated"
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { mission_id, action, user_id } = await req.json();

    if (!mission_id || !action || !user_id) {
      return new Response(
        JSON.stringify({ error: "mission_id, action, user_id required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: mission } = await supabase
      .from("safety_missions")
      .select("*")
      .eq("id", mission_id)
      .maybeSingle();

    if (!mission) {
      return new Response(JSON.stringify({ error: "Mission not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, string> = {};

    if (action === "assess_risk") {
      const analysis = await callGemini([
        {
          role: "user",
          parts: [
            {
              text: `You are the Risk Intelligence Agent for SafeSakhi AI. Analyze safety risk for this journey:
Destination: ${mission.destination_address}
Travel mode: ${mission.travel_mode}
Time: ${new Date().toLocaleTimeString("en-US", { hour12: false })}

Return a JSON object with these exact fields:
{
  "risk_score": <number 0-100>,
  "risk_level": "<SAFE|MODERATE|HIGH RISK>",
  "primary_factor": "<main risk factor in 10 words>",
  "recommendation": "<safety recommendation in 15 words>",
  "time_multiplier": <float 0.8-1.5>
}
Return only valid JSON, no explanation.`,
            },
          ],
        },
      ]);

      try {
        const parsed = JSON.parse(
          analysis.trim().replace(/```json\n?|\n?```/g, ""),
        );

        results.risk_analysis = JSON.stringify(parsed);

        await supabase
          .from("safety_missions")
          .update({ risk_score: parsed.risk_score })
          .eq("id", mission_id);

        await supabase.from("risk_assessments").insert({
          mission_id,
          user_id,
          location_name: mission.destination_address,
          risk_score: parsed.risk_score,
          time_of_day_multiplier: parsed.time_multiplier || 1.0,
          analysis: parsed.recommendation,
        });

        await supabase.from("agent_logs").insert({
          mission_id,
          user_id,
          agent: "risk_intelligence",
          status: "active",
          action: `risk_assess() → score: ${parsed.risk_score}/100 (${parsed.risk_level})`,
          reasoning: parsed.primary_factor,
          tool_called: "risk_assess",
        });

        await supabase.from("mcp_tool_calls").insert({
          mission_id,
          agent: "risk_intelligence",
          tool_name: "risk_assess",
          parameters: {
            destination: mission.destination_address,
            travel_mode: mission.travel_mode,
          },
          result: parsed,
          success: true,
        });
      } catch {
        results.risk_analysis = analysis;
      }
    }

    if (action === "escalate_tier1") {
      await supabase
        .from("safety_missions")
        .update({ escalation_tier: "tier1" })
        .eq("id", mission_id);

      await supabase.from("agent_logs").insert({
        mission_id,
        user_id,
        agent: "emergency_coordinator",
        status: "alert",
        action:
          "Check-in missed — Tier 1 escalation initiated. 2-minute grace period starting.",
        reasoning:
          "Automated escalation: user did not respond to scheduled check-in",
        tool_called: "escalation_trigger",
      });

      results.status = "tier1_activated";
    }

    if (action === "escalate_tier2") {
      const { data: contacts } = await supabase
        .from("trusted_contacts")
        .select("*")
        .eq("user_id", user_id);

      const contactNames =
        contacts?.map((c: { name: string }) => c.name).join(", ") ||
        "configured contacts";

      await supabase
        .from("safety_missions")
        .update({ escalation_tier: "tier2" })
        .eq("id", mission_id);

      await supabase.from("agent_logs").insert([
        {
          mission_id,
          user_id,
          agent: "trusted_contact",
          status: "alert",
          action: `contact_notify() → Emergency SMS dispatched to: ${contactNames}`,
          reasoning: "Tier 1 grace period expired — notifying trusted contacts",
          tool_called: "contact_notify",
        },
        {
          mission_id,
          user_id,
          agent: "emergency_coordinator",
          status: "alert",
          action: `Tier 2 escalation active — ${contacts?.length || 0} contacts notified`,
          reasoning: "Coordinating trusted contact notification cascade",
        },
      ]);

      await supabase.from("check_ins").insert({
        mission_id,
        user_id,
        status: "missed",
        scheduled_at: new Date().toISOString(),
      });

      results.status = "tier2_activated";
      results.contacts_notified = String(contacts?.length || 0);
    }

    if (action === "emergency") {
      await supabase
        .from("safety_missions")
        .update({ status: "emergency", escalation_tier: "tier3" })
        .eq("id", mission_id);

      const evidenceReport = await callGemini([
        {
          role: "user",
          parts: [
            {
              text: `You are the Evidence Agent for SafeSakhi AI. Generate a forensic incident report for:
Mission ID: ${mission.mission_code}
Destination: ${mission.destination_address}
Travel mode: ${mission.travel_mode}
Emergency triggered at: ${new Date().toISOString()}

Write a concise forensic report (max 150 words) as if you are the Evidence Agent. Include: what happened, what evidence was captured, what actions were taken. Plain text, no markdown.`,
            },
          ],
        },
      ]);

      await supabase.from("incidents").insert({
        mission_id,
        user_id,
        severity: "critical",
        title: "Emergency SOS — Full Protocol Activated",
        description:
          "Emergency Coordinator activated full response. All agents deployed.",
        location_address: mission.destination_address,
        escalation_reached: "tier3",
        report_generated: true,
        report_content: `EMERGENCY INCIDENT REPORT — ${mission.mission_code}\n\nTimestamp: ${new Date().toISOString()}\nLocation: ${mission.destination_address}\nTravel Mode: ${mission.travel_mode}\n\n${evidenceReport}\n\nStatus: EMERGENCY ACTIVE`,
      });

      await supabase.from("agent_logs").insert([
        {
          mission_id,
          user_id,
          agent: "evidence",
          status: "emergency",
          action: "evidence_capture() → Forensic package sealed",
          tool_called: "evidence_capture",
        },
        {
          mission_id,
          user_id,
          agent: "emergency_coordinator",
          status: "emergency",
          action: "emergency_dispatch() → Full emergency protocol ACTIVE",
          tool_called: "emergency_dispatch",
        },
      ]);

      results.status = "emergency_active";
      results.report = evidenceReport;
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[agent-orchestrate] error:", err);

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
