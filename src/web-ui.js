import { loadConfig, saveConfig, getConfigPath, getLogFile } from './config.js';
import { getNetworkInfo } from './tailscale.js';
import { restartService, getServiceStatus } from './service.js';
import { createServer } from 'http';
import { readFileSync } from 'fs';

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>opencode-remote Configuration</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #eee;
      padding: 20px;
    }
    .container { max-width: 600px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; color: #00d4ff; }
    .card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid rgba(255,255,255,0.1); }
    .card h2 { font-size: 14px; text-transform: uppercase; color: #888; margin-bottom: 16px; letter-spacing: 1px; }
    .form-group { margin-bottom: 16px; }
    label { display: block; margin-bottom: 6px; color: #aaa; font-size: 13px; }
    input[type="text"], input[type="number"], input[type="password"] { width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 14px; }
    input:focus { outline: none; border-color: #00d4ff; }
    .checkbox-group { display: flex; align-items: center; gap: 10px; }
    input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; }
    .btn { padding: 12px 24px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-primary { background: #00d4ff; color: #000; }
    .btn-primary:hover { background: #00b8e6; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: #fff; margin-left: 10px; }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }
    .network-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .info-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; text-align: center; }
    .info-box .label { font-size: 11px; color: #666; text-transform: uppercase; }
    .info-box .value { font-size: 16px; color: #00d4ff; margin-top: 4px; word-break: break-all; }
    .status { padding: 12px; border-radius: 8px; margin-bottom: 16px; text-align: center; }
    .status.success { background: rgba(0,255,136,0.1); color: #00ff88; }
    .status.error { background: rgba(255,0,0,0.1); color: #ff4444; }
    .buttons { display: flex; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>⚙️ opencode-remote</h1>
    <div id="status"></div>
    <div class="card">
      <h2>Network Information</h2>
      <div class="network-info">
        <div class="info-box"><div class="label">Tailscale IP</div><div class="value" id="tailscale-ip">Loading...</div></div>
        <div class="info-box"><div class="label">Local IP</div><div class="value" id="local-ip">Loading...</div></div>
      </div>
    </div>
    <div class="card">
      <h2>Configuration</h2>
      <form id="config-form">
        <div class="form-group"><label>OpenCode Web Port</label><input type="number" id="opencode-web-port" min="1024" max="65535"></div>
        <div class="form-group"><label>Config UI Port</label><input type="number" id="port" min="1024" max="65535"></div>
        <div class="form-group"><label>Password</label><input type="password" id="password" placeholder="Leave empty to disable"></div>
        <div class="form-group"><label>Hostname</label><input type="text" id="hostname" placeholder="0.0.0.0"></div>
        <div class="form-group checkbox-group"><input type="checkbox" id="auto-start"><label style="margin: 0;">Auto-start on login</label></div>
        <div class="form-group checkbox-group"><input type="checkbox" id="tailscale-only"><label style="margin: 0;">Show only Tailscale IP</label></div>
        <div class="buttons"><button type="submit" class="btn btn-primary">Save</button><button type="button" class="btn btn-secondary" onclick="restartService()">Restart Service</button></div>
      </form>
    </div>
    <div class="card">
      <h2>Quick Actions</h2>
      <p style="color: #888; font-size: 13px; margin-bottom: 12px;">Config file: <code id="config-path"></code></p>
      <button class="btn btn-secondary" onclick="openLogs()">View Logs</button>
    </div>
  </div>
  <script>
    async function loadConfig() {
      const res = await fetch('/api/config');
      const config = await res.json();
      document.getElementById('opencode-web-port').value = config.opencodeWebPort;
      document.getElementById('port').value = config.port;
      document.getElementById('password').value = config.password;
      document.getElementById('hostname').value = config.hostname;
      document.getElementById('auto-start').checked = config.autoStart;
      document.getElementById('tailscale-only').checked = config.tailscaleOnly;
      document.getElementById('config-path').textContent = config.configPath;
    }
    async function loadNetwork() {
      const res = await fetch('/api/network');
      const network = await res.json();
      document.getElementById('tailscale-ip').textContent = network.tailscale.ip || 'Not connected';
      document.getElementById('local-ip').textContent = network.localIp || 'Not available';
    }
    async function loadService() {
      const res = await fetch('/api/service');
      const service = await res.json();
      const statusEl = document.getElementById('status');
      if (service.isActive) { statusEl.className = 'status success'; statusEl.textContent = '✓ Service is running'; }
      else { statusEl.className = 'status error'; statusEl.textContent = '✗ Service is not running - Run: opencode-remote start'; }
    }
    document.getElementById('config-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const config = {
        opencodeWebPort: parseInt(document.getElementById('opencode-web-port').value),
        port: parseInt(document.getElementById('port').value),
        password: document.getElementById('password').value,
        hostname: document.getElementById('hostname').value,
        autoStart: document.getElementById('auto-start').checked,
        tailscaleOnly: document.getElementById('tailscale-only').checked,
      };
      await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      const statusEl = document.getElementById('status');
      statusEl.className = 'status success';
      statusEl.textContent = '✓ Configuration saved!';
      setTimeout(() => statusEl.textContent = '', 3000);
    });
    async function restartService() { await fetch('/api/service/restart', { method: 'POST' }); const statusEl = document.getElementById('status'); statusEl.className = 'status success'; statusEl.textContent = '✓ Service restarted!'; setTimeout(() => location.reload(), 1000); }
    async function openLogs() { window.open('/api/logs', '_blank'); }
    loadConfig(); loadNetwork(); loadService();
  </script>
</body>
</html>
`;

export class WebUI {
  constructor(port = 4097) {
    this.port = port;
    this.server = null;
  }

  async start() {
    this.server = createServer(async (req, res) => {
      try {
        if (req.url === '/api/config' && req.method === 'GET') {
          const config = loadConfig();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ...config, configPath: getConfigPath() }));
          return;
        }

        if (req.url === '/api/config' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => body += chunk);
          req.on('end', () => {
            const config = JSON.parse(body);
            saveConfig(config);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          });
          return;
        }

        if (req.url === '/api/network') {
          const network = await getNetworkInfo();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(network));
          return;
        }

        if (req.url === '/api/service') {
          const status = getServiceStatus();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(status));
          return;
        }

        if (req.url === '/api/service/restart' && req.method === 'POST') {
          restartService();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
          return;
        }

        if (req.url === '/api/logs') {
          const logFile = getLogFile();
          try {
            const logs = readFileSync(logFile, 'utf-8');
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(logs);
          } catch {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('No logs available');
          }
          return;
        }

        if (req.url === '/' || req.url === '/index.html') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(HTML_PAGE);
          return;
        }

        res.writeHead(404);
        res.end('Not Found');
      } catch (error) {
        console.error('Request error:', error);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Config UI running at http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}
