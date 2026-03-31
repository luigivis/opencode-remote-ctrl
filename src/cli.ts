#!/usr/bin/env bun
import { echo } from 'zx';
import chalk from 'chalk';
import { loadConfig, saveConfig } from './config.js';
import { 
  startService, 
  stopService, 
  restartService, 
  showServiceStatus,
  installService,
  uninstallService,
  isSystemdUserServiceInstalled,
} from './service.js';
import { getNetworkInfo, isTailscaleInstalled } from './tailscale.js';
import { WebUI } from './web-ui.js';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  if (!command) {
    printHelp();
    return;
  }

  switch (command) {
    case 'start':
      await cmdStart();
      break;
    case 'stop':
      await cmdStop();
      break;
    case 'restart':
      await cmdRestart();
      break;
    case 'status':
      await cmdStatus();
      break;
    case 'config':
      await cmdConfig();
      break;
    case 'install-service':
      await cmdInstallService();
      break;
    case 'uninstall-service':
      await cmdUninstallService();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    case 'version':
    case '--version':
      echo`${chalk.cyan('opencode-remote v1.0.0')}`;
      break;
    default:
      echo`${chalk.red('Unknown command:')} ${command}`;
      echo`Run 'opencode-remote help' for usage information`;
      process.exit(1);
  }
}

function printHelp(): void {
  echo`
${chalk.cyan('opencode-remote')} - Manage opencode web as a background service

${chalk.bold('Usage:')}
  opencode-remote <command>

${chalk.bold('Commands:')}
  ${chalk.green('start')}              Start the opencode-remote service
  ${chalk.green('stop')}              Stop the opencode-remote service
  ${chalk.green('restart')}           Restart the opencode-remote service
  ${chalk.green('status')}            Show service status and access URLs
  ${chalk.green('config')}            Open the web configuration UI
  ${chalk.green('install-service')}   Install systemd user service (auto-start)
  ${chalk.green('uninstall-service')} Remove systemd user service
  ${chalk.green('help')}               Show this help message
  ${chalk.green('version')}           Show version information

${chalk.bold('Examples:')}
  ${chalk.gray('$')} opencode-remote start
  ${chalk.gray('$')} opencode-remote config
  ${chalk.gray('$')} opencode-remote status

${chalk.bold('Access URLs:')}
  When running, access opencode web at:
  - Local:    ${chalk.blue('http://localhost:4096')}
  - Config:  ${chalk.blue('http://localhost:4097')}

${chalk.bold('Documentation:')}
  https://github.com/luigivis/opencode-remote
`;
}

async function cmdStart(): Promise<void> {
  echo`${chalk.cyan('Starting opencode-remote service...')}`;
  
  const config = loadConfig();
  
  if (!config.password) {
    echo`${chalk.yellow('⚠ Warning: No password set. Run "opencode-remote config" to set a password.')}`;
  }
  
  const tailscaleInstalled = isTailscaleInstalled();
  if (!tailscaleInstalled) {
    echo`${chalk.yellow('⚠ Tailscale not detected. Remote access may not work.')}`;
  }
  
  const success = startService();
  
  if (success) {
    const network = await getNetworkInfo();
    
    echo`
${chalk.green('✓ Service started successfully!')}

${chalk.bold('Access URLs:')}
`;
    
    if (network.tailscale.ip) {
      echo`  Tailscale: ${chalk.blue(`http://${network.tailscale.ip}:${config.opencodeWebPort}`)}`;
    }
    
    echo`  Local:    ${chalk.blue(`http://localhost:${config.opencodeWebPort}`)}
  Config UI: ${chalk.blue(`http://localhost:${config.port}`)}

${chalk.gray('Run "opencode-remote status" to see all URLs')}
`;
  }
}

async function cmdStop(): Promise<void> {
  echo`${chalk.cyan('Stopping opencode-remote service...')}`;
  stopService();
}

async function cmdRestart(): Promise<void> {
  echo`${chalk.cyan('Restarting opencode-remote service...')}`;
  restartService();
}

async function cmdStatus(): Promise<void> {
  await showServiceStatus();
}

async function cmdConfig(): Promise<void> {
  const config = loadConfig();
  const webUI = new WebUI(config.port);
  
  echo`${chalk.cyan('Starting configuration UI...')}`;
  echo`${chalk.blue(`Open http://localhost:${config.port} in your browser`)}`;
  echo`${chalk.gray('Press Ctrl+C to stop')}`;
  
  await webUI.start();
  
  // Try to open browser automatically (optional)
  try {
    const browserCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(`${browserCmd} http://localhost:${config.port}`, { stdio: 'ignore' });
  } catch {
    // Ignore if can't open browser
  }
  
  // Keep running
  await new Promise(() => {});
}

async function cmdInstallService(): Promise<void> {
  echo`${chalk.cyan('Installing systemd user service...')}`;
  
  if (!isSystemdUserServiceInstalled()) {
    const success = installService();
    if (success) {
      echo`
${chalk.green('✓ Service installed and enabled!')}
The service will now start automatically when you log in.

${chalk.gray('Run "opencode-remote start" to start it now')}
`;
    }
  } else {
    echo`${chalk.yellow('Service is already installed')}`;
  }
}

async function cmdUninstallService(): Promise<void> {
  echo`${chalk.cyan('Uninstalling systemd user service...')}`;
  
  stopService();
  uninstallService();
  
  echo`
${chalk.green('✓ Service uninstalled!')}
The service will no longer start automatically.
`;
}

main().catch(console.error);
