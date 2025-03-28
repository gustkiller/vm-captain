
import sqlite3
import os
import json
from datetime import datetime

# Database file path
DB_FILE = os.environ.get('DB_FILE', '/app/data/vm_captain.db')

# Ensure the directory exists
os.makedirs(os.path.dirname(DB_FILE), exist_ok=True)

def dict_factory(cursor, row):
    """Convert database row to dictionary for easier JSON serialization"""
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

def get_db_connection():
    """Create a database connection and return it"""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = dict_factory
    return conn

def initialize_database():
    """Create tables if they don't exist"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        assigned_vms TEXT DEFAULT '[]'
    )
    ''')
    
    # Check if we need to add default users
    cursor.execute("SELECT COUNT(*) as count FROM users")
    result = cursor.fetchone()
    
    if result['count'] == 0:
        # Add default users
        default_users = [
            {
                'id': 'admin-1',
                'username': 'admin',
                'password': '123456',
                'role': 'ADMIN',
                'assigned_vms': json.dumps([])
            },
            {
                'id': 'user-1',
                'username': 'user',
                'password': '123456',
                'role': 'USER',
                'assigned_vms': json.dumps([])
            }
        ]
        
        for user in default_users:
            cursor.execute('''
            INSERT INTO users (id, username, password, role, assigned_vms)
            VALUES (?, ?, ?, ?, ?)
            ''', (user['id'], user['username'], user['password'], user['role'], user['assigned_vms']))
    
    conn.commit()
    conn.close()

def get_user_by_credentials(username, password):
    """Find a user by username and password"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, password))
    user = cursor.fetchone()
    
    conn.close()
    
    if user and 'assigned_vms' in user:
        user['assigned_vms'] = json.loads(user['assigned_vms'])
    
    return user

def get_all_users():
    """Return all users"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    
    conn.close()
    
    # Convert assigned_vms from JSON string to list
    for user in users:
        if 'assigned_vms' in user:
            user['assigned_vms'] = json.loads(user['assigned_vms'])
    
    return users

def get_user_by_id(user_id):
    """Find a user by ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    
    conn.close()
    
    if user and 'assigned_vms' in user:
        user['assigned_vms'] = json.loads(user['assigned_vms'])
    
    return user

def add_user(user):
    """Add a new user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if username exists
    cursor.execute('SELECT COUNT(*) as count FROM users WHERE username = ?', (user['username'],))
    result = cursor.fetchone()
    
    if result['count'] > 0:
        conn.close()
        return False
    
    # Convert assigned_vms list to JSON string
    assigned_vms_json = json.dumps(user.get('assigned_vms', []))
    
    try:
        cursor.execute('''
        INSERT INTO users (id, username, password, role, assigned_vms)
        VALUES (?, ?, ?, ?, ?)
        ''', (user['id'], user['username'], user['password'], user['role'], assigned_vms_json))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error adding user: {str(e)}")
        conn.close()
        return False

def update_user(user):
    """Update an existing user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute('SELECT COUNT(*) as count FROM users WHERE id = ?', (user['id'],))
    result = cursor.fetchone()
    
    if result['count'] == 0:
        conn.close()
        return False
    
    # Convert assigned_vms list to JSON string
    assigned_vms_json = json.dumps(user.get('assigned_vms', []))
    
    try:
        cursor.execute('''
        UPDATE users 
        SET username = ?, password = ?, role = ?, assigned_vms = ?
        WHERE id = ?
        ''', (user['username'], user['password'], user['role'], assigned_vms_json, user['id']))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        conn.close()
        return False

def delete_user(user_id):
    """Delete a user"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        result = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        return result
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        conn.close()
        return False

def update_user_password(user_id, new_password):
    """Update a user's password"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute('UPDATE users SET password = ? WHERE id = ?', (new_password, user_id))
        result = cursor.rowcount > 0
        
        conn.commit()
        conn.close()
        return result
    except Exception as e:
        print(f"Error updating password: {str(e)}")
        conn.close()
        return False

def assign_vm_to_user(user_id, vm_id):
    """Assign a VM to a user"""
    user = get_user_by_id(user_id)
    
    if not user:
        return False
    
    assigned_vms = user.get('assigned_vms', [])
    
    if vm_id not in assigned_vms:
        assigned_vms.append(vm_id)
        user['assigned_vms'] = assigned_vms
        return update_user(user)
    
    return True

def remove_vm_from_user(user_id, vm_id):
    """Remove a VM from a user"""
    user = get_user_by_id(user_id)
    
    if not user:
        return False
    
    assigned_vms = user.get('assigned_vms', [])
    
    if vm_id in assigned_vms:
        assigned_vms.remove(vm_id)
        user['assigned_vms'] = assigned_vms
        return update_user(user)
    
    return True

# Initialize database on module import
initialize_database()
