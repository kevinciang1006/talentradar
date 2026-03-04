import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Search,
  Columns3,
  Briefcase,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Search, label: "Talent Pool", to: "/talent" },
  { icon: Columns3, label: "Pipeline", to: "/pipeline" },
  { icon: Briefcase, label: "Jobs", to: "/jobs" },
];

const secondaryItems = [
  { icon: Settings, label: "Settings", to: "/settings" },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

const AppSidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { company, logout } = useAuth();
  const companyName = company?.name;
  const email = company?.email;
  const initial = companyName?.charAt(0)?.toUpperCase() || "A";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isActive = (to: string) => location.pathname.startsWith(to);

  const NavItem = ({ icon: Icon, label, to }: { icon: any; label: string; to: string }) => {
    const active = isActive(to);
    const content = (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
        } ${collapsed ? "justify-center" : ""}`}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return content;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="py-5 px-4 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-0 shrink-0" onClick={() => setMobileOpen(false)}>
          {collapsed ? (
            <span className="text-lg font-bold text-primary">RL</span>
          ) : (
            <>
              <span className="text-xl font-bold text-primary">Remote</span>
              <span className="text-xl font-bold text-foreground">Leverage</span>
            </>
          )}
        </Link>
        {/* Mobile close */}
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Nav */}
      <div className="mt-2 space-y-1 px-3 flex-1">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        {/* Divider */}
        <div className="my-4 mx-0 border-t border-border" />

        {secondaryItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block px-3 py-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors"
        >
          {collapsed ? <ChevronRight className="h-5 w-5 shrink-0" /> : <ChevronLeft className="h-5 w-5 shrink-0" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>

      {/* Bottom user section */}
      <div className="border-t border-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-secondary transition-colors ${collapsed ? "justify-center" : ""}`}>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                {initial}
              </div>
              {!collapsed && (
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{companyName}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align={collapsed ? "center" : "start"} className="w-56">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-foreground">{companyName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" /> Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-card border-r border-border z-40 transition-all duration-200 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-foreground/20 z-40" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-64 bg-card border-r border-border z-50 transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AppSidebar;
