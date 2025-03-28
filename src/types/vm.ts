
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

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export interface UserType {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  assignedVMs?: string[]; // Array of VM IDs assigned to this user
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
  assignedUsers?: string[]; // Array of user IDs who can access this VM
}
