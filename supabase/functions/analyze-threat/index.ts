const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const threat = body?.threat ?? body;

    if (!threat?.summary && !threat?.description) {
      return json({ error: "Missing threat data", received: body }, 400);
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      return json({ error: "OPENAI_API_KEY not configured" }, 500);
    }

    const systemPrompt =
      "You are a senior SOC analyst. Return only valid JSON with analysis, recommendation, and risk_score.";

    const userPrompt = `Analyze this threat:
Category: ${threat.category}
Severity: ${threat.severity}
Source IP: ${threat.src ?? threat.source_ip}
Target: ${threat.dst ?? threat.target_node}
Protocol: ${threat.protocol}
Port: ${threat.port}
Packets: ${threat.packets ?? threat.packet_count}
Bytes: ${threat.bytes ?? threat.bytes_transferred}
Summary: ${threat.summary ?? threat.description}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("OpenAI error:", response.status, raw);
      return json({ error: "OpenAI request failed", status: response.status, details: raw }, response.status);
    }

    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content;

    return json(JSON.parse(content));
  } catch (e) {
    console.error("analyze-threat error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}