
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { VMStatusBadge } from "./VMStatusBadge";
import { HardDrive, Cpu, MemoryStick } from "lucide-react";
import { Link } from "react-router-dom";

interface VMCardProps {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'suspended' | 'error';
  os: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

export function VMCard({
  id,
  name,
  status,
  os,
  cpuUsage,
  memoryUsage,
  diskUsage,
}: VMCardProps) {
  return (
    <Link to={`/virtual-machines/${id}`} className="block w-full h-full">
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
          <div className="space-y-0">
            <h3 className="font-semibold leading-none tracking-tight">{name}</h3>
            <p className="text-xs text-muted-foreground">{os}</p>
          </div>
          <VMStatusBadge status={status} />
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center">
              <Cpu className="h-3 w-3 mr-1" />
              <span>{cpuUsage}%</span>
            </div>
            <div className="flex items-center">
              <MemoryStick className="h-3 w-3 mr-1" />
              <span>{memoryUsage}%</span>
            </div>
            <div className="flex items-center">
              <HardDrive className="h-3 w-3 mr-1" />
              <span>{diskUsage}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
