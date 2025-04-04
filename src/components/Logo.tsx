
import { GraduationCap } from "lucide-react";

const Logo = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-6 w-6",
    default: "h-7 w-7",
    large: "h-9 w-9",
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="bg-primary/10 p-1.5 rounded-md">
        <GraduationCap className={`text-primary ${sizeClasses[size]}`} />
      </div>
      <div className="flex flex-col">
        <span className={`font-bold leading-tight ${
          size === "small" ? "text-sm" : 
          size === "large" ? "text-lg" : "text-base"
        }`}>
          Smart Attendance
        </span>
        <span className={`text-muted-foreground leading-tight ${
          size === "small" ? "text-xs" : 
          size === "large" ? "text-sm" : "text-xs"
        }`}>
          IoT System
        </span>
      </div>
    </div>
  );
};

export default Logo;
