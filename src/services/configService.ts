
interface ConfigType {
  vCenter: {
    url: string;
    username: string;
    password: string;
    ignoreSSL: boolean;
  };
  environment: 'development' | 'production' | 'test';
}

// Read from environment variables
const config: ConfigType = {
  vCenter: {
    url: import.meta.env.VITE_VCENTER_URL || '',
    username: import.meta.env.VITE_VCENTER_USERNAME || '',
    password: import.meta.env.VITE_VCENTER_PASSWORD || '',
    ignoreSSL: import.meta.env.VITE_VCENTER_IGNORE_SSL === 'true' || false
  },
  environment: (import.meta.env.NODE_ENV as 'development' | 'production' | 'test') || 'production'
};

// Validate config
if (!config.vCenter.url || !config.vCenter.username || !config.vCenter.password) {
  console.error('Missing vCenter configuration. Please check your environment variables.');
}

export default config;
