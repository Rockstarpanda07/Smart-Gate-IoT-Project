
import { useState, useEffect } from "react";
import { DoorClosed, DoorOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

interface DoorStatusData {
  status: "closed" | "opening" | "open" | "closing" | "alert";
  lastOpened: string | null;
  autoCloseTimer: number;
}

const DoorStatus = () => {
  const [status, setStatus] = useState<"closed" | "opening" | "open" | "closing" | "alert">("closed");
  const [progress, setProgress] = useState(0);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState(0);
  
  useEffect(() => {
    // Fetch door status from API at regular intervals
    const fetchDoorStatus = async () => {
      try {
        const response = await fetch(buildApiUrl(API_ENDPOINTS.DOOR_STATUS));
        if (response.ok) {
          const data: DoorStatusData = await response.json();
          setStatus(data.status);
          setLastOpened(data.lastOpened);
          setAutoCloseTimer(data.autoCloseTimer);
        }
      } catch (error) {
        console.error("Error fetching door status:", error);
      }
    };
    
    // Initial fetch
    fetchDoorStatus();
    
    // Set up interval for regular updates
    const interval = setInterval(fetchDoorStatus, 1000); // Update every second
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (status === "opening") {
      // Door opening animation (3 seconds)
      setProgress(0);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer!);
            return 100;
          }
          return prev + 5;
        });
      }, 150);
    } else if (status === "closing") {
      // Door closing animation (3 seconds)
      setProgress(100);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(timer!);
            return 0;
          }
          return prev - 5;
        });
      }, 150);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);
  
  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className={`py-3 ${
        status === "alert" ? "bg-destructive/10" : 
        status === "open" ? "bg-success/10" : 
        "bg-primary/5"
      }`}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {status === "closed" && <DoorClosed className="h-5 w-5" />}
            {(status === "open" || status === "opening") && <DoorOpen className="h-5 w-5" />}
            {status === "closing" && <DoorClosed className="h-5 w-5" />}
            {status === "alert" && <AlertCircle className="h-5 w-5 text-destructive" />}
            Door Status
          </CardTitle>
          <Badge 
            className={
              status === "open" ? "bg-success/20 text-success-foreground border-success/30" :
              status === "closed" ? "bg-muted/50 border-border" :
              status === "alert" ? "bg-destructive/20 text-destructive-foreground border-destructive/30" :
              "bg-warning/20 text-warning-foreground border-warning/30"
            }
          >
            {status === "open" && "Open"}
            {status === "closed" && "Closed"}
            {status === "opening" && "Opening"}
            {status === "closing" && "Closing"}
            {status === "alert" && "Alert"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="relative h-40 w-full flex items-center justify-center">
          <div className="w-20 h-full relative">
            {/* Door frame */}
            <div className="absolute inset-x-0 top-0 bottom-4 border-t-4 border-x-4 border-primary/70 rounded-t-lg"></div>
            
            {/* Door */}
            <div 
              className={`absolute inset-x-[2px] top-[2px] bottom-4 bg-card border border-primary/40 rounded-t transition-transform duration-300 origin-left ${
                (status === "open" || status === "opening") ? "animate-door-open" : "animate-door-close"
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateY(${-progress * 0.3}deg)`
              }}
            >
              {/* Door handle */}
              <div className="absolute top-1/2 right-2 w-2 h-6 bg-primary/80 rounded-full"></div>
            </div>
            
            {/* Floor */}
            <div className="absolute inset-x-[-20px] bottom-0 h-4 bg-primary/20 rounded"></div>
            
            {status === "alert" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-destructive/20 backdrop-blur-sm p-4 rounded-lg animate-pulse">
                  <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                  <p className="text-xs font-medium text-destructive">Unauthorized Access</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {(status === "opening" || status === "closing") && (
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </CardContent>
      <CardFooter className="px-6 py-3 bg-muted/20 text-xs text-muted-foreground">
        <div className="w-full flex items-center justify-between">
          {lastOpened ? (
            <div>Last opened at: {lastOpened}</div>
          ) : (
            <div>No recent activity</div>
          )}
          
          {status === "open" && (
            <div>Auto-closing in: {autoCloseTimer}s</div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default DoorStatus;
