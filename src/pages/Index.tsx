
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import CameraFeed from "@/components/CameraFeed";
import DoorStatus from "@/components/DoorStatus";
import AttendanceTable from "@/components/AttendanceTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AreaChart, UserRound, Clock } from "lucide-react";
import { fetchStudents, fetchAttendanceLogs } from "@/services/supabase-service";

const Index = () => {
  const [activeCamera, setActiveCamera] = useState(true);
  const [studentCount, setStudentCount] = useState(0);
  const [todayEntries, setTodayEntries] = useState(0);
  const [weekEntries, setWeekEntries] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch students for count
        const students = await fetchStudents();
        setStudentCount(students.length);
        
        // Fetch attendance logs
        const logs = await fetchAttendanceLogs();
        
        // Calculate today's entries
        const today = new Date().toISOString().split('T')[0];
        const todayLogs = logs.filter(log => 
          log.timestamp && log.timestamp.startsWith(today)
        );
        setTodayEntries(todayLogs.length);
        
        // Calculate this week's entries
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekLogs = logs.filter(log => 
          log.timestamp && new Date(log.timestamp) >= oneWeekAgo
        );
        setWeekEntries(weekLogs.length);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
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
                  <p className="text-2xl font-bold">
                    {isLoading ? "..." : studentCount}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {isLoading ? "..." : todayEntries}
                  </p>
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
                  <p className="text-2xl font-bold">
                    {isLoading ? "..." : weekEntries}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Attendance Logs */}
          <div className="md:col-span-3">
            <Tabs defaultValue="attendance" className="space-y-4">
              <TabsList>
                <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
                <TabsTrigger value="activity">Activity History</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
              </TabsList>
              <TabsContent value="attendance" className="space-y-4">
                <AttendanceTable />
              </TabsContent>
              <TabsContent value="activity">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center py-8">
                      Activity history will be shown here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="alerts">
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground text-center py-8">
                      System alerts will be shown here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
