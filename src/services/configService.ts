
interface ConfigType {
  vCenter: {
    url: string;
    username: string;
    password: string;
    ignoreSSL: boolean;
  };
  environment: 'development' | 'production' | 'test';
}

// In a real app, these would be loaded from environment variables
// For now, we'll use default values with placeholders
const config: ConfigType = {
  vCenter: {
    url: import.meta.env.VITE_VCENTER_URL || 'https://your-vcenter-server/sdk',
    username: import.meta.env.VITE_VCENTER_USERNAME || 'administrator@vsphere.local',
    password: import.meta.env.VITE_VCENTER_PASSWORD || 'default-password',
    ignoreSSL: import.meta.env.VITE_VCENTER_IGNORE_SSL === 'true' || true
  },
  environment: (import.meta.env.NODE_ENV as 'development' | 'production' | 'test') || 'development'
};

export default config;
