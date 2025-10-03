import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import FilterSelector from './components/FilterSelector';
import ImagePreviewModal from './components/ImagePreviewModal';
import ShareButton from './components/ShareButton';
import ParticleBackground from './components/ParticleBackground';
import { Filter } from './types';
import { applyImageFilter } from './services/geminiService';
import { ImageProcessor } from './utils/imageProcessor';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

// Global guidance to improve multi-subject results across all filters
const STYLE_TRANSFER_CONSTRAINTS = (
  'Multi-subject guidance: Apply the requested style consistently to every person and object in the image. ' +
  'Preserve the number of distinct subjects and their relative positions; do not merge, duplicate, or remove subjects. ' +
  'Keep faces, hands, and identities coherent and readable. ' +
  'Respect original clothing and accessories unless the style explicitly restyles them. ' +
  'Avoid heavy warping or occluding key features; ensure clean separation between overlapping subjects.'
);

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    name: 'Artistic & Stylized',
    filters: [
      { id: 'anime', name: 'Anime', prompt: 'Transform into Japanese animation style with professional quality. Use precise linework and cel-shading techniques. Apply vibrant colors with smooth gradients. Create stylized hair with flowing texture and highlights. Render in polished animation format with clean details.' },
      { id: 'anime_v2', name: 'Anime Enhanced', prompt: 'Convert to premium Japanese animation style with studio-grade quality. Apply refined linework with consistent outlines. Use sophisticated cel-shading with layered colors and smooth transitions. Create detailed hair rendering with natural flow. Maintain professional animation standards throughout.' },
      { id: 'anime_v3', name: 'Anime Cinematic', prompt: 'Transform into cinematic Japanese animation style with film-grade quality. Use dynamic linework with varied weights for depth. Apply advanced cel-shading with dramatic lighting effects. Create flowing hair with detailed texture and movement. Render with theatrical animation polish and rich color palettes.' },
      { id: 'cartoon', name: '3D Cartoon', prompt: 'Transform this image into the style of a modern 3D animated film. It should have smooth digital painting, soft lighting, and slightly exaggerated, expressive features.' },
      { id: 'pixar', name: 'Pixar Style', prompt: 'Transform this entire image into the distinctive Pixar 3D animation style. Convert all people into Pixar-style characters with large, expressive eyes, rounded soft facial features, and slightly exaggerated proportions. Apply the signature Pixar body style with softer, more rounded forms and gentle curves. Transform clothing into the clean, simplified Pixar aesthetic with smooth textures and vibrant colors. Convert the entire background and environment into a Pixar-style scene with warm, cinematic lighting, rich saturated colors, and that polished 3D rendered look. Everything should have the characteristic Pixar charm - from character design to environmental details, creating a cohesive animated world that feels warm, inviting, and emotionally engaging.' },
      { id: 'western', name: 'Western Theme', prompt: 'Transform this image into a classic American Old West scene with authentic frontier atmosphere. Convert people into rugged cowboys or frontier folk with weathered faces, cowboy hats, boots, spurs, and period-appropriate clothing like leather chaps, vests, bandanas, and duster coats. Transform the setting into a dusty frontier town, ranch, or desert landscape with wooden buildings, hitching posts, tumbleweeds, and vast open skies. Apply warm, golden hour lighting with dramatic shadows and dust particles in the air. Use a sepia-toned or desaturated color palette with browns, oranges, and muted earth tones. Add authentic western details like horses, cattle, cacti, and weathered wood textures to create an immersive Wild West atmosphere.' },
      { id: 'oil', name: 'Oil Painting', prompt: 'Transform this image into a vibrant, textured oil painting with visible brushstrokes.' },
      { id: 'watercolor', name: 'Watercolor', prompt: 'Turn this image into a soft and dreamy watercolor painting with blended colors and delicate washes.' },
      { id: 'sketch', name: 'Pencil Sketch', prompt: 'Convert this image into a detailed, realistic pencil sketch on textured paper.' },
      { id: 'comic', name: 'Comic Book', prompt: 'Recreate this image in a bold comic book art style. Use heavy black outlines, vibrant primary colors, and Ben-Day dot patterns for shading.' },
      { id: 'lowpoly', name: 'Low Poly', prompt: 'Convert this image into a low-poly geometric art style, using simple polygons and flat shading.' },
      { id: 'ukiyo', name: 'Ukiyo-e', prompt: 'Transform this image into a Japanese Ukiyo-e woodblock print. Use a limited color palette, elegant lines, and a sense of traditional Japanese artistry.' },
      { id: 'impressionist', name: 'Impressionism', prompt: 'Transform this image into an Impressionist painting with loose, visible brushstrokes and emphasis on light and color. Use soft edges, vibrant colors, and capture the fleeting effects of natural light with a painterly quality reminiscent of Monet or Renoir.' },
      { id: 'popart', name: 'Pop Art', prompt: 'Transform this image into a bold Pop Art style with bright, saturated colors and high contrast. Use a limited color palette with flat, graphic areas of color. Apply a screen-printing aesthetic with clean edges and commercial art influence.' },
      { id: 'artdeco', name: 'Art Deco', prompt: 'Transform this image into an Art Deco style with geometric patterns, metallic accents, and luxury aesthetic. Use bold lines, symmetrical designs, and a sophisticated color palette with gold, black, and rich jewel tones.' },
    ],
  },
  {
    name: 'Photo Enhancement',
    filters: [
      { id: 'vintage', name: 'Vintage Photo', prompt: 'Give this photo a vintage film look from the 1970s. Apply a warm, sepia-like color grade, add subtle film grain, and a gentle fade in the blacks.' },
      { id: 'bw', name: 'Black & White', prompt: 'Convert this image to a dramatic, high-contrast black and white photograph. Emphasize deep blacks, bright whites, and striking textures.' },
      { id: 'hdr', name: 'HDR Look', prompt: 'Enhance this image with an HDR effect. Sharpen the details, boost the color saturation, and increase the dynamic range for a vibrant and dramatic look.' },
      { id: 'cinematic', name: 'Cinematic', prompt: 'Apply a cinematic color grade to this image. Use a teal and orange palette, add subtle letterboxing, and create a moody, atmospheric feel.' },
      { id: 'softglow', name: 'Soft Glow', prompt: 'Give this image a soft, ethereal glow. Smooth out skin textures gently, enhance highlights, and create a dreamy, flattering look.' },
      { id: 'filmnoir', name: 'Film Noir', prompt: 'Transform this image into a classic film noir style with high contrast black and white, dramatic shadows, and moody lighting. Emphasize deep blacks and bright whites with strong directional lighting.' },
      { id: 'doubleexposure', name: 'Double Exposure', prompt: 'Create a double exposure effect by blending this image with ghostly, translucent overlapping elements. Use soft, dreamy transparency effects and ethereal blending.' },
    ],
  },
  {
    name: 'Trendy & Social',
    filters: [
      { id: 'cyber', name: 'Cyberpunk', prompt: 'Transform this image with a cyberpunk aesthetic, featuring bright neon lights, futuristic elements, and a vibrant technological atmosphere with glowing accents.' },
      { id: 'vaporwave', name: 'Vaporwave', prompt: 'Submerge this image in a vaporwave aesthetic. Use a palette of pinks and cyans, incorporate classic motifs like Roman busts or 90s computer graphics, and give it a nostalgic, dreamy, and slightly surreal vibe.' },
      { id: 'pixel', name: 'Pixel Art', prompt: 'Convert this image into 8-bit pixel art. Simplify the shapes and use a limited color palette, reminiscent of a classic video game.' },
      { id: 'vhs', name: 'Retro VHS', prompt: 'Give this image a retro VHS aesthetic. Add screen distortion, a timestamp overlay in a digital font, and a color palette shifted towards pinks and cyans.' },
      { id: 'graffiti', name: 'Street Art', prompt: 'Transform this image into vibrant street art with spray paint textures, bold colors, and urban aesthetic. Use layered effects and energetic, expressive brushwork.' },
      { id: 'isometric', name: 'Isometric Art', prompt: 'Convert this image into an isometric 3D perspective with clean geometric forms, game-like aesthetic, and technical precision. Use flat colors and sharp edges.' },
    ],
  },
  {
    name: 'Fun & Transformative',
    filters: [
      { id: 'fantasy', name: 'Fantasy World', prompt: 'Turn this image into a scene from a fantasy world. Add glowing magical elements, an enchanted forest background, and a whimsical, fairy-tale atmosphere.' },
      { id: 'galaxy_bg', name: 'Galaxy BG', prompt: 'Keep the main subject in the foreground and replace the background with a beautiful, sprawling galaxy filled with nebulae and stars.' },
      { id: '1890s', name: '1890s Photo', prompt: 'Make this look like an authentic, aged photograph from the 1890s. Convert it to sepia, add textures of cracked emulsion and faded paper.' },
      { id: 'halloween', name: 'Halloween', prompt: 'Give this image a festive Halloween atmosphere. Add a low-lying fog, an autumn color grade with warm orange tones, and subtle pumpkin-themed lighting effects.' },
      { id: 'steampunk', name: 'Steampunk', prompt: 'Reimagine this image in a steampunk style, incorporating gears, brass, and Victorian-era technology.' },
      { id: 'stainedglass', name: 'Stained Glass', prompt: 'Transform this image into a beautiful stained glass window with colorful glass segments separated by dark lead lines. Use vibrant, translucent colors and geometric divisions.' },
      { id: 'mosaic', name: 'Mosaic', prompt: 'Convert this image into a mosaic artwork made of small colored tiles or stones. Create texture and depth through individual tile placement with visible grout lines.' },
      { id: 'chineseink', name: 'Chinese Ink', prompt: 'Transform this image into a traditional Chinese ink painting with flowing brushwork, minimalist composition, and emphasis on negative space. Use black ink with subtle washes.' },
    ],
  },
];

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dragCounter, setDragCounter] = useState<number>(0);

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setGeneratedImageUrl(null);
    setActiveFilter(null);
    setError(null);
  };

  const handleApplyFilter = async (filter: Filter) => {
    if (!imageFile) return;
    setIsLoading(true);
    setError(null);
    setActiveFilter(filter);
    
    // Scroll to top on mobile when filter is applied
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    try {
      const composedPrompt = `${STYLE_TRANSFER_CONSTRAINTS}\n\n${filter.prompt}`;
      const base64Data = await applyImageFilter(imageFile, composedPrompt);
      setGeneratedImageUrl(`data:image/png;base64,${base64Data}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setGeneratedImageUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilter = () => {
    setActiveFilter(null);
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleReset = () => {
    setImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setActiveFilter(null);
    setError(null);
    setIsLoading(false);
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    const link = document.createElement('a');
    link.href = generatedImageUrl;
    link.download = `stylized-${activeFilter?.id || 'image'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePeekStart = () => setIsPeeking(true);
  const handlePeekEnd = () => setIsPeeking(false);

  const handleOpenPreview = () => {
    if (generatedImageUrl) {
      setIsPreviewOpen(true);
    }
  };
  const handleClosePreview = () => setIsPreviewOpen(false);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragOver(false);
      }
      return newCount;
    });
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFile = files.find(file => {
      // Check MIME type first
      if (file.type.startsWith('image/')) return true;
      
      // Check file extension for files without proper MIME type (common with HEIC)
      const validExtensions = /\.(jpg|jpeg|png|webp|heic|heif|avif)$/i;
      return validExtensions.test(file.name);
    });
    
    if (imageFile) {
      try {
        // Process the image for Android compatibility
        const processed = await ImageProcessor.processImage(imageFile);
        handleImageUpload(processed.file);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
        setError(errorMessage);
        console.error('Image processing error:', err);
      }
    }
  };

  const renderContent = () => {
    if (!originalImageUrl) {
      return <ImageUploader onImageUpload={handleImageUpload} />;
    }

    return (
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row lg:space-x-8 items-start">
        {/* Left Column: Image Display */}
        <div className="w-full lg:w-2/3">
          <ImageDisplay
            originalImageUrl={originalImageUrl}
            generatedImageUrl={generatedImageUrl}
            isLoading={isLoading}
            isPeeking={isPeeking}
            onPeekStart={handlePeekStart}
            onPeekEnd={handlePeekEnd}
            onOpenPreview={handleOpenPreview}
            onDownload={handleDownload}
            error={error}
            activeFilterName={activeFilter?.name || null}
          />
        </div>

        {/* Right Column: Controls */}
        <div className="w-full lg:w-1/3 mt-8 lg:mt-0 flex flex-col">
           {/* Scrollable Filters Section */}
           <div className="flex-1 glass-panel p-3 lg:p-6 mb-6 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto scrollable-filters">
                <FilterSelector
                  categories={FILTER_CATEGORIES}
                  onSelectFilter={handleApplyFilter}
                  onClearFilter={handleClearFilter}
                  isLoading={isLoading}
                  activeFilterId={activeFilter?.id || null}
                />
              </div>
           </div>

           {/* Fixed Action Buttons */}
           <div className="glass-panel p-6">
              <div className="flex flex-col space-y-3">
                 <button
                  onClick={handleDownload}
                  disabled={!generatedImageUrl || isLoading}
                  className="w-full px-6 py-3 bg-green-500/20 backdrop-blur-xl border border-green-400/30 text-green-100 font-semibold rounded-2xl hover:bg-green-500/30 hover:border-green-400/50 transition-all duration-300 disabled:bg-gray-500/20 disabled:border-gray-400/20 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center justify-center shadow-lg gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Image
                </button>
                <ShareButton 
                  imageUrl={generatedImageUrl}
                  styleName={activeFilter?.name}
                />
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-3 bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white font-medium rounded-2xl hover:bg-white/[0.12] hover:border-white/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload New Image
                </button>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-between p-4 md:p-8 font-sans text-gray-200 relative subtle-bg ${
        isDragOver ? 'bg-blue-900/20' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Subtle mesh overlay */}
      <div className="absolute inset-0 mesh-overlay pointer-events-none" />
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-600/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/[0.08] backdrop-blur-2xl border-2 border-dashed border-blue-400/60 rounded-3xl p-12 text-center shadow-2xl shadow-black/30">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-2xl font-bold text-blue-200 mb-2">Drop your image here</h3>
            <p className="text-blue-300">Release to upload and start styling</p>
          </div>
        </div>
      )}
      
      <Header />
      <main className="w-full flex-grow flex items-center justify-center px-4 my-8">
        {renderContent()}
      </main>
      <Footer />
      {isPreviewOpen && generatedImageUrl && (
        <ImagePreviewModal imageUrl={generatedImageUrl} onClose={handleClosePreview} />
      )}
    </div>
  );
};

export default App;
