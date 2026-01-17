import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubdomainProvider } from "@/contexts/SubdomainContext";
import { SubdomainGate } from "@/components/SubdomainGate";
import { CompanyBrandingProvider } from "@/contexts/CompanyBrandingContext";
import { SubdomainAccessGuard } from "@/components/SubdomainAccessGuard";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import RegisterCompany from "./pages/RegisterCompany";
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
import FormResponses from "./pages/FormResponses";
import FormBuilder from "./pages/FormBuilder";
import PublicForm from "./pages/PublicForm";
import ResetPassword from "./pages/ResetPassword";
import ManageCompany from "./pages/ManageCompany";
import ManageProducts from "./pages/ManageProducts";
import PlatformAdmin from "./pages/PlatformAdmin";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

// Main domain routes (fastestcrm.com, www.fastestcrm.com, localhost, preview domains)
const MainDomainRoutes = () => (
  <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/terms" element={<TermsOfService />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/register-company" element={<RegisterCompany />} />
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
    <Route path="/dashboard/forms/:id/responses" element={<FormResponses />} />
    <Route path="/dashboard/forms/new" element={<FormBuilder />} />
    <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
    <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
    <Route path="/dashboard/company" element={<ManageCompany />} />
    <Route path="/dashboard/products" element={<ManageProducts />} />
    <Route path="/platform" element={<PlatformAdmin />} />
    <Route path="/form/:id" element={<PublicForm />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

// Subdomain routes (company.fastestcrm.com) - can be customized per workspace
// Wrapped with SubdomainAccessGuard to ensure users can only access their own company's subdomain
const SubdomainRoutes = () => (
  <SubdomainAccessGuard>
    <Routes>
      {/* On subdomain, "/" goes directly to auth/dashboard, not landing */}
      <Route path="/" element={<Auth />} />
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
      <Route path="/dashboard/forms/:id/responses" element={<FormResponses />} />
      <Route path="/dashboard/forms/new" element={<FormBuilder />} />
      <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
      <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
      <Route path="/dashboard/company" element={<ManageCompany />} />
      <Route path="/dashboard/products" element={<ManageProducts />} />
      <Route path="/form/:id" element={<PublicForm />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </SubdomainAccessGuard>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SubdomainProvider>
        <CompanyBrandingProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SubdomainGate mainDomainContent={<MainDomainRoutes />}>
                <SubdomainRoutes />
              </SubdomainGate>
            </BrowserRouter>
          </AuthProvider>
        </CompanyBrandingProvider>
      </SubdomainProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
