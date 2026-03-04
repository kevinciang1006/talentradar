import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PublicNavbar = () => {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <nav className="h-16 bg-card border-b border-border sticky top-0 z-50 flex items-center justify-between px-6 lg:px-8">
      <Link to="/" className="flex items-center gap-0">
        <span className="text-xl font-bold text-primary">Remote</span>
        <span className="text-xl font-bold text-foreground">Leverage</span>
      </Link>
      <div className="flex items-center gap-3">
        <Button variant="ghost" asChild>
          <Link to="/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link to="/register">Get Started</Link>
        </Button>
      </div>
    </nav>
  );
};

export default PublicNavbar;
