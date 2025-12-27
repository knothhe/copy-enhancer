# X Copy Enhancer

A browser extension that enhances your X.com (Twitter) experience by adding quick copy buttons to every tweet.

## Features

- **Copy with Link** - Copies tweet content, URL, and #X hashtag in one click
- **Copy Text Only** - Copies just the tweet text content
- **Visual Feedback** - Toast notification confirms successful copy
- **Auto-injection** - Buttons automatically appear on dynamically loaded tweets
- **Multi-platform** - Works on both x.com and twitter.com

## How It Works

The extension adds two copy buttons to the action bar below each tweet:

1. 🔗 **Link Icon** - Copies with link
   - Format: `Tweet content` + `Tweet URL` + `#X`

2. 📄 **Document Icon** - Copies text only
   - Format: Just the tweet text

## Installation

### Development Build

1. Clone this repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the extension:
   ```bash
   pnpm build
   ```
4. Load the extension in your browser:
   - Chrome/Edge: Go to `chrome://extensions/`, enable Developer mode, and load the `.output/chrome-mv3` directory
   - Firefox: Go to `about:debugging`, click "This Firefox", and load the temporary add-on from `.output/firefox-mv3`

## Development

```bash
# Install dependencies
pnpm install

# Development mode (Chrome)
pnpm dev

# Development mode (Firefox)
pnpm dev:firefox

# Build for production
pnpm build

# Build for Firefox
pnpm build:firefox

# Create zip package
pnpm zip
```

## Tech Stack

- [WXT](https://wxt.dev) - Web Extension Tools framework
- [React](https://react.dev) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## License

MIT
