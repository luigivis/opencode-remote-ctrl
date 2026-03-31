import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { loadConfig, getLogFile, getLogsDir, getServiceName } from './config.js';
import { getTailscaleIP } from './tailscale.js';

const c = {
  r: '\x1b[31m',
  g: '\x1b[32m',
  y: '\x1b[33m',
  b: '\x1b[34m',
  c: '\x1b[36m',
  bold: '\x1b[1m',
  gray: '\x1b[90m',
  reset: '\x1b[0m',
};

const color = (msg, col) => c[col[0]] + msg + c.reset;
const log = (msg, col) => console.log(color(msg, col || 'reset'));

const SERVICE_NAME = getServiceName();
const SERVICE_DIR = join(homedir(), '.config', 'systemd', 'user');
const SERVICE_FILE = join(getLogsDir(), `${SERVICE_NAME}.service`);

function getServiceDefinition() {
  const config = loadConfig();
  const logFile = getLogFile();
  
  return `[Unit]
Description=opencode-remote service
After=network.target

[Service]
Type=simple
ExecStart=${homedir()}/.opencode/bin/opencode web --hostname ${config.hostname} --port ${config.opencodeWebPort}
Environment=OPENCODE_SERVER_PASSWORD=${config.password}
WorkingDirectory=%h
Restart=always
RestartSec=5
StandardOutput=append:${logFile}
StandardError=append:${logFile}

[Install]
WantedBy=default.target
`;
}

export function isSystemdUserServiceInstalled() {
  try {
    execSync('systemctl --user list-unit-files', { stdio: 'ignore' });
    return existsSync(join(SERVICE_DIR, `${SERVICE_NAME}.service`));
  } catch {
    return false;
  }
}

export function installService() {
  try {
    if (!existsSync(SERVICE_DIR)) {
      execSync(`mkdir -p "${SERVICE_DIR}"`);
    }
    
    const serviceContent = getServiceDefinition();
    writeFileSync(SERVICE_FILE, serviceContent, 'utf-8');
    
    execSync(`ln -sf "${SERVICE_FILE}" "${SERVICE_DIR}/${SERVICE_NAME}.service"`, { stdio: 'ignore' });
    execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
    
    log('✓ Service installed successfully', 'g');
    return true;
  } catch (error) {
    log('✗ Failed to install service: ' + error, 'r');
    return false;
  }
}

export function uninstallService() {
  try {
    const servicePath = join(SERVICE_DIR, `${SERVICE_NAME}.service`);
    
    if (existsSync(servicePath)) {
      execSync(`systemctl --user stop ${SERVICE_NAME} 2>/dev/null`, { stdio: 'ignore' });
      execSync(`rm -f "${servicePath}"`, { stdio: 'ignore' });
      execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
    }
    
    log('✓ Service uninstalled successfully', 'g');
    return true;
  } catch (error) {
    log('✗ Failed to uninstall service: ' + error, 'r');
    return false;
  }
}

export function startService() {
  try {
    if (!isSystemdUserServiceInstalled()) {
      installService();
    }
    
    execSync(`systemctl --user start ${SERVICE_NAME}`, { stdio: 'ignore' });
    execSync(`systemctl --user enable ${SERVICE_NAME}`, { stdio: 'ignore' });
    
    log('✓ Service started', 'g');
    return true;
  } catch (error) {
    log('✗ Failed to start service: ' + error, 'r');
    return false;
  }
}

export function stopService() {
  try {
    execSync(`systemctl --user stop ${SERVICE_NAME} 2>/dev/null`, { stdio: 'ignore' });
    log('✓ Service stopped', 'g');
    return true;
  } catch (error) {
    log('✗ Failed to stop service: ' + error, 'r');
    return false;
  }
}

export function restartService() {
  try {
    execSync(`systemctl --user restart ${SERVICE_NAME}`, { stdio: 'ignore' });
    log('✓ Service restarted', 'g');
    return true;
  } catch (error) {
    log('✗ Failed to restart service: ' + error, 'r');
    return false;
  }
}

export function getServiceStatus() {
  let status = {
    isInstalled: false,
    isActive: false,
    isRunning: false,
    pid: null,
  };
  
  try {
    status.isInstalled = isSystemdUserServiceInstalled();
    
    if (status.isInstalled) {
      const activeOutput = execSync(`systemctl --user is-active ${SERVICE_NAME} 2>/dev/null`, { encoding: 'utf-8' });
      status.isActive = activeOutput.trim() === 'active';
      
      const runningOutput = execSync(`systemctl --user is-enabled ${SERVICE_NAME} 2>/dev/null`, { encoding: 'utf-8' });
      status.isRunning = runningOutput.trim() === 'enabled';
    }
  } catch {
    // Service not installed or not running
  }
  
  return status;
}

export async function showServiceStatus() {
  const status = getServiceStatus();
  const config = loadConfig();
  const tailscaleIP = await getTailscaleIP();
  
  console.log('');
  console.log('┌─────────────────────────────────────────┐');
  console.log('│    opencode-remote Status               │');
  console.log('└─────────────────────────────────────────┘');
  console.log('');
  
  console.log('  Service Installed:  ' + (status.isInstalled ? color('Yes', 'g') : color('No', 'y')));
  console.log('  Service Active:     ' + (status.isActive ? color('Yes', 'g') : color('No', 'y')));
  console.log('  Auto-start:        ' + (config.autoStart ? color('Enabled', 'g') : color('Disabled', 'r')));
  console.log('');
  console.log('  ' + color('Access URLs', 'bold') + ' (when running):');
  console.log('');
  
  if (tailscaleIP) {
    console.log('    Tailscale:  ' + color('http://' + tailscaleIP + ':' + config.opencodeWebPort, 'b'));
  }
  
  console.log('    Local:      ' + color('http://localhost:' + config.opencodeWebPort, 'b'));
  console.log('    Config UI:  ' + color('http://localhost:' + config.port, 'b'));
  console.log('');
  
  if (!status.isActive) {
    console.log('  ' + color("Run 'opencode-remote start' to start the service", 'y'));
  }
}
