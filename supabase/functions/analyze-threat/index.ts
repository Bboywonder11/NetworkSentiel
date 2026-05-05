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

    // Accept both:
    // { threat: {...} }
    // and raw threat object {...}
    const threat = body?.threat ?? body;

    if (!threat?.summary) {
      return json(
        {
          error: "Missing threat data",
          received: body,
        },
        400
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!OPENAI_API_KEY) {
      return json(
        { error: "OPENAI_API_KEY not configured in Supabase secrets" },
        500
      );
    }

    const system = `You are a senior SOC analyst. Given a single threat event JSON, produce a tight, two-paragraph operator briefing:
1) What is happening, attacker intent, and likely impact (cite the asset and protocol).
2) Recommended immediate mitigation, prefixed with "→ ", referencing concrete controls (block IP, ACL, rate-limit, isolate node, rotate creds, etc.).
Keep it under 120 words. No markdown headings, no bullet lists.`;

    const user = `Threat:\n${JSON.stringify(
      {
        category: threat.category,
        severity: threat.severity,
        risk: threat.risk,
        summary: threat.summary,
        src: threat.src,
        dst: threat.dst,
        port: threat.port,
        protocol: threat.protocol,
        packets: threat.packets,
        bytes: threat.bytes,
      },
      null,
      2
    )}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano",
        temperature: 0.3,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    const raw = await r.text();

    if (!r.ok) {
      console.error("OpenAI error:", r.status, raw);

      let message = raw;

      try {
        const parsed = JSON.parse(raw);
        message = parsed?.error?.message || raw;
      } catch {
        // raw is not JSON
      }

      return json(
        {
          error: "OpenAI request failed",
          status: r.status,
          message,
        },
        r.status
      );
    }

    const data = JSON.parse(raw);

    const analysis =
      data?.choices?.[0]?.message?.content?.trim() || "No analysis returned.";

    return json({ analysis });
  } catch (e) {
    console.error("analyze-threat function error:", e);

    return json(
      {
        error: e instanceof Error ? e.message : "Unknown server error",
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