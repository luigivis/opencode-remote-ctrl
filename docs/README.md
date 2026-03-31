# opencode-remote-ctrl Documentation

## Overview

**opencode-remote-ctrl** is a management tool for [OpenCode](https://opencode.ai) that allows you to:

1. Run OpenCode's web interface as a persistent background service
2. Access it remotely from any device (phone, tablet, other computer)
3. Configure everything via a beautiful web UI
4. Automatically start on login

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Remote Access](#remote-access)
- [Service Management](#service-management)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Installation

### Requirements

- Unix/Linux/macOS system
- [Bun](https://bun.sh) runtime
- [OpenCode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) (optional, for remote access)

### Steps

```bash
# Clone the repository
git clone https://github.com/luigivis/opencode-remote-ctrl.git
cd opencode-remote-ctrl

# Install dependencies
bun install

# Build the project
bun run build

# Link globally (optional)
ln -s "$(pwd)/dist/index.js" /usr/local/bin/opencode-remote-ctrl
```

---

## Quick Start

### 1. First-Time Setup

```bash
# Start the service
opencode-remote-ctrl start

# Open the web configuration UI
opencode-remote-ctrl config
```

Navigate to `http://localhost:4097` in your browser and set a password.

### 2. Access from Another Device

```bash
# Get your Tailscale IP
tailscale ip
# Example output: 100.70.27.92
```

From your phone/tablet, open:
```
http://100.70.27.92:4096
```

Enter your password when prompted.

### 3. Enable Auto-Start

```bash
opencode-remote-ctrl install-service
```

Now the service will automatically start whenever you log in.

---

## Configuration

### Configuration File

Location: `~/.config/opencode-remote-ctrl/config.json`

```json
{
  "port": 4097,
  "opencodeWebPort": 4096,
  "password": "your-password",
  "autoStart": true,
  "hostname": "0.0.0.0",
  "tailscaleOnly": false
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | number | 4097 | Port for the configuration web UI |
| `opencodeWebPort` | number | 4096 | Port for the OpenCode web interface |
| `password` | string | "" | Access password (empty = disabled) |
| `autoStart` | boolean | true | Enable systemd service for auto-start |
| `hostname` | string | "0.0.0.0" | Host to bind to (0.0.0.0 = all interfaces) |
| `tailscaleOnly` | boolean | false | Show only Tailscale IP in status output |

### Web UI Configuration

The easiest way to configure is via the web UI:

```bash
opencode-remote-ctrl config
```

Then open `http://localhost:4097` in your browser.

---

## Remote Access

### Using Tailscale (Recommended)

Tailscale creates a secure VPN between your devices.

#### Setup

1. **Install Tailscale** on both your computer and phone/tablet:
   - macOS/Linux: `curl -fsSL https://tailscale.com/install.sh | sh`
   - iOS/Android: Install from App Store/Play Store

2. **Login to Tailscale** on both devices with the same account

3. **Get your computer's Tailscale IP:**
   ```bash
   tailscale ip
   # Example: 100.70.27.92
   ```

4. **Access from your phone:**
   ```
   http://100.70.27.92:4096
   ```

#### Why Tailscale?

- ✅ Works from anywhere (not just local network)
- ✅ End-to-end encrypted
- ✅ No port forwarding needed
- ✅ Free for personal use (up to 100 devices)
- ✅ No URLs to remember or share

### Other Remote Access Methods

#### ngrok (Quick Test)

```bash
# Install ngrok
brew install ngrok  # or download from ngrok.com

# Create tunnel to opencode web
ngrok http 4096
```

You'll get a temporary URL like `https://xxxx.ngrok.io`.

#### Cloudflare Tunnel (Permanent)

```bash
# Install cloudflared
brew install cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:4096
```

#### SSH Tunnel

```bash
# From your phone, SSH to your computer with port forwarding
ssh -L 4096:localhost:4096 user@your-computer

# Then access http://localhost:4096 on your phone
```

---

## Service Management

### Command Reference

```bash
opencode-remote-ctrl start              # Start the service
opencode-remote-ctrl stop               # Stop the service
opencode-remote-ctrl restart           # Restart the service
opencode-remote-ctrl status            # Show status and URLs
opencode-remote-ctrl config            # Open configuration UI
opencode-remote-ctrl install-service   # Enable auto-start
opencode-remote-ctrl uninstall-service # Disable auto-start
```

### Systemd Service

The tool installs as a systemd user service.

#### Manual Commands

```bash
# Start
systemctl --user start opencode-remote-ctrl

# Stop
systemctl --user stop opencode-remote-ctrl

# Restart
systemctl --user restart opencode-remote-ctrl

# Status
systemctl --user status opencode-remote-ctrl

# Enable on boot
systemctl --user enable opencode-remote-ctrl

# Disable on boot
systemctl --user disable opencode-remote-ctrl
```

### Logs

View service logs:
```bash
# Follow logs in real-time
tail -f ~/.local/share/opencode-remote-ctrl/service.log

# View last 100 lines
tail -100 ~/.local/share/opencode-remote-ctrl/service.log
```

---

## API Reference

The configuration web UI exposes these endpoints:

### GET /api/config

Returns current configuration.

```json
{
  "port": 4097,
  "opencodeWebPort": 4096,
  "password": "secret",
  "autoStart": true,
  "hostname": "0.0.0.0",
  "tailscaleOnly": false,
  "configPath": "/home/user/.config/opencode-remote-ctrl/config.json"
}
```

### POST /api/config

Update configuration.

```json
{
  "password": "new-password",
  "autoStart": false
}
```

### GET /api/network

Returns network information.

```json
{
  "tailscale": {
    "ip": "100.70.27.92",
    "hostname": "my-computer",
    "isConnected": true
  },
  "localIp": "192.168.1.100"
}
```

### GET /api/service

Returns service status.

```json
{
  "isInstalled": true,
  "isActive": true,
  "isRunning": true
}
```

### POST /api/service/restart

Restarts the systemd service.

---

## Troubleshooting

### Service Won't Start

1. **Check if OpenCode is installed:**
   ```bash
   which opencode
   opencode --version
   ```

2. **Check if port is already in use:**
   ```bash
   lsof -i :4096
   ```

3. **View logs:**
   ```bash
   tail -f ~/.local/share/opencode-remote-ctrl/service.log
   ```

4. **Try starting OpenCode manually:**
   ```bash
   opencode web --port 4096
   ```

### Can't Access from Phone

1. **Verify Tailscale is connected:**
   ```bash
   tailscale status
   ```

2. **Check firewall:**
   ```bash
   # Linux
   sudo ufw allow 4096
   
   # macOS
   sudo pfctl -a opencode -f <(echo "pass in proto tcp from any to any port 4096")
   ```

3. **Test connectivity:**
   ```bash
   nc -zv 100.x.y.z 4096
   ```

### Password Not Working

1. Make sure you're accessing the correct URL
2. Clear browser cache/cookies
3. Check password in config file:
   ```bash
   cat ~/.config/opencode-remote-ctrl/config.json
   ```

### Config UI Won't Load

1. Make sure port 4097 isn't blocked by firewall
2. Check if another service is using that port:
   ```bash
   lsof -i :4097
   ```

---

## Architecture

```
opencode-remote-ctrl
│
├── CLI Interface (cli.ts)
│   └── Commands: start, stop, status, config, install-service
│
├── Configuration (config.ts)
│   └── ~/.config/opencode-remote-ctrl/config.json
│
├── Service Manager (service.ts)
│   └── Systemd user service integration
│
├── Web UI (web-ui.ts)
│   └── Configuration interface at port 4097
│
└── Tailscale Integration (tailscale.ts)
    └── Automatic IP detection
```

---

## Security Considerations

1. **Always set a password** - Without it, anyone on the network can access your OpenCode session

2. **Use Tailscale** - It encrypts all traffic between devices

3. **Don't expose to internet** - Unless using Tailscale or a VPN

4. **Keep credentials safe** - The password is stored in plain text locally

---

## Future Enhancements

Planned features:

- [ ] HTTPS support with Let's Encrypt
- [ ] Multi-user support
- [ ] WebSocket for real-time updates
- [ ] Mobile app
- [ ] Custom domain support
- [ ] OAuth/SSO integration

---

## Support

- **Issues:** https://github.com/luigivis/opencode-remote-ctrl/issues
- **GitHub:** [@luigivis](https://github.com/luigivis)

---

## License

MIT License - see [LICENSE](../LICENSE) for details.
