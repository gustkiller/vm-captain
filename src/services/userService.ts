import { UserType, UserRole, VMType } from '@/types/vm';

// Mock user data for demonstration
const mockUsers: UserType[] = [
  {
    id: 'admin-1',
    username: 'admin',
    password: '123456',
    role: UserRole.ADMIN,
    assignedVMs: []
  },
  {
    id: 'user-1',
    username: 'user',
    password: '123456',
    role: UserRole.USER,
    assignedVMs: []
  }
];

class UserService {
  private currentUser: UserType | null = null;
  private users: UserType[] = [...mockUsers];

  constructor() {
    // Load from localStorage on initialization
    this.loadState();
  }

  private loadState() {
    try {
      const storedCurrentUser = localStorage.getItem('currentUser');
      const storedUsers = localStorage.getItem('users');
      
      if (storedCurrentUser) {
        this.currentUser = JSON.parse(storedCurrentUser);
      }
      
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        // Initialize with default users if no stored users exist
        this.users = [...mockUsers];
        localStorage.setItem('users', JSON.stringify(this.users));
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
      // Fallback to default users
      this.users = [...mockUsers];
    }
  }

  private saveState() {
    try {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      localStorage.setItem('users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving state to localStorage:', error);
    }
  }

  login(username: string, password: string): boolean {
    console.log(`Attempting login with: ${username}/${password}`);
    console.log('Available users:', this.users);
    
    const user = this.users.find(u => u.username === username && u.password === password);
    if (user) {
      this.currentUser = user;
      this.saveState();
      return true;
    }
    return false;
  }

  changePassword(currentPassword: string, newPassword: string): boolean {
    if (!this.currentUser) {
      return false;
    }
    
    // Verify current password
    const user = this.users.find(u => 
      u.id === this.currentUser?.id && 
      u.password === currentPassword
    );
    
    if (!user) {
      return false;
    }
    
    // Update password
    const userIndex = this.users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      this.users[userIndex].password = newPassword;
      this.currentUser.password = newPassword;
      this.saveState();
      return true;
    }
    
    return false;
  }

  logout(): void {
    this.currentUser = null;
    this.saveState();
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
    return this.users;
  }

  getUserById(id: string): UserType | null {
    if (!this.isAdmin()) {
      return null;
    }
    return this.users.find(u => u.id === id) || null;
  }

  assignVMToUser(userId: string, vmId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }

    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    const user = this.users[userIndex];
    if (!user.assignedVMs) {
      user.assignedVMs = [];
    }

    if (!user.assignedVMs.includes(vmId)) {
      user.assignedVMs.push(vmId);
      this.users[userIndex] = user;
      this.saveState();
    }

    return true;
  }

  removeVMFromUser(userId: string, vmId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }

    const userIndex = this.users.findIndex(u => u.id === userId);
    if (userIndex === -1 || !this.users[userIndex].assignedVMs) {
      return false;
    }

    this.users[userIndex].assignedVMs = this.users[userIndex].assignedVMs?.filter(id => id !== vmId);
    this.saveState();
    return true;
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

    if (this.users.some(u => u.username === username)) {
      return null; // User already exists
    }

    const newUser: UserType = {
      id: `user-${Date.now()}`,
      username,
      password,
      role,
      assignedVMs: []
    };

    this.users.push(newUser);
    this.saveState();
    return newUser;
  }

  removeUser(userId: string): boolean {
    if (!this.isAdmin()) {
      return false;
    }

    // Prevent removal of current user
    if (this.currentUser?.id === userId) {
      return false;
    }

    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== userId);
    
    if (this.users.length < initialLength) {
      this.saveState();
      return true;
    }
    
    return false;
  }

  resetToDefaults(): void {
    this.users = [...mockUsers];
    this.currentUser = null;
    this.saveState();
    console.log('User database reset to defaults');
  }
}

// Singleton instance
export const userService = new UserService();
