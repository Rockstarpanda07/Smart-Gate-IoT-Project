
import { useState, useEffect } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { API_ENDPOINTS, buildApiUrl } from "@/config/api";

interface CameraFeedProps {
  isActive?: boolean;
}

interface RecognitionStatus {
  recognizedFace: string | null;
  lastActivity: string | null;
  status: "online" | "offline" | "processing";
}

const CameraFeed = ({ isActive = true }: CameraFeedProps) => {
  const [status, setStatus] = useState<"online" | "offline" | "processing">("offline");
  const [recognizedFace, setRecognizedFace] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  
  useEffect(() => {
    if (isActive) {
      setStatus("online");
      
      // Fetch camera snapshot and recognition status at regular intervals
      const fetchCameraData = async () => {
        try {
          // Fetch camera snapshot
          const imageResponse = await fetch(buildApiUrl(API_ENDPOINTS.CAMERA_SNAPSHOT));
          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            // Validate image data before setting state
            if (imageData && typeof imageData === 'object' && typeof imageData.image === 'string') {
              setCameraImage(imageData.image);
            } else {
              console.error("Invalid camera image data format");
            }
          } else {
            console.error("Failed to fetch camera image:", imageResponse.statusText);
          }
          
          // Fetch recognition status
          const statusResponse = await fetch(buildApiUrl(API_ENDPOINTS.RECOGNITION_STATUS));
          if (statusResponse.ok) {
            const rawData = await statusResponse.json();
            
            // Validate status data before updating state
            if (rawData && typeof rawData === 'object') {
              const validStatus = ['online', 'offline', 'processing'].includes(rawData.status) ? 
                rawData.status : 'offline';
              
              setStatus(validStatus);
              
              // Only update recognizedFace if it's a valid string
              if (typeof rawData.recognizedFace === 'string') {
                setRecognizedFace(rawData.recognizedFace);
              }
              
              // Only update lastActivity if it's a valid string
              if (typeof rawData.lastActivity === 'string') {
                setLastActivity(rawData.lastActivity);
              }
            } else {
              console.error("Invalid recognition status data format");
              setStatus("offline");
            }
          } else {
            console.error("Failed to fetch recognition status:", statusResponse.statusText);
            setStatus("offline");
          }
        } catch (error) {
          console.error("Error fetching camera data:", error);
          setStatus("offline");
        }
      };
      
      // Initial fetch
      fetchCameraData();
      
      // Set up interval for regular updates
      const interval = setInterval(fetchCameraData, 2000); // Update every 2 seconds
      
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
              {/* Display actual camera feed from API */}
              <div className="camera-feed bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                {cameraImage ? (
                  <img 
                    src={cameraImage} 
                    alt="Live camera feed" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-white text-center">Loading camera feed...</div>
                )}
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
