
import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { Barcode, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Barcode className="h-6 w-6 text-primary" />
          <Link to="/" className="text-xl font-semibold">
            SmartGate
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary">
            Dashboard
          </Link>
          <Link to="/admin" className="text-sm font-medium hover:text-primary">
            Admin
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-sm gap-2">
                <User className="h-4 w-4" />
                Admin
              </Button>
              <Button size="sm" variant="ghost" onClick={logout} className="text-sm gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/admin">
              <Button size="sm" variant="outline" className="text-sm">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
