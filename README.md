
# VM Captain

VM Captain is a web application for managing VMware vCenter virtual machines.

## Features

- Real-time VM monitoring and management
- Power operations (start, stop, restart)
- VM resource utilization metrics
- Responsive web interface

## Requirements

- Docker and Docker Compose
- Access to a VMware vCenter server
- PyVmomi Python library (installed automatically with Docker)

## Configuration

Copy the example environment file and modify it with your vCenter credentials:

```bash
cp .env.example .env
```

Edit the `.env` file and add your vCenter connection details:

```
VITE_VCENTER_URL=https://your-vcenter-server/sdk
VITE_VCENTER_USERNAME=administrator@vsphere.local
VITE_VCENTER_PASSWORD=your-password
VITE_VCENTER_IGNORE_SSL=true
```

## Deployment

### Using Docker Compose (Recommended)

1. Build and start the containers:

```bash
docker-compose up -d --build
```

2. Access the application:

```
http://your-server-ip:8844
```

### Manual Deployment

#### Backend (API)

1. Navigate to the api directory:

```bash
cd api
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the Flask API server:

```bash
gunicorn --bind 0.0.0.0:5000 app:app
```

#### Frontend

1. Install dependencies:

```bash
npm install
```

2. Build the production frontend:

```bash
npm run build
```

3. Serve the built files using a web server like Nginx.

## Troubleshooting

- Ensure that your vCenter credentials are correct in the `.env` file
- Check the Docker logs if you encounter issues:
  ```
  docker-compose logs
  ```
- Make sure port 8844 is not blocked by a firewall
- Check that your server can reach the vCenter server
- Verify API connectivity by accessing `http://your-server-ip:5000/health`

## Architecture

The application consists of two main components:

1. **Frontend**: React application that provides the user interface
2. **Backend API**: Flask application that communicates with vCenter using PyVmomi

All API calls to vCenter are proxied through the backend for security reasons.
