import { useMemo, useState } from "react";
import { useThreats } from "@/hooks/useThreats";
import { Brain, Sparkles, Zap, Loader2 } from "lucide-react";
import { SeverityChip } from "@/components/ThreatCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AIAnalysis() {
  const { threats, attachAnalysis } = useThreats();
  const [tab, setTab] = useState<"pending" | "analyzed">("pending");
  const [running, setRunning] = useState<Record<string, boolean>>({});
  const [bulkRunning, setBulkRunning] = useState(false);
  const [stickyIds, setStickyIds] = useState<string[]>([]);

  const analyzed = useMemo(() => threats.filter((t) => t.aiAnalysis), [threats]);

  const pending = useMemo(
    () => threats.filter((t) => !t.aiAnalysis || stickyIds.includes(t.id)),
    [threats, stickyIds]
  );

  const avgRisk = useMemo(
    () =>
      threats.length
        ? Math.round(threats.reduce((a, t) => a + t.risk, 0) / threats.length)
        : 0,
    [threats]
  );

  const criticalAnalyzed = analyzed.filter((t) => t.severity === "critical").length;

  const runOne = async (threatId: string) => {
    const t = threats.find((x) => x.id === threatId);
    if (!t) return;

    setRunning((r) => ({ ...r, [threatId]: true }));

    try {
      const { data, error } = await supabase.functions.invoke("analyze-threat", {
        body: {
          threat: {
            id: t.id,
            ts: t.ts,
            category: t.category,
            severity: t.severity,
            status: t.status,
            risk: t.risk,
            src: t.src,
            dst: t.dst,
            port: t.port,
            protocol: t.protocol,
            packets: t.packets,
            bytes: t.bytes,
            summary: t.summary,
          },
        },
      });

      if (error) {
        console.error("Function invoke error:", error);
        throw new Error(error.message || "Function failed");
      }

      if (!data) {
        throw new Error("No response from AI function");
      }

      if (data.error) {
        console.error("AI function returned error:", data);
        throw new Error(data.message || data.error);
      }

      const finalText = `Analysis:
${data.analysis ?? "No analysis returned."}

Recommendation:
${data.recommendation ?? "No recommendation returned."}

Risk Score:
${data.risk_score ?? t.risk}/100`;

      attachAnalysis(threatId, finalText);

      setStickyIds((ids) => (ids.includes(threatId) ? ids : [...ids, threatId]));

      toast.success("AI analysis complete");
    } catch (e: any) {
      console.error("Analysis failed:", e);
      toast.error(e?.message || "Analysis failed");
    } finally {
      setRunning((r) => ({ ...r, [threatId]: false }));
    }
  };

  const runTop5 = async () => {
    setBulkRunning(true);

    const top = [...threats]
      .filter((t) => !t.aiAnalysis)
      .sort((a, b) => b.risk - a.risk)
      .slice(0, 5);

    for (const t of top) {
      await runOne(t.id);
    }

    setBulkRunning(false);
    toast.success("Top 5 threats analyzed");
  };

  const list = tab === "pending" ? pending : analyzed;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mono text-xs tracking-[0.25em] text-primary mb-2 flex items-center gap-2">
            <Brain className="size-3.5" /> AI THREAT INTELLIGENCE
          </div>

          <h1 className="text-4xl font-bold">AI Analysis Console</h1>

          <p className="text-muted-foreground mt-1">
            Run AI-powered analysis on detected threats and act on security recommendations
          </p>
        </div>

        <button
          onClick={runTop5}
          disabled={bulkRunning}
          className="flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-5 py-3 font-semibold shadow-[var(--shadow-glow)] disabled:opacity-60"
        >
          {bulkRunning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Zap className="size-4" />
          )}
          Auto-analyze top 5 critical
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Mini
          label="Threats Analyzed"
          value={`${analyzed.length} / ${threats.length}`}
          sub={`${Math.round((analyzed.length / Math.max(1, threats.length)) * 100)}% coverage`}
        />
        <Mini label="Pending Analysis" value={pending.length} sub="Awaiting AI review" />
        <Mini label="Avg AI Risk Score" value={avgRisk} sub="0–100" />
        <Mini label="Critical Analyzed" value={criticalAnalyzed} sub="Requires action" />
      </div>

      <div className="flex gap-6 border-b border-border/60">
        {(["pending", "analyzed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-bold capitalize border-b-2 -mb-px transition ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t} ({t === "pending" ? pending.length : analyzed.length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {list.slice(0, 30).map((t) => (
          <div key={t.id} className="panel p-5 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityChip s={t.severity} />
              <span className="mono text-xs text-muted-foreground">{t.category}</span>
              <span className="chip text-[10px] uppercase">{t.status}</span>
              <span className="mono text-xs text-muted-foreground">risk {t.risk}</span>
              <span className="ml-auto text-xs mono text-muted-foreground">
                {new Date(t.ts).toLocaleString()}
              </span>
            </div>

            <div className="font-semibold">{t.summary}</div>

            <div className="text-xs mono text-muted-foreground">
              src: {t.src} → {t.dst} :{t.port} {t.protocol}
            </div>

            {t.aiAnalysis ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase mb-2">
                  <Sparkles className="size-3.5" /> AI Analysis
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{t.aiAnalysis}</p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No AI analysis yet for this threat
                </p>

                <button
                  onClick={() => runOne(t.id)}
                  disabled={running[t.id]}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold shadow-[var(--shadow-glow)] disabled:opacity-60"
                >
                  {running[t.id] ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {running[t.id] ? "Analyzing…" : "Run AI Analysis"}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Mini({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="panel p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </div>
      <div className="text-3xl font-bold text-primary mt-2">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">
        {sub}
      </div>
    </div>
  );
}