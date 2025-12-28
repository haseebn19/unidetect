# UniDetect

[![CI](https://github.com/haseebn19/unidetect/actions/workflows/ci.yml/badge.svg)](https://github.com/haseebn19/unidetect/actions/workflows/ci.yml)

<img src="public/logo512.png" alt="UniDetect Logo" width="250">

A modern web application for detecting and cleaning hidden Unicode characters in text.

## Features

- **Real-time Unicode Detection**: Instantly detect hidden and special Unicode characters
- **Visual Character Highlighting**: Hidden characters highlighted with Unicode code tooltips
- **Multiple File Format Support**: Process PDF, DOCX, TXT, and MD files
- **Drag & Drop Support**: Easy file uploading through drag and drop
- **Clean Text Functionality**: One-click cleaning with automatic clipboard copy
- **Real-time Statistics**: Character counts, byte size, and detailed breakdowns
- **Privacy-Focused**: All processing done locally in your browser

## Prerequisites

- Node.js 18.x or higher
- npm (Node Package Manager)
- Docker & Docker Compose (optional, see [DOCKER.md](DOCKER.md))

## Installation

```bash
git clone https://github.com/haseebn19/unidetect.git
cd unidetect
npm install
```

## Usage

```bash
npm run dev
```

1. Open `http://localhost:3000/unidetect/` in your browser
2. Paste text directly or drag and drop a file (PDF, DOCX, TXT, MD)
3. Hidden characters are automatically highlighted - hover to see Unicode info
4. Click "Clean Text" to remove hidden characters and copy to clipboard

## Development

### Setup

```bash
npm install
npm run dev
```

### Testing

```bash
npm test              # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Linting

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Run ESLint with auto-fix
npm run type-check    # TypeScript type checking
```

## Building

```bash
npm run build   # Build for production
npm run preview # Preview production build
```

Build output is created in the `dist` directory.

## Project Structure

```
unidetect/
├── src/
│   ├── components/     # React components with co-located CSS
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── types/          # TypeScript type definitions
│   └── test/           # Test setup
├── public/             # Static assets
└── .github/workflows/  # CI/CD configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Credits

- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF file processing
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX file processing
- [Vite](https://vitejs.dev/) - Build tool
- [Vitest](https://vitest.dev/) - Testing framework

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
