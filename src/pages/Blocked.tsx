import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Ban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type BlockedIp = { id: string; ip: string; reason: string | null; created_at: string };

export default function Blocked() {
  const [list, setList] = useState<BlockedIp[]>([]);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from("blocked_ips").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setList(data || []);
  };
  useEffect(() => { load(); }, []);

  const block = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ip.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("blocked_ips").insert({ user_id: user.id, ip: ip.trim(), reason: reason.trim() || null });
    setLoading(false);
    if (error) return toast.error(error.message);
    setIp(""); setReason(""); toast.success("IP blocked at perimeter");
    load();
  };

  const unblock = async (id: string) => {
    const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast("Unblocked"); load(); }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-4xl font-bold">Blocked IPs</h1>
        <p className="text-muted-foreground mt-1">{list.length} address{list.length === 1 ? "" : "es"} currently blocked at the perimeter</p>
      </header>

      <form onSubmit={block} className="panel p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <Plus className="size-4" /> Add block rule
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
          <input value={ip} onChange={e => setIp(e.target.value)} required
            placeholder="IP address (e.g. 185.220.101.42)"
            className="bg-secondary/60 border border-border rounded-lg px-3 py-2.5 mono text-sm focus:border-primary focus:outline-none" />
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="bg-secondary/60 border border-border rounded-lg px-3 py-2.5 text-sm focus:border-primary focus:outline-none" />
          <button disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground px-5 py-2.5 font-bold disabled:opacity-60">
            <Ban className="size-4" /> Block
          </button>
        </div>
      </form>

      <div className="panel p-5">
        {list.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            No IPs are currently blocked. Block one above or from the Threats page.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {list.map(b => (
              <li key={b.id} className="flex items-center gap-4 py-3">
                <Ban className="size-4 text-destructive" />
                <div className="flex-1 min-w-0">
                  <div className="mono font-semibold">{b.ip}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {b.reason || "No reason provided"} · {new Date(b.created_at).toLocaleString()}
                  </div>
                </div>
                <button onClick={() => unblock(b.id)}
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition">
                  <Trash2 className="size-3.5" /> Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
