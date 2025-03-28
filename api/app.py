
import os
import ssl
import json
import atexit
from flask import Flask, request, jsonify
from flask_cors import CORS
from pyVim.connect import SmartConnect, Disconnect
from pyVmomi import vim
import random
import time
from dotenv import load_dotenv
import db_models as db

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Store active sessions
sessions = {}

@app.route('/', methods=['GET'])
def index():
    """Root endpoint to verify API is running"""
    return jsonify({
        'status': 'ok',
        'message': 'VM Captain API is running'
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok', 
        'message': 'API is running',
        'environment': {
            'VCENTER_URL': os.environ.get('VITE_VCENTER_URL', 'Not set'),
            'VCENTER_USERNAME': os.environ.get('VITE_VCENTER_USERNAME', 'Not set'),
            'VCENTER_IGNORE_SSL': os.environ.get('VITE_VCENTER_IGNORE_SSL', 'Not set'),
            'PORT': os.environ.get('PORT', '5000')
        }
    })

# User management endpoints
@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate a user"""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    user = db.get_user_by_credentials(username, password)
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Don't send password to client
    if 'password' in user:
        del user['password']
    
    return jsonify(user)

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users (admin only)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    user_id = auth_header.split(' ')[1]
    user = db.get_user_by_id(user_id)
    
    if not user or user['role'] != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    users = db.get_all_users()
    
    # Don't send passwords to client
    for u in users:
        if 'password' in u:
            del u['password']
    
    return jsonify(users)

@app.route('/api/users', methods=['POST'])
def add_user():
    """Add a new user (admin only)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    user_id = auth_header.split(' ')[1]
    admin = db.get_user_by_id(user_id)
    
    if not admin or admin['role'] != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    new_user = {
        'id': f"user-{int(time.time())}",
        'username': data.get('username'),
        'password': data.get('password'),
        'role': data.get('role'),
        'assigned_vms': []
    }
    
    if not new_user['username'] or not new_user['password'] or not new_user['role']:
        return jsonify({'error': 'Username, password, and role are required'}), 400
    
    success = db.add_user(new_user)
    
    if not success:
        return jsonify({'error': 'Username already exists'}), 400
    
    # Don't send password back to client
    del new_user['password']
    
    return jsonify(new_user), 201

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete a user (admin only)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    admin_id = auth_header.split(' ')[1]
    admin = db.get_user_by_id(admin_id)
    
    if not admin or admin['role'] != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Prevent admin from deleting themselves
    if admin_id == user_id:
        return jsonify({'error': 'Cannot delete yourself'}), 400
    
    success = db.delete_user(user_id)
    
    if not success:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'message': 'User deleted successfully'})

@app.route('/api/users/password', methods=['PUT'])
def change_password():
    """Change a user's password"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    user_id = auth_header.split(' ')[1]
    user = db.get_user_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.json
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    if not current_password or not new_password:
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    # Verify current password
    if user['password'] != current_password:
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    success = db.update_user_password(user_id, new_password)
    
    if not success:
        return jsonify({'error': 'Failed to update password'}), 500
    
    return jsonify({'message': 'Password updated successfully'})

@app.route('/api/users/<user_id>/vms/<vm_id>', methods=['PUT'])
def assign_vm(user_id, vm_id):
    """Assign a VM to a user (admin only)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    admin_id = auth_header.split(' ')[1]
    admin = db.get_user_by_id(admin_id)
    
    if not admin or admin['role'] != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    success = db.assign_vm_to_user(user_id, vm_id)
    
    if not success:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'message': 'VM assigned successfully'})

@app.route('/api/users/<user_id>/vms/<vm_id>', methods=['DELETE'])
def remove_vm(user_id, vm_id):
    """Remove a VM from a user (admin only)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'error': 'Authorization header required'}), 401
    
    admin_id = auth_header.split(' ')[1]
    admin = db.get_user_by_id(admin_id)
    
    if not admin or admin['role'] != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    success = db.remove_vm_from_user(user_id, vm_id)
    
    if not success:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'message': 'VM removed successfully'})

# vCenter connection endpoints
@app.route('/vcenter/connect', methods=['POST'])
def connect():
    try:
        # Get connection parameters from request body or environment variables
        data = request.json
        url = data.get('url') or os.environ.get('VITE_VCENTER_URL')
        username = data.get('username') or os.environ.get('VITE_VCENTER_USERNAME')
        password = data.get('password') or os.environ.get('VITE_VCENTER_PASSWORD')
        ignore_ssl = data.get('ignore_ssl') or (os.environ.get('VITE_VCENTER_IGNORE_SSL') == 'true')
        
        app.logger.info(f"Connecting to vCenter at {url} with username {username}")
        
        if not url or not username or not password:
            app.logger.error("Missing required connection parameters")
            return jsonify({'error': 'Missing required connection parameters'}), 400
        
        # Parse hostname from URL
        import re
        hostname_match = re.search(r'https?://([^/]+)', url)
        if not hostname_match:
            app.logger.error(f"Invalid vCenter URL format: {url}")
            return jsonify({'error': 'Invalid vCenter URL format'}), 400
        
        hostname = hostname_match.group(1)
        app.logger.info(f"Parsed hostname: {hostname}")
        
        # Configure SSL context
        context = None
        if ignore_ssl:
            context = ssl._create_unverified_context()
        
        # Connect to vCenter
        app.logger.info("Attempting connection to vCenter...")
        service_instance = SmartConnect(
            host=hostname,
            user=username,
            pwd=password,
            sslContext=context
        )
        
        if not service_instance:
            app.logger.error("Failed to connect to vCenter - no service instance returned")
            return jsonify({'error': 'Failed to connect to vCenter - authentication failed'}), 500
        
        # Generate session ID
        session_id = f"session-{int(time.time())}-{random.randint(1000, 9999)}"
        sessions[session_id] = {
            'service_instance': service_instance,
            'created_at': time.time()
        }
        
        # Register cleanup function to disconnect all sessions when app stops
        atexit.register(cleanup_sessions)
        app.logger.info(f"Connection successful - created session {session_id}")
        
        return jsonify({'session_id': session_id})
    
    except Exception as e:
        app.logger.error(f"Connection error: {str(e)}")
        return jsonify({'error': f'Failed to connect to vCenter: {str(e)}'}), 500

@app.route('/vcenter/disconnect', methods=['POST'])
def disconnect():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized'}), 401
    
    session_id = auth_header.split(' ')[1]
    if session_id in sessions:
        try:
            Disconnect(sessions[session_id]['service_instance'])
            del sessions[session_id]
            return jsonify({'message': 'Disconnected successfully'})
        except Exception as e:
            return jsonify({'error': f'Failed to disconnect: {str(e)}'}), 500
    
    return jsonify({'message': 'Session not found'}), 404

@app.route('/vcenter/vms', methods=['GET'])
def get_vms():
    session = get_session_from_request()
    if not session:
        return jsonify({'error': 'Unauthorized or session expired'}), 401
    
    try:
        service_instance = session['service_instance']
        content = service_instance.RetrieveContent()
        
        # Get all VMs
        container = content.viewManager.CreateContainerView(
            content.rootFolder, [vim.VirtualMachine], True
        )
        
        vms = []
        for vm in container.view:
            # Only basic VM properties for list view
            power_state = str(vm.runtime.powerState) if vm.runtime and hasattr(vm.runtime, 'powerState') else 'UNKNOWN'
            app.logger.info(f"VM {vm.name} power state: {power_state}")
            
            vm_data = {
                'id': vm._moId,
                'name': vm.name,
                'power_state': power_state,
                'guest_full_name': vm.config.guestFullName if vm.config else 'Unknown',
            }
            
            # Add IP address if available
            if vm.guest and vm.guest.ipAddress:
                vm_data['ip_address'] = vm.guest.ipAddress
            
            # Get performance metrics if VM is powered on
            if vm.runtime.powerState == vim.VirtualMachine.PowerState.poweredOn:
                vm_data['cpu_usage'] = random.randint(5, 85)  # Simplified for demo
                vm_data['memory_usage'] = random.randint(10, 90)  # Simplified for demo
                vm_data['disk_usage'] = random.randint(20, 95)  # Simplified for demo
            else:
                vm_data['cpu_usage'] = 0
                vm_data['memory_usage'] = 0
                vm_data['disk_usage'] = 0
            
            vms.append(vm_data)
        
        container.Destroy()
        return jsonify(vms)
    
    except Exception as e:
        app.logger.error(f"Error retrieving VMs: {str(e)}")
        return jsonify({'error': f'Failed to retrieve VMs: {str(e)}'}), 500

# ... keep existing code (VM detail, power operations, and snapshots endpoints)

def get_session_from_request():
    """Get the session from the request's Authorization header."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    session_id = auth_header.split(' ')[1]
    if session_id in sessions:
        # Check if session has expired (24 hour expiration)
        if time.time() - sessions[session_id]['created_at'] > 86400:
            try:
                Disconnect(sessions[session_id]['service_instance'])
            except:
                pass
            del sessions[session_id]
            return None
        return sessions[session_id]
    
    return None

def cleanup_sessions():
    """Clean up all vCenter sessions."""
    for session_id in list(sessions.keys()):
        try:
            Disconnect(sessions[session_id]['service_instance'])
        except:
            pass
        del sessions[session_id]

if __name__ == '__main__':
    # Enable more detailed logging
    import logging
    logging.basicConfig(level=logging.INFO)
    app.logger.setLevel(logging.INFO)
    app.logger.info("Starting VM Captain API...")
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
