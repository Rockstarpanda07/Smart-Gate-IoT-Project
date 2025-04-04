
import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "@/components/ui/use-toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<{ username: string; role: string } | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Mock authentication - replace with actual API call
    if (username === "admin" && password === "admin123") {
      setIsAuthenticated(true);
      setUser({ username: "admin", role: "admin" });
      localStorage.setItem("user", JSON.stringify({ username, role: "admin" }));
      toast({
        title: "Login Successful",
        description: "Welcome back, Admin!",
      });
      return true;
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem("user");
    toast({
      title: "Logged Out",
      description: "You've been logged out successfully",
    });
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
