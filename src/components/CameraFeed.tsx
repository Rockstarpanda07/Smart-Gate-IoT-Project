
import { useState, useEffect } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CameraFeedProps {
  isActive?: boolean;
}

const CameraFeed = ({ isActive = true }: CameraFeedProps) => {
  const [status, setStatus] = useState<"online" | "offline" | "processing">("offline");
  const [recognizedFace, setRecognizedFace] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  
  useEffect(() => {
    if (isActive) {
      setStatus("online");
      
      // Simulate processing activity every 20 seconds
      const interval = setInterval(() => {
        setStatus("processing");
        
        // Simulate recognition after 2 seconds
        setTimeout(() => {
          const timestamp = new Date().toLocaleTimeString();
          const students = ["Alex Johnson", "Maria Garcia", "James Wilson", "Sophia Chen"];
          const randomStudent = students[Math.floor(Math.random() * students.length)];
          
          setRecognizedFace(randomStudent);
          setLastActivity(timestamp);
          setStatus("online");
        }, 2000);
      }, 20000);
      
      return () => clearInterval(interval);
    } else {
      setStatus("offline");
    }
  }, [isActive]);

  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className="bg-primary/5 py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Camera Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className={`status-indicator ${status}`} />
            <span className="text-xs font-medium">
              {status === "online" && "Online"}
              {status === "offline" && "Offline"}
              {status === "processing" && "Processing"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="camera-container">
          {status !== "offline" ? (
            <>
              {/* Placeholder for actual camera feed */}
              <div className="camera-feed bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {status === "processing" && (
                  <div className="camera-overlay animate-fade-in">
                    <div className="bg-background/20 backdrop-blur-sm p-4 rounded-lg">
                      <div className="text-white text-center">
                        <div className="mb-2">Scanning...</div>
                        <div className="flex items-center justify-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    {recognizedFace && (
                      <div className="text-sm font-medium animate-fade-in">
                        Last detected: {recognizedFace}
                      </div>
                    )}
                    {lastActivity && (
                      <div className="text-xs text-gray-300">
                        {lastActivity}
                      </div>
                    )}
                  </div>
                  {status === "online" && (
                    <Badge variant="outline" className="bg-success/20 text-success-foreground border-success/30">
                      Ready to Scan
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center bg-muted/50 text-muted-foreground">
              <CameraOff className="h-10 w-10 mb-2" />
              <p className="text-sm font-medium">Camera Offline</p>
              <p className="text-xs">Please check your connection</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CameraFeed;
