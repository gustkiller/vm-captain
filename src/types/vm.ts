
export enum VMStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  SUSPENDED = 'SUSPENDED',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
}

export interface DiskType {
  label: string;
  size_gb: number;
  disk_mode: string;
  thin_provisioned: boolean;
}

export interface VMType {
  id: string;
  name: string;
  description: string;
  status: VMStatus;
  os: string;
  cpu: number;
  memory: number;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  ipAddress?: string;
  disks?: DiskType[];
}
