
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Logo from "@/components/Logo";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        isScrolled ? "bg-background/80 backdrop-blur-sm shadow-sm" : "bg-background"
      }`}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1">
            <Link to="/">
              <Button variant="ghost">Home</Button>
            </Link>
            <Link to="/admin">
              <Button variant="ghost">Admin</Button>
            </Link>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="md:hidden flex items-center gap-4">
          <ThemeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4">
                <Link to="/">
                  <Button variant="ghost" className="w-full justify-start">
                    Home
                  </Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost" className="w-full justify-start">
                    Admin
                  </Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
