
import { Badge } from '@/components/ui/badge';

type VMStatus = 'running' | 'stopped' | 'suspended' | 'error';

interface VMStatusBadgeProps {
  status: VMStatus;
}

const statusConfig = {
  running: {
    label: 'Running',
    className: 'bg-vm-running text-white hover:bg-vm-running/80',
  },
  stopped: {
    label: 'Stopped',
    className: 'bg-vm-stopped text-white hover:bg-vm-stopped/80',
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-vm-suspended text-black hover:bg-vm-suspended/80',
  },
  error: {
    label: 'Error',
    className: 'bg-destructive',
  },
};

export function VMStatusBadge({ status }: VMStatusBadgeProps) {
  const config = statusConfig[status];
  
  // Only apply pulsing animation to running status
  const animationClass = status === 'running' ? 'animate-pulse-slow' : '';
  
  return (
    <Badge 
      className={`${config.className} ${animationClass}`}
      variant="outline"
    >
      {config.label}
    </Badge>
  );
}
