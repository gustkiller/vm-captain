
import { UserRole, UserType } from '@/types/vm';

// This service is now just a stub that shows SQLite is being used
// The actual database operations are handled by the backend API
class DatabaseService {
  constructor() {
    console.info('SQLite database is being used via backend API');
  }
  
  getUserByCredentials(username: string, password: string): UserType | null {
    console.warn('This method is deprecated. Use userService.login instead.');
    return null;
  }
  
  getAllUsers(): UserType[] {
    console.warn('This method is deprecated. Use userService.getAllUsers instead.');
    return [];
  }
  
  getUserById(id: string): UserType | null {
    console.warn('This method is deprecated. Use userService.getUserById instead.');
    return null;
  }
  
  addUser(user: UserType): boolean {
    console.warn('This method is deprecated. Use userService.addUser instead.');
    return false;
  }
  
  updateUser(user: UserType): boolean {
    console.warn('This method is deprecated. Use userService.updateUser instead.');
    return false;
  }
  
  deleteUser(id: string): boolean {
    console.warn('This method is deprecated. Use userService.removeUser instead.');
    return false;
  }
  
  updateUserPassword(id: string, newPassword: string): boolean {
    console.warn('This method is deprecated. Use userService.changePassword instead.');
    return false;
  }
  
  assignVMToUser(userId: string, vmId: string): boolean {
    console.warn('This method is deprecated. Use userService.assignVMToUser instead.');
    return false;
  }
  
  removeVMFromUser(userId: string, vmId: string): boolean {
    console.warn('This method is deprecated. Use userService.removeVMFromUser instead.');
    return false;
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
