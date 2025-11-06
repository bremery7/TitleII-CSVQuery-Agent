import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SSO_CONFIG_FILE = path.join(DATA_DIR, 'sso-config.json');

export interface SSOConfig {
  enabled: boolean;
  provider: 'azure-ad' | null;
  azureAd?: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
  };
  localAuthEnabled: boolean;
  updatedAt: string;
  updatedBy?: string;
}

const defaultConfig: SSOConfig = {
  enabled: false,
  provider: null,
  localAuthEnabled: true,
  updatedAt: new Date().toISOString(),
};

// Ensure data directory exists
function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating data directory:', error);
    throw error;
  }
}

// Initialize SSO config file if it doesn't exist
function initializeSSOConfig() {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(SSO_CONFIG_FILE)) {
      console.log('Creating default SSO config file:', SSO_CONFIG_FILE);
      fs.writeFileSync(SSO_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
      console.log('Default SSO config created successfully');
    }
  } catch (error) {
    console.error('Error initializing SSO config:', error);
    throw error;
  }
}

// Load SSO config from file
export function loadSSOConfig(): SSOConfig {
  try {
    initializeSSOConfig();
    const data = fs.readFileSync(SSO_CONFIG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading SSO config:', error);
    return defaultConfig;
  }
}

// Save SSO config to file
export function saveSSOConfig(config: SSOConfig): void {
  try {
    ensureDataDir();
    config.updatedAt = new Date().toISOString();
    fs.writeFileSync(SSO_CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log('SSO config saved successfully');
  } catch (error) {
    console.error('Error saving SSO config:', error);
    throw new Error('Failed to save SSO configuration');
  }
}

// Update SSO config
export function updateSSOConfig(updates: Partial<SSOConfig>, updatedBy?: string): SSOConfig {
  const currentConfig = loadSSOConfig();
  const newConfig: SSOConfig = {
    ...currentConfig,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  saveSSOConfig(newConfig);
  return newConfig;
}

// Get Azure AD config if enabled
export function getAzureADConfig(): SSOConfig['azureAd'] | null {
  const config = loadSSOConfig();
  if (config.enabled && config.provider === 'azure-ad' && config.azureAd) {
    return config.azureAd;
  }
  return null;
}

// Check if local auth is enabled
export function isLocalAuthEnabled(): boolean {
  const config = loadSSOConfig();
  return config.localAuthEnabled;
}

// Check if SSO is enabled
export function isSSOEnabled(): boolean {
  const config = loadSSOConfig();
  return config.enabled;
}
