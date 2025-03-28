
// This file is not included in the main application bundle
// It's a standalone script to reset passwords in the database

// In a real application with a real SQLite database, you would run this script with Node.js
// This is a simulated version that shows how it would work

function resetPasswords() {
  console.log('Resetting admin and user passwords to defaults...');
  
  try {
    // For this simulated version, we directly modify sessionStorage
    // In a real application, this would connect to the SQLite database
    const storedUsers = sessionStorage.getItem('db_users');
    if (storedUsers) {
      const users = JSON.parse(storedUsers);
      
      // Find and update admin user
      const adminUser = users.find(u => u.username === 'admin');
      if (adminUser) {
        adminUser.password = '123456';
        console.log('Admin password reset to 123456');
      }
      
      // Find and update standard user
      const standardUser = users.find(u => u.username === 'user');
      if (standardUser) {
        standardUser.password = '123456';
        console.log('User password reset to 123456');
      }
      
      // Save changes back to sessionStorage
      sessionStorage.setItem('db_users', JSON.stringify(users));
      console.log('Passwords reset successfully.');
    } else {
      console.log('No user database found.');
    }
  } catch (error) {
    console.error('Error resetting passwords:', error);
  }
}

// To use this script, open your browser's developer console and run:
// resetPasswords()

// Export for potential use in admin tools
module.exports = { resetPasswords };
