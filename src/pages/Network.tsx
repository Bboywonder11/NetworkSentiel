import { useMemo } from "react";
import { useThreats } from "@/hooks/useThreats";
import { Database, Globe, Server, Shield } from "lucide-react";

const NODES = [
  { name: "web-prod-01", ip: "10.0.200.9", region: "eu-west-1", icon: Globe },
  { name: "db-cluster-02", ip: "10.0.70.19", region: "eu-west-1", icon: Database },
  { name: "api-gateway", ip: "10.0.77.87", region: "eu-west-1", icon: Server },
  { name: "auth-service", ip: "10.0.169.85", region: "eu-west-1", icon: Shield },
  { name: "file-storage-01", ip: "10.0.204.37", region: "ap-south-1", icon: Database },
  { name: "load-balancer", ip: "10.0.90.189", region: "eu-west-1", icon: Server },
  { name: "cache-redis-01", ip: "10.0.53.59", region: "eu-west-1", icon: Server },
  { name: "monitoring-host", ip: "10.0.67.13", region: "eu-west-1", icon: Server },
  { name: "web-prod-02", ip: "10.0.231.193", region: "us-east-1", icon: Globe },
  { name: "db-cluster-03", ip: "10.0.191.205", region: "ap-south-1", icon: Database },
  { name: "api-gateway-2", ip: "10.0.251.174", region: "us-east-1", icon: Server },
  { name: "auth-service-2", ip: "10.0.241.248", region: "eu-west-1", icon: Shield },
  { name: "queue-broker", ip: "10.0.12.4", region: "eu-west-1", icon: Server },
  { name: "search-node", ip: "10.0.45.77", region: "us-east-1", icon: Database },
  { name: "edge-cdn", ip: "10.0.99.21", region: "global", icon: Globe },
  { name: "secrets-vault", ip: "10.0.5.5", region: "eu-west-1", icon: Shield },
];

export default function Network() {
  const { threats } = useThreats();

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; active: number; critical: number }>();
    NODES.forEach(n => map.set(n.name, { total: 0, active: 0, critical: 0 }));
    threats.forEach(t => {
      const key = NODES.find(n => t.dst === n.name)?.name;
      if (!key) return;
      const s = map.get(key)!;
      s.total++;
      if (t.status === "active") s.active++;
      if (t.severity === "critical") s.critical++;
    });
    return map;
  }, [threats]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Network Topology</h1>
        <p className="text-muted-foreground mt-1">Monitored cloud infrastructure · {NODES.length} nodes</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {NODES.map(({ name, ip, region, icon: Icon }) => {
          const s = stats.get(name) || { total: 0, active: 0, critical: 0 };
          const hot = s.critical > 0;
          return (
            <div key={ip} className={`panel p-5 relative overflow-hidden ${hot ? "border-critical/50 shadow-[0_0_30px_hsl(var(--critical)/0.2)]" : ""}`}>
              {hot && <div className="scan absolute inset-0 pointer-events-none" />}
              <div className="flex items-start justify-between">
                <div className="size-10 rounded-lg bg-secondary/60 grid place-items-center">
                  <Icon className="size-5 text-primary" />
                </div>
                <span className="chip text-[10px] uppercase">
                  <span className="size-1.5 rounded-full bg-success pulse-dot" /> Online
                </span>
              </div>
              <div className="mt-4">
                <div className="font-bold mono text-sm">{name}</div>
                <div className="mono text-xs text-muted-foreground">{ip}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{region}</div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <NodeStat n={s.active} label="Active" tone="text-high" />
                <NodeStat n={s.critical} label="Critical" tone="text-critical" />
                <NodeStat n={s.total} label="Total" tone="text-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodeStat({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div>
      <div className={`text-2xl font-bold ${tone}`}>{n}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
