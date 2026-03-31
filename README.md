# opencode-remote-ctrl

A CLI tool to manage [OpenCode](https://opencode.ai) as a background service with a web UI for configuration and Tailscale integration for remote access.

## What is this?

This tool adds a **web interface** to OpenCode, so you can access it from your phone, tablet, or any device remotely via Tailscale VPN.

**Why would you want this?**
- Access OpenCode's AI coding assistant from your phone
- Same terminal experience, but from anywhere
- No need to have a browser open on your computer
- Share your coding session with others easily

## Installation

Requires **Node.js 16+** (no other dependencies needed).

```bash
# Clone the repo
git clone https://github.com/luigivis/opencode-remote-ctrl.git
cd opencode-remote-ctrl

# Run the installer
./install.sh
```

The installer will:
1. Copy files to `~/.local/lib/opencode-remote-ctrl/`
2. Create a symlink in `~/.local/bin/`
3. Add `~/.local/bin` to your PATH if needed

## Requirements

- [Tailscale](https://tailscale.com) installed (optional, for remote access)
- Unix/Linux/macOS system
- OpenCode (auto-installed if missing)

## Usage

### Start the Service

```bash
opencode-remote-ctrl start
```

The tool will:
1. **Auto-install OpenCode** if not already installed
2. Start OpenCode web interface
3. Display access URLs

### Other Commands

```bash
opencode-remote-ctrl status          # Check status
opencode-remote-ctrl config          # Open configuration UI
opencode-remote-ctrl stop            # Stop the service
opencode-remote-ctrl restart         # Restart the service
opencode-remote-ctrl install-service # Enable auto-start on login
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

## Troubleshooting

### "command not found" after installation

If you get `opencode-remote-ctrl: command not found`, make sure `~/.local/bin` is in your PATH:

```bash
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc
```

### Service won't start

1. Check if OpenCode is installed:
   ```bash
   which opencode
   ```

2. Check service logs:
   ```bash
   tail -f ~/.local/share/opencode-remote-ctrl/service.log
   ```

## License

MIT
