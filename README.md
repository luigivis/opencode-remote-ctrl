# opencode-remote-ctrl

A CLI tool to manage [OpenCode](https://opencode.ai) as a background service with a web UI for configuration and Tailscale integration for remote access.

## Features

- 🌐 **Web UI** - Visual configuration panel for all settings
- 🔒 **Password Protection** - Secure your remote access with a password
- 📱 **Tailscale Integration** - Automatic detection of Tailscale IP for remote access
- ⚡ **Auto-start** - Runs as a systemd user service, starts on login
- 🔄 **Service Management** - Start, stop, restart, and monitor the service
- 📊 **Status Dashboard** - See all access URLs and service status at a glance
- 📝 **Logging** - Service logs saved for debugging

## Prerequisites

- [OpenCode](https://opencode.ai) installed
- [Tailscale](https://tailscale.com) installed (optional, for remote access)
- Unix/Linux/macOS system

## Installation

### From Source

```bash
git clone https://github.com/luigivis/opencode-remote-ctrl.git
cd opencode-remote-ctrl
bun install
bun run build
sudo ln -s "$(pwd)/dist/index.js" /usr/local/bin/opencode-remote-ctrl
```

### Quick Install (Bun)

```bash
bun install -g opencode-remote-ctrl
```

## Usage

### Basic Commands

```bash
# Start the service
opencode-remote-ctrl start

# Check status
opencode-remote-ctrl status

# Open configuration UI
opencode-remote-ctrl config

# Stop the service
opencode-remote-ctrl stop

# Restart the service
opencode-remote-ctrl restart

# Show help
opencode-remote-ctrl help
```

### First-Time Setup

1. **Start the service:**
   ```bash
   opencode-remote-ctrl start
   ```

2. **Open the configuration UI:**
   ```bash
   opencode-remote-ctrl config
   ```

3. **Set your password** in the web UI at `http://localhost:4097`

4. **Enable auto-start** (optional):
   ```bash
   opencode-remote-ctrl install-service
   ```

### Remote Access with Tailscale

If you have Tailscale installed on both your computer and phone:

1. **Ensure Tailscale is running** on both devices and logged in with the same account

2. **Start the service:**
   ```bash
   opencode-remote-ctrl start
   ```

3. **Get your Tailscale IP:**
   ```bash
   tailscale ip
   ```

4. **From your phone**, open the browser and go to:
   ```
   http://<YOUR_TAILSCALE_IP>:4096
   ```

5. **Enter your password** when prompted

## Configuration

Configuration is stored at `~/.config/opencode-remote-ctrl/config.json`

### Web UI Configuration

Access the web UI at `http://localhost:4097`:

| Setting | Description | Default |
|---------|-------------|---------|
| OpenCode Web Port | Port for the OpenCode web interface | 4096 |
| Config UI Port | Port for the configuration UI | 4097 |
| Password | Access password (leave empty to disable) | - |
| Hostname | Network interface to bind to | 0.0.0.0 |
| Auto-start | Start service on login | true |
| Tailscale Only | Show only Tailscale IP in status | false |

### Manual Configuration

You can also edit `~/.config/opencode-remote-ctrl/config.json` directly:

```json
{
  "port": 4097,
  "opencodeWebPort": 4096,
  "password": "your-secure-password",
  "autoStart": true,
  "hostname": "0.0.0.0",
  "tailscaleOnly": false
}
```

## Access URLs

When the service is running:

| Access Type | URL |
|-------------|-----|
| Local (Browser) | http://localhost:4096 |
| Config UI | http://localhost:4097 |
| Tailscale (Phone) | http://100.x.y.z:4096 |
| Local Network | http://192.168.x.x:4096 |

## Systemd Service

The tool can install itself as a systemd user service for automatic startup:

### Install Service

```bash
opencode-remote-ctrl install-service
```

### Uninstall Service

```bash
opencode-remote-ctrl uninstall-service
```

### Manual Service Management

```bash
systemctl --user start opencode-remote-ctrl
systemctl --user stop opencode-remote-ctrl
systemctl --user restart opencode-remote-ctrl
systemctl --user status opencode-remote-ctrl
```

## Logs

Service logs are stored at:
```
~/.local/share/opencode-remote-ctrl/service.log
```

View logs:
```bash
tail -f ~/.local/share/opencode-remote-ctrl/service.log
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    opencode-remote-ctrl                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌────────────┐  │
│  │     CLI      │    │   Web UI    │    │   Service   │  │
│  │  (Commands)  │    │   (Config)  │    │  (Systemd)  │  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬─────┘  │
│         │                   │                   │         │
│         └───────────────────┼───────────────────┘         │
│                             │                             │
│              ┌──────────────┴──────────────┐              │
│              │        Config Store        │              │
│              │  ~/.config/opencode-remote-ctrl/ │              │
│              └─────────────────────────────┘              │
│                             │                             │
│         ┌───────────────────┼───────────────────┐         │
│         │                   │                   │         │
│  ┌──────┴───────┐   ┌───────┴───────┐   ┌──────┴──────┐  │
│  │   Tailscale  │   │  opencode web │   │    Logs     │  │
│  │     Info     │   │   Service     │   │             │  │
│  └──────────────┘   └───────────────┘   └─────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENCODE_SERVER_PASSWORD` | Password for OpenCode web (set via config UI) |

## Troubleshooting

### Service won't start

1. Check if OpenCode is installed:
   ```bash
   which opencode
   ```

2. Check service logs:
   ```bash
   tail -f ~/.local/share/opencode-remote-ctrl/service.log
   ```

3. Try starting manually:
   ```bash
   opencode web --port 4096
   ```

### Can't access from phone

1. Verify Tailscale is connected on both devices:
   ```bash
   tailscale status
   ```

2. Check your Tailscale IP:
   ```bash
   tailscale ip
   ```

3. Check if the port is accessible:
   ```bash
   nc -zv 100.x.y.z 4096
   ```

### Password not working

Make sure you're using the same password you set in the config UI. The password is stored locally and not synced anywhere.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Author

- GitHub: [@luigivis](https://github.com/luigivis)
