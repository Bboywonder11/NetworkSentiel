import { Link, Navigate } from "react-router-dom";
import { Shield, Activity, Brain, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Landing() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <div className="mx-auto size-16 rounded-2xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)] mb-8">
          <Shield className="size-8 text-primary-foreground" />
        </div>
        <div className="mono text-xs tracking-[0.3em] text-primary mb-3">SENTINEL · CLOUD SECURITY</div>
        <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight">
          AI-driven SOC for your <span className="bg-gradient-primary bg-clip-text text-transparent">cloud perimeter</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Real-time threat detection, Gemini-powered analysis, and one-click mitigation across your entire infrastructure.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary text-primary-foreground px-6 py-3 font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition">
            Provision an Operator <ArrowRight className="size-4" />
          </Link>
          <Link to="/auth" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/40 px-6 py-3 font-semibold hover:bg-secondary transition">
            Sign in
          </Link>
        </div>
        <div className="mt-20 grid md:grid-cols-3 gap-4 text-left">
          {[
            { icon: Activity, title: "Live Threat Feed", body: "Stream detections from every node — DDoS, brute force, intrusions, anomalies." },
            { icon: Brain, title: "Gemini AI Analysis", body: "On-demand reasoning on each event with mitigation playbooks." },
            { icon: Shield, title: "One-click Mitigation", body: "Block hostile IPs at the perimeter and track every action." },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-5">
              <Icon className="size-5 text-primary mb-3" />
              <div className="font-semibold">{title}</div>
              <p className="text-sm text-muted-foreground mt-1">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
