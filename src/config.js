import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

const SERVICE_NAME = 'opencode-remote-ctrl';

const CONFIG_DEFAULTS = {
  port: 4097,
  opencodeWebPort: 4096,
  password: '',
  autoStart: true,
  hostname: '0.0.0.0',
  tailscaleOnly: false,
};

function getConfigDir() {
  return join(homedir(), '.config', SERVICE_NAME);
}

function getDataDir() {
  return join(homedir(), '.local', 'share', SERVICE_NAME);
}

const CONFIG_FILE = join(getConfigDir(), 'config.json');
const LOG_DIR = getDataDir();

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig() {
  try {
    ensureDir(getConfigDir());
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

export function saveConfig(config) {
  ensureDir(getConfigDir());
  const current = loadConfig();
  const updated = { ...current, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  return updated;
}

export function getConfigPath() {
  return CONFIG_FILE;
}

export function getLogsDir() {
  ensureDir(LOG_DIR);
  return LOG_DIR;
}

export function getLogFile() {
  return join(getLogsDir(), 'service.log');
}

export function getServiceName() {
  return SERVICE_NAME;
}
