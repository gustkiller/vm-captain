
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { VMCard } from '@/components/vm/VMCard';
import { VMType } from '@/types/vm';
import { VCenterService, createVCenterService } from '@/services/vCenterService';
import config from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [vms, setVMs] = useState<VMType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchVMs = async () => {
      setLoading(true);
      try {
        const vcenterService = createVCenterService({
          url: config.vCenter.url,
          username: config.vCenter.username,
          password: config.vCenter.password,
          ignoreSSL: config.vCenter.ignoreSSL
        });

        await vcenterService.connect();
        const fetchedVMs = await vcenterService.getVirtualMachines();
        setVMs(fetchedVMs);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch VMs:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
        toast({
          variant: 'destructive',
          title: 'Connection Error',
          description: `Failed to connect to vCenter: ${err instanceof Error ? err.message : 'Unknown error'}`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVMs();
  }, [toast]);

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome to VM Captain</h2>
          <p className="text-muted-foreground">
            Manage and monitor your virtual machines from a central dashboard
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Connecting to vCenter...</span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-4 text-center">
            <p className="text-destructive font-medium">Failed to connect to vCenter</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : vms.length === 0 ? (
          <div className="text-center py-12">
            <p>No virtual machines found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.map(vm => (
              <VMCard
                key={vm.id}
                id={vm.id}
                name={vm.name}
                status={vm.status.toLowerCase() as any}
                os={vm.os || 'Unknown OS'}
                cpuUsage={vm.cpuUsage}
                memoryUsage={vm.memoryUsage}
                diskUsage={vm.diskUsage}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Index;
