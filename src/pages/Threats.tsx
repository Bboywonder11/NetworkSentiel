import { useMemo, useState } from "react";
import { useThreats, Severity, Status } from "@/hooks/useThreats";
import ThreatCard from "@/components/ThreatCard";
import { Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATUSES: (Status | "all")[] = ["all","active","investigating","mitigated","resolved"];
const SEVERITIES: (Severity | "all")[] = ["all","critical","high","medium","low"];

export default function Threats() {
  const { threats } = useThreats();
  const [status, setStatus] = useState<Status | "all">("all");
  const [sev, setSev] = useState<Severity | "all">("all");

  const filtered = useMemo(() => threats.filter(t =>
    (status === "all" || t.status === status) && (sev === "all" || t.severity === sev)
  ), [threats, status, sev]);

  const blockIp = async (ip: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("blocked_ips").insert({ user_id: user.id, ip, reason: "Blocked from threats" });
    if (error) toast.error(error.message); else toast.success(`Blocked ${ip}`);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Threat Inventory</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} of {threats.length} threats · investigate, mitigate, escalate</p>
      </header>

      <div className="panel p-4 flex flex-wrap items-center gap-3">
        <Filter className="size-4 text-muted-foreground" />
        <span className="mono text-xs uppercase tracking-widest text-muted-foreground">Status</span>
        <Group items={STATUSES} value={status} onChange={setStatus} />
        <span className="mono text-xs uppercase tracking-widest text-muted-foreground ml-4">Severity</span>
        <Group items={SEVERITIES} value={sev} onChange={setSev} />
      </div>

      <div className="space-y-3">
        {filtered.slice(0, 50).map(t => <ThreatCard key={t.id} t={t} onBlock={blockIp} />)}
        {filtered.length === 0 && <div className="panel p-12 text-center text-muted-foreground">No threats match the current filters.</div>}
      </div>
    </div>
  );
}

function Group<T extends string>({ items, value, onChange }: { items: T[]; value: T; onChange: (v: any) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(i => (
        <button key={i} onClick={() => onChange(i)}
          className={`px-3 py-1 text-xs rounded-md font-medium capitalize transition ${
            value === i ? "bg-primary/15 text-primary border border-primary/40" : "text-muted-foreground hover:text-foreground border border-transparent"
          }`}>{i}</button>
      ))}
    </div>
  );
}
