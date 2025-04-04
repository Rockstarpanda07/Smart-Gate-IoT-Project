
import { GraduationCap } from "lucide-react";

const Logo = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-5 w-5",
    large: "h-6 w-6",
  };
  
  return (
    <div className="flex items-center gap-1.5">
      <div className="bg-primary/10 p-1 rounded-md">
        <GraduationCap className={`text-primary ${sizeClasses[size]}`} />
      </div>
      <div className="flex flex-col">
        <span className={`font-medium leading-tight ${
          size === "small" ? "text-xs" : 
          size === "large" ? "text-base" : "text-sm"
        }`}>
          Smart Attendance
        </span>
        <span className={`text-muted-foreground leading-tight ${
          size === "small" ? "text-[10px]" : 
          size === "large" ? "text-xs" : "text-[10px]"
        }`}>
          IoT System
        </span>
      </div>
    </div>
  );
};

export default Logo;
