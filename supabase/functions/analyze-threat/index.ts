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

    const systemPrompt = `You are a senior SOC analyst.
Return ONLY valid JSON. No markdown. No explanation.

Use this exact JSON structure:
{
  "analysis": "string",
  "recommendation": "string",
  "risk_score": 0
}`;

    const userPrompt = `Analyze this threat:
Category: ${threat.category ?? "Unknown"}
Severity: ${threat.severity ?? "Unknown"}
Source IP: ${threat.src ?? threat.source_ip ?? "Unknown"}
Target: ${threat.dst ?? threat.target_node ?? "Unknown"}
Protocol: ${threat.protocol ?? "Unknown"}
Port: ${threat.port ?? "Unknown"}
Packets: ${threat.packets ?? threat.packet_count ?? 0}
Bytes: ${threat.bytes ?? threat.bytes_transferred ?? 0}
Summary: ${threat.summary ?? threat.description ?? "No summary provided"}
Risk: ${threat.risk ?? "Unknown"}`;

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

      return json(
        {
          error: "OpenAI request failed",
          status: response.status,
          details: raw,
        },
        response.status
      );
    }

    const data = JSON.parse(raw);
    const content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return json(
        {
          error: "No content returned from OpenAI",
          raw: data,
        },
        500
      );
    }

    try {
      return json(JSON.parse(content));
    } catch {
      return json({
        analysis: content,
        recommendation:
          "Review the threat manually and apply emergency security controls such as blocking the source IP, isolating affected services, and checking authentication logs.",
        risk_score: threat.risk ?? 80,
      });
    }
  } catch (e) {
    console.error("FULL FUNCTION ERROR:", e instanceof Error ? e.stack : e);

    return json(
      {
        error: "Function crashed",
        message: e instanceof Error ? e.message : String(e),
        stack: e instanceof Error ? e.stack : null,
      },
      500
    );
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}