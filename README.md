# Checkered Background Remover

A client-side React application that removes checkered patterns and solid backgrounds from images using OpenCV.js.

## Features

- 🎨 Remove checkered patterns (transparency indicators)
- 🖼️ Remove solid color backgrounds
- 🌓 Remove shadows from backgrounds
- 🔒 100% client-side processing - your images never leave your browser
- ⚡ Fast processing with OpenCV.js
- 📱 Responsive design with TailwindCSS
- 💾 Export as PNG with transparency

## Live Demo

Visit: `https://jagadish-k.github.io/remove-bg/`

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## How It Works

1. Upload a PNG or JPG image
2. Choose which processing options to apply:
   - Remove checkered pattern
   - Remove solid background
   - Remove shadows
3. Adjust the tolerance slider for fine-tuning
4. Click "Process Image"
5. Download the result as a transparent PNG

## Tech Stack

- React 19
- TypeScript
- Vite
- TailwindCSS
- OpenCV.js (via opencv-react-ts)
- GitHub Actions for CI/CD

## Privacy

All image processing happens entirely in your browser using WebAssembly. No images are uploaded to any server.

## License

MIT
