# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side React application that removes checkered patterns and solid backgrounds from images using OpenCV.js. All image processing happens entirely in the browser using WebAssembly - no images are uploaded to any server.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on localhost:5173 by default)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture

### Core Processing Flow

The application follows this flow:
1. User uploads image via `ImageUploader` component
2. Image is loaded into browser memory as `HTMLImageElement`
3. User configures processing options in `ProcessingControls`
4. `processImage()` in `src/utils/imageProcessor.ts` performs OpenCV operations
5. Result is displayed in `ResultModal` with download/crop options

### Key Components

**App.tsx** (`src/App.tsx`)
- Main application component wrapped in `OpenCvProvider`
- Manages state for original image, processed image, and processing options
- Coordinates image upload, processing, and result display
- OpenCV loading happens via `useOpenCv()` hook from `opencv-react-ts`

**Image Processing** (`src/utils/imageProcessor.ts`)
- Core processing logic using OpenCV.js
- Three removal strategies:
  - **Checkered pattern removal**: Samples corner pixels to detect pattern colors, removes matching pixels
  - **Solid background removal**: Uses edge sampling + flood fill to detect and remove dominant background
  - **Shadow removal**: Converts to HSV color space, detects dark regions via V-channel thresholding
- All operations work on Mat objects and manipulate alpha channel directly
- Memory management: Always delete OpenCV Mat objects after use to prevent leaks

**Components**
- `ImageUploader`: Handles file upload via input or drag-and-drop
- `ProcessingControls`: UI for checkboxes (removeCheckered, removeSolid, removeShadow) and tolerance slider
- `ResultModal`: Displays processed image with crop and download functionality

### State Management

All state is managed locally in `App.tsx` using React hooks:
- `originalImage`: HTMLImageElement of uploaded image
- `processedImage`: Base64 data URL of processed result
- `options`: ProcessingOptions object (boolean flags + tolerance number)
- `processing`: Boolean flag to show loading state
- OpenCV loaded state comes from `useOpenCv()` hook

### Image Processing Details

**Color matching tolerance**: The `tolerance` option (5-50) controls color difference threshold. Formula: `Math.abs(r1-r2) + Math.abs(g1-g2) + Math.abs(b1-b2) < tolerance * 3`

**OpenCV Mat lifecycle**:
- Create Mat from HTMLImageElement via `cv.imread()`
- Convert to RGBA if needed
- Create separate alpha channel (CV_8UC1)
- Apply processing functions that modify alpha
- Merge channels and export via canvas.toDataURL()
- CRITICAL: Delete all Mat objects to avoid memory leaks

**Background detection**: Edge sampling strategy - samples pixels from all four edges at intervals, averages to find dominant background color

## Deployment

GitHub Actions workflow deploys to GitHub Pages on push to main:
- Build runs `npm ci` and `npm run build`
- Outputs to `dist/` directory
- Deploys to `https://jagadish-k.github.io/bg-remover/`

## Tech Stack

- React 19 with TypeScript
- Vite (build tool and dev server)
- TailwindCSS 4 for styling
- OpenCV.js via `opencv-react-ts` wrapper
- ESLint with TypeScript and React plugins
