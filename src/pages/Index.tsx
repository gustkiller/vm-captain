
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { VMCard } from '@/components/vm/VMCard';
import { VMType } from '@/types/vm';
import { VCenterService, createVCenterService } from '@/services/vCenterService';
import config from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/services/userService';
import { Loader2, ServerOff, Plus, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Index = () => {
  const [vms, setVMs] = useState<VMType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const currentUser = userService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

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
        
        // Filter VMs based on user role
        const accessibleVMs = userService.getAssignedVMs(fetchedVMs);
        setVMs(accessibleVMs);
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
  }, [toast, navigate]);

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome to VM Captain</h2>
            <p className="text-muted-foreground">
              Manage and monitor your virtual machines
            </p>
          </div>
          {userService.isAdmin() && (
            <div className="flex gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Manage Users
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>User Management</SheetTitle>
                    <SheetDescription>
                      Manage users and their VM access
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <h3 className="font-medium mb-2">Users</h3>
                    <div className="space-y-2">
                      {userService.getAllUsers().map(user => (
                        <div key={user.id} className="p-3 border rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{user.username}</p>
                              <p className="text-xs text-muted-foreground">Role: {user.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              
              <Sheet>
                <SheetTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Assign VMs
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>VM Assignment</SheetTitle>
                    <SheetDescription>
                      Assign VMs to specific users
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-4">
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Select User</h3>
                      <div className="space-y-2">
                        {userService.getAllUsers()
                          .filter(user => user.role === 'USER')
                          .map(user => (
                            <div key={user.id} className="flex items-center p-2 border rounded hover:bg-accent cursor-pointer">
                              <span>{user.username}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Available VMs</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {vms.map(vm => (
                          <div key={vm.id} className="flex items-center justify-between p-2 border rounded hover:bg-accent">
                            <span>{vm.name}</span>
                            <Button variant="outline" size="sm">
                              Assign
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[180px] w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/15 p-6 text-center">
            <ServerOff className="h-12 w-12 mx-auto mb-3 text-destructive" />
            <p className="text-destructive font-medium text-lg">Failed to connect to vCenter</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : vms.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <ServerOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium">No virtual machines found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {userService.isAdmin() 
                ? "No VMs are available in your vCenter." 
                : "You don't have access to any VMs. Contact your administrator."}
            </p>
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
