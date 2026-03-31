import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { echo } from 'zx';
import { loadConfig, getLogFile, getLogsDir } from './config.js';
import { getTailscaleIP } from './tailscale.js';

const SERVICE_NAME = 'opencode-remote';
const SERVICE_FILE = join(getLogsDir(), `${SERVICE_NAME}.service`);

interface ServiceStatus {
  isInstalled: boolean;
  isActive: boolean;
  isRunning: boolean;
  pid: number | null;
}

function getServiceDefinition(): string {
  const config = loadConfig();
  const logFile = getLogFile();
  
  return `[Unit]
Description=opencode-remote service
After=network.target

[Service]
Type=simple
ExecStart=/home/%u/.opencode/bin/opencode web --hostname ${config.hostname} --port ${config.opencodeWebPort}
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

export function isSystemdUserServiceInstalled(): boolean {
  try {
    execSync('systemctl --user list-unit-files', { stdio: 'ignore' });
    return existsSync(join(process.env.HOME || '/root', '.config', 'systemd', 'user', `${SERVICE_NAME}.service`));
  } catch {
    return false;
  }
}

export function installService(): boolean {
  try {
    const serviceDir = join(process.env.HOME || '/root', '.config', 'systemd', 'user');
    
    if (!existsSync(serviceDir)) {
      execSync(`mkdir -p "${serviceDir}"`);
    }
    
    const serviceContent = getServiceDefinition();
    writeFileSync(SERVICE_FILE, serviceContent, 'utf-8');
    
    execSync(`ln -sf "${SERVICE_FILE}" "${serviceDir}/${SERVICE_NAME}.service"`, { stdio: 'ignore' });
    execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
    
    echo`${'{green'}✓{/green} Service installed successfully`;
    return true;
  } catch (error) {
    echo`${'{red'}✗{/red} Failed to install service: ${error}`;
    return false;
  }
}

export function uninstallService(): boolean {
  try {
    const serviceDir = join(process.env.HOME || '/root', '.config', 'systemd', 'user');
    const servicePath = join(serviceDir, `${SERVICE_NAME}.service`);
    
    if (existsSync(servicePath)) {
      execSync('systemctl --user stop ${SERVICE_NAME} 2>/dev/null', { stdio: 'ignore' });
      execSync(`rm -f "${servicePath}"`, { stdio: 'ignore' });
      execSync('systemctl --user daemon-reload', { stdio: 'ignore' });
    }
    
    echo`${'{green'}✓{/green} Service uninstalled successfully`;
    return true;
  } catch (error) {
    echo`${'{red'}✗{/red} Failed to uninstall service: ${error}`;
    return false;
  }
}

export function startService(): boolean {
  try {
    if (!isSystemdUserServiceInstalled()) {
      installService();
    }
    
    execSync('systemctl --user start ${SERVICE_NAME}', { stdio: 'ignore' });
    execSync('systemctl --user enable ${SERVICE_NAME}', { stdio: 'ignore' });
    
    echo`${'{green'}✓{/green} Service started`;
    return true;
  } catch (error) {
    echo`${'{red'}✗{/red} Failed to start service: ${error}`;
    return false;
  }
}

export function stopService(): boolean {
  try {
    execSync('systemctl --user stop ${SERVICE_NAME} 2>/dev/null', { stdio: 'ignore' });
    echo`${'{green'}✓{/green} Service stopped`;
    return true;
  } catch (error) {
    echo`${'{red'}✗{/red} Failed to stop service: ${error}`;
    return false;
  }
}

export function restartService(): boolean {
  try {
    execSync('systemctl --user restart ${SERVICE_NAME}', { stdio: 'ignore' });
    echo`${'{green'}✓{/green} Service restarted`;
    return true;
  } catch (error) {
    echo`${'{red'}✗{/red} Failed to restart service: ${error}`;
    return false;
  }
}

export function getServiceStatus(): ServiceStatus {
  let status: ServiceStatus = {
    isInstalled: false,
    isActive: false,
    isRunning: false,
    pid: null,
  };
  
  try {
    status.isInstalled = isSystemdUserServiceInstalled();
    
    if (status.isInstalled) {
      const activeOutput = execSync('systemctl --user is-active ${SERVICE_NAME} 2>/dev/null', { encoding: 'utf-8' });
      status.isActive = activeOutput.trim() === 'active';
      
      const runningOutput = execSync('systemctl --user is-enabled ${SERVICE_NAME} 2>/dev/null', { encoding: 'utf-8' });
      status.isRunning = runningOutput.trim() === 'enabled';
    }
  } catch {
    // Service not installed or not running
  }
  
  return status;
}

export async function showServiceStatus(): Promise<void> {
  const status = getServiceStatus();
  const config = loadConfig();
  const tailscaleIP = await getTailscaleIP();
  
  echo`
${'{cyan'}┌─────────────────────────────────────────�{/cyan}┐
${'{cyan'}│{/cyan}    opencode-remote Status                 ${'{cyan'}│{/cyan}
${'{cyan'}└─────────────────────────────────────────┘{/cyan}
`;
  
  echo`  Service Installed:  ${status.isInstalled ? '{green}Yes{/green}' : '{yellow}No{/yellow}'}`;
  echo`  Service Active:     ${status.isActive ? '{green}Yes{/green}' : '{yellow}No{/yellow}'}`;
  echo`  Auto-start:         ${config.autoStart ? '{green}Enabled{/green}' : '{red}Disabled{/red}'}`;
  echo``;
  echo`  ${'{bold'}Access URLs{/bold'} (when running):`;
  
  if (tailscaleIP) {
    echo`    Tailscale:  ${'{blue'}http://${tailscaleIP}:${config.opencodeWebPort}{/blue}`;
  }
  
  echo`    Local:      ${'{blue'}http://localhost:${config.opencodeWebPort}{/blue}`;
  echo`    Config UI:  ${'{blue'}http://localhost:${config.port}{/blue}`;
  echo``;
  
  if (!status.isActive) {
    echo`  ${'{yellow'}Run 'opencode-remote start' to start the service{/yellow}`;
  }
}
