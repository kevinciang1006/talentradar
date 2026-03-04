import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TalentSearch from "./pages/TalentSearch";
import TalentProfile from "./pages/TalentProfile";
import Pipeline from "./pages/Pipeline";
import Jobs from "./pages/Jobs";
import Settings from "./pages/Settings";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminDeals from "./pages/admin/AdminDeals";
import AdminTalentPool from "./pages/admin/AdminTalentPool";
import AdminCompanies from "./pages/admin/AdminCompanies";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/talent" element={<TalentSearch />} />
              <Route path="/talent/:id" element={<TalentProfile />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminOverview />} />
              <Route path="/admin/deals" element={<AdminDeals />} />
              <Route path="/admin/talent" element={<AdminTalentPool />} />
              <Route path="/admin/companies" element={<AdminCompanies />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </TooltipProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
