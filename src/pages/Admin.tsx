
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AdminDashboard from "@/components/AdminDashboard";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const Admin = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user was previously logged in (from localStorage)
    const user = localStorage.getItem("user");
    if (!isAuthenticated && !user) {
      navigate("/admin", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container py-12 flex items-center justify-center">
          <LoginForm />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        
        <Tabs defaultValue="students" className="space-y-4">
          <TabsList>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="settings">System Settings</TabsTrigger>
            <TabsTrigger value="devices">IoT Devices</TabsTrigger>
          </TabsList>
          <TabsContent value="students" className="space-y-4">
            <AdminDashboard />
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  System settings will be available here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="devices">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground text-center py-8">
                  IoT device management will be available here
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
