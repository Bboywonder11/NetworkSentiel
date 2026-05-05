import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";

export type Severity = "critical" | "high" | "medium" | "low";
export type Status = "active" | "investigating" | "mitigated" | "resolved";
export type Category =
  | "DDoS Attack" | "Brute Force" | "Intrusion Attempt" | "Malware"
  | "Data Exfiltration" | "Port Scan" | "Suspicious Process" | "Behavioral Anomaly";

export type Threat = {
  id: string;
  ts: number;
  category: Category;
  severity: Severity;
  status: Status;
  risk: number; // 0-100
  src: string;
  dst: string;
  port: number;
  protocol: string;
  packets: number;
  bytes: number;
  summary: string;
  aiAnalysis?: string;
};

type Intensity = "low" | "med" | "high";

type Ctx = {
  threats: Threat[];
  paused: boolean;
  setPaused: (p: boolean) => void;
  intensity: Intensity;
  setIntensity: (i: Intensity) => void;
  setStatus: (id: string, s: Status) => void;
  attachAnalysis: (id: string, text: string) => void;
  reset: () => void;
};

const ThreatCtx = createContext<Ctx | null>(null);

const CATEGORIES: Category[] = ["DDoS Attack","Brute Force","Intrusion Attempt","Malware","Data Exfiltration","Port Scan","Suspicious Process","Behavioral Anomaly"];
const NODES = ["web-prod-01","db-cluster-02","api-gateway","auth-service","file-storage-01","load-balancer","cache-redis-01","monitoring-host"];
const PROTOCOLS = ["TCP","HTTPS","SSH","FTP","DNS","HTTP"];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random()*arr.length)];
const ip = () => `${1+Math.floor(Math.random()*223)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;

function severityFromRisk(r: number): Severity {
  if (r >= 85) return "critical";
  if (r >= 65) return "high";
  if (r >= 40) return "medium";
  return "low";
}

function makeThreat(): Threat {
  const category = rand(CATEGORIES);
  const dst = rand(NODES);
  const src = ip();
  const risk = Math.floor(Math.random()*100);
  const port = rand([22,80,443,3306,3389,5432,8080,21,53,28899]);
  const protocol = rand(PROTOCOLS);
  const packets = Math.floor(Math.random()*300000)+50;
  const bytes = Math.floor(Math.random()*5_000_000)+10_000;
  let summary = "";
  switch (category) {
    case "DDoS Attack": summary = `Volumetric flood detected — ${Math.floor(1000+Math.random()*60000)} req/s sustained from ${src} targeting ${dst}`; break;
    case "Brute Force": summary = `Repeated authentication failures — ${Math.floor(50+Math.random()*600)} failed login attempts from ${src} on ${dst}`; break;
    case "Intrusion Attempt": summary = `Unauthorized access attempt — privilege escalation detected on ${dst}`; break;
    case "Malware": summary = `Suspicious payload signature matched on ${dst}. Possible trojan from ${src}`; break;
    case "Data Exfiltration": summary = `Large outbound transfer ${(bytes/1e6).toFixed(1)} MB from ${dst} to ${src}`; break;
    case "Port Scan": summary = `Sequential port probing from ${src} across ${dst}`; break;
    case "Suspicious Process": summary = `Anomalous process spawned on ${dst} with elevated privileges`; break;
    case "Behavioral Anomaly": summary = `Behavioral anomaly: traffic pattern from ${src} deviates ${Math.floor(50+Math.random()*45)}% from baseline on ${dst}`; break;
  }
  return {
    id: crypto.randomUUID(),
    ts: Date.now(),
    category, severity: severityFromRisk(risk), status: "active",
    risk, src, dst, port, protocol, packets, bytes, summary,
  };
}

const SEED_COUNT = 500;

export function ThreatProvider({ children }: { children: ReactNode }) {
  const [threats, setThreats] = useState<Threat[]>(() => {
    const seed: Threat[] = [];
    for (let i = 0; i < SEED_COUNT; i++) {
      const t = makeThreat();
      t.ts = Date.now() - Math.floor(Math.random()*30*60*1000);
      seed.push(t);
    }
    return seed.sort((a,b) => b.ts - a.ts);
  });
  const [paused, setPaused] = useState(false);
  const [intensity, setIntensity] = useState<Intensity>("med");
  const pausedRef = useRef(paused);
  const intensityRef = useRef(intensity);
  pausedRef.current = paused; intensityRef.current = intensity;

  useEffect(() => {
    const tick = () => {
      if (pausedRef.current) return;
      const n = intensityRef.current === "low" ? 1 : intensityRef.current === "med" ? 3 : 7;
      const fresh = Array.from({length: n}, makeThreat);
      setThreats(prev => [...fresh, ...prev].slice(0, 800));
    };
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, []);

  const value = useMemo<Ctx>(() => ({
    threats, paused, setPaused, intensity, setIntensity,
    setStatus: (id, s) => setThreats(p => p.map(t => t.id === id ? { ...t, status: s } : t)),
    attachAnalysis: (id, text) => setThreats(p => p.map(t => t.id === id ? { ...t, aiAnalysis: text } : t)),
    reset: () => setThreats([]),
  }), [threats, paused, intensity]);

  return <ThreatCtx.Provider value={value}>{children}</ThreatCtx.Provider>;
}

export const useThreats = () => {
  const c = useContext(ThreatCtx);
  if (!c) throw new Error("useThreats must be used within ThreatProvider");
  return c;
};
