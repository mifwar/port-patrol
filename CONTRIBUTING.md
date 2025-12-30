# Contributing to Port Patrol

Thanks for your interest in contributing! Here's how you can help.

## Development Setup

```bash
# Clone the repo
git clone https://github.com/mifwar/port-patrol.git
cd port-patrol

# Install dependencies
npm install

# Run in development
npm run dev

# Build
npm run build

# Run built version
node dist/cli.js
```

## Pull Request Guidelines

1. Fork the repo and create your branch from `main`
2. Test your changes locally with `npm run build`
3. Run `npm run format` before committing
4. Submit a PR with a clear description

## Ideas for Contributions

- [ ] More filtering and sorting options
- [ ] Better Windows process metadata
- [ ] Export results to JSON/CSV
- [ ] Additional port color themes
- [ ] Mouse support

## Code Style

- Use TypeScript
- Follow existing patterns in the codebase
- Keep components small and focused
- Use `.js` extensions in imports (for ESM compatibility)

## Questions?

Open an issue if you have questions or need help!
