
#!/usr/bin/env python3

import sqlite3
import os
import sys

def reset_passwords():
    """Reset admin and user passwords to default"""
    db_file = os.environ.get('DB_FILE', '/app/data/vm_captain.db')
    
    if not os.path.exists(db_file):
        print(f"Database file not found: {db_file}")
        sys.exit(1)
    
    try:
        # Connect to SQLite database
        conn = sqlite3.connect(db_file)
        cursor = conn.cursor()
        
        # Reset admin password
        cursor.execute("UPDATE users SET password = '123456' WHERE username = 'admin'")
        admin_count = cursor.rowcount
        
        # Reset user password
        cursor.execute("UPDATE users SET password = '123456' WHERE username = 'user'")
        user_count = cursor.rowcount
        
        # Commit changes
        conn.commit()
        
        # Close connection
        conn.close()
        
        if admin_count > 0:
            print("Admin password reset to 123456")
        else:
            print("Admin user not found")
            
        if user_count > 0:
            print("User password reset to 123456")
        else:
            print("Standard user not found")
            
        print("Password reset completed.")
        
    except Exception as e:
        print(f"Error resetting passwords: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    reset_passwords()
