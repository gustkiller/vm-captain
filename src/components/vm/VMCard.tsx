
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VMStatusBadge } from "./VMStatusBadge";
import { Play, PowerOff, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { VCenterService, createVCenterService } from "@/services/vCenterService";
import config from "@/services/configService";

interface VMCardProps {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'stopped' | 'suspended' | 'error';
  os: string;
  cpu: number;
  memory: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export function VMCard({
  id,
  name,
  description,
  status,
  os,
  cpu,
  memory,
  cpuUsage,
  memoryUsage,
  diskUsage,
}: VMCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const handlePowerAction = async (action: 'start' | 'stop' | 'restart') => {
    setIsLoading(true);
    try {
      const vcenterService = createVCenterService({
        url: config.vCenter.url,
        username: config.vCenter.username,
        password: config.vCenter.password,
        ignoreSSL: config.vCenter.ignoreSSL
      });
      
      await vcenterService.connect();
      await vcenterService.powerOperation(id, action);
      
      toast({
        title: `VM ${action}ed`,
        description: `The VM "${name}" has been ${action}ed successfully.`,
      });
      
      // In a real app, we would refresh the VM status here
      // This is a placeholder for that functionality
    } catch (err) {
      console.error(`Failed to ${action} VM:`, err);
      toast({
        variant: 'destructive',
        title: `Failed to ${action} VM`,
        description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <div className="space-y-0">
          <h3 className="font-semibold leading-none tracking-tight">{name}</h3>
          <p className="text-xs text-muted-foreground">{os}</p>
        </div>
        <VMStatusBadge status={status} />
      </CardHeader>
      <CardContent className="p-4 pb-0">
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <p className="text-muted-foreground">CPU</p>
            <p className="font-medium">{cpu} vCPUs</p>
          </div>
          <div>
            <p className="text-muted-foreground">Memory</p>
            <p className="font-medium">{memory} GB</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>CPU Usage</span>
            <span className="font-medium">{cpuUsage}%</span>
          </div>
          <Progress value={cpuUsage} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Memory Usage</span>
            <span className="font-medium">{memoryUsage}%</span>
          </div>
          <Progress value={memoryUsage} className="h-1" />
          
          <div className="flex justify-between text-xs">
            <span>Disk Usage</span>
            <span className="font-medium">{diskUsage}%</span>
          </div>
          <Progress value={diskUsage} className="h-1" />
        </div>
      </CardContent>
      <Separator className="my-4" />
      <CardFooter className="p-4 pt-0 justify-between">
        <Button 
          size="sm" 
          variant={status === 'running' ? 'destructive' : 'default'}
          onClick={() => handlePowerAction(status === 'running' ? 'stop' : 'start')}
          disabled={status === 'error' || isLoading}
        >
          {status === 'running' ? (
            <><PowerOff className="mr-1 h-3 w-3" /> Stop</>
          ) : (
            <><Play className="mr-1 h-3 w-3" /> Start</>
          )}
        </Button>
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => handlePowerAction('restart')}
          disabled={status !== 'running' || isLoading}
        >
          <RefreshCw className="mr-1 h-3 w-3" /> Restart
        </Button>
      </CardFooter>
    </Card>
  );
}
