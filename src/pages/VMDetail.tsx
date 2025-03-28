
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { VMType } from '@/types/vm';
import { SnapshotType } from '@/types/snapshot';
import { VCenterService, createVCenterService } from '@/services/vCenterService';
import config from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Play, 
  PowerOff, 
  RefreshCw, 
  ArrowLeft, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Clock,
  PlusSquare
} from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { VMStatusBadge } from '@/components/vm/VMStatusBadge';
import { useForm } from 'react-hook-form';

const VMDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [vm, setVM] = useState<VMType | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [snapshotForm, setSnapshotForm] = useState({
    name: '',
    description: '',
    memory: false,
    quiesce: false
  });
  
  useEffect(() => {
    const fetchVMDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const vcenterService = createVCenterService({
          url: config.vCenter.url,
          username: config.vCenter.username,
          password: config.vCenter.password,
          ignoreSSL: config.vCenter.ignoreSSL
        });

        await vcenterService.connect();
        const fetchedVM = await vcenterService.getVirtualMachine(id);
        if (fetchedVM) {
          setVM(fetchedVM);
          
          // Fetch snapshots
          setSnapshotLoading(true);
          try {
            const snapshots = await vcenterService.getSnapshots(id);
            setSnapshots(snapshots);
          } catch (snapErr) {
            console.error('Failed to fetch snapshots:', snapErr);
            toast({
              variant: 'destructive',
              title: 'Error fetching snapshots',
              description: snapErr instanceof Error ? snapErr.message : 'Unknown error'
            });
          } finally {
            setSnapshotLoading(false);
          }
        } else {
          setError('VM not found');
          toast({
            variant: 'destructive',
            title: 'VM Not Found',
            description: 'The requested virtual machine could not be found'
          });
        }
      } catch (err) {
        console.error('Failed to fetch VM details:', err);
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

    fetchVMDetails();
  }, [id, toast]);
  
  const handlePowerAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!id || !vm) return;
    
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
        description: `The VM "${vm.name}" has been ${action}ed successfully.`,
      });
      
      // Refresh VM data
      const updatedVM = await vcenterService.getVirtualMachine(id);
      if (updatedVM) {
        setVM(updatedVM);
      }
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
  
  const handleCreateSnapshot = async () => {
    if (!id || !vm) return;
    
    if (!snapshotForm.name) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Snapshot name is required'
      });
      return;
    }
    
    setIsCreatingSnapshot(true);
    try {
      const vcenterService = createVCenterService({
        url: config.vCenter.url,
        username: config.vCenter.username,
        password: config.vCenter.password,
        ignoreSSL: config.vCenter.ignoreSSL
      });
      
      await vcenterService.connect();
      await vcenterService.createSnapshot(
        id, 
        snapshotForm.name, 
        snapshotForm.description, 
        snapshotForm.memory, 
        snapshotForm.quiesce
      );
      
      toast({
        title: 'Snapshot Created',
        description: `Snapshot "${snapshotForm.name}" has been created successfully.`,
      });
      
      // Reset form
      setSnapshotForm({
        name: '',
        description: '',
        memory: false,
        quiesce: false
      });
      
      // Refresh snapshots
      const refreshedSnapshots = await vcenterService.getSnapshots(id);
      setSnapshots(refreshedSnapshots);
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Snapshot',
        description: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`
      });
    } finally {
      setIsCreatingSnapshot(false);
    }
  };
  
  if (loading) {
    return (
      <MainLayout title="VM Details">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading VM details...</span>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !vm) {
    return (
      <MainLayout title="VM Details">
        <div className="space-y-4">
          <Button variant="outline" onClick={() => navigate('/virtual-machines')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to VMs
          </Button>
          
          <div className="rounded-md bg-destructive/15 p-4 text-center">
            <p className="text-destructive font-medium">Failed to load VM details</p>
            <p className="text-sm mt-1">{error || 'VM not found'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={vm.name}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => navigate('/virtual-machines')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to VMs
          </Button>
          
          <div className="space-x-2">
            <Button 
              size="sm" 
              variant={vm.status === VMStatus.RUNNING ? 'destructive' : 'default'}
              onClick={() => handlePowerAction(vm.status === VMStatus.RUNNING ? 'stop' : 'start')}
              disabled={vm.status === VMStatus.ERROR || isLoading}
            >
              {vm.status === VMStatus.RUNNING ? (
                <><PowerOff className="mr-2 h-4 w-4" /> Stop</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Start</>
              )}
            </Button>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handlePowerAction('restart')}
              disabled={vm.status !== VMStatus.RUNNING || isLoading}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Restart
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card className="md:col-span-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>{vm.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{vm.os}</p>
              </div>
              <VMStatusBadge status={vm.status.toLowerCase() as any} />
            </CardHeader>
            <CardContent>
              {vm.description && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">{vm.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center">
                  <Cpu className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{vm.cpu} vCPUs</p>
                    <div className="flex items-center mt-1">
                      <Progress value={vm.cpuUsage} className="h-2 w-24" />
                      <span className="text-xs ml-2">{vm.cpuUsage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MemoryStick className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{vm.memory} GB RAM</p>
                    <div className="flex items-center mt-1">
                      <Progress value={vm.memoryUsage} className="h-2 w-24" />
                      <span className="text-xs ml-2">{vm.memoryUsage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <HardDrive className="h-5 w-5 mr-2 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Storage</p>
                    <div className="flex items-center mt-1">
                      <Progress value={vm.diskUsage} className="h-2 w-24" />
                      <span className="text-xs ml-2">{vm.diskUsage}%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="disks">
                <TabsList>
                  <TabsTrigger value="disks">Disks</TabsTrigger>
                  <TabsTrigger value="snapshots">Snapshots</TabsTrigger>
                </TabsList>
                
                <TabsContent value="disks" className="mt-4">
                  {vm.disks && vm.disks.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Label</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Mode</TableHead>
                            <TableHead>Provisioning</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {vm.disks.map((disk, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{disk.label}</TableCell>
                              <TableCell>{disk.size_gb.toFixed(2)} GB</TableCell>
                              <TableCell>{disk.disk_mode}</TableCell>
                              <TableCell>{disk.thin_provisioned ? 'Thin' : 'Thick'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No disk information available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="snapshots" className="mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">VM Snapshots</h3>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <PlusSquare className="mr-2 h-4 w-4" />
                          Create Snapshot
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Snapshot</DialogTitle>
                          <DialogDescription>
                            Create a point-in-time snapshot of this virtual machine.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="snapshot-name">Name</Label>
                            <Input 
                              id="snapshot-name" 
                              placeholder="Snapshot name" 
                              value={snapshotForm.name} 
                              onChange={e => setSnapshotForm({...snapshotForm, name: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="snapshot-description">Description (optional)</Label>
                            <Input 
                              id="snapshot-description" 
                              placeholder="Snapshot description" 
                              value={snapshotForm.description} 
                              onChange={e => setSnapshotForm({...snapshotForm, description: e.target.value})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="snapshot-memory" 
                                checked={snapshotForm.memory}
                                onCheckedChange={(checked) => 
                                  setSnapshotForm({...snapshotForm, memory: !!checked})
                                }
                              />
                              <Label htmlFor="snapshot-memory">Include memory state</Label>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="snapshot-quiesce" 
                                checked={snapshotForm.quiesce}
                                onCheckedChange={(checked) => 
                                  setSnapshotForm({...snapshotForm, quiesce: !!checked})
                                }
                              />
                              <Label htmlFor="snapshot-quiesce">Quiesce guest file system (requires VMware tools)</Label>
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setSnapshotForm({
                            name: '',
                            description: '',
                            memory: false,
                            quiesce: false
                          })}>
                            Cancel
                          </Button>
                          <Button onClick={handleCreateSnapshot} disabled={isCreatingSnapshot}>
                            {isCreatingSnapshot ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create'
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {snapshotLoading ? (
                    <div className="flex justify-center items-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2">Loading snapshots...</span>
                    </div>
                  ) : snapshots.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>State</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {snapshots.map((snapshot) => (
                            <TableRow key={snapshot.id}>
                              <TableCell className="font-medium">{snapshot.name}</TableCell>
                              <TableCell>{snapshot.description || '-'}</TableCell>
                              <TableCell>
                                {snapshot.create_time ? new Date(snapshot.create_time).toLocaleString() : '-'}
                              </TableCell>
                              <TableCell>{snapshot.state || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">No snapshots have been created for this VM</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default VMDetail;
