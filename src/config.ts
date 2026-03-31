import envPaths from 'env-paths';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface OpencodeRemoteConfig {
  port: number;
  opencodeWebPort: number;
  password: string;
  autoStart: boolean;
  hostname: string;
  tailscaleOnly: boolean;
}

const CONFIG_DEFAULTS: OpencodeRemoteConfig = {
  port: 4097,
  opencodeWebPort: 4096,
  password: '',
  autoStart: true,
  hostname: '0.0.0.0',
  tailscaleOnly: false,
};

const paths = envPaths('opencode-remote');
const CONFIG_FILE = join(paths.config, 'config.json');

function ensureConfigDir(): void {
  if (!existsSync(paths.config)) {
    mkdirSync(paths.config, { recursive: true });
  }
}

export function loadConfig(): OpencodeRemoteConfig {
  try {
    ensureConfigDir();
    if (existsSync(CONFIG_FILE)) {
      const data = readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return { ...CONFIG_DEFAULTS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return { ...CONFIG_DEFAULTS };
}

export function saveConfig(config: Partial<OpencodeRemoteConfig>): OpencodeRemoteConfig {
  ensureConfigDir();
  const current = loadConfig();
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getLogsDir(): string {
  if (!existsSync(paths.data)) {
    mkdirSync(paths.data, { recursive: true });
  }
  return paths.data;
}

export function getLogFile(): string {
  return join(getLogsDir(), 'service.log');
}
