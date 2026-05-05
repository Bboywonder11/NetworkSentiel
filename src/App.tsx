import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThreatProvider } from "@/hooks/useThreats";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Threats from "./pages/Threats";
import AIAnalysis from "./pages/AIAnalysis";
import Network from "./pages/Network";
import Blocked from "./pages/Blocked";
import NotFound from "./pages/NotFound";

function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Initializing console…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

const App = () => (
  <TooltipProvider>
    <Toaster theme="dark" position="top-right" />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route element={<Protected><ThreatProvider><Layout /></ThreatProvider></Protected>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/threats" element={<Threats />} />
            <Route path="/ai" element={<AIAnalysis />} />
            <Route path="/network" element={<Network />} />
            <Route path="/blocked" element={<Blocked />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
