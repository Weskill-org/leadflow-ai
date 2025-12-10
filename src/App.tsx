import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AllLeads from "./pages/AllLeads";
import LGDashboard from "./pages/LGDashboard";
import Interested from "./pages/Interested";
import Paid from "./pages/Paid";
import PendingPayments from "./pages/PendingPayments";
import AutoDialer from "./pages/AutoDialer";
import AIInsights from "./pages/AIInsights";
import Team from "./pages/Team";
import Automations from "./pages/Automations";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import Forms from "./pages/Forms";
import FormBuilder from "./pages/FormBuilder";
import PublicForm from "./pages/PublicForm";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/lg" element={<LGDashboard />} />
            <Route path="/dashboard/leads" element={<AllLeads />} />
            <Route path="/dashboard/interested" element={<Interested />} />
            <Route path="/dashboard/paid" element={<Paid />} />
            <Route path="/dashboard/pending" element={<PendingPayments />} />
            <Route path="/dashboard/dialer" element={<AutoDialer />} />
            <Route path="/dashboard/ai" element={<AIInsights />} />
            <Route path="/dashboard/team" element={<Team />} />
            <Route path="/dashboard/automations" element={<Automations />} />
            <Route path="/dashboard/integrations" element={<Integrations />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/forms" element={<Forms />} />
            <Route path="/dashboard/forms/new" element={<FormBuilder />} />
            <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
            <Route path="/form/:id" element={<PublicForm />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;