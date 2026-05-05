import { NavLink, Outlet } from "react-router-dom";
import { Activity, LayoutDashboard, Brain, Network as NetIcon, Ban, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/threats", label: "Threats", icon: Activity },
  { to: "/ai", label: "AI Analysis", icon: Brain },
  { to: "/network", label: "Network", icon: NetIcon },
  { to: "/blocked", label: "Blocked IPs", icon: Ban },
];

export default function Layout() {
  const { signOut } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-border/60 bg-card/30 backdrop-blur-sm flex flex-col">
        <div className="p-5 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold tracking-wide">SENTINEL</div>
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground">CLOUD SECURITY</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}>
              <Icon className="size-4" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut}
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition">
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
