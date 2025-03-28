import { UserType, UserRole, VMType } from '@/types/vm';
import { toast } from 'sonner';

class UserService {
  private currentUser: UserType | null = null;
  private baseUrl = '/api';
  private cachedUsers: UserType[] | null = null;

  constructor() {
    // Check for saved user session
    this.loadSession();
  }

  private loadSession() {
    try {
      const storedCurrentUser = localStorage.getItem('currentUser');
      if (storedCurrentUser) {
        this.currentUser = JSON.parse(storedCurrentUser);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
      this.currentUser = null;
    }
  }

  private saveSession() {
    try {
      if (this.currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          console.warn("API not available, using mock login");
          return this.mockLogin(username, password);
        }
        
        const errorData = await response.json();
        console.error('Login failed:', errorData.error);
        return false;
      }

      const user = await response.json();
      this.currentUser = user;
      this.saveSession();
      return true;
    } catch (error) {
      console.error('Login error, using mock login:', error);
      return this.mockLogin(username, password);
    }
  }

  private mockLogin(username: string, password: string): boolean {
    if (username === 'admin' && password === '123456') {
      this.currentUser = {
        id: 'admin-1',
        username: 'admin',
        role: UserRole.ADMIN,
        assignedVMs: []
      };
      this.saveSession();
      return true;
    } else if (username === 'user' && password === '123456') {
      this.currentUser = {
        id: 'user-1',
        username: 'user',
        role: UserRole.USER,
        assignedVMs: []
      };
      this.saveSession();
      return true;
    }
    return false;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    if (!this.currentUser) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Change password failed:', errorData.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Change password error:', error);
      return false;
    }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): UserType | null {
    return this.currentUser;
  }

  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  async getAllUsers(): Promise<UserType[]> {
    if (!this.isAdmin() || !this.currentUser) {
      return [];
    }

    if (this.cachedUsers) {
      return this.cachedUsers;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          console.warn("API not available, using mock users");
          return this.getMockUsers();
        }
        
        const errorData = await response.json();
        console.error('Get users failed:', errorData.error);
        return [];
      }

      const users = await response.json();
      this.cachedUsers = users;
      return users;
    } catch (error) {
      console.error('Get users error, using mock data:', error);
      return this.getMockUsers();
    }
  }

  getSyncUsers(): UserType[] {
    return this.cachedUsers || [];
  }

  async getUserById(id: string): Promise<UserType | null> {
    if (!this.isAdmin() || !this.currentUser) {
      return null;
    }

    if (this.cachedUsers) {
      const cachedUser = this.cachedUsers.find(u => u.id === id);
      if (cachedUser) return cachedUser;
    }

    try {
      const users = await this.getAllUsers();
      return users.find(u => u.id === id) || null;
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }

  async assignVMToUser(userId: string, vmId: string): Promise<boolean> {
    if (!this.isAdmin() || !this.currentUser) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/vms/${vmId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Assign VM failed:', errorData.error);
        return false;
      }

      this.cachedUsers = null;
      return true;
    } catch (error) {
      console.error('Assign VM error:', error);
      return false;
    }
  }

  async removeVMFromUser(userId: string, vmId: string): Promise<boolean> {
    if (!this.isAdmin() || !this.currentUser) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}/vms/${vmId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Remove VM failed:', errorData.error);
        return false;
      }

      this.cachedUsers = null;
      return true;
    } catch (error) {
      console.error('Remove VM error:', error);
      return false;
    }
  }

  getAssignedVMs(vms: VMType[]): VMType[] {
    if (!this.currentUser) {
      return [];
    }

    if (this.isAdmin()) {
      return vms;
    }

    if (!this.currentUser.assignedVMs) {
      return [];
    }

    return vms.filter(vm => this.currentUser?.assignedVMs?.includes(vm.id));
  }

  async addUser(username: string, password: string, role: UserRole): Promise<UserType | null> {
    if (!this.isAdmin() || !this.currentUser) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
        body: JSON.stringify({ username, password, role }),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          console.warn("API not available, using mock user creation");
          return this.mockAddUser(username, password, role);
        }
        
        const errorData = await response.json();
        console.error('Add user failed:', errorData.error);
        return null;
      }

      this.cachedUsers = null;
      
      return await response.json();
    } catch (error) {
      console.error('Add user error, using mock data:', error);
      return this.mockAddUser(username, password, role);
    }
  }

  private mockAddUser(username: string, password: string, role: UserRole): UserType | null {
    const existingUsers = this.cachedUsers || this.getMockUsers();
    if (existingUsers.some(u => u.username === username)) {
      return null;
    }
    
    const newUser: UserType = {
      id: `user-${Date.now()}`,
      username,
      role,
      assignedVMs: []
    };
    
    this.cachedUsers = [...existingUsers, newUser];
    return newUser;
  }

  async removeUser(userId: string): Promise<boolean> {
    if (!this.isAdmin() || !this.currentUser) {
      return false;
    }

    if (this.currentUser.id === userId) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 0) {
          console.warn("API not available, using mock user removal");
          return this.mockRemoveUser(userId);
        }
        
        const errorData = await response.json();
        console.error('Remove user failed:', errorData.error);
        return false;
      }

      this.cachedUsers = null;
      
      return true;
    } catch (error) {
      console.error('Remove user error, using mock data:', error);
      return this.mockRemoveUser(userId);
    }
  }

  private mockRemoveUser(userId: string): boolean {
    if (!this.cachedUsers) {
      this.cachedUsers = this.getMockUsers();
    }
    
    const initialLength = this.cachedUsers.length;
    this.cachedUsers = this.cachedUsers.filter(u => u.id !== userId);
    
    return this.cachedUsers.length < initialLength;
  }

  private getMockUsers(): UserType[] {
    const mockUsers: UserType[] = [
      {
        id: 'admin-1',
        username: 'admin',
        role: UserRole.ADMIN,
        assignedVMs: []
      },
      {
        id: 'user-1',
        username: 'user',
        role: UserRole.USER,
        assignedVMs: []
      }
    ];
    this.cachedUsers = mockUsers;
    return mockUsers;
  }
}

export const userService = new UserService();
