import { Outlet } from "react-router-dom";
import { Activity, LayoutDashboard, Brain, Network as NetIcon, Ban, LogOut, Shield, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { NavLink } from "@/components/NavLink";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/threats", label: "Threats", icon: Activity },
  { to: "/ai", label: "AI Analysis", icon: Brain },
  { to: "/network", label: "Network", icon: NetIcon },
  { to: "/blocked", label: "Blocked IPs", icon: Ban },
];

export default function Layout() {
  const { signOut } = useAuth();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">

      {/* 🔹 Hamburger button */}
      {isMobile && (
        <button
          onClick={() => setOpen(!open)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      {/* 🔹 Overlay */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 🔹 Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full w-64 z-40 border-r border-border/60 bg-card/90 backdrop-blur-sm flex flex-col transition-transform duration-300
        ${isMobile ? (open ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-gradient-primary grid place-items-center shadow-[var(--shadow-glow)]">
            <Shield className="size-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-bold tracking-wide">SENTINEL</div>
            <div className="text-[10px] tracking-[0.2em] text-muted-foreground">
              CLOUD SECURITY
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => isMobile && setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              activeClassName="bg-primary/10 text-primary border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.2)]"
            >
              <Icon className="size-4" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <button
          onClick={signOut}
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>

      {/* 🔹 Main Content */}
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}