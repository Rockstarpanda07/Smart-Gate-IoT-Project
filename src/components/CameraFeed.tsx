
import { useState, useEffect } from "react";
import { Camera, CameraOff, Scan, CircleCheck, CircleX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CameraFeedProps {
  isActive?: boolean;
}

type VerificationStep = "idle" | "barcode" | "face" | "success" | "failed";

const CameraFeed = ({ isActive = true }: CameraFeedProps) => {
  const [status, setStatus] = useState<"online" | "offline" | "processing">("offline");
  const [recognizedFace, setRecognizedFace] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<string | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep>("idle");
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  
  useEffect(() => {
    if (isActive) {
      setStatus("online");
      
      // Simulate verification process every 20 seconds
      const interval = setInterval(() => {
        simulateVerificationProcess();
      }, 20000);
      
      return () => clearInterval(interval);
    } else {
      setStatus("offline");
    }
  }, [isActive]);

  const simulateVerificationProcess = () => {
    // Only start if currently idle
    if (verificationStep !== "idle" || status !== "online") return;
    
    // Generate a random student ID
    const year = new Date().getFullYear();
    const randomId = `${String(year).slice(-2)}110${Math.floor(Math.random() * 900) + 100}`;
    setStudentId(randomId);
    
    // Start with barcode scan
    setStatus("processing");
    setVerificationStep("barcode");
    setVerificationMessage("Scanning barcode...");
    
    // After 1.5 seconds, simulate barcode detected
    setTimeout(() => {
      setVerificationMessage(`Barcode detected: Student ID ${randomId}`);
      
      // After 1 second, move to face scanning
      setTimeout(() => {
        setVerificationStep("face");
        setVerificationMessage("Scanning face... Please look at the camera");
        
        // After 2 seconds, complete face scan
        setTimeout(() => {
          const timestamp = new Date().toLocaleTimeString();
          const students = ["Alex Johnson", "Maria Garcia", "James Wilson", "Sophia Chen"];
          const randomStudent = students[Math.floor(Math.random() * students.length)];
          setRecognizedFace(randomStudent);
          setLastActivity(timestamp);
          
          // Randomly decide if verification passes or fails (80% success rate)
          const success = Math.random() < 0.8;
          
          if (success) {
            setVerificationStep("success");
            setVerificationMessage(`Verification successful: Welcome, ${randomStudent}!`);
            
            // After 3 seconds, reset to idle
            setTimeout(() => {
              setVerificationStep("idle");
              setVerificationMessage(null);
              setStatus("online");
            }, 3000);
          } else {
            setVerificationStep("failed");
            setVerificationMessage("Verification failed: Face does not match student ID");
            
            // After 3 seconds, reset to idle
            setTimeout(() => {
              setVerificationStep("idle");
              setVerificationMessage(null);
              setStatus("online");
            }, 3000);
          }
        }, 2000);
      }, 1000);
    }, 1500);
  };

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
                        {verificationStep === "barcode" && (
                          <div className="flex flex-col items-center">
                            <Scan className="w-10 h-10 mb-2 animate-pulse" />
                            <div className="mb-2">{verificationMessage}</div>
                          </div>
                        )}
                        {verificationStep === "face" && (
                          <div className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full border-2 border-white mb-2 flex items-center justify-center relative">
                              <div className="w-16 h-16 rounded-full bg-white/20 animate-pulse"></div>
                              <div className="absolute w-full h-1 bg-primary animate-scan"></div>
                            </div>
                            <div className="mb-2">{verificationMessage}</div>
                          </div>
                        )}
                        {verificationStep === "success" && (
                          <div className="flex flex-col items-center">
                            <CircleCheck className="w-10 h-10 mb-2 text-success" />
                            <div className="mb-2">{verificationMessage}</div>
                          </div>
                        )}
                        {verificationStep === "failed" && (
                          <div className="flex flex-col items-center">
                            <CircleX className="w-10 h-10 mb-2 text-destructive" />
                            <div className="mb-2">{verificationMessage}</div>
                          </div>
                        )}
                        {["barcode", "face"].includes(verificationStep) && (
                          <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                          </div>
                        )}
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
