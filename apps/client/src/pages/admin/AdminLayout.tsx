import { useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, UserPlus, Building, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", to: "/admin" },
  { icon: Users, label: "Active Deals", to: "/admin/deals" },
  { icon: UserPlus, label: "Talent Pool", to: "/admin/talent" },
  { icon: Building, label: "Companies", to: "/admin/companies" },
];

const AdminLayout = () => {
  const { admin, isAuthenticated, isLoading, logout } = useAdminAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
  };

  const isActive = (to: string) => to === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(to);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="py-5 px-4 flex items-center justify-between">
        <span className="text-lg font-bold text-white">RL Admin</span>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-2 space-y-1 px-3 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.to) ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="border-t border-slate-700 p-3">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white w-full transition-colors">
          <LogOut className="h-5 w-5" />
          <span>Log out</span>
        </button>
        <div className="flex items-center gap-3 px-3 py-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center">
            {admin?.name?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{admin?.name || "Admin User"}</p>
            <p className="text-xs text-slate-500 truncate">{admin?.email || "admin@remoteleverage.com"}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-foreground z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="lg:hidden fixed inset-0 bg-foreground/50 z-40" onClick={() => setMobileOpen(false)} />}
      <aside className={`lg:hidden fixed left-0 top-0 h-screen w-64 bg-foreground z-50 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden h-14 bg-card border-b border-border sticky top-0 z-30 flex items-center px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-foreground ml-3">RL Admin</span>
      </div>

      <main className="lg:ml-64 pt-6 pb-12">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
