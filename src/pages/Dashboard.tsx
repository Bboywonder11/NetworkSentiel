import { useMemo } from "react";
import { useThreats } from "@/hooks/useThreats";
import { Activity, AlertTriangle, ShieldAlert, ShieldCheck, Pause, Play, Zap, Brain } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import ThreatCard from "@/components/ThreatCard";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CAT_COLORS = ["hsl(0 90% 58%)","hsl(18 95% 55%)","hsl(38 95% 55%)","hsl(60 90% 55%)","hsl(142 71% 45%)","hsl(180 70% 50%)","hsl(200 90% 55%)","hsl(280 70% 60%)"];

export default function Dashboard() {
  const { threats, paused, setPaused, intensity, setIntensity } = useThreats();
  const nav = useNavigate();

  const stats = useMemo(() => {
    const active = threats.filter(t => t.status === "active").length;
    const critical = threats.filter(t => t.severity === "critical").length;
    const high = threats.filter(t => t.severity === "high").length;
    const mitigated = threats.filter(t => t.status === "mitigated").length;
    return { active, critical, high, mitigated };
  }, [threats]);

  const velocity = useMemo(() => {
    const now = Date.now();
    const buckets: { t: string; v: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const start = now - (i+1)*60_000;
      const end = now - i*60_000;
      const v = threats.filter(t => t.ts >= start && t.ts < end).length;
      const d = new Date(end);
      buckets.push({ t: `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`, v });
    }
    return buckets;
  }, [threats]);

  const mix = useMemo(() => {
    const m = new Map<string, number>();
    threats.slice(0, 200).forEach(t => m.set(t.category, (m.get(t.category) || 0) + 1));
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [threats]);

  const blockIp = async (ip: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("blocked_ips").insert({ user_id: user.id, ip, reason: "Blocked from dashboard" });
    if (error) toast.error(error.message); else toast.success(`Blocked ${ip}`);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mono text-xs tracking-[0.25em] text-primary mb-2 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary pulse-dot" /> LIVE SOC CONSOLE
          </div>
          <h1 className="text-4xl font-bold">Threat Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time AI-driven monitoring · Local server simulation active</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="panel p-1 flex">
            {(["low","med","high"] as const).map(i => (
              <button key={i} onClick={() => setIntensity(i)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md uppercase tracking-wider transition ${
                  intensity === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}>{i}</button>
            ))}
          </div>
          <button onClick={() => setPaused(!paused)}
            className="flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold shadow-[var(--shadow-glow)]">
            {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            {paused ? "Resume feed" : "Pause feed"}
          </button>
        </div>
      </header>

      <div className="text-right text-xs mono text-muted-foreground">
        ● {paused ? "PAUSED" : "LIVE"} — SIMULATING {intensity === "low" ? 1 : intensity === "med" ? 3 : 7} THREATS / 3S
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Active Threats" value={stats.active} icon={Activity} tone="high" />
        <Stat label="Critical" value={stats.critical} icon={AlertTriangle} tone="critical" />
        <Stat label="High Severity" value={stats.high} icon={ShieldAlert} tone="high" />
        <Stat label="Mitigated" value={stats.mitigated} icon={ShieldCheck} tone="success" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel p-5 lg:col-span-2 relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold">Threat Velocity</h3>
              <p className="text-xs text-muted-foreground">Detections per minute · last 30 minutes</p>
            </div>
            <Zap className="size-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={velocity}>
                <defs>
                  <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(18 95% 55%)" stopOpacity={0.6}/>
                    <stop offset="100%" stopColor="hsl(18 95% 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" stroke="hsl(var(--muted-foreground))" fontSize={10} interval={4} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Area type="monotone" dataKey="v" stroke="hsl(18 95% 55%)" fill="url(#vGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold">Threat Mix</h3>
              <p className="text-xs text-muted-foreground">By category</p>
            </div>
            <Brain className="size-4 text-primary" />
          </div>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {mix.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Live Threat Feed</h3>
            <p className="text-xs text-muted-foreground">Most recent detections — click "Analyze" for AI assessment</p>
          </div>
          <span className="chip text-[10px] uppercase">
            <span className="size-1.5 rounded-full bg-critical pulse-dot" /> Recording
          </span>
        </div>
        <div className="space-y-3">
          {(() => {
            const analyzed = threats.filter(t => t.aiAnalysis);
            const rest = threats.filter(t => !t.aiAnalysis).slice(0, Math.max(0, 8 - analyzed.length));
            return [...analyzed, ...rest].slice(0, 12).map(t => (
              <ThreatCard key={t.id} t={t} onBlock={blockIp} />
            ));
          })()}
        </div>
        <button onClick={() => nav("/threats")}
          className="mt-4 w-full rounded-lg border border-border bg-secondary/40 hover:bg-secondary py-3 text-sm font-semibold transition">
          Open full threat inventory →
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: number; icon: any; tone: "critical"|"high"|"success" }) {
  const toneClass = tone === "critical" ? "text-critical" : tone === "high" ? "text-high" : "text-success";
  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{label}</div>
        <Icon className={`size-4 ${toneClass}`} />
      </div>
      <div className={`mt-3 text-4xl font-bold ${toneClass}`}>{value}</div>
    </div>
  );
}
