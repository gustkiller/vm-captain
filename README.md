
# VM Captain

A modern dashboard for managing and monitoring virtual machines using vCenter.

## Project info

**URL**: https://lovable.dev/projects/423970bf-8aa2-4cef-9311-2ef92474b130

## Docker Setup

This project includes a Docker configuration for easy deployment:

1. Create a `.env` file based on `.env.example`:
   ```sh
   cp .env.example .env
   ```

2. Edit the `.env` file with your vCenter credentials:
   ```
   VITE_VCENTER_URL=https://your-vcenter-server/sdk
   VITE_VCENTER_USERNAME=administrator@vsphere.local
   VITE_VCENTER_PASSWORD=your-secure-password
   VITE_VCENTER_IGNORE_SSL=true
   ```

3. Build and run the Docker container:
   ```sh
   docker-compose up -d
   ```

4. Access the application at http://localhost:8844

## Development Setup

If you want to work locally using your own IDE, you can clone this repo and push changes:

```sh
# Step 1: Clone the repository
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies
npm i

# Step 4: Create and configure .env file
cp .env.example .env
# Edit .env with your vCenter credentials

# Step 5: Start the development server
npm run dev
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Docker for production deployment

## vCenter Integration

The application connects to vCenter using the credentials provided in the `.env` file. To configure your vCenter connection:

1. Ensure you have valid vCenter administrator credentials
2. Update the `.env` file with your vCenter URL, username, and password
3. Set `VITE_VCENTER_IGNORE_SSL=true` if you want to ignore SSL certificate validation (only for development)

## Deployment

To deploy to production:

1. Build the Docker image:
   ```sh
   docker build -t vm-captain .
   ```

2. Run the container:
   ```sh
   docker run -d -p 8844:80 --env-file .env vm-captain
   ```

## Custom Domain

We don't support custom domains (yet). If you want to deploy your project under your own domain then we recommend using Netlify. Visit our docs for more details: [Custom domains](https://docs.lovable.dev/tips-tricks/custom-domain/)
