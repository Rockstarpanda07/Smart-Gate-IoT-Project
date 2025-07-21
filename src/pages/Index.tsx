
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import CameraFeed from "@/components/CameraFeed";
import DoorStatus from "@/components/DoorStatus";
import AttendanceTable from "@/components/AttendanceTable";
//remove the above if you are using the mock data
//import MockAttendanceTable from "@/components/MockAttendanceTable"; // Add this import for MockAttendanceTable

import TeamMembers from "@/components/TeamMembers"; // Add this import
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, UserRound, Clock } from "lucide-react";

import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

interface StatsData {
  totalStudents: number;
  todaysEntries: number;
  thisWeek: number;
}

const Index = () => {
  const [activeCamera, setActiveCamera] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    totalStudents: 0,
    todaysEntries: 0,
    thisWeek: 0
  });

  useEffect(() => {
    // Fetch statistics from API
    const fetchStats = async () => {
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.STATS));
        if (response.ok) {
          const data = await response.json();
          // Validate data structure before updating state
          if (data && typeof data === 'object') {
            const validatedData: StatsData = {
              totalStudents: typeof data.totalStudents === 'number' ? data.totalStudents : 0,
              todaysEntries: typeof data.todaysEntries === 'number' ? data.todaysEntries : 0,
              thisWeek: typeof data.thisWeek === 'number' ? data.thisWeek : 0
            };
            setStats(validatedData);
          } else {
            console.error("Invalid statistics data format");
          }
        } else {
          console.error("Failed to fetch statistics:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };
    
    // Initial fetch
    fetchStats();
    
    // Set up interval for regular updates
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 container py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Camera Feed */}
          <div className="md:col-span-2">
            <CameraFeed isActive={activeCamera} />
          </div>
          
          {/* Door Status */}
          <div>
            <DoorStatus />
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:col-span-3">
            <Card className="shadow-sm card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <UserRound className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{stats.totalStudents}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Entries</p>
                  <p className="text-2xl font-bold">{stats.todaysEntries}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-info/10 rounded-full flex items-center justify-center">
                  <AreaChart className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Attendance Table */}
          <div className="md:col-span-3">
            <AttendanceTable />
          </div>
          
          {/* Team Members Section */}
          <div className="md:col-span-3 mt-6">
            <TeamMembers />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
