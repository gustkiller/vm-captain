
import { UserRole, UserType } from '@/types/vm';

// Simulate database using in-memory storage with sessionStorage persistence
class DatabaseService {
  private users: UserType[] = [
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
  
  constructor() {
    // Initialize database
    this.initializeDatabase();
  }
  
  private initializeDatabase() {
    // Load data from sessionStorage to simulate persistence between page refreshes
    try {
      const storedUsers = sessionStorage.getItem('db_users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      } else {
        // Initialize with default users if no stored users exist
        sessionStorage.setItem('db_users', JSON.stringify(this.users));
      }
    } catch (error) {
      console.error('Error initializing database:', error);
    }
  }
  
  private saveDatabase() {
    try {
      sessionStorage.setItem('db_users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }
  
  getUserByCredentials(username: string, password: string): UserType | null {
    return this.users.find(u => u.username === username && u.password === password) || null;
  }
  
  getAllUsers(): UserType[] {
    return [...this.users];
  }
  
  getUserById(id: string): UserType | null {
    return this.users.find(u => u.id === id) || null;
  }
  
  addUser(user: UserType): boolean {
    if (this.users.some(u => u.username === user.username)) {
      return false; // User already exists
    }
    
    this.users.push(user);
    this.saveDatabase();
    return true;
  }
  
  updateUser(user: UserType): boolean {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index === -1) return false;
    
    this.users[index] = user;
    this.saveDatabase();
    return true;
  }
  
  deleteUser(id: string): boolean {
    const initialLength = this.users.length;
    this.users = this.users.filter(u => u.id !== id);
    
    if (this.users.length < initialLength) {
      this.saveDatabase();
      return true;
    }
    
    return false;
  }
  
  updateUserPassword(id: string, newPassword: string): boolean {
    const user = this.getUserById(id);
    if (!user) return false;
    
    user.password = newPassword;
    return this.updateUser(user);
  }
  
  assignVMToUser(userId: string, vmId: string): boolean {
    const user = this.getUserById(userId);
    if (!user) return false;
    
    if (!user.assignedVMs) {
      user.assignedVMs = [];
    }
    
    if (!user.assignedVMs.includes(vmId)) {
      user.assignedVMs.push(vmId);
      return this.updateUser(user);
    }
    
    return true;
  }
  
  removeVMFromUser(userId: string, vmId: string): boolean {
    const user = this.getUserById(userId);
    if (!user || !user.assignedVMs) return false;
    
    user.assignedVMs = user.assignedVMs.filter(id => id !== vmId);
    return this.updateUser(user);
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
