# AI Image Stylizer

A powerful web application that transforms your photos into stunning artwork using advanced AI technology. Apply over 30 professional art styles ranging from anime and oil paintings to cyberpunk and vintage photography effects.

## Features

### Extensive Style Library
- **Artistic & Stylized**: Anime, Oil Painting, Watercolor, Pencil Sketch, Comic Book, Ukiyo-e, Impressionism, Pop Art, Art Deco
- **Photo Enhancement**: Vintage Photo, Black & White, HDR, Cinematic, Soft Glow, Film Noir, Double Exposure
- **Trendy & Social**: Cyberpunk, Vaporwave, Pixel Art, Retro VHS, Street Art, Isometric
- **Fun & Transformative**: Realism, Fantasy World, Galaxy Background, 1890s Photo, Halloween, Steampunk, Stained Glass, Mosaic, Chinese Ink
- **Era & Alternative**: 90s Grunge, Y2K, 80s Synthwave, Retro Futurism

### Advanced Features
- **Image Comparison Tools**: Side-by-side slider comparison and hold-to-peek modes
- **Style History**: Track and revisit your previous transformations
- **Keyboard Shortcuts**: Quick access to common actions
- **Image Processing**: Automatic format conversion for HEIC, HEIF, and AVIF files
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Privacy-Focused**: Images processed securely without permanent storage
- **Share Functionality**: Easy sharing via native device sharing or custom links

### User Experience
- Glass morphism UI with particle background effects
- Real-time loading progress indicators
- Drag-and-drop image upload
- Custom prompt input for personalized styles
- Comprehensive feedback system
- Terms of Service and Privacy Policy

## Technology Stack

### Frontend
- **React 19** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling

### AI & Backend
- **Google Gemini AI** - Advanced image generation and style transfer
- **Vercel Blob Storage** - Temporary image hosting
- **Custom Image Processing** - Format conversion and optimization

### Key Libraries
- Custom hooks for keyboard shortcuts
- Image processor utility for format compatibility
- Glass UI design system

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Google Gemini API key
- Vercel Blob Storage token (for image hosting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-image-stylizer.git
cd ai-image-stylizer
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
ai-image-stylizer/
├── api/                          # API endpoints
│   └── apply-image-filter.ts    # Main filter application endpoint
├── components/                   # React components
│   ├── AnalysisResult.tsx
│   ├── ComparisonModeToggle.tsx
│   ├── FeedbackForm.tsx
│   ├── FilterSelector.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   ├── ImageComparison.tsx
│   ├── ImageDisplay.tsx
│   ├── ImagePreviewModal.tsx
│   ├── ImageUploader.tsx
│   ├── LoadingProgress.tsx
│   ├── Logo.tsx
│   ├── ParticleBackground.tsx
│   ├── PrivacyPolicy.tsx
│   ├── PromptInput.tsx
│   ├── ShareButton.tsx
│   ├── Spinner.tsx
│   ├── StyleHistory.tsx
│   ├── TermsOfService.tsx
│   └── Toast.tsx
├── hooks/                        # Custom React hooks
│   └── useKeyboardShortcuts.ts
├── services/                     # Service layer
│   ├── geminiService.ts         # Gemini AI integration
│   └── imageHostingService.ts   # Image upload/hosting
├── utils/                        # Utility functions
│   └── imageProcessor.ts        # Image format conversion
├── App.tsx                       # Main application component
├── glass-ui.css                 # Glass morphism styles
├── index.html
├── index.tsx                     # Application entry point
├── types.ts                      # TypeScript type definitions
├── vite.config.ts               # Vite configuration
└── package.json
```

## API Configuration

### Gemini API Setup
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### Vercel Blob Storage Setup
1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Create a new Blob store in your project settings
3. Copy the read/write token
4. Add it to your `.env.local` file

## Usage Guide

### Basic Workflow
1. **Upload Image**: Click or drag-and-drop an image (PNG, JPG, WebP, HEIC supported)
2. **Select Category**: Choose from Artistic, Photo Enhancement, Trendy, Fun, or Era styles
3. **Pick Style**: Click on any of the 30+ available art styles
4. **Wait for Processing**: Watch the progress indicator as AI transforms your image
5. **Compare Results**: Use the slider or hold-to-peek to compare original and styled versions
6. **Download or Share**: Save your creation or share it directly

### Advanced Features
- **Custom Prompts**: Use the prompt input for personalized style instructions
- **Style History**: Access your previous transformations from the history panel
- **Keyboard Shortcuts**: Press `?` to view available shortcuts
- **Comparison Modes**: Toggle between slider and hold-to-peek comparison

## Keyboard Shortcuts

- `Escape` - Close modals and overlays
- `Arrow Keys` - Navigate through style history
- `Enter` - Apply selected style
- `Space` - Toggle comparison mode

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

Modern browsers with ES6+ support required.

## Performance Optimization

- Automatic image compression for large files
- Format conversion for compatibility
- Lazy loading of components
- Optimized bundle size with Vite
- Efficient state management

## Privacy & Security

- Images are processed securely through Google Gemini AI
- Temporary storage only - images are not permanently saved
- No user data collection beyond necessary processing
- Compliant with privacy best practices
- See Privacy Policy in-app for full details

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code style
- Test thoroughly before submitting
- Update documentation as needed

## Known Limitations

- Maximum image size: 10MB
- Processing time varies based on image complexity (typically 10-30 seconds)
- Some styles may be blocked by AI safety filters for certain content
- Internet connection required for AI processing

## Troubleshooting

### Common Issues

**"Invalid image format" error:**
- Ensure your image is in a supported format (PNG, JPG, WebP, HEIC)
- Try converting the image to JPG format
- Check that the file size is under 10MB

**"API did not return an image" error:**
- Content may have been blocked by AI safety filters
- Try a different image or style
- Check your API key is valid and has quota remaining

**Slow processing:**
- Large images take longer to process
- Complex styles require more processing time
- Check your internet connection speed

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Powered by Google Gemini AI
- Built with React and Vite
- Hosted on Vercel
- UI inspired by glass morphism design trends

## Support

For questions, feedback, or bug reports, please use the in-app feedback form or contact: therise03@hotmail.com

## Android App

This project can be built as a native Android app using Capacitor!

### Quick Start
```bash
npm run build
npm run cap:open:android
```

See **[QUICK_START_ANDROID.md](QUICK_START_ANDROID.md)** for step-by-step instructions.

### Features
- 📱 Native Android app
- 📸 Camera integration
- 🖼️ Photo gallery access
- 📤 Native share functionality
- 💾 Save images to device
- 🎨 Full-screen immersive experience

For comprehensive setup and deployment guide, see **[ANDROID_SETUP.md](ANDROID_SETUP.md)**.

## Roadmap

Future enhancements planned:
- Additional art styles and filters
- Batch processing for multiple images
- Style intensity controls
- Custom style creation
- ✅ ~~Mobile app versions~~ (Android app available!)
- API access for developers
- iOS app version

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Active Development
