import { useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/talent": "Talent Pool",
  "/pipeline": "Pipeline",
  "/jobs": "Jobs",
  "/settings": "Settings",
};

const ProtectedLayout = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const matchedTitle = Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path));
  const pageTitle = matchedTitle?.[1] || "";

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Mobile top bar */}
      <div className="lg:hidden h-14 bg-card border-b border-border sticky top-0 z-30 flex items-center px-4 gap-3">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
      </div>

      <main
        className={`transition-all duration-200 pt-6 pb-12 ${
          collapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
