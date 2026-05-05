import { Threat, Status } from "@/hooks/useThreats";
import { Sparkles, Ban, ShieldCheck, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useThreats } from "@/hooks/useThreats";

const sevStyles: Record<Threat["severity"], string> = {
  critical: "bg-critical/15 text-critical border-critical/40",
  high: "bg-high/15 text-high border-high/40",
  medium: "bg-medium/15 text-medium border-medium/40",
  low: "bg-low/15 text-low border-low/40",
};

export function SeverityChip({ s }: { s: Threat["severity"] }) {
  return (
    <span className={`chip uppercase tracking-wider ${sevStyles[s]}`}>
      <span className="size-1.5 rounded-full bg-current pulse-dot" />{s}
    </span>
  );
}

export default function ThreatCard({ t, showActions = true, onBlock }: { t: Threat; showActions?: boolean; onBlock?: (ip: string) => void }) {
  const { setStatus, attachAnalysis, paused, setPaused } = useThreats();
  const [analyzing, setAnalyzing] = useState(false);

  const runAnalysis = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    const wasPaused = paused;
    if (!wasPaused) setPaused(true); // pause feed so card stays visible
    try {
      const { data, error } = await supabase.functions.invoke("analyze-threat", { body: { threat: t } });
      if (error) throw error;
      if (!data?.analysis) throw new Error("Empty AI response");
      attachAnalysis(t.id, data.analysis);
      toast.success("AI analysis complete");
    } catch (e: any) {
      const msg = e?.message || "Analysis failed";
      if (msg.includes("429")) toast.error("Rate limited. Try again shortly.");
      else if (msg.includes("402")) toast.error("AI credits exhausted. Add funds in workspace.");
      else toast.error(msg);
    } finally {
      setAnalyzing(false);
      if (!wasPaused) setTimeout(() => setPaused(false), 8000); // give 8s to read result
    }
  };

  return (
    <div className="panel p-5 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <SeverityChip s={t.severity} />
          <span className="mono text-xs text-muted-foreground">{t.category}</span>
          <span className="chip text-[10px] uppercase">{t.status}</span>
          <span className="mono text-xs text-muted-foreground">risk {t.risk}</span>
          <span className="ml-auto text-xs text-muted-foreground mono">{new Date(t.ts).toLocaleString()}</span>
        </div>
        <p className="mt-3 text-base font-semibold leading-snug">{t.summary}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mono">
          <span>src: <span className="text-foreground">{t.src}</span></span>
          <span>→ {t.dst}</span>
          <span>port :{t.port}</span>
          <span>{t.protocol}</span>
          <span>{t.packets.toLocaleString()} pkts</span>
          <span>{(t.bytes/1e6).toFixed(1)} MB</span>
        </div>
        {t.aiAnalysis && (
          <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase mb-2">
              <Sparkles className="size-3.5" /> AI Analysis
            </div>
            <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90">{t.aiAnalysis}</p>
          </div>
        )}
      </div>
      {showActions && (
        <div className="flex flex-col gap-2 lg:w-44">
          <button onClick={runAnalysis} disabled={analyzing}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/60 hover:bg-secondary px-3 py-2 text-sm font-medium transition disabled:opacity-60">
            {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {analyzing ? "Analyzing…" : "AI Analyze"}
          </button>
          <button onClick={() => onBlock?.(t.src)}
            className="flex items-center justify-center gap-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-3 py-2 text-sm font-semibold transition">
            <Ban className="size-4" /> Block IP
          </button>
          <button onClick={() => { setStatus(t.id, "mitigated"); toast.success("Marked mitigated"); }}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary/40 hover:bg-secondary px-3 py-2 text-sm font-medium transition">
            <ShieldCheck className="size-4" /> Mitigate
          </button>
          <button onClick={() => { setStatus(t.id, "resolved"); toast("Marked false positive"); }}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition">
            <XCircle className="size-4" /> False positive
          </button>
        </div>
      )}
    </div>
  );
}
