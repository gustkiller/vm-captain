
import { UserType, UserRole, VMType } from '@/types/vm';
import { dbService } from './dbService';

class UserService {
  private currentUser: UserType | null = null;

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

  login(username: string, password: string): boolean {
    const user = dbService.getUserByCredentials(username, password);
    if (user) {
      this.currentUser = user;
      this.saveSession();
      return true;
    }
    return false;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    
    // Verify current password
    const user = dbService.getUserByCredentials(this.currentUser.username, currentPassword);
    
    if (!user) {
      return false;
    }
    
    // Update password
    const success = dbService.updateUserPassword(user.id, newPassword);
    if (success) {
      // Update current user
      this.currentUser = dbService.getUserById(user.id);
      this.saveSession();
    }
    return success;
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

  getAllUsers(): UserType[] {
    if (!this.isAdmin()) {
      return [];
    }
    return dbService.getAllUsers();
  }

  getUserById(id: string): UserType | null {
    if (!this.isAdmin()) {
      return null;
    }
    return dbService.getUserById(id);
  }

  assignVMToUser(userId: string, vmId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }
    return dbService.assignVMToUser(userId, vmId);
  }

  removeVMFromUser(userId: string, vmId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }
    return dbService.removeVMFromUser(userId, vmId);
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

  addUser(username: string, password: string, role: UserRole): UserType | null {
    if (!this.isAdmin()) {
      return null;
    }

    const newUser: UserType = {
      id: `user-${Date.now()}`,
      username,
      password,
      role,
      assignedVMs: []
    };

    const success = dbService.addUser(newUser);
    return success ? newUser : null;
  }

  removeUser(userId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }

    // Prevent removal of current user
    if (this.currentUser?.id === userId) {
      return false;
    }
    
    return dbService.deleteUser(userId);
  }
}

// Singleton instance
export const userService = new UserService();
