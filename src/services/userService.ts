
import { UserType, UserRole, VMType } from '@/types/vm';
import { toast } from 'sonner';

class UserService {
  private currentUser: UserType | null = null;
  private baseUrl = '/api';

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
        const errorData = await response.json();
        console.error('Login failed:', errorData.error);
        return false;
      }

      const user = await response.json();
      this.currentUser = user;
      this.saveSession();
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
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

    try {
      const response = await fetch(`${this.baseUrl}/users`, {
        headers: {
          'Authorization': `Bearer ${this.currentUser.id}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Get users failed:', errorData.error);
        return [];
      }

      return await response.json();
    } catch (error) {
      console.error('Get users error:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<UserType | null> {
    if (!this.isAdmin() || !this.currentUser) {
      return null;
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
        const errorData = await response.json();
        console.error('Add user failed:', errorData.error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Add user error:', error);
      return null;
    }
  }

  async removeUser(userId: string): Promise<boolean> {
    if (!this.isAdmin() || !this.currentUser) {
      return false;
    }

    // Prevent removal of current user
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
        const errorData = await response.json();
        console.error('Remove user failed:', errorData.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Remove user error:', error);
      return false;
    }
  }
}

// Singleton instance
export const userService = new UserService();
