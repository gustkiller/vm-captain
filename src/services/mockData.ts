
// Mock data for development purposes

// Generate random time-series data
export const generateTimeSeriesData = (count: number, min: number, max: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const hour = String(Math.floor(i / 4) % 24).padStart(2, '0');
    const minute = String((i % 4) * 15).padStart(2, '0');
    return {
      time: `${hour}:${minute}`,
      value: Math.floor(Math.random() * (max - min)) + min
    };
  });
};

// Virtual Machines mock data
export const mockVMs = [
  {
    id: "vm-001",
    name: "Web Server",
    description: "Production web server running Nginx",
    status: "running" as const,
    os: "Ubuntu 22.04 LTS",
    cpu: 4,
    memory: 8,
    cpuUsage: 65,
    memoryUsage: 72,
    diskUsage: 45,
  },
  {
    id: "vm-002",
    name: "Database Server",
    description: "PostgreSQL database instance",
    status: "running" as const,
    os: "CentOS 8",
    cpu: 8,
    memory: 16,
    cpuUsage: 78,
    memoryUsage: 83,
    diskUsage: 67,
  },
  {
    id: "vm-003",
    name: "Test Environment",
    description: "QA testing environment for new features",
    status: "stopped" as const,
    os: "Windows Server 2019",
    cpu: 2,
    memory: 4,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 22,
  },
  {
    id: "vm-004",
    name: "CI/CD Pipeline",
    description: "Jenkins server for continuous integration",
    status: "running" as const,
    os: "Debian 11",
    cpu: 4,
    memory: 8,
    cpuUsage: 34,
    memoryUsage: 51,
    diskUsage: 39,
  },
  {
    id: "vm-005",
    name: "Backup Server",
    description: "Nightly backup and archiving system",
    status: "suspended" as const,
    os: "Ubuntu 20.04 LTS",
    cpu: 2,
    memory: 4,
    cpuUsage: 5,
    memoryUsage: 12,
    diskUsage: 94,
  },
  {
    id: "vm-006",
    name: "Development Server",
    description: "Development environment for team",
    status: "running" as const,
    os: "Alpine Linux",
    cpu: 4,
    memory: 8,
    cpuUsage: 22,
    memoryUsage: 45,
    diskUsage: 31,
  },
  {
    id: "vm-007",
    name: "Legacy Application",
    description: "Legacy application server",
    status: "error" as const,
    os: "Windows Server 2012",
    cpu: 2,
    memory: 4,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 86,
  },
  {
    id: "vm-008",
    name: "Mail Server",
    description: "Corporate mail server",
    status: "running" as const,
    os: "CentOS 7",
    cpu: 4,
    memory: 8,
    cpuUsage: 18,
    memoryUsage: 42,
    diskUsage: 53,
  },
];

// Stats summary
export const mockStatsSummary = {
  totalVMs: 8,
  runningVMs: 5,
  stoppedVMs: 1,
  suspendedVMs: 1,
  errorVMs: 1,
  totalCPUs: 30,
  totalMemoryGB: 60,
  averageCPUUsage: 28,
  averageMemoryUsage: 38,
};
