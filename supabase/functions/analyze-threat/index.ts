const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { threat } = await req.json();
    if (!threat) return json({ error: "Missing threat" }, 400);

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) return json({ error: "OPENAI_API_KEY not configured" }, 500);

    const system = `You are a senior SOC analyst. Given a single threat event JSON, produce a tight, two-paragraph operator briefing:
1) What is happening, attacker intent, and likely impact (cite the asset and protocol).
2) Recommended immediate mitigation, prefixed with "→ ", referencing concrete controls (block IP, ACL, rate-limit, isolate node, rotate creds, etc.).
Keep it under 120 words. No markdown headings, no bullet lists.`;

    const user = `Threat:\n${JSON.stringify({
      category: threat.category, severity: threat.severity, risk: threat.risk,
      summary: threat.summary, src: threat.src, dst: threat.dst,
      port: threat.port, protocol: threat.protocol,
      packets: threat.packets, bytes: threat.bytes,
    }, null, 2)}`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-nano",temperature: 0.3,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });

    if (r.status === 429) return json({ error: "Rate limited (429)" }, 429);
    if (r.status === 402) return json({ error: "Payment required (402)" }, 402);
    if (!r.ok) {
      const t = await r.text();
      console.error("AI gateway error", r.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await r.json();
    const analysis = data?.choices?.[0]?.message?.content?.trim() || "No analysis returned.";
    return json({ analysis });
  } catch (e) {
    console.error("analyze-threat error", e);
    return json({ error: e instanceof Error ? e.message : "Unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
