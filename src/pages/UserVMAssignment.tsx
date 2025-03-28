
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { userService } from '@/services/userService';
import { createVCenterService } from '@/services/vCenterService';
import { UserType, VMType, VMStatus } from '@/types/vm';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { configService } from '@/services/configService';

// Helper function to convert VMStatus enum to string format for VMStatusBadge
const mapVMStatus = (status: VMStatus): 'running' | 'stopped' | 'suspended' | 'error' => {
  switch (status) {
    case VMStatus.RUNNING:
      return 'running';
    case VMStatus.STOPPED:
      return 'stopped';
    case VMStatus.SUSPENDED:
      return 'suspended';
    case VMStatus.ERROR:
    case VMStatus.MAINTENANCE:
    default:
      return 'error';
  }
};

const UserVMAssignment = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  const [allVMs, setAllVMs] = useState<VMType[]>([]);
  const [assignedVMs, setAssignedVMs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!id) return;
    
    // Get user
    const loadUserData = async () => {
      const foundUser = await userService.getUserById(id);
      if (!foundUser) {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive"
        });
        navigate('/users');
        return;
      }
      
      setUser(foundUser);
      
      if (foundUser.assignedVMs) {
        setAssignedVMs(foundUser.assignedVMs);
      }
    };
    
    // Load VMs and user's assigned VMs
    const loadData = async () => {
      try {
        setLoading(true);
        await loadUserData();
        
        // Create a new instance of VCenterService
        const vCenterConfig = configService.getVCenterConfig();
        const vCenterServiceInstance = createVCenterService(vCenterConfig);
        const vms = await vCenterServiceInstance.getVirtualMachines();
        setAllVMs(vms);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, navigate, toast]);
  
  const handleToggleVM = async (vmId: string) => {
    if (!user || !id) return;
    
    try {
      let success = false;
      
      if (assignedVMs.includes(vmId)) {
        // Remove VM
        success = await userService.removeVMFromUser(id, vmId);
        if (success) {
          setAssignedVMs(prev => prev.filter(id => id !== vmId));
          toast({
            title: "VM Removed",
            description: `VM removed from ${user.username}'s access`,
          });
        }
      } else {
        // Add VM
        success = await userService.assignVMToUser(id, vmId);
        if (success) {
          setAssignedVMs(prev => [...prev, vmId]);
          toast({
            title: "VM Assigned",
            description: `VM assigned to ${user.username}`,
          });
        }
      }
      
      // Refresh user data
      if (success) {
        const updatedUser = await userService.getUserById(id);
        if (updatedUser) {
          setUser(updatedUser);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update VM assignment",
        variant: "destructive"
      });
    }
  };
  
  if (loading) {
    return (
      <MainLayout title="VM Assignment">
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    return (
      <MainLayout title="VM Assignment">
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">User Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested user could not be found.</p>
            <Button onClick={() => navigate('/users')}>Back to Users</Button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={`VM Assignment - ${user.username}`}>
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/users')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold">{user.username}'s Virtual Machines</h2>
              <p className="text-muted-foreground mt-1">
                Assign or remove virtual machines for this user
              </p>
            </div>
            <Button variant="outline" onClick={() => window.location.reload()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Virtual Machine Access</CardTitle>
            <CardDescription>
              Select the virtual machines this user is allowed to access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Access</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>OS</TableHead>
                  <TableHead>CPU/Memory</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allVMs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No virtual machines available
                    </TableCell>
                  </TableRow>
                ) : (
                  allVMs.map((vm) => (
                    <TableRow key={vm.id}>
                      <TableCell>
                        <Checkbox 
                          checked={assignedVMs.includes(vm.id)}
                          onCheckedChange={() => handleToggleVM(vm.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{vm.name}</TableCell>
                      <TableCell>
                        <VMStatusBadge status={mapVMStatus(vm.status)} />
                      </TableCell>
                      <TableCell>{vm.os}</TableCell>
                      <TableCell>
                        {vm.cpu} vCPU / {vm.memory} GB
                      </TableCell>
                      <TableCell>
                        {vm.ipAddress || "Not available"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default UserVMAssignment;
