# UniDetect

![UniDetect Logo](public/logo192.png)

UniDetect is a modern web application designed to help users detect and clean hidden Unicode characters in text.

## Features

- **Real-time Unicode Detection**: Instantly detect hidden and special Unicode characters in your text.
- **Visual Character Highlighting**: Hidden characters are highlighted with tooltips showing their Unicode codes.
- **Multiple File Format Support**: Process text from various file types:
  - PDF documents
  - Microsoft Word (DOCX) files
  - Plain text files (TXT)
  - Markdown files (MD)
- **Drag & Drop Support**: Easy file uploading through drag and drop interface.
- **Clean Text Functionality**: One-click cleaning of hidden characters with automatic clipboard copy.
- **Real-time Statistics**: Monitor your text with detailed statistics:
  - Total character count
  - Visible/hidden character counts
  - Newline and space counts
  - Byte size information
- **Privacy-Focused**: All text processing is done locally in your browser - no data is sent to any server.

## Prerequisites

- Node.js 16.x or higher
- npm (Node Package Manager)
- A modern web browser

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/haseebn19/hidden-unicode.git
   ```

2. Navigate to the project directory:
   ```bash
   cd hidden-unicode
   ```

3. Install the required dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. **Text Input**:
   - Paste text directly into the text area
   - Drag and drop supported files
   - Type or edit text directly

2. **Character Detection**:
   - Hidden characters are automatically highlighted
   - Hover over highlights to see Unicode information
   - View detailed statistics about your text

3. **Text Cleaning**:
   - Click "Clean Text" to remove hidden characters
   - Cleaned text is automatically copied to clipboard
   - Original formatting and line breaks are preserved

## Building for Production

To create a production build:
```bash
npm run build
```

The build files will be created in the `build` directory.

## Contributing

If you'd like to contribute to UniDetect or have suggestions for improvements, please fork the repository and create a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Credits

This project uses open-source libraries:
- [PDF.js](https://mozilla.github.io/pdf.js/) - PDF file processing
- [Mammoth.js](https://github.com/mwilliamson/mammoth.js) - DOCX file processing