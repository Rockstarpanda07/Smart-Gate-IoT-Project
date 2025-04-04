
import { useState, useEffect } from "react";
import { DoorClosed, DoorOpen, AlertCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const DoorStatus = () => {
  const [status, setStatus] = useState<"closed" | "opening" | "open" | "closing" | "alert">("closed");
  const [progress, setProgress] = useState(0);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [autoCloseTimer, setAutoCloseTimer] = useState(0);
  
  useEffect(() => {
    // Simulate door activity every 30 seconds
    const interval = setInterval(() => {
      simulateDoorActivity();
    }, 30000);
    
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
            setStatus("open");
            setLastOpened(new Date().toLocaleTimeString());
            setAutoCloseTimer(5); // 5 seconds auto-close timer
            return 100;
          }
          return prev + 2; // Faster animation
        });
      }, 60);
    } else if (status === "closing") {
      // Door closing animation (3 seconds)
      setProgress(100);
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(timer!);
            setStatus("closed");
            return 0;
          }
          return prev - 2; // Faster animation
        });
      }, 60);
    } else if (status === "open") {
      // Auto close countdown
      timer = setInterval(() => {
        setAutoCloseTimer(prev => {
          if (prev <= 0) {
            clearInterval(timer!);
            setStatus("closing");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status]);
  
  const simulateDoorActivity = () => {
    if (status === "closed" || status === "alert") {
      // Simulate door opening
      setStatus("opening");
      
      // 10% chance of alert (unauthorized access attempt)
      if (Math.random() < 0.1) {
        setTimeout(() => {
          setStatus("alert");
        }, 3000);
      }
    }
  };
  
  const handleOpenDoor = () => {
    if (status === "closed") {
      setStatus("opening");
    }
  };
  
  const handleCloseDoor = () => {
    if (status === "open") {
      setStatus("closing");
    }
  };
  
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
          <div className="w-full h-full relative max-w-xs mx-auto">
            {/* Door frame */}
            <div className="absolute inset-0 border-4 border-primary/70 rounded-lg"></div>
            
            {/* Door with hinge animation */}
            <div 
              className="absolute top-1 left-1 bottom-1 w-[calc(100%-8px)] origin-left transition-transform"
              style={{
                transform: `perspective(1000px) rotateY(${status === "closed" || status === "closing" 
                  ? 0 
                  : status === "open" 
                    ? -80 
                    : -(progress * 0.8)}deg)`
              }}
            >
              <div className="h-full bg-card border border-primary/40 rounded">
                {/* Door handle */}
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2 w-2 h-6 bg-primary/80 rounded-full"></div>
              </div>
            </div>
            
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
        
        {/* Manual door controls */}
        <div className="mt-6 flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleOpenDoor}
            disabled={status !== "closed"}
            className="w-28"
          >
            <DoorOpen className="mr-2 h-4 w-4" /> Open Door
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleCloseDoor}
            disabled={status !== "open"}
            className="w-28"
          >
            <DoorClosed className="mr-2 h-4 w-4" /> Close Door
          </Button>
        </div>
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
