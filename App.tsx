import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import FilterSelector from './components/FilterSelector';
import ImagePreviewModal from './components/ImagePreviewModal';
import PromptInput from './components/PromptInput';
import { Filter } from './types';
import { applyImageFilter } from './services/geminiService';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    name: 'Artistic & Stylized',
    filters: [
      { id: 'anime', name: 'Anime', prompt: 'Transform this image into a clean, polished anime-style illustration. The style should feature sharp black line art around the main subjects. Use bright, cel-shaded coloring with smooth gradient transitions for a modern look. Apply balanced highlights and subtle shadows to create depth. Maintain realistic body proportions while stylizing features like the face and simplifying anatomical details to match a contemporary anime art style.' },
      { id: 'cartoon', name: '3D Cartoon', prompt: 'Transform this image into the style of a modern 3D animated film. It should have smooth digital painting, soft lighting, and slightly exaggerated, expressive features.' },
      { id: 'pixar', name: 'Pixar Style', prompt: 'Transform this entire image into the distinctive Pixar 3D animation style. Convert all people into Pixar-style characters with large, expressive eyes, rounded soft facial features, and slightly exaggerated proportions. Apply the signature Pixar body style with softer, more rounded forms and gentle curves. Transform clothing into the clean, simplified Pixar aesthetic with smooth textures and vibrant colors. Convert the entire background and environment into a Pixar-style scene with warm, cinematic lighting, rich saturated colors, and that polished 3D rendered look. Everything should have the characteristic Pixar charm - from character design to environmental details, creating a cohesive animated world that feels warm, inviting, and emotionally engaging.' },
      { id: 'oil', name: 'Oil Painting', prompt: 'Transform this image into a vibrant, textured oil painting with visible brushstrokes.' },
      { id: 'watercolor', name: 'Watercolor', prompt: 'Turn this image into a soft and dreamy watercolor painting with blended colors and delicate washes.' },
      { id: 'sketch', name: 'Pencil Sketch', prompt: 'Convert this image into a detailed, realistic pencil sketch on textured paper.' },
      { id: 'comic', name: 'Comic Book', prompt: 'Recreate this image in a bold comic book art style. Use heavy black outlines, vibrant primary colors, and Ben-Day dot patterns for shading.' },
      { id: 'lowpoly', name: 'Low Poly', prompt: 'Convert this image into a low-poly geometric art style, using simple polygons and flat shading.' },
      { id: 'ukiyo', name: 'Ukiyo-e', prompt: 'Transform this image into a Japanese Ukiyo-e woodblock print. Use a limited color palette, elegant lines, and a sense of traditional Japanese artistry.' },
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
    ],
  },
  {
    name: 'Trendy & Social',
    filters: [
      { id: 'cyber', name: 'Cyberpunk', prompt: 'Transform this image with a cyberpunk aesthetic, featuring neon lights, futuristic elements, and a dark, moody atmosphere.' },
      { id: 'vaporwave', name: 'Vaporwave', prompt: 'Submerge this image in a vaporwave aesthetic. Use a palette of pinks and cyans, incorporate classic motifs like Roman busts or 90s computer graphics, and give it a nostalgic, dreamy, and slightly surreal vibe.' },
      { id: 'pixel', name: 'Pixel Art', prompt: 'Convert this image into 8-bit pixel art. Simplify the shapes and use a limited color palette, reminiscent of a classic video game.' },
      { id: 'vhs', name: 'Retro VHS', prompt: 'Give this image a retro VHS aesthetic. Add screen distortion, a timestamp overlay in a digital font, and a color palette shifted towards pinks and cyans.' },
    ],
  },
  {
    name: 'Fun & Transformative',
    filters: [
      { id: 'fantasy', name: 'Fantasy World', prompt: 'Turn this image into a scene from a fantasy world. Add glowing magical elements, an enchanted forest background, and a whimsical, fairy-tale atmosphere.' },
      { id: 'galaxy_bg', name: 'Galaxy BG', prompt: 'Keep the main subject in the foreground and replace the background with a beautiful, sprawling galaxy filled with nebulae and stars.' },
      { id: '1890s', name: '1890s Photo', prompt: 'Make this look like an authentic, aged photograph from the 1890s. Convert it to sepia, add textures of cracked emulsion and faded paper.' },
      { id: 'halloween', name: 'Halloween', prompt: 'Give this image a spooky Halloween vibe. Add a low-lying fog, a dark and moody color grade with hints of orange, and maybe a subtle jack-o\'-lantern glow.' },
      { id: 'steampunk', name: 'Steampunk', prompt: 'Reimagine this image in a steampunk style, incorporating gears, brass, and Victorian-era technology.' },
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
  const [userPrompt, setUserPrompt] = useState<string>('');

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
    
    try {
      const extra = userPrompt.trim();
      const combinedPrompt = extra
        ? `${filter.prompt}\n\nAdditional user guidance to apply consistently: ${extra}`
        : filter.prompt;
      const base64Data = await applyImageFilter(imageFile, combinedPrompt);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
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
            error={error}
          />
        </div>

        {/* Right Column: Controls */}
        <div className="w-full lg:w-1/3 mt-8 lg:mt-0">
           <div className="sticky top-8 flex flex-col space-y-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
              <FilterSelector
                categories={FILTER_CATEGORIES}
                onSelectFilter={handleApplyFilter}
                isLoading={isLoading}
                activeFilterId={activeFilter?.id || null}
              />
              <PromptInput
                value={userPrompt}
                onChange={setUserPrompt}
                disabled={isLoading}
              />
              <div className="flex flex-col space-y-3 pt-4 border-t border-white/20">
                 <button
                  onClick={handleDownload}
                  disabled={!generatedImageUrl || isLoading}
                  className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center shadow-lg gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Download Image
                </button>
                <button
                  onClick={handleReset}
                  className="w-full px-6 py-2 bg-gray-600/50 text-white font-semibold rounded-lg hover:bg-gray-600/80 transition-colors"
                >
                  Upload New Image
                </button>
              </div>
               {error && (
                <div className="text-center p-4 bg-red-900/50 border border-red-600 rounded-lg">
                  <p className="font-semibold text-red-200">Styling Failed</p>
                  <p className="mt-1 text-sm text-red-300">{error}</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`min-h-screen flex flex-col items-center justify-between p-4 md:p-8 font-sans text-gray-200 relative ${
        isDragOver ? 'bg-blue-900/20' : ''
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="fixed inset-0 bg-blue-600/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl border-2 border-dashed border-blue-400 rounded-2xl p-12 text-center">
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
