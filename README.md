# UniDetect

[![CI](https://github.com/haseebn19/unidetect/actions/workflows/ci.yml/badge.svg)](https://github.com/haseebn19/unidetect/actions/workflows/ci.yml)

<img src="public/logo.svg" alt="UniDetect logo" width="250">

A browser tool for finding and removing hidden Unicode characters in text and documents.

**Live site:** [haseebn19.github.io/unidetect](https://haseebn19.github.io/unidetect/)

## Features

- Highlights hidden characters as you type or paste, with the name and code point of each one
- Opens PDF, DOCX, TXT, and Markdown files by drag and drop or with the **Open file** button
- Cleans the text and copies the result to the clipboard
- Shows character, line break, tab, space, and byte counts
- Runs entirely in the browser; text and files are never uploaded

## What Counts as Hidden

UniDetect flags characters that are invisible or unexpected in plain text:

- Zero-width and other default-ignorable characters, such as zero-width spaces, joiners, bidirectional controls, variation selectors, and tag characters
- Whitespace other than the regular space, tab, and line breaks, such as no-break and ideographic spaces
- Control codes, private-use characters, and unassigned code points

Combining accents, scripts such as Devanagari, and complete emoji sequences are treated as normal text.

When cleaning, unusual spaces become a regular space, line and paragraph separators become line breaks, and everything else that was flagged is removed.

## Development

Requires Node.js 22.13+.

```bash
git clone https://github.com/haseebn19/unidetect.git
cd unidetect
npm ci
npm run dev
```

The development server opens `http://localhost:3000/unidetect/`.

| Command | Purpose |
| :--- | :--- |
| `npm test` | Run the tests once |
| `npm run test:watch` | Run the tests in watch mode |
| `npm run test:coverage` | Run the tests with a coverage report |
| `npm run lint` | Check the code with ESLint |
| `npm run format` | Format the code with Prettier |
| `npm run type-check` | Check types with TypeScript |
| `npm run build` | Build the production site into `dist/` |
| `npm run deploy` | Build and publish to GitHub Pages |

## Project Structure

```text
src/
+-- components/   React components, each with its own stylesheet
+-- hooks/        Text analysis, file loading, and status message state
+-- utils/        Hidden character detection, cleaning, and file extraction
+-- types/        Shared TypeScript types
+-- test/         Test setup
```

The detection rules live in `src/utils/unicodeHelpers.ts`.

## Credits

- [PDF.js](https://mozilla.github.io/pdf.js/) for reading PDF files
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) for reading DOCX files

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
