import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { syncDataToSupabase } from "@/lib/syncData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SyncButton = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    toast({
      title: "Sync Started",
      description: "Syncing data to Supabase...",
    });
    
    try {
      // Use the syncDataToSupabase function from syncData.ts
      const result = await syncDataToSupabase();
      
      if (result.success) {
        setLastSync(new Date());
        toast({
          title: "Sync Successful",
          description: `Successfully synced ${result.data?.studentsCount || 0} students and ${result.data?.attendanceCount || 0} attendance records to Supabase.`,
          variant: "default",
        });
      } else {
        const errorMessage = result.error?.message || 
                          (typeof result.error === 'string' ? result.error : 'Unknown error');
        toast({
          title: "Sync Failed",
          description: `Error: ${errorMessage}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Format the last sync time
  const getLastSyncText = () => {
    if (!lastSync) return "Never synced";
    
    return `Last sync: ${lastSync.toLocaleTimeString()}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            size="sm"
            className="gap-2"
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4" />
            )}
            {isSyncing ? "Syncing..." : "Sync Data"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getLastSyncText()}</p>
          <p>Manually sync all data to Supabase</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SyncButton;