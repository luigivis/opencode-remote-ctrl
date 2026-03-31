# opencode-remote-ctrl

A CLI tool to manage [OpenCode](https://opencode.ai) as a background service with a web UI for configuration and Tailscale integration for remote access.

## What is this?

This tool adds a **web interface** to OpenCode, so you can access it from your phone, tablet, or any device remotely via Tailscale VPN.

**Why would you want this?**
- Access OpenCode's AI coding assistant from your phone
- Same terminal experience, but from anywhere
- No need to have a browser open on your computer
- Share your coding session with others easily

## Features

- 🌐 **Web UI** - Visual configuration panel for all settings
- 🔒 **Password Protection** - Secure your remote access with a password
- 📱 **Tailscale Integration** - Automatic detection of Tailscale IP for remote access
- ⚡ **Auto-start** - Runs as a systemd user service, starts on login
- 🔄 **Service Management** - Start, stop, restart, and monitor the service
- 📊 **Status Dashboard** - See all access URLs and service status at a glance
- 📝 **Logging** - Service logs saved for debugging

## Prerequisites

- [Tailscale](https://tailscale.com) installed (optional, for remote access)
- Unix/Linux/macOS system
- OpenCode (auto-installed if missing)

## Installation

```bash
npm install -g opencode-remote-ctrl
```

## Usage

### Start the Service

```bash
opencode-remote-ctrl start
```

The tool will:
1. **Auto-install OpenCode** if not already installed
2. Start OpenCode web interface
3. Display access URLs

### Check Status

```bash
opencode-remote-ctrl status
```

### Open Configuration UI

```bash
opencode-remote-ctrl config
```

### Other Commands

```bash
opencode-remote-ctrl stop          # Stop the service
opencode-remote-ctrl restart       # Restart the service
opencode-remote-ctrl install-service   # Enable auto-start on login
opencode-remote-ctrl help          # Show help
```

## Remote Access with Tailscale

If you have Tailscale installed on both your computer and phone:

1. **Start the service:**
   ```bash
   opencode-remote-ctrl start
   ```

2. **Get your Tailscale IP:**
   ```bash
   tailscale ip
   ```

3. **From your phone**, open the browser and go to:
   ```
   http://<YOUR_TAILSCALE_IP>:4096
   ```

4. **Enter your password** when prompted

## Why Tailscale?

Tailscale creates a secure VPN between your devices:
- Works from anywhere (not just local network)
- End-to-end encrypted
- No port forwarding needed
- Free for personal use (up to 100 devices)

## Auto-Installation

If OpenCode is not installed, the tool will:
1. Display information about what OpenCode is and why you need it
2. Offer to auto-install it for you
3. Run the official OpenCode installation script

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

## Access URLs

When the service is running:

| Access Type | URL |
|-------------|-----|
| Local (Browser) | http://localhost:4096 |
| Config UI | http://localhost:4097 |
| Tailscale (Phone) | http://100.x.y.z:4096 |
| Local Network | http://192.168.x.x:4096 |

## Systemd Service

Enable auto-start on login:

```bash
opencode-remote-ctrl install-service
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

## License

MIT License

## Author

- GitHub: [@luigivis](https://github.com/luigivis)
