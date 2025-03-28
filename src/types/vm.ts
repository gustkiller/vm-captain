
export enum VMStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  SUSPENDED = 'SUSPENDED',
  MAINTENANCE = 'MAINTENANCE',
  ERROR = 'ERROR'
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
}
