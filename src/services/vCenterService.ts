
import { VMType, VMStatus } from '@/types/vm';
import { SnapshotType } from '@/types/snapshot';

export class VCenterConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VCenterConnectionError';
  }
}

export interface VCenterCredentials {
  url: string;
  username: string;
  password: string;
  ignoreSSL?: boolean;
}

export class VCenterService {
  private credentials: VCenterCredentials;
  private apiBaseUrl = '/api'; // API endpoint via the nginx proxy
  private sessionId: string | null = null;

  constructor(credentials: VCenterCredentials) {
    this.credentials = credentials;
    console.log(`VCenterService initialized with URL: ${this.credentials.url}`);
  }

  /**
   * Connect to the vCenter API through our backend service
   */
  async connect(): Promise<void> {
    try {
      console.log(`Connecting to vCenter at ${this.credentials.url}`);
      
      // First check if the API is available
      try {
        const healthCheck = await fetch(`${this.apiBaseUrl}/health`);
        if (healthCheck.ok) {
          const healthData = await healthCheck.json();
          console.log('API health check:', healthData);
        } else {
          console.warn('API health check failed:', await healthCheck.text());
        }
      } catch (healthErr) {
        console.warn('Could not perform API health check:', healthErr);
      }
      
      // Now attempt to connect
      const response = await fetch(`${this.apiBaseUrl}/vcenter/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: this.credentials.url,
          username: this.credentials.username,
          password: this.credentials.password,
          ignore_ssl: this.credentials.ignoreSSL
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      this.sessionId = data.session_id;
      console.log('Connected to vCenter successfully');
    } catch (error) {
      console.error('Failed to connect to vCenter:', error);
      throw new VCenterConnectionError(`Failed to connect to vCenter: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of virtual machines from vCenter
   */
  async getVirtualMachines(): Promise<VMType[]> {
    if (!this.sessionId) {
      await this.connect();
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/vcenter/vms`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sessionId}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }

      const vms = await response.json();
      return vms.map(this.mapVMFromAPI);
    } catch (error) {
      console.error('Failed to fetch VMs:', error);
      throw new VCenterConnectionError(`Failed to fetch virtual machines: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get details for a specific VM
   */
  async getVirtualMachine(id: string): Promise<VMType | null> {
    if (!this.sessionId) {
      await this.connect();
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/vcenter/vms/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sessionId}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }

      const vm = await response.json();
      return this.mapVMFromAPI(vm);
    } catch (error) {
      console.error(`Failed to fetch VM ${id}:`, error);
      throw new VCenterConnectionError(`Failed to fetch VM details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get snapshots for a specific VM
   */
  async getSnapshots(id: string): Promise<SnapshotType[]> {
    if (!this.sessionId) {
      await this.connect();
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/vcenter/vms/${id}/snapshots`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.sessionId}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }

      const snapshots = await response.json();
      return snapshots;
    } catch (error) {
      console.error(`Failed to fetch snapshots for VM ${id}:`, error);
      throw new VCenterConnectionError(`Failed to fetch snapshots: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a snapshot for a specific VM
   */
  async createSnapshot(id: string, name: string, description: string = '', memory: boolean = false, quiesce: boolean = false): Promise<void> {
    if (!this.sessionId) {
      await this.connect();
    }
    
    try {
      const response = await fetch(`${this.apiBaseUrl}/vcenter/vms/${id}/snapshots`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sessionId}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          memory,
          quiesce
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`Failed to create snapshot for VM ${id}:`, error);
      throw new VCenterConnectionError(`Failed to create snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Power operations for VMs
   */
  async powerOperation(id: string, operation: 'start' | 'stop' | 'restart'): Promise<boolean> {
    if (!this.sessionId) {
      await this.connect();
    }
    
    try {
      console.log(`Performing ${operation} operation on VM ${id}`);
      
      const response = await fetch(`${this.apiBaseUrl}/vcenter/vms/${id}/power/${operation}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sessionId}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Unknown error';
        } catch (e) {
          errorMessage = `HTTP ${response.status}: ${errorText || 'No error details available'}`;
        }
        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      console.error(`Failed to ${operation} VM ${id}:`, error);
      throw new VCenterConnectionError(`Failed to ${operation} VM: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from the vCenter API
   */
  async disconnect(): Promise<void> {
    if (this.sessionId) {
      try {
        await fetch(`${this.apiBaseUrl}/vcenter/disconnect`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.sessionId}`,
          },
        });
        
        console.log('Disconnecting from vCenter');
      } catch (error) {
        console.error('Error during disconnect:', error);
      } finally {
        this.sessionId = null;
      }
    }
  }

  /**
   * Map API VM format to our internal format
   */
  private mapVMFromAPI(vmData: any): VMType {
    // Convert API response to our VMType
    let status: VMStatus = VMStatus.STOPPED;
    
    // Improved power state mapping to ensure status is correctly parsed
    const powerState = vmData.power_state?.toUpperCase();
    console.log(`VM ${vmData.name} has power state: ${powerState}`);
    
    switch(powerState) {
      case 'POWERED_ON':
      case 'POWEREDON':
        status = VMStatus.RUNNING;
        break;
      case 'POWERED_OFF':
      case 'POWEREDOFF':
        status = VMStatus.STOPPED;
        break;
      case 'SUSPENDED':
        status = VMStatus.SUSPENDED;
        break;
      default:
        // If power state exists but isn't recognized, mark as ERROR
        status = powerState ? VMStatus.ERROR : VMStatus.STOPPED;
    }

    return {
      id: vmData.id || vmData.vm || '',
      name: vmData.name || 'Unknown VM',
      description: vmData.description || '',
      status: status,
      os: vmData.guest_full_name || vmData.os || 'Unknown OS',
      cpu: vmData.num_cpu || vmData.cpu_count || 0,
      memory: vmData.memory_size_mb ? Math.round(vmData.memory_size_mb / 1024) : 0,
      cpuUsage: vmData.cpu_usage || 0,
      memoryUsage: vmData.memory_usage || 0,
      diskUsage: vmData.disk_usage || 0,
      ipAddress: vmData.ip_address || '',
      disks: vmData.disks || []
    };
  }
}

// Export a function that creates service instances
export const createVCenterService = (credentials: VCenterCredentials): VCenterService => {
  return new VCenterService(credentials);
};
