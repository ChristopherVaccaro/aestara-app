import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import FilterSelector from './components/FilterSelector';
import ImagePreviewModal from './components/ImagePreviewModal';
import ShareButton from './components/ShareButton';
import ParticleBackground from './components/ParticleBackground';
import ImageComparison from './components/ImageComparison';
import StyleHistory, { HistoryItem } from './components/StyleHistory';
import LoadingProgress from './components/LoadingProgress';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Filter } from './types';
import { applyImageFilter } from './services/geminiService';
import { ImageProcessor } from './utils/imageProcessor';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

// Global guidance to improve style consistency across all filters
const STYLE_TRANSFER_CONSTRAINTS = (
  'Apply the artistic style uniformly across the entire composition. ' +
  'Maintain the original spatial arrangement and proportions. ' +
  'Preserve all visual elements and their relationships. ' +
  'Keep details coherent and clearly defined within the chosen aesthetic. ' +
  'Ensure consistent treatment of all components without distortion or omission.'
);

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    name: 'Artistic & Stylized',
    filters: [
      { id: 'anime', name: 'Anime', prompt: 'Transform into Japanese animation style with professional quality. Use precise linework and cel-shading techniques. Apply vibrant colors with smooth gradients. Create stylized hair with flowing texture and highlights. Render in polished animation format with clean details.' },
      { id: 'anime_v2', name: 'Anime Enhanced', prompt: 'Convert to premium Japanese animation style with studio-grade quality. Apply refined linework with consistent outlines. Use sophisticated cel-shading with layered colors and smooth transitions. Create detailed hair rendering with natural flow. Maintain professional animation standards throughout.' },
      { id: 'anime_v3', name: 'Anime Cinematic', prompt: 'Transform into cinematic Japanese animation style with film-grade quality. Use dynamic linework with varied weights for depth. Apply advanced cel-shading with dramatic lighting effects. Create flowing hair with detailed texture and movement. Render with theatrical animation polish and rich color palettes.' },
      { id: 'cartoon', name: '3D Cartoon', prompt: 'Transform this image into the style of a modern 3D animated film. It should have smooth digital painting, soft lighting, and slightly exaggerated, expressive features.' },
      { id: 'pixar', name: 'Pixar Style', prompt: 'Render in the distinctive Pixar 3D animation aesthetic with characteristic large expressive eyes, rounded soft features, and gentle exaggerated proportions. Apply the signature Pixar visual style with softer forms and smooth curves throughout. Use clean, simplified design with smooth textures and vibrant colors. Create a cohesive scene with warm cinematic lighting, rich saturated colors, and polished 3D rendered appearance. Infuse the characteristic Pixar charm with inviting warmth and emotional depth across all elements.' },
      { id: 'western', name: 'Western Theme', prompt: 'Reimagine in classic American Old West aesthetic with authentic frontier atmosphere. Apply rugged cowboy styling with weathered textures, cowboy hats, boots, leather elements, vests, bandanas, and duster coats. Create a dusty frontier setting with wooden buildings, hitching posts, tumbleweeds, and vast open skies. Use warm golden hour lighting with dramatic shadows and atmospheric dust. Apply sepia-toned or desaturated color palette with browns, oranges, and muted earth tones. Include authentic western details like horses, cattle, cacti, and weathered wood textures for immersive Wild West atmosphere.' },
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
      { id: 'cyber', name: 'Cyberpunk', prompt: 'Apply a cyberpunk aesthetic with bright neon lights in pink, cyan, and purple. Add futuristic technological elements, holographic effects, and vibrant glowing accents. Use high-contrast lighting with deep shadows and luminous highlights for a dystopian urban atmosphere.' },
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
      { id: 'halloween', name: 'Halloween', prompt: 'Create a festive autumn evening atmosphere with mysterious ambiance. Add atmospheric mist, warm orange and purple color grading, and soft glowing lighting effects reminiscent of carved decorations.' },
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
  
  // New UX improvements
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [useComparisonSlider, setUseComparisonSlider] = useState<boolean>(false);
  
  const MAX_HISTORY = 15; // Limit history to prevent memory issues

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setOriginalImageUrl(URL.createObjectURL(file));
    setGeneratedImageUrl(null);
    setActiveFilter(null);
    setError(null);
    // Clear history when new image is uploaded
    setHistory([]);
    setCurrentHistoryIndex(-1);
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
      const newImageUrl = `data:image/png;base64,${base64Data}`;
      setGeneratedImageUrl(newImageUrl);
      
      // Add to history
      const newHistoryItem: HistoryItem = {
        id: Date.now().toString(),
        imageUrl: newImageUrl,
        filterName: filter.name,
        filterId: filter.id,
        timestamp: Date.now(),
      };
      
      // Remove any future history if we're not at the end
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      const updatedHistory = [...newHistory, newHistoryItem].slice(-MAX_HISTORY);
      setHistory(updatedHistory);
      setCurrentHistoryIndex(updatedHistory.length - 1);
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
    setHistory([]);
    setCurrentHistoryIndex(-1);
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
  
  // History navigation handlers
  const handleSelectHistory = (index: number) => {
    if (history[index]) {
      setGeneratedImageUrl(history[index].imageUrl);
      setCurrentHistoryIndex(index);
      const filter = FILTER_CATEGORIES
        .flatMap(cat => cat.filters)
        .find(f => f.id === history[index].filterId);
      setActiveFilter(filter || null);
    }
  };
  
  const handleClearHistory = () => {
    setHistory([]);
    setCurrentHistoryIndex(-1);
  };
  
  const handleUndo = () => {
    if (currentHistoryIndex > 0) {
      handleSelectHistory(currentHistoryIndex - 1);
    }
  };
  
  const handleRedo = () => {
    if (currentHistoryIndex < history.length - 1) {
      handleSelectHistory(currentHistoryIndex + 1);
    }
  };
  
  // Keyboard shortcuts
  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onDownload: handleDownload,
    onReset: handleReset,
  });

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
          {isLoading ? (
            <div className="w-full aspect-square glass-image-container overflow-hidden ring-1 ring-white/[0.08] flex items-center justify-center rounded-3xl">
              <LoadingProgress 
                message={activeFilter ? `Applying ${activeFilter.name}...` : 'Processing image...'}
                estimatedTimeMs={10000}
              />
            </div>
          ) : generatedImageUrl && useComparisonSlider ? (
            <>
              <ImageComparison
                originalImageUrl={originalImageUrl}
                generatedImageUrl={generatedImageUrl}
                activeFilterName={activeFilter?.name || 'Styled'}
              />
              {/* Toggle back to hold-to-peek */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => setUseComparisonSlider(false)}
                  className="text-sm text-gray-400 hover:text-purple-400 transition-colors"
                >
                  Switch to Hold-to-Peek mode
                </button>
              </div>
            </>
          ) : (
            <>
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
              {/* Toggle to comparison slider */}
              {generatedImageUrl && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setUseComparisonSlider(true)}
                    className="text-sm text-gray-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                    Switch to Comparison Slider
                  </button>
                </div>
              )}
            </>
          )}
          
          {/* Error Display */}
          {error && !isLoading && (
            <div className="mt-4 p-4 bg-red-500/[0.08] backdrop-blur-xl border border-red-400/30 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-red-200 text-sm">Error</p>
                  <p className="mt-1 text-xs text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Controls */}
        <div className="w-full lg:w-1/3 mt-8 lg:mt-0 flex flex-col">
           {/* Style History */}
           {history.length > 0 && (
             <StyleHistory
               history={history}
               currentIndex={currentHistoryIndex}
               onSelectHistory={handleSelectHistory}
               onClearHistory={handleClearHistory}
             />
           )}
           
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
        <ImagePreviewModal 
          imageUrl={generatedImageUrl} 
          onClose={handleClosePreview}
          filterName={activeFilter?.name}
        />
      )}
    </div>
  );
};

export default App;
