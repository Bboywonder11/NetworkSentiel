import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", org: "", email: "", password: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.name, organization: form.org },
          },
        });
        if (error) throw error;
        toast.success("Operator provisioned");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
        if (error) throw error;
        toast.success("Welcome back, operator");
      }
      nav("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Authentication failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      <Link to="/" className="absolute top-6 left-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back
      </Link>
      <div className="relative max-w-md mx-auto pt-24 px-6">
        <div className="mx-auto size-14 rounded-2xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)] mb-6">
          <Shield className="size-7 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-center">{mode === "signup" ? "Provision an Operator" : "Operator Sign in"}</h1>
        <p className="text-center text-muted-foreground mt-2">
          {mode === "signup" ? "Stand up your own AI-driven SOC console" : "Resume your security operations"}
        </p>
        <form onSubmit={submit} className="panel mt-8 p-6 space-y-4">
          {mode === "signup" && (
            <>
              <Field label="Full name">
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="Jane Operator" className="input" />
              </Field>
              <Field label="Organization" optional>
                <input value={form.org} onChange={e => setForm({...form, org: e.target.value})}
                  placeholder="Acme Corp" className="input" />
              </Field>
            </>
          )}
          <Field label="Email">
            <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              placeholder="operator@acme.com" className="input mono" />
          </Field>
          <Field label="Password">
            <input required type="password" minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})}
              placeholder="At least 6 characters" className="input mono" />
          </Field>
          <button disabled={loading}
            className="w-full rounded-lg bg-gradient-primary text-primary-foreground py-3 font-bold shadow-[var(--shadow-glow)] hover:opacity-95 transition disabled:opacity-60">
            {loading ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already an operator? " : "Need an account? "}
            <button type="button" onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-primary hover:underline">
              {mode === "signup" ? "Sign in" : "Provision"}
            </button>
          </p>
        </form>
      </div>
      <style>{`
        .input { width: 100%; background: hsl(var(--secondary) / 0.6); border: 1px solid hsl(var(--border));
          border-radius: 0.5rem; padding: 0.7rem 0.9rem; outline: none; color: hsl(var(--foreground)); }
        .input:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1.5">
        {label} {optional && <span className="text-muted-foreground font-normal">(optional)</span>}
      </span>
      {children}
    </label>
  );
}
