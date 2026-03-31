# Contributing to opencode-remote-ctrl

Thank you for your interest in contributing!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/luigivis/opencode-remote-ctrl.git
cd opencode-remote-ctrl

# Install dependencies
bun install

# Run in development mode
bun run dev

# Build
bun run build
```

## Project Structure

```
opencode-remote-ctrl/
├── src/
│   ├── cli.ts        # CLI command handlers
│   ├── config.ts     # Configuration management
│   ├── service.ts    # Systemd service integration
│   ├── tailscale.ts  # Tailscale IP detection
│   ├── web-ui.ts     # Configuration web UI
│   └── index.ts      # Entry point
├── docs/
│   └── README.md     # Detailed documentation
├── package.json
├── tsconfig.json
└── README.md
```

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Run `bun run build` before committing

## Testing

```bash
# Test locally
bun run dev

# In another terminal
bun run status
```

## Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Issues

Feel free to submit issues for:
- Bug reports
- Feature requests
- Documentation improvements

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
