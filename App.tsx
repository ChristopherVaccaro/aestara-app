import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ImageDisplay from './components/ImageDisplay';
import FilterSelector from './components/FilterSelector';
import CategorySelector from './components/CategorySelector';
import ImagePreviewModal from './components/ImagePreviewModal';
import ParticleBackground from './components/ParticleBackground';
import ImageComparison from './components/ImageComparison';
import StyleHistory, { HistoryItem } from './components/StyleHistory';
import LoadingProgress from './components/LoadingProgress';
import BlurredImageLoading from './components/BlurredImageLoading';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FeedbackForm from './components/FeedbackForm';
import DevModeToggle from './components/DevModeToggle';
import MobileBottomSheet from './components/MobileBottomSheet';
import MobileFloatingButton from './components/MobileFloatingButton';
import { AdminDashboard } from './components/AdminDashboard';
import ImageEditor from './components/ImageEditor';
import StyleGallery from './components/StyleGallery';
import GlamatronStyleSidebar from './components/GlamatronStyleSidebar';
import Footer from './components/Footer';
import GalleryModal from './components/GalleryModal';
import { useGallery } from './contexts/GalleryContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Filter } from './types';
import { applyImageFilter } from './services/geminiService';
import { ImageProcessor } from './utils/imageProcessor';
import { GenerationFeedback } from './components/GenerationFeedback';
import { useToast, ToastContainer } from './components/Toast';
import {
  getActivePrompt,
} from './services/voteTrackingService';
import {
  getPrompt,
  refreshPromptCache,
  seedAllPrompts,
  incrementGenerationCount,
} from './services/promptService';
import { recordPromptUsage } from './services/userPromptUsageService';
import { useAuth } from './contexts/AuthContext';
import { getStyleExampleThumbSources } from './utils/styleExamples';

interface FilterCategory {
  name: string;
  filters: Filter[];
}

 type Page = 'main' | 'admin' | 'styles';

 const getPageFromLocation = (): Page => {
   const params = new URLSearchParams(window.location.search);
   const page = params.get('page');
   if (page === 'admin') return 'admin';
   if (page === 'styles') return 'styles';
   return 'main';
 };

 const buildUrlForPage = (page: Page): string => {
   const params = new URLSearchParams(window.location.search);
   if (page === 'admin') params.set('page', 'admin');
   else if (page === 'styles') params.set('page', 'styles');
   else params.delete('page');
   const query = params.toString();
   return `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash || ''}`;
 };

// Global guidance to improve style consistency across all filters
const STYLE_TRANSFER_CONSTRAINTS = (
  'CRITICAL IDENTITY PRESERVATION RULES - HIGHEST PRIORITY:\n' +
  '1. FACIAL STRUCTURE: Preserve exact facial bone structure, face shape, jawline, chin shape, cheekbones, and forehead. The person MUST remain 100% recognizable.\n' +
  '2. FACIAL FEATURES: Keep identical eye shape, eye spacing, nose shape, nose bridge, mouth shape, lip proportions, and ear placement. Do NOT alter any facial measurements or proportions.\n' +
  '3. BODY & POSE: Maintain exact body position, pose, posture, limb placement, and overall composition. Do NOT change body proportions or positioning.\n' +
  '4. LIKENESS: The subject must be instantly recognizable as the same person. Preserve their unique facial characteristics and identity completely.\n' +
  '5. STYLE APPLICATION: Apply ONLY the artistic rendering style (brushstrokes, colors, textures, lighting effects). Change styling elements like hair texture, makeup, or clothing texture ONLY - never the underlying anatomy.\n' +
  '6. WHAT TO PRESERVE: Face geometry, facial proportions, body structure, pose, composition, spatial relationships, background layout.\n' +
  '7. WHAT TO CHANGE: Only the artistic medium, rendering technique, color palette, lighting style, and surface textures according to the chosen art style.\n' +
  '\nApply the artistic style as a visual filter over the existing image while keeping all structural elements identical.'
);

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    name: 'Artistic & Stylized',
    filters: [
      { id: 'anime', name: 'Anime', prompt: 'Apply anime illustration style rendering to this image. PRESERVE: Exact facial structure, face shape, eye shape, nose shape, mouth shape, all facial proportions, body pose, and composition. STYLE: Traditional 2D anime cel-shading with clean linework, solid color blocks, and soft shadows. Render the existing features in anime aesthetic without altering facial geometry or proportions. Keep the person 100% recognizable with their unique facial characteristics intact. Only change the rendering style to anime illustration technique.' },
      { id: 'anime_v2', name: 'Anime Enhanced', prompt: 'Apply cinematic anime key visual rendering style. PRESERVE: Exact facial structure, all facial features, eye shape, nose shape, mouth proportions, face geometry, body pose, clothing design, and composition. STYLE: Refined cel-shading with soft rim lighting and atmospheric gradients. Render existing features with anime aesthetic while maintaining perfect facial likeness. LIGHTING: Dramatic yet balanced with colored highlights. COLOR: Rich, vibrant anime palette. Keep the person 100% recognizable with all unique facial characteristics intact. Only apply anime rendering technique to existing structure.' },
      { id: 'anime_v3', name: 'Anime Cinematic', prompt: 'Apply cinematic anime film rendering style. PRESERVE: Exact facial structure, all facial features, face shape, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Elegant linework with multi-step cel-shading, cinematic lighting effects, and atmospheric elements. Render existing features with anime aesthetic while maintaining realistic facial structure and perfect likeness. LIGHTING: Cinematic rim lights with atmospheric effects. COLOR: Rich filmic palette with warm skin tones. Keep the person 100% recognizable. Only apply anime rendering technique.' },
      { id: 'western', name: 'Western Theme', prompt: 'Reimagine in classic American Old West aesthetic with authentic frontier atmosphere. Apply rugged cowboy styling with weathered textures, cowboy hats, boots, leather elements, vests, bandanas, and duster coats. Create a dusty frontier setting with wooden buildings, hitching posts, tumbleweeds, and vast open skies. Use warm golden hour lighting with dramatic shadows and atmospheric dust. Apply sepia-toned or desaturated color palette with browns, oranges, and muted earth tones. Include authentic western details like horses, cattle, cacti, and weathered wood textures for immersive Wild West atmosphere.' },
      { id: 'oil', name: 'Oil Painting', prompt: 'Apply classical oil painting rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Visible directional brushstrokes with rich layered pigments and canvas texture. Apply oil painting technique to existing features without altering facial geometry. TECHNIQUE: Impasto texture, wet-on-wet blending, warm and cool color temperatures. Keep the person 100% recognizable. Only change the rendering medium to oil painting technique while maintaining perfect facial likeness.' },
      { id: 'watercolor', name: 'Watercolor', prompt: 'Apply watercolor painting rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Transparent washes with soft edges, luminous translucent colors, and paper texture. Apply watercolor technique to existing features without altering facial geometry. TECHNIQUE: Color bleeding effects, loose fluid brushwork, preserved paper whites. Keep the person 100% recognizable. Only change the rendering medium to watercolor technique while maintaining perfect facial likeness.' },
      { id: 'sketch', name: 'Pencil Sketch', prompt: 'Apply graphite pencil sketch rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Varied pencil strokes with crosshatching and blending on textured paper. Apply pencil sketch technique to existing features without altering facial geometry. TECHNIQUE: Light to dark pencil range, paper texture, subtle smudging. Keep the person 100% recognizable. Only change the rendering medium to pencil sketch technique while maintaining perfect facial likeness.' },
      { id: 'comic', name: 'Comic Book', prompt: 'Apply comic book art rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Bold black ink outlines with vibrant flat color blocks and Ben-Day dot shading. Apply comic book technique to existing features without altering facial geometry. TECHNIQUE: Strong linework, limited color palette, solid shadows. Keep the person 100% recognizable. Only change the rendering style to comic book technique while maintaining perfect facial likeness.' },
      { id: 'lowpoly', name: 'Low Poly', prompt: 'Apply low-polygon 3D art rendering style. PRESERVE: Exact facial structure, face shape, all facial features, body pose, and composition. STYLE: Simple triangular polygonal facets with flat shading and geometric appearance. Apply low-poly technique to existing features without altering facial geometry or proportions. TECHNIQUE: Clear polygon edges, solid colors per face, minimal polygon count. Keep the person 100% recognizable. Only change the rendering style to low-poly 3D technique while maintaining perfect facial likeness.' },
      { id: 'ukiyo', name: 'Ukiyo-e', prompt: 'Apply traditional Japanese Ukiyo-e woodblock print rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Elegant flowing black outlines with limited flat color palette and traditional Japanese aesthetic. Apply Ukiyo-e technique to existing features without altering facial geometry. TECHNIQUE: Flat color blocks, paper grain texture, traditional pigments. Keep the person 100% recognizable. Only change the rendering style to woodblock print technique while maintaining perfect facial likeness.' },
      { id: 'impressionist', name: 'Impressionism', prompt: 'Apply Impressionist painting rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Short broken brushstrokes with vibrant colors and soft blurred edges emphasizing light effects. Apply Impressionist technique to existing features without altering facial geometry. TECHNIQUE: Layered strokes, optical color mixing, luminous quality. Keep the person 100% recognizable. Only change the rendering style to Impressionist painting technique while maintaining perfect facial likeness.' },
      { id: 'popart', name: 'Pop Art', prompt: 'Apply Pop Art rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Bright saturated colors with strong outlines, flat color blocks, and Ben-Day dot patterns. Apply Pop Art technique to existing features without altering facial geometry. TECHNIQUE: Limited bold palette, screen-printing appearance, high contrast. Keep the person 100% recognizable. Only change the rendering style to Pop Art technique while maintaining perfect facial likeness.' },
      { id: 'artdeco', name: 'Art Deco', prompt: 'Apply Art Deco rendering style. PRESERVE: Exact facial structure, face shape, all facial features, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Strong geometric patterns, bold clean lines, and sophisticated metallic color palette with luxurious aesthetic. Apply Art Deco technique to existing features without altering facial geometry. TECHNIQUE: Symmetrical designs, stylized decorative elements, glamorous opulent feel. Keep the person 100% recognizable. Only change the rendering style to Art Deco technique while maintaining perfect facial likeness.' },
    ],
  },
  {
    name: 'Photo Enhancement',
    filters: [
      { id: 'vintage', name: 'Vintage Photo', prompt: 'Transform into authentic 1970s vintage photograph: COLOR GRADING - Warm, slightly faded tones with sepia or amber cast. Reduced saturation with emphasis on yellows, oranges, and browns. BLACKS - Lifted, faded blacks (not pure black). Gentle fade in shadow areas. GRAIN - Visible film grain texture throughout. Organic, analog quality. DAMAGE - Subtle aging effects: slight color shift, minor scratches or dust specks if appropriate. EXPOSURE - Slightly soft focus, gentle vignetting. QUALITY - Authentic film photography aesthetic from that era. AVOID - Digital clarity, pure whites/blacks, sharp modern look, HDR effects. AIM FOR - Nostalgic, warm film photography appearance with genuine aged photograph characteristics.' },
      { id: 'bw', name: 'Black & White', prompt: 'Convert to dramatic black and white photography (Ansel Adams style): CONTRAST - High contrast with rich tonal range. Deep, pure blacks and bright whites. MIDTONES - Full spectrum of grays with excellent tonal separation. TEXTURE - Enhanced texture detail and surface quality. Sharp, defined edges. LIGHTING - Dramatic lighting with strong shadows and highlights. Sculptural quality. COMPOSITION - Emphasize form, shape, and tonal relationships. QUALITY - Professional monochrome photography with excellent tonal depth. AVOID - Flat gray appearance, washed out tones, muddy midtones, sepia tinting. AIM FOR - Classic fine art black and white photography with dramatic impact and rich tonal depth.' },
      { id: 'hdr', name: 'HDR Look', prompt: 'Apply HDR (High Dynamic Range) photographic enhancement: DYNAMIC RANGE - Expanded tonal range with visible detail in both shadows and highlights. DETAILS - Enhanced micro-contrast and sharpness. Crisp, defined edges. COLORS - Boosted saturation with vibrant but believable colors. CLARITY - Increased local contrast for dramatic effect. SHADOWS - Lifted shadows with visible detail. HIGHLIGHTS - Controlled highlights preventing blowout. HALOS - Minimal haloing (avoid excessive glow around edges). DEPTH - Enhanced sense of dimension and pop. AVOID - Oversaturation, unrealistic appearance, excessive halos, cartoonish look. AIM FOR - Dramatic, impactful photography with enhanced realism and visual punch, professional HDR aesthetic.' },
      { id: 'cinematic', name: 'Cinematic', prompt: 'Apply professional cinematic color grading (Hollywood film aesthetic): COLOR PALETTE - Teal and orange color scheme (teal in shadows, warm orange in highlights and skin tones). CONTRAST - Controlled contrast with crushed blacks and gentle roll-off in highlights. MOOD - Atmospheric, moody feel with dramatic lighting. DEPTH - Enhanced dimensional quality through color separation. SHADOWS - Teal/cyan tint in shadow areas. SKIN TONES - Warm, flattering orange/peach tones. SATURATION - Selective saturation with emphasis on key colors. ASPECT - Wide cinematic framing aesthetic. AVOID - Flat colors, neutral grading, amateur video look, oversaturation. AIM FOR - Professional film look-up-table (LUT) quality grading like modern blockbuster movies.' },
      { id: 'softglow', name: 'Soft Glow', prompt: 'Apply soft romantic glow effect (portrait photography filter): GLOW - Gentle, diffused glow emanating from highlights. Soft halation effect. SKIN - Smoothed skin texture while maintaining natural appearance (not plastic). HIGHLIGHTS - Enhanced, luminous highlights with soft bloom. FOCUS - Slight softening overall with maintained subject clarity. MOOD - Dreamy, ethereal, flattering quality. COLORS - Slightly desaturated with warm, gentle tones. CONTRAST - Reduced contrast for soft, gentle appearance. AVOID - Harsh blur, loss of detail, over-smoothing, artificial look, excessive blur. AIM FOR - Professional portrait retouching aesthetic with flattering soft focus and romantic glow, elegant and natural.' },
      { id: 'filmnoir', name: 'Film Noir', prompt: 'Transform into classic Film Noir cinematography (1940s-50s detective film aesthetic): BLACK & WHITE - High contrast monochrome with dramatic tonal range. LIGHTING - Strong directional lighting with deep, dramatic shadows (chiaroscuro). Hard light creating sharp shadow edges. SHADOWS - Deep, inky blacks with bold shadow patterns. Venetian blind shadows, dramatic silhouettes. COMPOSITION - Low-key lighting, mysterious atmosphere, noir cinematography angles. MOOD - Dark, moody, mysterious, tension-filled atmosphere. CONTRAST - Extreme contrast between light and shadow areas. FOG/SMOKE - Atmospheric haze, volumetric lighting if appropriate. AVOID - Flat lighting, gray tones, bright cheerful mood, soft shadows. AIM FOR - Classic noir films like The Maltese Falcon or Double Indemnity with dramatic expressionist lighting and mystery.' },
      { id: 'doubleexposure', name: 'Double Exposure', prompt: 'Create artistic double exposure photography effect: TECHNIQUE - Blend two exposures together with translucent overlay. Primary subject with secondary ghostly image superimposed. TRANSPARENCY - Soft, ethereal transparency in overlapping areas. Multiple exposure blend. ELEMENTS - Combine subject with complementary imagery (nature, cityscapes, textures). BLENDING - Natural, organic blending modes (not cut-and-paste). Seamless integration. CONTRAST - Strong subject silhouette with lighter overlaid elements. MOOD - Dreamy, artistic, surreal quality. COMPOSITION - Thoughtful positioning of overlapping elements. AVOID - Harsh edges, obvious compositing, cluttered overlays, muddy blending. AIM FOR - Professional multiple exposure photography like analog double exposure technique with artistic, intentional overlapping imagery.' },
      { id: 'boudoir', name: 'Boudoir', prompt: 'Apply elegant portrait photography styling while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Professional glamour portrait aesthetic with soft flattering lighting and gentle shadows. Warm romantic color palette with soft creams, blush pinks, champagne tones. Window light quality with subtle highlights. Enhance expression to be confident and graceful. Add soft fabrics like silk and satin in styling. Sophisticated, empowering atmosphere. Professional beauty retouching while maintaining natural features. Timeless, artistic portrait quality. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'glamour', name: 'Glamour', prompt: 'Apply high-fashion glamour photography styling while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Professional fashion editorial aesthetic with dramatic makeup and styled hair. Flattering studio lighting with soft key light and rim lighting. Enhance wardrobe with elegant fabrics while keeping original clothing style. Rich colors with skin tone perfection. Confident, empowered expression. Vogue editorial quality with professional retouching and natural beauty enhancement. High-end fashion magazine aesthetic. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'editorial', name: 'Editorial', prompt: 'Transform into high-fashion editorial photography while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Striking fashion-forward styling with bold makeup and sophisticated hair. Dramatic fashion lighting with strong directional light. Enhance clothing with designer fashion aesthetic and luxurious textures while keeping original pose. Confident, powerful expression. Harper\'s Bazaar magazine quality with artistic composition. Professional fashion photography with elegant, sophisticated atmosphere. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'redcarpet', name: 'Red Carpet', prompt: 'Apply red carpet celebrity styling while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Hollywood glamour with professional styling. Flawless makeup with contouring, dramatic eyes, perfect lips. Elegant hairstyling with volume and shine. Enhance clothing with designer formal attire while keeping original pose. Professional event lighting with flash photography glow. Confident, radiant expression. A-list celebrity aesthetic with paparazzi-ready perfection. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
    ],
  },
  {
    name: 'Trendy & Social',
    filters: [
      { id: 'cyber', name: 'Cyberpunk', prompt: 'Transform into cyberpunk aesthetic (Blade Runner, Ghost in the Shell style): LIGHTING - Bright neon lights in electric pink, cyan, purple, and blue. Strong color contrast. ATMOSPHERE - Dark, moody environment with luminous accents. Rain-slicked surfaces, fog, atmospheric haze. TECHNOLOGY - Futuristic tech elements, holographic displays, digital interfaces, circuitry patterns. COLORS - High saturation neon colors against dark backgrounds. Deep shadows with glowing highlights. MOOD - Dystopian urban environment, high-tech low-life aesthetic. EFFECTS - Light bloom, neon glow, reflections on wet surfaces. COMPOSITION - Urban night scene quality with dramatic lighting. AVOID - Bright daylight, natural colors, soft pastels, rural settings. AIM FOR - Dark futuristic cityscape aesthetic with neon-soaked cyberpunk atmosphere and technological dystopia feel.' },
      { id: 'vaporwave', name: 'Vaporwave', prompt: 'Transform into Vaporwave aesthetic (90s internet nostalgia art): COLORS - Pastel pink, cyan, purple, and magenta palette. Gradient backgrounds with color transitions. ELEMENTS - Retro 90s computer graphics, wireframe grids, Roman/Greek statues, palm trees, geometric shapes. EFFECTS - VHS glitch effects, scan lines, chromatic aberration, digital artifacts. MOOD - Dreamy, nostalgic, surreal, slightly melancholic atmosphere. COMPOSITION - Layered elements with depth, floating objects, impossible spaces. TYPOGRAPHY - Retro computer fonts if text present. AESTHETIC - Early internet, Windows 95, mall aesthetic, consumerism critique. AVOID - Modern clean design, realistic rendering, muted colors, sharp focus. AIM FOR - Nostalgic internet aesthetic with dreamy surrealism and retro digital collage feel.' },
      { id: 'pixel', name: 'Pixel Art', prompt: 'Convert into authentic 8-bit/16-bit pixel art (retro video game style): PIXELS - Clearly visible square pixels at low resolution. Crisp pixel edges (no anti-aliasing). PALETTE - Limited color palette (16-64 colors maximum). Consistent indexed color scheme. SIMPLIFICATION - Reduce forms to essential shapes readable at low resolution. SHADING - Dithering patterns for gradients, limited color ramps. STYLE - Classic video game sprite aesthetic (NES, SNES, Game Boy era). OUTLINES - Dark outlines defining shapes. DETAIL - Strategic detail placement within pixel constraints. AVOID - Smooth gradients, photo-realistic detail, modern high-resolution look, blur effects. AIM FOR - Authentic retro video game pixel art with charm and readability of classic 8-bit or 16-bit games.' },
      { id: 'vhs', name: 'Retro VHS', prompt: 'Transform into retro VHS tape recording aesthetic (1980s-90s home video): DISTORTION - Horizontal scan lines, tracking errors, image warping, magnetic tape artifacts. COLOR SHIFT - Color bleeding, especially pinks and cyans. Chromatic separation. QUALITY - Low resolution, analog video compression, reduced sharpness. NOISE - Video noise, static, analog grain throughout. TIMESTAMP - Digital timestamp in corner (optional). Retro camcorder date/time overlay. EFFECTS - Occasional glitches, dropout, magnetic interference. MOOD - Nostalgic, lo-fi, home video memories aesthetic. AVOID - Digital clarity, HD quality, modern video codecs, clean image. AIM FOR - Authentic degraded VHS tape quality with analog video artifacts and 80s/90s home video camcorder feel.' },
      { id: 'graffiti', name: 'Street Art', prompt: 'Transform into vibrant street art/graffiti style (urban mural aesthetic): TECHNIQUE - Spray paint textures with drips, overspray, and stencil effects. COLORS - Bold, vibrant colors with high saturation. Multiple layered colors. STYLE - Wildstyle letters, characters, or illustrative elements. Urban art vocabulary. SURFACE - Brick wall, concrete, or urban surface texture visible. DETAILS - Paint drips, caps spray patterns, tape edges, stencil boundaries. COMPOSITION - Dynamic, energetic, rebellious aesthetic. Layered imagery. MOOD - Raw, expressive, urban street culture. EFFECTS - Overspray halos, color blending, weathering if appropriate. AVOID - Clean digital look, precise edges, corporate aesthetic, watercolor softness. AIM FOR - Authentic street art aesthetic with spray paint authenticity and urban mural energy like Banksy or traditional graffiti artists.' },
      { id: 'isometric', name: 'Isometric Art', prompt: 'Transform into isometric 3D art (technical illustration style): PERSPECTIVE - True isometric projection (30° angles, no perspective distortion). All parallel lines remain parallel. GEOMETRY - Clean geometric forms with precise angles. Cubic/rectangular construction. STYLE - Flat shaded surfaces with clear facets. Architectural/technical quality. COLORS - Solid, distinct colors per face. Clear color separation for each surface. EDGES - Sharp, clean edges. Precise line work. AESTHETIC - Video game isometric view, technical diagram quality. DETAILS - Small elements in isometric perspective. Grid-based placement. SHADING - Flat or simple 3-tone shading per surface. AVOID - Perspective distortion, curved lines, photo-realism, atmospheric effects. AIM FOR - Clean isometric technical illustration like Monument Valley game or architectural diagrams with precise geometric clarity.' },
      { id: 'gta', name: 'GTA Style', prompt: 'Transform into iconic Grand Theft Auto game cover art illustration style while preserving exact facial features and identity. SIGNATURE GTA LOOK - Rockstar Games distinctive illustrated realism: hyper-stylized digital painting with bold graphic novel elements. Reference GTA V, San Andreas, Vice City loading screens and cover art aesthetic. LINEWORK - Thick confident black ink outlines around ALL major forms (face, hair, clothing, body). Comic book border lines 3-4px thick. Strong contour lines defining facial planes, jawline, cheekbones. Graphic novel quality borders. SHADING TECHNIQUE - Hard-edged cel-shading with NO soft transitions. 4-5 distinct tonal zones per color area. Deep shadow areas in rich purples, dark blues, or near-black. Mid-tones in saturated base colors. Highlights in warm oranges, yellows, or hot pinks. Airbrush-smooth within each zone but SHARP edges between zones. COLOR GRADING - Extreme saturation boost (+40%). Shadows tinted with deep purple/blue (never pure black). Skin tones pushed toward warm orange/amber. Complementary color contrast (warm vs cool). Vibrant urban palette: hot pinks, electric blues, neon greens, deep purples, golden yellows. LIGHTING - Dramatic low-angle or side lighting like action movie posters. Strong rim lighting creating glowing edges (often in contrasting colors - blue rim on warm subject). Multiple colored light sources (street lights, neon signs). Cinematic lens flare or light streaks. TEXTURE - Smooth digital airbrush finish with subtle halftone dot pattern (like screen printing). NO photo grain. Clean vector-like quality with painted details. FACIAL RENDERING - Sculpted planes with defined cheekbones, strong jawline emphasis. Eyes with sharp white highlights (catchlights). Lips with 2-3 tone rendering. Nose with clear light/shadow definition. Hair rendered in chunky graphic shapes with highlights. ATMOSPHERE - Urban gritty street culture energy. Confident swagger and attitude in expression. Badass action hero presence. Movie poster drama. COMPOSITION - Bold frontal or 3/4 view. Strong eye contact. Dynamic presence filling frame. Magazine cover quality. EFFECTS - Optional: subtle lens flare, light rays, atmospheric glow, neon reflections, urban haze. PRESERVE - Exact face shape, bone structure, eye shape, nose, mouth, all facial proportions. 100% recognizable identity. AVOID - Soft painterly look, photorealism, flat colors, anime style, watercolor, sketchy lines, muted colors, natural lighting. AIM FOR - Unmistakable Rockstar Games GTA cover art: bold, graphic, saturated, dramatic, with thick outlines and hard-edged shading. Street art meets digital illustration meets action movie poster.' },
    ],
  },
  {
    name: 'Seasonal & Holiday',
    filters: [
      { id: 'christmas', name: 'Christmas', prompt: 'Transform into festive Christmas scene while preserving exact facial features and identity. Add holiday elements around subject: Cozy winter sweaters, Santa hats, scarves, festive accessories. Decorate background with Christmas trees, twinkling lights, ornaments, wreaths, garland, presents. Rich holiday colors (red, green, gold, white). Warm glowing lighting from fairy lights and candles. Soft falling snow or bokeh light effects. Festive cheerful atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'halloween', name: 'Halloween', prompt: 'Apply festive autumn Halloween styling while preserving exact facial features and identity. Add fun costume accessories and festive elements. Decorate scene with carved pumpkins, autumn leaves, orange and purple decorations. Warm orange and purple color palette. Soft glowing candlelight effect. Mysterious evening atmosphere with gentle fog. Festive autumn celebration mood. Family-friendly holiday aesthetic. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'valentines', name: "Valentine's Day", prompt: 'Transform into romantic Valentine\'s scene while preserving exact facial features and identity. Add romantic elements around subject: Soft romantic styling, hearts, roses, cupid motifs. Decorate background with rose petals, heart decorations, romantic candles, soft fabrics. Romantic color palette (reds, pinks, whites, soft purples). Soft dreamy lighting with romantic glow. Bokeh heart-shaped lights. Sweet romantic atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'easter', name: 'Easter', prompt: 'Transform into cheerful Easter scene while preserving exact facial features and identity. Add spring elements around subject: Pastel spring clothing, bunny ears, floral accessories, Easter bonnets. Decorate background with Easter eggs, spring flowers, bunnies, baskets, blooming gardens. Soft pastel palette (pink, lavender, mint, yellow, baby blue). Bright cheerful spring lighting. Fresh spring atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'newyear', name: 'New Year', prompt: 'Transform into celebratory New Year scene while preserving exact facial features and identity. Add party elements around subject: Glamorous party attire, party hats, festive accessories, champagne glasses. Decorate background with confetti, balloons, streamers, fireworks, clocks showing midnight, sparklers. Metallic colors (gold, silver, black, white). Dramatic celebratory lighting with sparkles and glitter effects. Festive party atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'thanksgiving', name: 'Thanksgiving', prompt: 'Transform into warm Thanksgiving scene while preserving exact facial features and identity. Add harvest elements around subject: Cozy autumn clothing, plaid patterns, warm layers. Decorate background with pumpkins, autumn leaves, cornucopia, harvest decorations, rustic table settings. Warm autumn palette (orange, brown, burgundy, gold, cream). Warm golden hour lighting. Cozy harvest atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'stpatricks', name: "St. Patrick's Day", prompt: 'Transform into festive St. Patrick\'s Day scene while preserving exact facial features and identity. Add Irish elements around subject: Green clothing, leprechaun hats, shamrock accessories, Celtic patterns. Decorate background with shamrocks, rainbows, pots of gold, Irish flags, Celtic decorations. Vibrant green palette with gold accents. Cheerful bright lighting. Festive Irish celebration atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'summer', name: 'Summer Vibes', prompt: 'Transform into bright summer scene while preserving exact facial features and identity. Add summer elements around subject: Light summer clothing, sunglasses, beach accessories, tropical prints. Decorate background with palm trees, beach elements, tropical flowers, sunshine, blue skies. Bright vibrant summer colors (turquoise, coral, yellow, tropical greens). Bright sunny lighting with lens flares. Warm tropical vacation atmosphere. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'winter', name: 'Winter Wonderland', prompt: 'Transform into magical winter scene while preserving exact facial features and identity. Add winter elements around subject: Cozy winter clothing, knit sweaters, scarves, beanies, mittens. Decorate background with snow, snowflakes, icicles, frosted trees, winter landscapes. Cool winter palette (icy blue, white, silver, soft purple). Soft diffused winter lighting with sparkly snow effects. Peaceful snowy atmosphere. Keep face shape, nose, eyes, mouth identical.' },
    ],
  },
  {
    name: 'Classic Portraits',
    filters: [
      { id: 'pinup', name: 'Pin-Up Art', prompt: 'Transform into classic 1950s pin-up illustration style while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Vintage illustration aesthetic with painted quality and soft airbrushed look. Retro styling with period-appropriate hair and makeup. Warm vintage color palette with soft pastels and bold reds. Confident, playful expression with classic pin-up charm. Alberto Vargas or Gil Elvgren artistic quality with painted illustration technique. Nostalgic 1950s calendar art aesthetic. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'renaissance', name: 'Renaissance Portrait', prompt: 'Transform into Renaissance master painting style while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Classical oil painting technique with rich colors and dramatic lighting. Elegant period styling with Renaissance aesthetic. Warm golden lighting with chiaroscuro shadows. Luxurious fabrics like velvet and silk in deep jewel tones. Dignified, serene expression. Old master painting quality like Titian or Raphael with classical beauty ideals. Timeless artistic portrait. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'baroque', name: 'Baroque Elegance', prompt: 'Transform into Baroque painting style while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Dramatic lighting with strong contrasts and rich colors. Opulent styling with luxurious fabrics and ornate details. Deep shadows and golden highlights. Confident, regal expression. Rembrandt or Caravaggio quality with theatrical lighting and rich textures. Grand, dramatic aesthetic. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'rococo', name: 'Rococo Romance', prompt: 'Transform into Rococo painting style while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Soft, delicate aesthetic with pastel colors and ornate details. Elegant styling with ribbons, lace, and flowing fabrics. Gentle lighting with soft shadows. Sweet, charming expression. François Boucher or Jean-Honoré Fragonard quality with romantic, decorative style. Playful, lighthearted atmosphere. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'noir', name: 'Noir Portrait', prompt: 'Transform into film noir portrait style while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Dramatic black and white with strong shadows and highlights. Sophisticated styling with elegant attire and classic beauty. Hard directional lighting creating mystery. Confident, enigmatic expression. Classic Hollywood portrait quality with dramatic chiaroscuro. Timeless, sophisticated aesthetic. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'poolside', name: 'Poolside Leisure', prompt: 'Transform into vintage poolside photography while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Retro summer aesthetic with 1960s poolside styling. Bright sunny lighting with reflections and warm tones. Relaxed vacation atmosphere with resort elegance. Confident, carefree expression. Slim Aarons photography quality with sophisticated leisure aesthetic. Timeless summer elegance. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'studio', name: 'Studio Portrait', prompt: 'Transform into professional studio portrait while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Professional lighting setup with key light, fill light, and rim light. Flawless styling with elegant wardrobe and professional hair and makeup. Clean background with gradient. Confident, engaging expression. High-end fashion photography quality with perfect lighting and retouching. Polished, professional aesthetic. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
      { id: 'golden', name: 'Golden Hour', prompt: 'Transform into golden hour photography while preserving exact pose, composition, and facial features. CRITICAL: Maintain original body position, pose, and framing exactly as shown. Warm golden sunlight with soft glowing quality. Natural outdoor styling with flowing fabrics and windswept hair. Magical sunset lighting with lens flares and warm tones. Serene, radiant expression. Professional outdoor portrait quality with dreamy golden light. Romantic, ethereal atmosphere. Keep original pose, body position, face shape, nose, eyes, mouth identical.' },
    ],
  },
  {
    name: 'Fun & Transformative',
    filters: [
      { id: 'realism', name: 'Realism', prompt: 'Transform this illustrated or anime-style image into a highly realistic professional photograph while keeping the same subject, composition, and pose. Replace the illustrated look with true-to-life photographic detail, realistic textures, and natural lighting. Photorealism goals: - Skin: natural human skin tones with visible pores, subtle color variation, and soft natural lighting. Avoid painted or cel-shaded tones. - Hair: convert stylized clumps into thousands of fine, photorealistic strands with realistic shine and flyaways. - Clothing: realistic fabrics showing weave texture, folds, and natural wrinkles. - Lighting: cinematic natural light with gentle shadows, ambient bounce, and depth of field. - Face: real human anatomy — proportional features, realistic eyes with light reflections, detailed lips and nose. - Depth & Color: soft background blur, natural contrast, film-like muted tones (no oversaturation). The result should look like a live-action adaptation portrait of the same character — realistic, camera-captured, and indistinguishable from a real photo. Avoid: cartoon lines, flat color blocks, cel-shading, exaggerated features, or painterly rendering. Style reference: cinematic portrait photography, Sony α7R / Canon EOS R5 quality, 85mm lens f/1.8 shallow depth of field.' },
      { id: 'fantasy', name: 'Fantasy World', prompt: 'Transform into fantasy realm aesthetic (magical fairy tale world): ATMOSPHERE - Enchanted, magical environment with otherworldly quality. Glowing mystical elements. LIGHTING - Ethereal, soft magical lighting. Bioluminescent glows, sparkles, light particles. ELEMENTS - Fantasy elements like magical energy, glowing crystals, enchanted flora, mystical fog. COLORS - Rich, saturated fantasy palette with jewel tones and magical hues. ENVIRONMENT - Enchanted forest, magical landscapes, fairy tale settings. MOOD - Whimsical, wondrous, dreamlike atmosphere. DETAILS - Magical particles, glowing accents, fantasy embellishments. AVOID - Modern elements, realistic photography, mundane settings, harsh lighting. AIM FOR - High fantasy illustration aesthetic like fantasy book covers or fantasy films with magical, enchanting quality.' },
      { id: '1890s', name: '1890s Photo', prompt: 'Transform into authentic 1890s antique photograph: COLOR - Sepia tone or albumen print coloring. Warm brown/tan monochrome. DAMAGE - Aged photograph artifacts: cracked emulsion, faded areas, edge deterioration, foxing spots. TEXTURE - Visible paper texture, photographic plate texture, period-appropriate surface. QUALITY - Soft focus typical of 19th century photography. Slightly blurred, low contrast. COMPOSITION - Victorian era photographic aesthetic. Formal poses, studio quality. WEAR - Age spots, water damage marks, creases, vintage wear patterns. CLARITY - Reduced sharpness matching old lens quality. AVOID - Modern sharpness, digital effects, vibrant colors, contemporary styling. AIM FOR - Genuine antique photograph appearance from Victorian era with authentic aging and period photography characteristics.' },
      { id: 'steampunk', name: 'Steampunk', prompt: 'Transform into Steampunk aesthetic (Victorian science fiction): ELEMENTS - Mechanical gears, brass fittings, copper pipes, gauges, clockwork mechanisms, steam-powered machinery. MATERIALS - Brass, copper, bronze, polished metal, leather, dark wood, rivets. ERA - Victorian era (1850s-1900s) fashion and architecture with anachronistic technology. DETAILS - Exposed machinery, intricate mechanical details, pressure gauges, pipes, valves. COLORS - Warm metallic tones: brass gold, copper, bronze, brown leather, sepia. ATMOSPHERE - Industrial revolution meets science fiction. Mechanical elegance. MOOD - Retro-futuristic, industrial, Victorian sophistication. AVOID - Modern technology, plastic materials, digital displays, bright neon. AIM FOR - Victorian-era industrial aesthetic with fantastical mechanical elements like Jules Verne novels or steampunk illustrations.' },
      { id: 'stainedglass', name: 'Stained Glass', prompt: 'Transform into stained glass window art (church window style): STRUCTURE - Colored glass segments separated by dark lead came/solder lines. Clear geometric or organic divisions. COLORS - Vibrant, translucent jewel-tone colors. Light shining through glass effect. TECHNIQUE - Individual glass pieces with distinct boundaries. Lead lines defining each segment. LIGHT - Backlit quality with luminous, glowing colors. Light transmission through colored glass. PATTERNS - Geometric patterns, art nouveau flowing lines, or pictorial scenes in glass. TEXTURE - Slight glass texture, uneven color within pieces. BORDERS - Heavy lead outlines (black lines) around each glass piece. AVOID - Solid opaque colors, photographic detail, smooth gradients within pieces, missing lead lines. AIM FOR - Authentic cathedral stained glass window appearance with translucent luminous quality and traditional glass art craftsmanship.' },
      { id: 'mosaic', name: 'Mosaic', prompt: 'Transform into mosaic tile artwork (ancient Roman/Byzantine style): TILES - Small square or irregular tiles (tesserae) clearly visible. Each tile distinct. SPACING - Visible grout lines between tiles creating grid or irregular pattern. COLORS - Solid color per tile from limited palette. No gradients within individual tiles. TECHNIQUE - Tiles arranged to create image through color placement. Opus tessellatum style. TEXTURE - Three-dimensional surface quality. Slight variations in tile height. MATERIALS - Stone, glass, or ceramic tile appearance. Matte or slight sheen. COMPOSITION - Image formed by aggregate of small colored pieces. Pixelated quality at close view. SHADOWS - Subtle shadows between tiles adding depth. AVOID - Smooth surfaces, photo-realistic detail, perfect alignment, modern digital look. AIM FOR - Authentic ancient mosaic art appearance with handcrafted tile-by-tile quality and classical mosaic technique.' },
      { id: 'chineseink', name: 'Chinese Ink', prompt: 'Transform into traditional Chinese ink painting (Sumi-e/Shui-mo style): BRUSHWORK - Flowing, expressive brush strokes with varied ink density. Calligraphic quality. INK - Black ink with gradations from deep black to pale gray washes. Minimal color if any. TECHNIQUE - Wet-on-wet ink bleeding, brush texture visible. Traditional brush painting marks. COMPOSITION - Minimalist with emphasis on negative space (empty white areas). Asymmetrical balance. PHILOSOPHY - Capture essence rather than detail. Suggestion over definition. ELEMENTS - Traditional subjects: landscapes, bamboo, birds, mountains interpreted artistically. PAPER - Rice paper texture, ink absorption and bleeding effects. AVOID - Western painting techniques, heavy detail, filled composition, opaque coverage. AIM FOR - Authentic Chinese brush painting aesthetic with philosophical minimalism and masterful ink control like traditional literati paintings.' },
    ],
  },
  {
    name: 'Aesthetic Styles',
    filters: [
      { id: 'grunge90s', name: '90s Grunge', prompt: 'Apply 1990s grunge aesthetic while preserving exact facial features and identity: Flannel shirts, ripped jeans, band tees, Doc Martens. Messy unkempt hair with natural colors or bleached streaks. Minimal makeup with dark lipstick or smudged eyeliner. Chokers, wallet chains, beanies. Desaturated muted palette (grays, browns, dark greens, burgundy). Gritty textures with film grain. Low-key moody lighting with heavy shadows. Melancholic rebellious mood. Seattle grunge scene vibe. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'goth', name: 'Gothic', prompt: 'Apply Gothic aesthetic while preserving exact facial structure and identity: Jet black or deep burgundy hair. Heavy black eyeliner, dark eyeshadow, pale foundation, dark lipstick. Black Victorian-inspired clothing with corsets, lace, velvet, leather. Silver jewelry, crosses, chokers, chains. Deep blacks, dark purples, blood reds. Dramatic chiaroscuro lighting with deep shadows. Dark mysterious romantic mood with Victorian gothic influence. Keep face shape, bone structure, features identical.' },
      { id: 'emo', name: 'Emo', prompt: 'Apply 2000s emo aesthetic while preserving exact facial features and identity: Side-swept bangs covering one eye, black hair with colored streaks (red, blue, pink). Heavy black eyeliner on both eyes. Skinny jeans, band tees, studded belts, Converse shoes, striped arm warmers. Black clothing with bright accent colors. Wristbands, lip piercings, gauges. Moody dramatic lighting. Emotional expressive mood. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'scene', name: 'Scene Kid', prompt: 'Apply 2000s scene aesthetic while preserving exact facial structure and identity: Teased voluminous hair with bright neon colors (pink, blue, green) and choppy layers. Heavy black eyeliner, bright eyeshadow. Skinny jeans, band tees, neon accessories, checkered patterns. Multiple colorful bracelets, bows, Hello Kitty items. Vibrant saturated colors with high contrast. Energetic playful rebellious mood. MySpace era vibes. Keep face shape, bone structure, features identical.' },
      { id: 'punk', name: 'Punk Rock', prompt: 'Apply punk rock aesthetic while preserving exact facial features and identity: Edgy punk hairstyle with bold colors or natural tones. Heavy dark makeup, safety pin accessories. Leather jackets, studded clothing, ripped fishnets, combat boots, band patches. Chains, spikes, safety pins. Bold graphic elements. Gritty urban textures. High contrast dramatic lighting. Rebellious anti-establishment attitude. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'futuristic', name: 'Futuristic', prompt: 'Apply futuristic sci-fi cyberpunk aesthetic while preserving exact facial features and identity: Metallic hair colors (silver, platinum, electric blue) with geometric cuts or cyberpunk undercuts. Chrome lips, holographic highlights, geometric neon eyeliner, tech-inspired face markings. High-tech bodysuits with circuit patterns, metallic fabrics, LED-embedded clothing, cybernetic accessories. Futuristic AR/VR eyewear, neural interface headsets, LED jewelry, tech implants. Glossy metals, glass, holographic surfaces, carbon fiber textures. Neon lighting (cyan, magenta, purple) with dramatic shadows. Blade Runner meets Ghost in the Shell aesthetic. Advanced technology, cyberpunk dystopian vibe, sci-fi innovation. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'retro80s', name: 'Retro 80s', prompt: 'Apply 1980s retro aesthetic while preserving exact facial structure and identity: Big voluminous hair, perms, crimped hair, side ponytails. Bright eyeshadow (electric blue, hot pink, purple), heavy blush, bold lipstick. Neon windbreakers, leg warmers, shoulder pads, acid wash denim. Scrunchies, large geometric earrings, aviator sunglasses. Vibrant neon colors. Memphis design patterns. Dramatic colored lighting with neon glow. MTV era energy. Keep face shape, bone structure, features identical.' },
      { id: 'rockabilly', name: 'Rockabilly', prompt: 'Apply 1950s rockabilly aesthetic while preserving exact facial features and identity: Victory rolls, pompadour, pin curls for hair. Red lipstick, winged eyeliner, defined brows. Polka dots, gingham, cherry prints, high-waisted jeans, leather jackets, bandanas. Vintage accessories, cat-eye sunglasses. Bold reds, blacks, whites. Classic 1950s rock and roll styling with retro diner vibes. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'boho', name: 'Boho Chic', prompt: 'Apply bohemian aesthetic while preserving exact facial structure and identity: Loose flowing hair with braids, waves, or natural texture. Natural makeup with bronze tones. Flowing maxi dresses, fringe, crochet, embroidered fabrics, layered jewelry. Flower crowns, feathers, turquoise jewelry, leather accessories. Earthy warm palette (terracotta, mustard, cream, sage). Soft natural lighting. Free-spirited artistic mood. Keep face shape, bone structure, features identical.' },
      { id: 'maximalist', name: 'Maximalist', prompt: 'Apply maximalist aesthetic: Dense layered abundant visual elements. Rich vibrant multiple colors with bold combinations. Multiple patterns layered together (florals, geometrics, textures). Intricate details everywhere with ornate embellishments. Rich variety of textures (velvet, silk, metallics). Bold confident expressive luxurious mood. More is more philosophy.' },
      { id: 'psychedelic', name: 'Psychedelic', prompt: 'Apply psychedelic art style while preserving exact facial features and identity: Rainbow flowing hair with swirling patterns and melting color transitions. Tie-dye patterns, kaleidoscopic designs, peace symbols. Round sunglasses, flower accessories, beads. Vibrant saturated contrasting colors with rainbow spectrums. Swirling flowing patterns, fractals, mandalas, optical illusions. Warping melting morphing effects. Glowing luminous quality. 1960s counterculture trippy aesthetic. Keep face shape, nose, eyes, mouth identical despite visual effects.' },
      { id: 'cottagecore', name: 'Cottagecore', prompt: 'Apply cottagecore aesthetic while preserving exact facial structure and identity: Natural soft hairstyles with braids, loose waves, flower crowns. Minimal natural makeup with rosy cheeks. Flowing dresses, linen fabrics, floral patterns, prairie dresses, lace details. Straw hats, wicker baskets, delicate jewelry. Wildflowers, gardens, rustic details. Warm natural palette (cream, sage green, soft pink, butter yellow). Soft golden hour lighting. Peaceful wholesome pastoral mood. Keep face shape, bone structure, features identical.' },
      { id: 'coquette', name: 'Coquette', prompt: 'Apply coquette aesthetic while preserving exact facial structure and identity: Soft romantic hairstyles with bows, ribbons, pearl clips. Glossy lips, rosy cheeks, delicate natural makeup. Bows everywhere, lace, ruffles, pearls, pink accents. Feminine delicate clothing with vintage-inspired details. Soft pastels (pink, cream, white, lavender). Romantic dreamy lighting. Ultra-feminine, sweet, innocent aesthetic. Vintage doll-like charm. Keep face shape, bone structure, features identical.' },
      { id: 'cleangirl', name: 'Clean Girl', prompt: 'Apply clean girl aesthetic while preserving exact facial features and identity: Slicked-back bun or sleek low ponytail. Minimal dewy makeup, glossy lips, natural brows, subtle gold hoops. No-makeup makeup look with glowing skin. Neutral tones (beige, cream, white, camel, tan). Simple elegant pieces, minimalist jewelry. Effortless sophistication. Soft natural lighting. Fresh polished understated elegance. Keep face shape, nose, eyes, mouth identical.' },
      { id: 'oldmoney', name: 'Old Money', prompt: 'Apply old money aesthetic while preserving exact facial structure and identity: Classic elegant hairstyles (sleek bun, soft waves, neat styling). Subtle refined makeup, natural elegance. Tailored blazers, neutral palette (navy, beige, cream, white, camel). Timeless pieces, no logos, quiet luxury. Classic silhouettes, high-quality fabrics. Sophisticated understated elegance. Soft refined lighting. Kennedy family, European aristocracy aesthetic. Keep face shape, bone structure, features identical.' },
      { id: 'acubi', name: 'Acubi', prompt: 'Apply Acubi aesthetic while preserving exact facial structure and identity: Minimalist Korean streetwear styling. Sleek hair (often dark), minimal makeup. Cargo pants, crop tops, utilitarian pieces. Neutral colors (black, white, gray, beige). Subversive basics with slight military influence. Clean lines, functional fashion. Y2K futurism meets minimalism. Urban streetwear edge. Moody atmospheric lighting. Keep face shape, bone structure, features identical.' },
    ],
  },
];

const App: React.FC = () => {
  const { toasts, addToast, removeToast } = useToast();
  const { user } = useAuth();
  
  // Check if we're on the admin page
  const [currentPage, setCurrentPage] = useState<Page>(() => getPageFromLocation());
  const didMountRef = useRef(false);
  const isHandlingPopStateRef = useRef(false);
  
  // Update URL when page changes
  useEffect(() => {
    const newUrl = buildUrlForPage(currentPage);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash || ''}`;

    if (!didMountRef.current) {
      didMountRef.current = true;
      if (newUrl !== currentUrl) window.history.replaceState({}, '', newUrl);
      return;
    }

    if (newUrl === currentUrl) {
      isHandlingPopStateRef.current = false;
      return;
    }

    if (isHandlingPopStateRef.current) {
      isHandlingPopStateRef.current = false;
      window.history.replaceState({}, '', newUrl);
      return;
    }

    window.history.pushState({}, '', newUrl);
  }, [currentPage]);

  useEffect(() => {
    const handlePopState = () => {
      isHandlingPopStateRef.current = true;
      setCurrentPage(getPageFromLocation());
    };

    const handleNavigate = (e: Event) => {
      const page = (e as CustomEvent<{ page?: Page }>).detail?.page;
      if (page) setCurrentPage(page);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('app:navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('app:navigate', handleNavigate as EventListener);
    };
  }, []);
  
  // If admin page, render admin dashboard
  if (currentPage === 'admin') {
    return <AdminDashboard />;
  }
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<Filter | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPeeking, setIsPeeking] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [dragCounter, setDragCounter] = useState<number>(0);
  
  // New UX improvements
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  // Modal states
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  // Track if a modal/drawer overlay is open to adjust z-index of Category panel
  const [overlayOpen, setOverlayOpen] = useState<boolean>(false);
  
  // Dev mode (only available in development)
  const [isDevMode, setIsDevMode] = useState<boolean>(false);
  const [devMockImageUrl, setDevMockImageUrl] = useState<string | null>(null);
  
  // Mobile bottom sheet
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState<boolean>(false);
  
  // Transition state for smooth reveal
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  
  // Image preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  // Image editor
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  
  // Gallery modal
  const [isGalleryOpen, setIsGalleryOpen] = useState<boolean>(false);
  const { addItem: addToGallery, loadUserGallery } = useGallery();
  
  // Load gallery when user logs in
  useEffect(() => {
    if (user?.id) {
      loadUserGallery(user.id);
    }
  }, [user?.id, loadUserGallery]);
  
  // Category selection
  const [activeCategory, setActiveCategory] = useState<string>(FILTER_CATEGORIES[0]?.name || '');
  // Track category dropdown state to elevate its parent panel while open
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState<boolean>(false);

  // Listen for global overlay events (modals and the hamburger side menu)
  useEffect(() => {
    const handleModalOpen = () => setOverlayOpen(true);
    const handleModalClose = () => setOverlayOpen(false);
    const handleMenuOpen = () => setOverlayOpen(true);
    const handleMenuClose = () => setOverlayOpen(false);
    window.addEventListener('modal-open', handleModalOpen);
    window.addEventListener('modal-close', handleModalClose);
    window.addEventListener('menu-open', handleMenuOpen);
    window.addEventListener('menu-close', handleMenuClose);
    return () => {
      window.removeEventListener('modal-open', handleModalOpen);
      window.removeEventListener('modal-close', handleModalClose);
      window.removeEventListener('menu-open', handleMenuOpen);
      window.removeEventListener('menu-close', handleMenuClose);
    };
  }, []);

  // Listen for category dropdown open/close to adjust the panel stacking only while open
  useEffect(() => {
    const handleOpen = () => setIsCategoryDropdownOpen(true);
    const handleClose = () => setIsCategoryDropdownOpen(false);
    window.addEventListener('category-dropdown-open', handleOpen);
    window.addEventListener('category-dropdown-close', handleClose);
    return () => {
      window.removeEventListener('category-dropdown-open', handleOpen);
      window.removeEventListener('category-dropdown-close', handleClose);
    };
  }, []);
  
  // Auto-update category when filter is selected
  useEffect(() => {
    if (selectedFilter) {
      const categoryWithFilter = FILTER_CATEGORIES.find(cat =>
        cat.filters.some(filter => filter.id === selectedFilter.id)
      );
      if (categoryWithFilter && categoryWithFilter.name !== activeCategory) {
        setActiveCategory(categoryWithFilter.name);
      }
    }
  }, [selectedFilter]);
  
  // Vote tracking
  const [currentGenerationId, setCurrentGenerationId] = useState<string | null>(null);
  const [currentPromptUsed, setCurrentPromptUsed] = useState<string | null>(null);
  
  // Initialize prompts from database on mount
  useEffect(() => {
    const initializePrompts = async () => {
      try {
        await refreshPromptCache();
        console.log('✅ Prompt cache initialized');
        
        // Auto-seed prompts on first load (runs once)
        const hasSeeded = localStorage.getItem('prompts_seeded');
        if (!hasSeeded) {
          console.log('🌱 Seeding prompts to database...');
          const allFilters = FILTER_CATEGORIES.flatMap(cat => cat.filters);
          await seedAllPrompts(allFilters);
          localStorage.setItem('prompts_seeded', 'true');
          console.log('✅ Prompts seeded successfully!');
        }
      } catch (error) {
        console.error('Error initializing prompts:', error);
      }
    };
    initializePrompts();
  }, []);
  
  const MAX_HISTORY = 15; // Limit history to prevent memory issues

  const handleImageUpload = (file: File) => {
    // Clean up old image URL to prevent memory leaks
    if (originalImageUrl) {
      URL.revokeObjectURL(originalImageUrl);
    }
    if (generatedImageUrl) {
      URL.revokeObjectURL(generatedImageUrl);
    }
    
    // Force state reset for Safari
    setImageFile(null);
    setOriginalImageUrl(null);
    
// Use setTimeout to ensure Safari processes the state change
    setTimeout(() => {
      setImageFile(file);
      setOriginalImageUrl(URL.createObjectURL(file));
      setGeneratedImageUrl(null);
      setError(null);
      // Reset history when new image is uploaded (history is unique to each image)
      setHistory([]);
      setCurrentHistoryIndex(-1);
      // Note: activeFilter is preserved to allow quick re-application to new image
      
      // Open bottom sheet on mobile/tablet when image is uploaded
      const isMobileOrTablet = window.innerWidth < 1024;
      if (isMobileOrTablet) {
        setIsMobileSheetOpen(true);
      }
    }, 10);
  };

  // Handle dev mode toggle
  const handleDevModeToggle = (enabled: boolean) => {
    setIsDevMode(enabled);
    
    if (enabled && !originalImageUrl) {
      // If enabling dev mode without an image, set a mock image
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 800, 800);
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#f093fb');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 800);
        
        // Add text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEV MODE', 400, 350);
        
        ctx.font = '24px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Mock Image Placeholder', 400, 420);
        ctx.fillText('Test UI without API calls', 400, 460);
        
        // Convert to blob and create URL
        canvas.toBlob((blob) => {
          if (blob) {
            const mockUrl = URL.createObjectURL(blob);
            setDevMockImageUrl(mockUrl);
            setOriginalImageUrl(mockUrl);
            // Create a mock file
            const mockFile = new File([blob], 'sample-image.png', { type: 'image/png' });
            setImageFile(mockFile);
          }
        });
      } else {
        setDevMockImageUrl('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80');
      }
    } else if (!enabled && devMockImageUrl) {
      // Clean up when dev mode is disabled
      URL.revokeObjectURL(devMockImageUrl);
      setDevMockImageUrl(null);
      setOriginalImageUrl(null);
      setImageFile(null);
      setGeneratedImageUrl(null);
      setActiveFilter(null);
      setHistory([]);
      setCurrentHistoryIndex(-1);
    }
  };

  const handleApplyFilter = async (filter: Filter) => {
    if (!imageFile) return;
    setIsLoading(true);
    setIsTransitioning(false);
    setError(null);
    setActiveFilter(filter);
    
    // Close bottom sheet and scroll to top on mobile/tablet when filter is applied
    const isMobileOrTablet = window.innerWidth < 1024;
    if (isMobileOrTablet) {
      setIsMobileSheetOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    try {
      let newImageUrl: string;
      const isDevSimulation = isDevMode;
      
      // Dev mode: simulate image generation without API call
      if (isDevSimulation) {
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Create a mock styled image by adding a colored overlay effect
        // In dev mode, we'll just use the original image with a filter indicator
        newImageUrl = originalImageUrl || '';
      } else {
        // Production mode: actual API call
        // Get prompt from database (falls back to hardcoded if not in DB yet)
        let activePrompt = await getPrompt(filter.id);
        
        // Fallback to hardcoded prompt if not in database
        if (!activePrompt) {
          console.warn(`Prompt not in DB for ${filter.id}, using hardcoded version`);
          activePrompt = filter.prompt;
        }
        
        // Store the prompt used for this generation (needed for auto-refinement)
        setCurrentPromptUsed(activePrompt);
        
        const composedPrompt = `${STYLE_TRANSFER_CONSTRAINTS}\n\n${activePrompt}`;
        const base64Data = await applyImageFilter(
          imageFile,
          composedPrompt
        );
        newImageUrl = `data:image/png;base64,${base64Data}`;
        
        // Increment generation count for analytics
        await incrementGenerationCount(filter.id);
        
// Track prompt usage for authenticated users
        if (user?.id) {
          console.log('👤 User is authenticated, tracking prompt usage...');
          await recordPromptUsage(user.id, filter.id, filter.name);
        } else {
          console.log('👻 User is anonymous, skipping prompt usage tracking');
        }
      }
      
      // Start transition effect
      setIsTransitioning(true);
      
      // Small delay to show the unblur transition
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setGeneratedImageUrl(newImageUrl);
      setIsTransitioning(false);
      
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
      
      // Set generation ID for voting (unique per generation)
      setCurrentGenerationId(`${filter.id}_${Date.now()}`);
      
      // Save to gallery for logged-in users
      if (user?.id && originalImageUrl) {
        addToGallery({
          userId: user.id,
          originalImage: originalImageUrl,
          resultImage: newImageUrl,
          filterName: filter.name,
          filterId: filter.id,
          isFavorite: false,
        });
      }
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
    setSelectedFilter(null);
    setGeneratedImageUrl(null);
    setError(null);
  };

  const handleReset = () => {
    setImageFile(null);
    setOriginalImageUrl(null);
    setGeneratedImageUrl(null);
    setActiveFilter(null);
    setSelectedFilter(null);
    setError(null);
    setIsLoading(false);
    setHistory([]);
    setCurrentHistoryIndex(-1);
    setCurrentGenerationId(null);
  };

  const handleSelectFilter = (filter: Filter) => {
    setSelectedFilter(filter);
  };

  const handleApplySelectedFilter = async () => {
    if (!selectedFilter) return;
    await handleApplyFilter(selectedFilter);
  };

  if (currentPage === 'styles') {
    return (
      <div className="h-screen flex flex-col items-center overflow-hidden py-0 px-4 md:p-6 font-sans text-gray-200 relative subtle-bg">
        <ParticleBackground />
        <div className="absolute inset-0 mesh-overlay pointer-events-none" />
        <Header 
          onLogoClick={() => setCurrentPage('main')} 
          hideMenu={false} 
          showBackButton={true}
          onBackClick={() => setCurrentPage('main')}
        />
        <main className="w-full flex-1 flex items-start justify-center px-4 overflow-hidden pt-4 md:pt-8">
          <StyleGallery
            categories={FILTER_CATEGORIES}
            selectedFilterId={selectedFilter?.id || null}
            onSelectFilter={handleSelectFilter}
            onApplySelectedFilter={async () => {
              setCurrentPage('main');
              await handleApplySelectedFilter();
            }}
            onBack={() => setCurrentPage('main')}
            isApplying={isLoading}
          />
        </main>
      </div>
    );
  }

  // Handle vote feedback - just log without triggering prompt refinement
  const handleVoteRecorded = async (isPositive: boolean) => {
    if (!activeFilter || isDevMode) return;
    // Vote is recorded in GenerationFeedback component - no prompt refinement
    console.log(`Vote recorded for ${activeFilter.name}: ${isPositive ? '👍' : '👎'}`);
  };

  // Handle file input trigger for mobile
  const handleTriggerFileInput = () => {
    // Keep bottom sheet open while file picker is shown
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif';
    
    // Add to DOM for better iOS Safari compatibility
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const processed = await ImageProcessor.processImage(file);
          handleImageUpload(processed.file);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
          setError(errorMessage);
          console.error('Image processing error:', err);
        }
      }
      // Clean up
      document.body.removeChild(input);
    };
    
    // Handle cancel (iOS Safari specific)
    input.oncancel = () => {
      document.body.removeChild(input);
    };
    
    input.click();
  };

  const handleDownload = (imageUrl?: string) => {
    const urlToDownload = imageUrl || generatedImageUrl;
    if (!urlToDownload) return;
    
const link = document.createElement('a');
    link.href = urlToDownload;
    // Get original filename without extension
    const originalName = imageFile?.name || 'image';
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    
    // Create filename with style appended
    const styleName = activeFilter?.name || 'styled';
    const safeStyleName = styleName.replace(/\s+/g, '-').toLowerCase();
    link.download = `${nameWithoutExt}-${safeStyleName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditor = (imageUrl?: string) => {
    const target = imageUrl || generatedImageUrl || originalImageUrl;
    if (target) {
      setImageToEdit(target);
      setIsEditorOpen(true);
    }
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setImageToEdit(null);
  };
  
  const handleSaveEditedImage = async (editedImageUrl: string) => {
    // Replace the generated image with the edited version
    setGeneratedImageUrl(editedImageUrl);
    
    // Update the original image URL so future filters use the edited version
    setOriginalImageUrl(editedImageUrl);
    
    // Convert the edited image back to a File object for future filter applications
    try {
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageFile?.name || 'edited-image.png', { type: 'image/png' });
      setImageFile(file);
    } catch (error) {
      console.error('Error converting edited image to file:', error);
    }
    
    setIsEditorOpen(false);
    setImageToEdit(null);
  };
  
  const handleSaveAIEdit = async (editedImageUrl: string) => {
    // Update the generated image with the AI-edited version
    setGeneratedImageUrl(editedImageUrl);
    
    // Also update the original so future filters use this version
    setOriginalImageUrl(editedImageUrl);
    
    // Convert to File object for future filter applications
    try {
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], imageFile?.name || 'ai-edited-image.png', { type: 'image/png' });
      setImageFile(file);
    } catch (error) {
      console.error('Error converting AI-edited image to file:', error);
    }
  };
  
  const handleShare = async () => {
    if (!generatedImageUrl) return;

try {
      // Convert base64 to blob for sharing
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const styleName = activeFilter?.name || 'styled';
      const file = new File([blob], `stylized-${styleName}.png`, { type: 'image/png' });

      const shareData = {
        title: `AI Stylized Image${styleName ? ` - ${styleName}` : ''}`,
        text: `Check out this cool ${styleName} image I created with AI! Try it yourself at: ${window.location.origin}`,
        url: window.location.origin
      };

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          files: [file]
        });
      } else if (navigator.share) {
        // Fallback without file
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Sharing failed:', error);
      }
    }
  };

  const handlePeekStart = () => setIsPeeking(true);
  const handlePeekEnd = () => setIsPeeking(false);

  const handleOpenPreview = (url?: string) => {
    const targetUrl = url || generatedImageUrl;
    if (targetUrl) {
      setPreviewImageUrl(targetUrl);
      setIsPreviewOpen(true);
    }
  };
  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewImageUrl(null);
  };
  
  // History navigation handlers
  const handleSelectHistory = (index: number) => {
    if (history[index]) {
      setGeneratedImageUrl(history[index].imageUrl);
      setCurrentHistoryIndex(index);
      const filter = FILTER_CATEGORIES
        .flatMap(cat => cat.filters)
        .find(f => f.id === history[index].filterId);
      setActiveFilter(filter || null);
      setSelectedFilter(filter || null);
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
    return (
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:grid lg:grid-cols-[80px_minmax(0,1fr)] lg:gap-4 items-start overflow-visible h-full">
        {/* Desktop Left Toolbar - Always visible, disabled when no image */}
        <div className="hidden lg:flex w-full justify-center">
          <GlamatronStyleSidebar
            categories={FILTER_CATEGORIES}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            selectedFilterId={selectedFilter?.id || null}
            onSelectFilter={handleSelectFilter}
            isLoading={isLoading}
            onApplySelectedFilter={handleApplySelectedFilter}
            canApply={!!selectedFilter && !isLoading && !!originalImageUrl}
            onUploadNewImage={handleTriggerFileInput}
            onRemoveImage={handleReset}
            hasImage={!!originalImageUrl}
            disabled={!originalImageUrl || isLoading}
          />
        </div>

        {/* Main Content Area */}
        {!originalImageUrl ? (
          <ImageUploader onImageUpload={handleImageUpload} />
        ) : (
          <div className="w-full">
          <div className="relative pb-6">
            {isLoading || isTransitioning ? (
              <BlurredImageLoading 
                originalImageUrl={originalImageUrl}
                message={isTransitioning ? 'Finalizing...' : (activeFilter ? `Applying ${activeFilter.name}...` : 'Processing image...')}
                estimatedTimeMs={isTransitioning ? 300 : 10000}
              />
            ) : generatedImageUrl ? (
              <ImageComparison
                originalImageUrl={originalImageUrl}
                generatedImageUrl={generatedImageUrl}
                activeFilterName={activeFilter?.name || 'Styled'}
                onOpenPreview={handleOpenPreview}
                onDownload={handleDownload}
                onShare={handleShare}
                onEdit={handleOpenEditor}
                onSaveAIEdit={handleSaveAIEdit}
                previousImageUrl={currentHistoryIndex > 0 ? history[currentHistoryIndex - 1]?.imageUrl : undefined}
              />
            ) : (
              <ImageDisplay
                originalImageUrl={originalImageUrl}
                generatedImageUrl={generatedImageUrl}
                isLoading={isLoading}
                isPeeking={isPeeking}
                onPeekStart={handlePeekStart}
                onPeekEnd={handlePeekEnd}
                onOpenPreview={handleOpenPreview}
                onDownload={handleDownload}
                onShare={handleShare}
                onEdit={handleOpenEditor}
                onSaveAIEdit={handleSaveAIEdit}
                error={error}
                activeFilterName={activeFilter?.name || null}
                isDevMode={isDevMode}
              />
            )}
          </div>

          {/* Rate this Image and Style History - Under Image Preview */}
          <div className="mt-6 space-y-4">
            {/* Desktop: Side by side layout */}
            <div className="hidden lg:flex flex-wrap items-center justify-center gap-4">
              {generatedImageUrl && !isLoading && activeFilter && currentGenerationId && (
                <GenerationFeedback
                  filterName={activeFilter.id}
                  generationId={currentGenerationId}
                  filterId={activeFilter.id}
                  currentPrompt={currentPromptUsed || undefined}
                  onVoteRecorded={handleVoteRecorded}
                  onShowToast={addToast}
                  wrapperClassName="inline-flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/40"
                />
              )}
              {history.length > 0 && (
                <StyleHistory
                  history={history}
                  currentIndex={currentHistoryIndex}
                  onSelectHistory={handleSelectHistory}
                  onClearHistory={handleClearHistory}
                  containerClassName="w-fit max-w-full rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-2xl shadow-black/40 px-4 py-3"
                />
              )}
            </div>

            {/* Mobile: Stacked layout */}
            <div className="lg:hidden space-y-4">
              {generatedImageUrl && !isLoading && activeFilter && currentGenerationId && (
                <div className="glass-panel p-4 w-full">
                  <GenerationFeedback
                    filterName={activeFilter.id}
                    generationId={currentGenerationId}
                    filterId={activeFilter.id}
                    currentPrompt={currentPromptUsed || undefined}
                    onVoteRecorded={handleVoteRecorded}
                    onShowToast={addToast}
                  />
                </div>
              )}
              {history.length > 0 && (
                <div className="glass-panel p-4 w-full">
                  <h3 className="text-sm font-semibold text-white/80 mb-2">Style History</h3>
                  <StyleHistory
                    history={history}
                    currentIndex={currentHistoryIndex}
                    onSelectHistory={handleSelectHistory}
                    onClearHistory={handleClearHistory}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={`h-screen flex flex-col items-center overflow-hidden py-0 px-4 md:p-6 font-sans text-gray-200 relative subtle-bg ${
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
      
      <Header onLogoClick={handleReset} hideMenu={isEditorOpen} onOpenGallery={() => setIsGalleryOpen(true)} />
      <main className="w-full max-w-6xl mx-auto flex-1 flex items-start justify-center px-4 sm:px-6 overflow-y-auto pt-4 md:pt-8">
        {renderContent()}
      </main>
      <Footer />
      {isPreviewOpen && previewImageUrl && (
        <ImagePreviewModal 
          imageUrl={previewImageUrl} 
          onClose={handleClosePreview}
          filterName={activeFilter?.name}
        />
      )}
      
      {/* Image Editor */}
      {isEditorOpen && imageToEdit && (
        <ImageEditor
          imageUrl={imageToEdit}
          onClose={handleCloseEditor}
          onSave={handleSaveEditedImage}
        />
      )}
      
      {/* Legal and Feedback Modals */}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
      
      {/* Gallery Modal */}
      {user && (
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          userId={user.id}
        />
      )}
      
      {/* Dev Mode Toggle (only in development) */}
      <DevModeToggle
        isDevMode={isDevMode}
        onToggle={handleDevModeToggle}
      />
      
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Mobile Bottom Sheet */}
      {originalImageUrl && (
        <>
          <MobileFloatingButton onClick={() => setIsMobileSheetOpen(true)} />
          <MobileBottomSheet
            isOpen={isMobileSheetOpen}
            onClose={() => setIsMobileSheetOpen(false)}
            categories={FILTER_CATEGORIES}
            onSelectFilter={handleSelectFilter}
            onApplySelectedFilter={handleApplySelectedFilter}
            onClearFilter={handleClearFilter}
            isLoading={isLoading}
            activeFilterId={selectedFilter?.id || null}
            selectedFilter={selectedFilter}
            onReset={handleTriggerFileInput}
            history={history}
            currentHistoryIndex={currentHistoryIndex}
            onSelectHistory={handleSelectHistory}
            onClearHistory={handleClearHistory}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
          />
        </>
      )}
    </div>
  );
};

export default App;


