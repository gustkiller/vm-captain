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
            vm_data = {
                'id': vm._moId,
                'name': vm.name,
                'power_state': str(vm.runtime.powerState),
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

@app.route('/vcenter/vms/<vm_id>', methods=['GET'])
def get_vm(vm_id):
    session = get_session_from_request()
    if not session:
        return jsonify({'error': 'Unauthorized or session expired'}), 401
    
    try:
        service_instance = session['service_instance']
        content = service_instance.RetrieveContent()
        
        # Find VM by its managed object ID
        vm = find_vm_by_id(content, vm_id)
        if not vm:
            return jsonify({'error': 'VM not found'}), 404
        
        # Detailed VM properties
        vm_data = {
            'id': vm._moId,
            'name': vm.name,
            'power_state': str(vm.runtime.powerState),
            'guest_full_name': vm.config.guestFullName if vm.config else 'Unknown',
            'description': vm.config.annotation if vm.config and vm.config.annotation else '',
            'num_cpu': vm.config.hardware.numCPU if vm.config and vm.config.hardware else 0,
            'memory_size_mb': vm.config.hardware.memoryMB if vm.config and vm.config.hardware else 0,
        }

        # Add IP address if available
        if vm.guest and vm.guest.ipAddress:
            vm_data['ip_address'] = vm.guest.ipAddress
        
        # Add disk information
        disks = []
        if vm.config and vm.config.hardware.device:
            for device in vm.config.hardware.device:
                if isinstance(device, vim.vm.device.VirtualDisk):
                    disk_info = {
                        'label': device.deviceInfo.label,
                        'size_gb': device.capacityInKB / 1024 / 1024,
                        'disk_mode': device.backing.diskMode if hasattr(device.backing, 'diskMode') else 'unknown',
                        'thin_provisioned': device.backing.thinProvisioned if hasattr(device.backing, 'thinProvisioned') else False
                    }
                    disks.append(disk_info)
        vm_data['disks'] = disks
        
        # Get performance metrics if VM is powered on
        if vm.runtime.powerState == vim.VirtualMachine.PowerState.poweredOn:
            try:
                # These are simplified metrics for demo purposes
                vm_data['cpu_usage'] = random.randint(5, 85)
                vm_data['memory_usage'] = random.randint(10, 90)
                vm_data['disk_usage'] = random.randint(20, 95)
            except Exception as e:
                app.logger.error(f"Error getting performance metrics: {str(e)}")
        else:
            vm_data['cpu_usage'] = 0
            vm_data['memory_usage'] = 0
            vm_data['disk_usage'] = 0
        
        return jsonify(vm_data)
    
    except Exception as e:
        app.logger.error(f"Error retrieving VM: {str(e)}")
        return jsonify({'error': f'Failed to retrieve VM: {str(e)}'}), 500

@app.route('/vcenter/vms/<vm_id>/power/<operation>', methods=['POST'])
def power_operation(vm_id, operation):
    if operation not in ['start', 'stop', 'restart']:
        return jsonify({'error': 'Invalid power operation'}), 400
    
    session = get_session_from_request()
    if not session:
        return jsonify({'error': 'Unauthorized or session expired'}), 401
    
    try:
        service_instance = session['service_instance']
        content = service_instance.RetrieveContent()
        
        # Find VM by its managed object ID
        vm = find_vm_by_id(content, vm_id)
        if not vm:
            return jsonify({'error': 'VM not found'}), 404
        
        # Perform power operation
        if operation == 'start':
            if vm.runtime.powerState != vim.VirtualMachine.PowerState.poweredOn:
                task = vm.PowerOnVM_Task()
                wait_for_task(task)
            return jsonify({'status': 'success', 'message': 'VM powered on successfully'})
        
        elif operation == 'stop':
            if vm.runtime.powerState != vim.VirtualMachine.PowerState.poweredOff:
                task = vm.PowerOffVM_Task()
                wait_for_task(task)
            return jsonify({'status': 'success', 'message': 'VM powered off successfully'})
        
        elif operation == 'restart':
            if vm.runtime.powerState == vim.VirtualMachine.PowerState.poweredOn:
                task = vm.RebootGuest()
                # RebootGuest doesn't return a task, so we wait a bit
                time.sleep(2)
            else:
                # If not powered on, power it on
                task = vm.PowerOnVM_Task()
                wait_for_task(task)
            return jsonify({'status': 'success', 'message': 'VM restarted successfully'})
    
    except Exception as e:
        app.logger.error(f"Power operation error: {str(e)}")
        return jsonify({'error': f'Failed to perform power operation: {str(e)}'}), 500

@app.route('/vcenter/vms/<vm_id>/snapshots', methods=['GET'])
def get_snapshots(vm_id):
    session = get_session_from_request()
    if not session:
        return jsonify({'error': 'Unauthorized or session expired'}), 401
    
    try:
        service_instance = session['service_instance']
        content = service_instance.RetrieveContent()
        
        # Find VM by its managed object ID
        vm = find_vm_by_id(content, vm_id)
        if not vm:
            return jsonify({'error': 'VM not found'}), 404
        
        # Get snapshots
        snapshots = []
        if vm.snapshot:
            snap_list = get_snapshots_recursive(vm.snapshot.rootSnapshotList)
            snapshots = snap_list
        
        return jsonify(snapshots)
    
    except Exception as e:
        app.logger.error(f"Error retrieving snapshots: {str(e)}")
        return jsonify({'error': f'Failed to retrieve snapshots: {str(e)}'}), 500

@app.route('/vcenter/vms/<vm_id>/snapshots', methods=['POST'])
def create_snapshot(vm_id):
    session = get_session_from_request()
    if not session:
        return jsonify({'error': 'Unauthorized or session expired'}), 401
    
    try:
        data = request.json
        name = data.get('name')
        description = data.get('description', '')
        memory = data.get('memory', False)
        quiesce = data.get('quiesce', False)
        
        if not name:
            return jsonify({'error': 'Snapshot name is required'}), 400
        
        service_instance = session['service_instance']
        content = service_instance.RetrieveContent()
        
        # Find VM by its managed object ID
        vm = find_vm_by_id(content, vm_id)
        if not vm:
            return jsonify({'error': 'VM not found'}), 404
        
        # Create snapshot
        task = vm.CreateSnapshot(name=name, description=description, memory=memory, quiesce=quiesce)
        wait_for_task(task)
        
        return jsonify({'status': 'success', 'message': 'Snapshot created successfully'})
    
    except Exception as e:
        app.logger.error(f"Error creating snapshot: {str(e)}")
        return jsonify({'error': f'Failed to create snapshot: {str(e)}'}), 500

def get_snapshots_recursive(snapshots):
    """Get all snapshots recursively."""
    snapshot_data = []
    for snapshot in snapshots:
        snap = {
            'id': snapshot.id,
            'name': snapshot.name,
            'description': snapshot.description,
            'create_time': snapshot.createTime.isoformat() if hasattr(snapshot, 'createTime') else None,
            'state': str(snapshot.state) if hasattr(snapshot, 'state') else None,
        }
        
        # Add children if any
        if hasattr(snapshot, 'childSnapshotList') and snapshot.childSnapshotList:
            snap['children'] = get_snapshots_recursive(snapshot.childSnapshotList)
        
        snapshot_data.append(snap)
    
    return snapshot_data

def find_vm_by_id(content, vm_id):
    """Find a VM by its managed object ID."""
    container = content.viewManager.CreateContainerView(
        content.rootFolder, [vim.VirtualMachine], True
    )
    for vm in container.view:
        if vm._moId == vm_id:
            container.Destroy()
            return vm
    container.Destroy()
    return None

def wait_for_task(task):
    """Wait for a vCenter task to finish."""
    while task.info.state == vim.TaskInfo.State.running:
        time.sleep(1)
    
    if task.info.state != vim.TaskInfo.State.success:
        raise Exception(task.info.error.msg)

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
