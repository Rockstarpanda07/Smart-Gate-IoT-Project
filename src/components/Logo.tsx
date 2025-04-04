
import { GraduationCap, Scan, CircleCheck } from "lucide-react";

const Logo = ({ size = "default" }: { size?: "small" | "default" | "large" }) => {
  const sizeClasses = {
    small: "h-8",
    default: "h-10",
    large: "h-14",
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="bg-primary/20 p-2 rounded-full">
          <div className="bg-primary/20 p-1 rounded-full">
            <GraduationCap className={`text-primary ${sizeClasses[size]}`} />
          </div>
        </div>
        <Scan className="text-secondary-foreground absolute -right-2 -bottom-1 h-5 w-5" />
        <CircleCheck className="text-success absolute -left-1 -top-1 h-4 w-4" />
      </div>
      <div className="flex flex-col">
        <span className={`font-bold ${size === "small" ? "text-sm" : size === "large" ? "text-xl" : "text-base"}`}>
          Smart Attendance
        </span>
        <span className={`text-muted-foreground ${size === "small" ? "text-xs" : size === "large" ? "text-sm" : "text-xs"}`}>
          IoT-Based System
        </span>
      </div>
    </div>
  );
};

export default Logo;
