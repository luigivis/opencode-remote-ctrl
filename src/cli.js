#!/usr/bin/env node
import { execSync } from 'child_process';
import { loadConfig } from './config.js';
import { 
  startService, 
  stopService, 
  restartService, 
  showServiceStatus,
  installService,
  uninstallService,
  isSystemdUserServiceInstalled,
} from './service.js';
import { getNetworkInfo, isTailscaleInstalled, installTailscale } from './tailscale.js';
import { WebUI } from './web-ui.js';

const args = process.argv.slice(2);
const command = args[0];

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
const log = (msg, col) => console.log(color(msg, col));

function isOpenCodeInstalled() {
  try {
    execSync('which opencode', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function installOpenCode() {
  console.log(color('OpenCode is not installed. Installing...', 'y'));
  console.log('');
  
  try {
    console.log(color('Installing OpenCode...', 'c'));
    execSync('curl -fsSL https://opencode.ai/install | sh', { stdio: 'inherit' });
    
    if (isOpenCodeInstalled()) {
      console.log(color('✓ OpenCode installed successfully!', 'g'));
      return true;
    } else {
      console.log(color('✗ Failed to install OpenCode', 'r'));
      return false;
    }
  } catch (error) {
    console.log(color('✗ Installation failed. Please install manually:', 'r'));
    console.log(color('curl -fsSL https://opencode.ai/install | sh', 'b'));
    return false;
  }
}

function ensureOpenCodeInstalled() {
  if (isOpenCodeInstalled()) {
    return true;
  }
  
  console.log('');
  console.log(color('━━━ OpenCode Required ━━━', 'bold'));
  console.log('');
  console.log('This tool provides a web interface for OpenCode, allowing you to access it');
  console.log('from your phone or other devices remotely.');
  console.log('');
  console.log(color('Why do you need OpenCode?', 'bold'));
  console.log('  • OpenCode is an AI coding assistant that runs in your terminal');
  console.log('  • This tool adds a web UI and remote access via Tailscale');
  console.log('  • Access OpenCode from your phone with the same experience');
  console.log('  • No browser needed on your computer - just the terminal');
  console.log('');
  console.log(color('━━━ Auto-install OpenCode? ━━━', 'bold'));
  console.log('');
  
  const response = execSync('echo "y"', { encoding: 'utf-8' }).trim();
  
  if (response.toLowerCase() === 'y' || response === '') {
    return installOpenCode();
  }
  
  console.log(color('Installation cancelled. Please install OpenCode manually:', 'y'));
  console.log(color('curl -fsSL https://opencode.ai/install | sh', 'b'));
  return false;
}

function ensureTailscaleInstalled() {
  if (isTailscaleInstalled()) {
    return true;
  }
  
  console.log('');
  console.log(color('━━━ Tailscale Required ━━━', 'bold'));
  console.log('');
  console.log('Tailscale is needed for remote access from your phone.');
  console.log('');
  console.log(color('━━━ Auto-install Tailscale? ━━━', 'bold'));
  console.log('');
  
  try {
    const response = execSync('echo "y"', { encoding: 'utf-8' }).trim();
    
    if (response.toLowerCase() === 'y' || response === '') {
      return installTailscale();
    }
  } catch {}
  
  console.log(color('Installation cancelled. Please install Tailscale manually:', 'y'));
  console.log(color('curl -fsSL https://tailscale.com/install.sh | sh', 'b'));
  return false;
}

function main() {
  if (!command) {
    printHelp();
    return;
  }

  switch (command) {
    case 'start':
      cmdStart();
      break;
    case 'stop':
      cmdStop();
      break;
    case 'restart':
      cmdRestart();
      break;
    case 'status':
      cmdStatus();
      break;
    case 'config':
      cmdConfig();
      break;
    case 'install-service':
      cmdInstallService();
      break;
    case 'uninstall-service':
      cmdUninstallService();
      break;
    case 'help':
    case '--help':
    case '-h':
      printHelp();
      break;
    case 'version':
    case '--version':
      console.log(color('opencode-remote v1.1.0', 'c'));
      break;
    default:
      console.log(color('Unknown command: ' + command, 'r'));
      console.log("Run 'opencode-remote help' for usage information");
      process.exit(1);
  }
}

function printHelp() {
  console.log('');
  console.log(color('opencode-remote', 'c') + color(' - Manage opencode web as a background service', 'reset'));
  console.log('');
  console.log(color('Usage:', 'bold'));
  console.log('  opencode-remote <command>');
  console.log('');
  console.log(color('Commands:', 'bold'));
  console.log('  ' + color('start', 'g') + '              Start the opencode-remote service');
  console.log('  ' + color('stop', 'g') + '              Stop the opencode-remote service');
  console.log('  ' + color('restart', 'g') + '           Restart the opencode-remote service');
  console.log('  ' + color('status', 'g') + '            Show service status and access URLs');
  console.log('  ' + color('config', 'g') + '            Open the web configuration UI');
  console.log('  ' + color('install-service', 'g') + '   Install systemd user service (auto-start)');
  console.log('  ' + color('uninstall-service', 'g') + ' Remove systemd user service');
  console.log('  ' + color('help', 'g') + '               Show this help message');
  console.log('  ' + color('version', 'g') + '           Show version information');
  console.log('');
  console.log(color('Examples:', 'bold'));
  console.log('  $ opencode-remote start');
  console.log('  $ opencode-remote config');
  console.log('  $ opencode-remote status');
  console.log('');
  console.log(color('Access URLs:', 'bold'));
  console.log('  When running, access opencode web at:');
  console.log('  - Local:    ' + color('http://localhost:4096', 'b'));
  console.log('  - Config:   ' + color('http://localhost:4097', 'b'));
  console.log('');
  console.log(color('Documentation:', 'bold'));
  console.log('  https://github.com/luigivis/opencode-remote-ctrl');
  console.log('');
}

function cmdStart() {
  if (!ensureOpenCodeInstalled()) {
    process.exit(1);
  }
  
  console.log(color('Starting opencode-remote service...', 'c'));
  
  const config = loadConfig();
  
  if (!config.password) {
    console.log(color('⚠ Warning: No password set. Run "opencode-remote config" to set a password.', 'y'));
  }
  
  if (!ensureTailscaleInstalled()) {
    console.log(color('⚠ Tailscale not installed. Remote access will not work.', 'y'));
  }
  
  const success = startService();
  
  if (success) {
    console.log('');
    console.log(color('✓ Service started successfully!', 'g'));
    console.log('');
    console.log(color('Access URLs:', 'bold'));
    console.log('');
    
    console.log('  Local:    ' + color('http://localhost:' + config.opencodeWebPort, 'b'));
    console.log('  Config UI: ' + color('http://localhost:' + config.port, 'b'));
    console.log('');
    console.log(color('Run "opencode-remote status" to see all URLs', 'gray'));
    console.log('');
  }
}

function cmdStop() {
  console.log(color('Stopping opencode-remote service...', 'c'));
  stopService();
}

function cmdRestart() {
  console.log(color('Restarting opencode-remote service...', 'c'));
  restartService();
}

async function cmdStatus() {
  await showServiceStatus();
}

async function cmdConfig() {
  if (!ensureOpenCodeInstalled()) {
    process.exit(1);
  }
  
  const config = loadConfig();
  const webUI = new WebUI(config.port);
  
  console.log(color('Starting configuration UI...', 'c'));
  console.log(color('Open http://localhost:' + config.port + ' in your browser', 'b'));
  console.log(color('Press Ctrl+C to stop', 'gray'));
  
  await webUI.start();
  
  try {
    const browserCmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    execSync(browserCmd + ' http://localhost:' + config.port, { stdio: 'ignore' });
  } catch {
    // Ignore if can't open browser
  }
  
  await new Promise(() => {});
}

function cmdInstallService() {
  console.log(color('Installing systemd user service...', 'c'));
  
  if (!isSystemdUserServiceInstalled()) {
    const success = installService();
    if (success) {
      console.log('');
      console.log(color('✓ Service installed and enabled!', 'g'));
      console.log('The service will now start automatically when you log in.');
      console.log('');
      console.log(color('Run "opencode-remote start" to start it now', 'gray'));
      console.log('');
    }
  } else {
    console.log(color('Service is already installed', 'y'));
  }
}

function cmdUninstallService() {
  console.log(color('Uninstalling systemd user service...', 'c'));
  
  stopService();
  uninstallService();
  
  console.log('');
  console.log(color('✓ Service uninstalled!', 'g'));
  console.log('The service will no longer start automatically.');
  console.log('');
}

main();
