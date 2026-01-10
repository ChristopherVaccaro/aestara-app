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
import ContactModal from './components/ContactModal';
import HelpFAQModal from './components/HelpFAQModal';
import GalleryModal from './components/GalleryModal';
import CustomStyleUploader from './components/CustomStyleUploader';
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

// ✅ Global guidance that works for BOTH illustration re-renders and photo enhancement
const STYLE_TRANSFER_CONSTRAINTS =
  'CRITICAL IDENTITY + COMPOSITION PRESERVATION (HIGHEST PRIORITY):\n' +
  '1. IDENTITY LOCK: The subject must remain instantly recognizable as the same person.\n' +
  '2. GEOMETRY LOCK: Preserve facial structure and feature shapes (jawline, chin, cheekbones, eyes, nose, mouth) and their proportions.\n' +
  '3. POSE & FRAMING LOCK: Preserve the same pose, camera angle, crop, and composition.\n' +
  '4. CLOTHING SILHOUETTE: Preserve overall clothing silhouette and major garment shapes unless the chosen style explicitly changes wardrobe.\n' +
  '5. STYLE GOAL: Follow the chosen filter’s rendering mode and art direction exactly. Do not “half-switch” styles.\n' +
  '6. BACKGROUND: Preserve general scene layout and perspective, but re-render the background to match the chosen style when applicable.\n' +
  '\nIMPORTANT:\n' +
  '- If the chosen style is an ILLUSTRATION style, the output must look clearly illustrated (not a photo with colored lighting).\n' +
  '- If the chosen style is PHOTO ENHANCEMENT, the output must remain a photograph (no cartoon/ink/paint look).\n';

// ✅ Render-mode locks (the real fix for "photo + neon overlay" failures)
const ILLUSTRATION_RENDER_LOCK =
  'RENDER MODE (MANDATORY): RE-RENDER the target as an illustration. This is NOT a color filter.\n' +
  'The final image must NOT look like a photograph.\n' +
  'Use stylized surfaces and intentional line/shading models consistent with the chosen art style.\n';

const NEGATIVE_PHOTO_REALISM =
  'AVOID (NEGATIVE): photorealistic, photo, DSLR, cinematic portrait, camera realism, lens blur, bokeh, ' +
  'real skin pores, hyperreal, HDR, film grain, realistic skin texture, studio portrait lighting.\n';

const PHOTO_RENDER_LOCK =
  'RENDER MODE (MANDATORY): Keep the image photorealistic as a photograph.\n' +
  'Do NOT introduce illustration linework, cel-shading, paint strokes, toon edges, or comic inks.\n';

const NEGATIVE_ILLUSTRATION =
  'AVOID (NEGATIVE): anime, cartoon, illustration, ink outlines, cel shading, comic style, painterly, watercolor, sketch.\n';

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    name: 'Artistic & Stylized',
    filters: [
      {
        id: 'anime',
        name: 'Anime',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'ANIME STYLE: 2D anime cel-shading with clean inked linework, simplified skin rendering, solid color blocks, and soft shadow shapes.\n' +
          'Keep the subject’s unique facial characteristics, but draw them in anime form while preserving identity and proportions.\n' +
          'BACKGROUND: Re-render background in matching anime style (not photographic).\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'anime_v3',
        name: 'Anime Cinematic',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'CINEMATIC ANIME FILM LOOK: polished anime feature-film rendering.\n' +
          'LINEWORK: elegant clean lines where appropriate.\n' +
          'SHADING: multi-step cel shading (distinct tonal zones), not photographic gradients.\n' +
          'LIGHTING: cinematic rim lights + atmosphere, but still illustrated.\n' +
          'COLOR: rich filmic palette while remaining 2D anime.\n' +
          'BACKGROUND: illustrated atmosphere and depth, not a real photo environment.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'western',
        name: 'Western Theme',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Reimagine in classic American Old West aesthetic with authentic frontier atmosphere.\n' +
          'Apply rugged cowboy styling with weathered textures, cowboy hats, boots, leather elements, vests, bandanas, and duster coats.\n' +
          'Create a dusty frontier setting with wooden buildings, hitching posts, tumbleweeds, and vast open skies.\n' +
          'Use warm golden hour lighting with dramatic shadows and atmospheric dust.\n' +
          'Apply sepia-toned or desaturated color palette with browns, oranges, and muted earth tones.\n' +
          'Include authentic western details like horses, cattle, cacti, and weathered wood textures for immersive Wild West atmosphere.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'oil',
        name: 'Oil Painting',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply classical oil painting rendering style.\n' +
          'STYLE: Visible directional brushstrokes with rich layered pigments and canvas texture.\n' +
          'TECHNIQUE: Impasto texture, wet-on-wet blending, warm and cool color temperatures.\n' +
          'BACKGROUND: Re-render background in oil paint style.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'watercolor',
        name: 'Watercolor',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply watercolor painting rendering style.\n' +
          'STYLE: Transparent washes with soft edges, luminous translucent colors, and paper texture.\n' +
          'TECHNIQUE: Color bleeding effects, loose fluid brushwork, preserved paper whites.\n' +
          'BACKGROUND: watercolor wash background treatment.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'sketch',
        name: 'Pencil Sketch',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply graphite pencil sketch rendering style.\n' +
          'STYLE: Varied pencil strokes with crosshatching and blending on textured paper.\n' +
          'TECHNIQUE: Light to dark pencil range, paper texture, subtle smudging.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'comic',
        name: 'Comic Book',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply comic book art rendering style.\n' +
          'STYLE: Bold black ink outlines with vibrant flat color blocks and Ben-Day dot shading.\n' +
          'TECHNIQUE: Strong linework, limited palette, solid shadows, graphic shapes.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'lowpoly',
        name: 'Low Poly',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply low-polygon 3D art rendering style.\n' +
          'STYLE: Simple triangular polygonal facets with flat shading and geometric appearance.\n' +
          'TECHNIQUE: Clear polygon edges, solid colors per face, minimal polygon count.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'ukiyo',
        name: 'Ukiyo-e',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply traditional Japanese Ukiyo-e woodblock print rendering style.\n' +
          'STYLE: Elegant flowing black outlines with limited flat color palette.\n' +
          'TECHNIQUE: Flat color blocks, paper grain texture, traditional pigments.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'impressionist',
        name: 'Impressionism',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply Impressionist painting rendering style.\n' +
          'STYLE: Short broken brushstrokes, vibrant colors, softened edges emphasizing light.\n' +
          'TECHNIQUE: Layered strokes, optical color mixing, luminous quality.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'popart',
        name: 'Pop Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply Pop Art rendering style.\n' +
          'STYLE: Bright saturated colors with strong outlines, flat blocks, Ben-Day dot patterns.\n' +
          'TECHNIQUE: Screen-printing look, limited bold palette, high contrast.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'artdeco',
        name: 'Art Deco',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply Art Deco rendering style.\n' +
          'STYLE: Strong geometry, clean lines, sophisticated metallic/jewel palette, decorative patterns.\n' +
          'TECHNIQUE: Symmetry, stylized elegance, graphic ornamentation.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'surrealism',
        name: 'Surrealism',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply surrealist art style with dreamlike impossible scenes.\n' +
          'STYLE: symbolic imagery, unexpected juxtapositions, floating objects, impossible architecture.\n' +
          'LIGHTING: soft atmospheric with dramatic shadows; rich jewel tones.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'retrowave',
        name: 'Retrowave/Synthwave',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply 1980s synthwave/retrowave illustrated aesthetic.\n' +
          'ELEMENTS: neon grid landscapes, chrome accents, sunset gradients, wireframe mountains, geometric shapes.\n' +
          'EFFECTS: subtle VHS scan lines + chromatic aberration in an illustrated way.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'glitchart',
        name: 'Glitch Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply digital glitch art aesthetic.\n' +
          'EFFECTS: RGB channel separation, scan line distortions, displaced fragments, digital artifacts.\n' +
          'Keep subject recognizable through glitch effects.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'chibi',
        name: 'Chibi/Kawaii',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into adorable chibi/kawaii illustration while preserving identity cues.\n' +
          'STYLE: oversized head, large sparkling eyes, simplified body, cute proportions, pastel palette.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'lofi',
        name: 'Lo-Fi Aesthetic',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply lo-fi illustrated aesthetic with cozy vibes.\n' +
          'STYLE: warm muted palette, soft grain texture, dreamy softness, anime-inspired lo-fi look.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'biophilic',
        name: 'Biophilic Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Apply biophilic nature-integrated illustration style.\n' +
          'ELEMENTS: flowers, moss, leaves, vines integrated in a stylized artistic way.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'claymation',
        name: 'Claymation',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into claymation/stop-motion style.\n' +
          'STYLE: clay-like matte textures, handmade imperfections, sculpting marks, miniature set feel.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'manga',
        name: 'Manga',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Japanese manga black-and-white comic illustration.\n' +
          'LINEWORK: clean ink lines with varied thickness; SHADING: screentone dots, hatching/crosshatching; high contrast.\n' +
          'BACKGROUND: manga panel quality atmosphere.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'lego',
        name: 'LEGO Minifigure',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into official LEGO minifigure style.\n' +
          'STYLE: plastic toy surfaces, minifig proportions, simple printed face details, LEGO world background.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'cyberpunkneon',
        name: 'Cyberpunk Neon',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'STYLE TARGET: cyberpunk neon in an anime/digital-illustration rendering (cyberpunk anime poster energy).\n' +
          'LIGHTING: intense neon rim light + emissive glow accents (magenta/cyan/violet), stylized bloom.\n' +
          'SURFACES: illustrated materials (painted/inked), no real pores or camera capture.\n' +
          'ATMOSPHERE: rainy neon city, haze, smoke catching light, reflective wet surfaces rendered as illustration.\n' +
          'DETAILS: futuristic signage, tech motifs, graphic shapes.\n' +
          'BACKGROUND: illustrated neon cityscape; do NOT keep photographic realism.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
    ],
  },
  {
    name: 'Photo Enhancement',
    filters: [
      {
        id: 'vintage',
        name: 'Vintage Photo',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into authentic 1970s vintage photograph:\n' +
          'COLOR GRADING - Warm, slightly faded tones with sepia or amber cast.\n' +
          'BLACKS - Lifted, faded blacks; gentle fade in shadows.\n' +
          'GRAIN - Visible film grain texture; organic analog quality.\n' +
          'DAMAGE - Subtle aging effects: slight color shift, minor dust specks.\n' +
          'EXPOSURE - Slightly soft focus, gentle vignette.\n' +
          'AVOID - Digital clarity, HDR.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'bw',
        name: 'Black & White',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Convert to dramatic black and white fine-art photography:\n' +
          'CONTRAST - High contrast with rich tonal range.\n' +
          'MIDTONES - Full spectrum of grays with good separation.\n' +
          'TEXTURE - Enhanced texture detail and sharp edges.\n' +
          'LIGHTING - Dramatic lighting with strong shadows/highlights.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'hdr',
        name: 'HDR Look',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply HDR photographic enhancement:\n' +
          'DYNAMIC RANGE - Expanded tonal range.\n' +
          'DETAILS - Enhanced micro-contrast and clarity.\n' +
          'COLORS - Boosted saturation but believable.\n' +
          'HIGHLIGHTS - Controlled roll-off.\n' +
          'AVOID - Excess halos/oversaturation.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'cinematic',
        name: 'Cinematic',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply professional cinematic color grading (Hollywood film aesthetic):\n' +
          'COLOR PALETTE - Teal shadows, warm highlights/skin tones.\n' +
          'CONTRAST - Controlled contrast with gentle highlight roll-off.\n' +
          'MOOD - Atmospheric, moody, film LUT quality.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'filmnoir',
        name: 'Film Noir',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into classic Film Noir cinematography:\n' +
          'BLACK & WHITE - High contrast monochrome.\n' +
          'LIGHTING - Hard directional chiaroscuro with deep shadows.\n' +
          'MOOD - Mysterious, tension-filled atmosphere.\n' +
          'FOG/SMOKE - Atmospheric haze if appropriate.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'doubleexposure',
        name: 'Double Exposure',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Create artistic double exposure photography effect:\n' +
          'Blend two exposures with soft translucent overlay.\n' +
          'Natural blending, no harsh cutouts.\n' +
          'Strong subject silhouette with complementary imagery.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'boudoir',
        name: 'Boudoir',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply elegant portrait photography styling while preserving exact pose, composition, and facial features.\n' +
          'Soft flattering lighting, warm romantic palette, professional beauty retouching while keeping natural features.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'redcarpet',
        name: 'Red Carpet',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply red carpet celebrity styling while preserving exact pose, composition, and facial features.\n' +
          'Hollywood glamour, professional event lighting, polished makeup/hair.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
    ],
  },
  {
    name: 'Trendy & Social',
    filters: [
      {
        id: 'cyber',
        name: 'Cyberpunk',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into cyberpunk aesthetic (Blade Runner / Ghost in the Shell atmosphere):\n' +
          'LIGHTING - Bright neon pink/cyan/purple/blue with strong contrast.\n' +
          'ATMOSPHERE - Dark moody rain-slicked environment, fog, haze.\n' +
          'TECH - Holograms, circuitry motifs, futuristic UI elements.\n' +
          'EFFECTS - Bloom, neon reflections on wet surfaces.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'vaporwave',
        name: 'Vaporwave',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Vaporwave illustrated aesthetic (90s internet nostalgia art):\n' +
          'COLORS - Pastel pink/cyan/purple gradients.\n' +
          'ELEMENTS - Retro 90s graphics, wireframe grids, statues, palm trees, geometric shapes.\n' +
          'EFFECTS - VHS scan lines, chromatic aberration, digital artifacts (stylized).\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'pixel',
        name: 'Pixel Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Convert into authentic 8-bit/16-bit pixel art:\n' +
          'PIXELS - visible square pixels, crisp edges.\n' +
          'PALETTE - limited colors (16–64).\n' +
          'SHADING - dithering patterns.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'vhs',
        name: 'Retro VHS',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into retro VHS tape recording aesthetic:\n' +
          'DISTORTION - scan lines, tracking errors, warping.\n' +
          'COLOR SHIFT - color bleeding, chroma separation.\n' +
          'QUALITY - low resolution analog compression.\n' +
          'NOISE - video noise/static.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'graffiti',
        name: 'Street Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into street art / graffiti mural style:\n' +
          'TECHNIQUE - spray paint textures, drips, overspray, stencil edges.\n' +
          'COLORS - bold high saturation.\n' +
          'SURFACE - urban wall texture suggested in illustration.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'isometric',
        name: 'Isometric Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into isometric 3D technical illustration:\n' +
          'PERSPECTIVE - true isometric projection.\n' +
          'GEOMETRY - clean precise forms.\n' +
          'SHADING - flat/simple facets.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'gta',
        name: 'GTA Style',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into iconic Grand Theft Auto cover art illustration style while preserving exact facial features and identity.\n' +
          'SIGNATURE GTA LOOK - hyper-stylized digital painting with bold graphic novel elements.\n' +
          'LINEWORK - Thick confident black outlines.\n' +
          'SHADING - Hard-edged cel shading with distinct tonal zones.\n' +
          'COLOR - Extreme saturation, urban palette.\n' +
          'LIGHTING - Dramatic poster lighting, strong rim light.\n' +
          'AVOID - photorealism, soft painterly realism.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
    ],
  },
  {
    name: 'Seasonal & Holiday',
    filters: [
      {
        id: 'christmas',
        name: 'Christmas',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into festive Christmas scene while preserving identity and pose.\n' +
          'Holiday accessories, warm glowing lights, cozy winter styling, soft snow/bokeh effects.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'halloween',
        name: 'Halloween',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply festive autumn Halloween styling (family-friendly) with pumpkins, warm orange/purple palette, gentle fog.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'valentines',
        name: "Valentine's Day",
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into romantic Valentine’s scene with hearts, roses, soft dreamy lighting, blush/red palette.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'easter',
        name: 'Easter',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into cheerful Easter scene with spring florals, pastel palette, bright soft lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'newyear',
        name: 'New Year',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into celebratory New Year scene with confetti, sparkles, metallic palette, festive lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'thanksgiving',
        name: 'Thanksgiving',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into warm Thanksgiving scene with harvest decor, cozy autumn layers, golden lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'stpatricks',
        name: "St. Patrick's Day",
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into festive St. Patrick’s Day scene with greens/golds, shamrocks, cheerful lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'summer',
        name: 'Summer Vibes',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into bright summer scene with beach/tropical elements, vibrant colors, sunny lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'winter',
        name: 'Winter Wonderland',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into magical winter scene with snow, frosted trees, icy palette, soft diffused lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
    ],
  },
  {
    name: 'Classic Portraits',
    filters: [
      {
        id: 'pinup',
        name: 'Pin-Up Art',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into classic 1950s pin-up illustration style.\n' +
          'Vintage painted/airbrushed illustration aesthetic with warm palette and retro styling.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'renaissance',
        name: 'Renaissance Portrait',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Renaissance master painting style.\n' +
          'Classical oil painting, chiaroscuro lighting, rich fabrics, old master composition.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'baroque',
        name: 'Baroque Elegance',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Baroque painting style.\n' +
          'Dramatic theatrical lighting, opulent textures, deep shadows, golden highlights.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'rococo',
        name: 'Rococo Romance',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Rococo painting style.\n' +
          'Soft pastels, ornate decorative details, gentle lighting, romantic elegance.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'noir',
        name: 'Noir Portrait',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into film noir portrait photography.\n' +
          'High-contrast monochrome, hard directional lighting, mysterious mood.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'poolside',
        name: 'Poolside Leisure',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into vintage poolside photography with retro resort elegance.\n' +
          'Bright sun, warm tones, refined leisure vibe.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'studio',
        name: 'Studio Portrait',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into professional studio portrait photography.\n' +
          'Clean background, pro lighting setup, polished styling and retouching.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'golden',
        name: 'Golden Hour',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into golden hour photography with warm glowing sunlight and natural softness.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
    ],
  },
  {
    name: 'Fun & Transformative',
    filters: [
      {
        id: 'realism',
        name: 'Realism',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform this illustrated or anime-style image into a highly realistic professional photograph while keeping the same subject, composition, and pose.\n' +
          'Photorealism goals:\n' +
          '- Skin: natural tones with visible pores, subtle variation.\n' +
          '- Hair: thousands of fine strands.\n' +
          '- Clothing: realistic fabric weave and folds.\n' +
          '- Lighting: cinematic natural light with depth of field.\n' +
          'Avoid: cartoon lines, cel-shading, painterly rendering.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'fantasy',
        name: 'Fantasy World',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into high fantasy illustration aesthetic (book cover / cinematic fantasy art).\n' +
          'Ethereal magical lighting, glowing particles, enchanted environments.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: '1890s',
        name: '1890s Photo',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into authentic 1890s antique photograph.\n' +
          'Sepia/albumen tones, aged artifacts, soft focus, reduced contrast, period lens feel.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'steampunk',
        name: 'Steampunk',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Transform into Steampunk Victorian science-fiction aesthetic.\n' +
          'Brass/copper/leather materials, gears, gauges, clockwork details, warm metallic tones.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'stainedglass',
        name: 'Stained Glass',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into stained glass window art.\n' +
          'Colored glass segments with dark lead lines, translucent jewel tones, backlit glow.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'mosaic',
        name: 'Mosaic',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into mosaic tile artwork.\n' +
          'Visible tesserae tiles and grout lines, limited palette per tile, handcrafted texture.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'chineseink',
        name: 'Chinese Ink',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into traditional Chinese ink painting (Sumi-e/Shui-mo).\n' +
          'Expressive brushwork, ink gradations, minimalism, rice paper texture, negative space.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'simpsons',
        name: 'Simpsons Style',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into The Simpsons TV series art style.\n' +
          'Flat colors, bold outlines, simple shapes, Springfield aesthetic.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'southpark',
        name: 'South Park Style',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into South Park cutout animation style.\n' +
          'Flat paper shapes, minimal detail, crude simple geometry.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'marvelcomic',
        name: 'Marvel Comics',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into classic Marvel Comics illustration style.\n' +
          'Bold ink lines, four-color printing feel, Ben-Day dots, dramatic shadows.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'dccomic',
        name: 'DC Comics',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into DC Comics superhero illustration style with dramatic transformation.\n' +
          'Bold ink lines, rich jewel tones, dramatic lighting; add hero costume elements.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'studioghibli',
        name: 'Studio Ghibli',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Studio Ghibli animated film art style.\n' +
          'Hand-painted backgrounds, soft warm palette, gentle expressions, whimsical atmosphere.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'disneypixar',
        name: 'Disney/Pixar 3D',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Disney/Pixar 3D animated film rendering.\n' +
          'High-quality CGI, appealing proportions, glossy eyes, soft GI lighting.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'spiderverse',
        name: 'Spider-Verse',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Spider-Verse animation style.\n' +
          'Comic halftones, bold lines, hatching, high-contrast colors, stylized chromatic effects.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'arcane',
        name: 'Arcane Style',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into Arcane (Fortiche) painterly animation style.\n' +
          'Painted texture overlays, dramatic lighting, rich palette, atmospheric depth.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
      {
        id: 'onepunchman',
        name: 'One Punch Man',
        prompt:
          `${ILLUSTRATION_RENDER_LOCK}` +
          'Transform into One Punch Man anime/manga art style.\n' +
          'Clean bold lines, high-contrast shading, speed lines/impact effects.\n' +
          `${NEGATIVE_PHOTO_REALISM}`
      },
    ],
  },
  {
    name: 'Aesthetic Styles',
    filters: [
      {
        id: 'grunge90s',
        name: '90s Grunge',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply 1990s grunge aesthetic: flannel, band tees, Doc Martens, muted desaturated palette, gritty texture.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'goth',
        name: 'Gothic',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply Gothic aesthetic: dark palette, dramatic makeup, Victorian-inspired black lace/velvet/leather, chiaroscuro mood.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'emo',
        name: 'Emo',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply 2000s emo aesthetic: side-swept bangs, heavy eyeliner, skinny jeans, band tee styling, moody lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'scene',
        name: 'Scene Kid',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply 2000s scene aesthetic: teased colorful hair, neon accessories, checkered patterns, high saturation.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'punk',
        name: 'Punk Rock',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply punk rock aesthetic: leather/studs/chains, gritty textures, rebellious mood, high contrast lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'futuristic',
        name: 'Futuristic',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply futuristic sci-fi styling: metallic fabrics, tech accessories, neon accents, cyber aesthetic.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'retro80s',
        name: 'Retro 80s',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply 1980s retro aesthetic: big hair, neon clothing, bold makeup, MTV-era energy, colored lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'rockabilly',
        name: 'Rockabilly',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply 1950s rockabilly aesthetic: victory rolls/pompadour, red lipstick, polka dots/gingham, diner vibe.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'boho',
        name: 'Boho Chic',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply bohemian aesthetic: flowing fabrics, layered jewelry, earthy palette, soft natural light.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'maximalist',
        name: 'Maximalist',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply maximalist aesthetic: dense layered patterns, vibrant colors, ornate embellishments, rich textures.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'psychedelic',
        name: 'Psychedelic',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply psychedelic aesthetic: swirling rainbow patterns, fractals/mandalas, glowing trippy lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'cottagecore',
        name: 'Cottagecore',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply cottagecore aesthetic: soft natural styling, florals, warm pastoral palette, golden hour softness.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'coquette',
        name: 'Coquette',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply coquette aesthetic: bows, pearls, lace/ruffles, pastel palette, dreamy romantic lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'cleangirl',
        name: 'Clean Girl',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply clean girl aesthetic: minimal dewy makeup, sleek hair, neutral palette, effortless polished look.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
      {
        id: 'oldmoney',
        name: 'Old Money',
        prompt:
          `${PHOTO_RENDER_LOCK}` +
          'Apply old money aesthetic: timeless tailored wardrobe, quiet luxury palette (navy/cream/camel), refined lighting.\n' +
          `${NEGATIVE_ILLUSTRATION}`
      },
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
  const [showContact, setShowContact] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
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

  // Custom style modal
  const [isCustomStyleOpen, setIsCustomStyleOpen] = useState<boolean>(false);

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
      // Convert blob URLs to data URLs for persistence (blob URLs expire with session)
      if (user?.id && originalImageUrl) {
        let persistentOriginalUrl = originalImageUrl;

        // Convert blob URL to data URL for persistence
        if (originalImageUrl.startsWith('blob:')) {
          try {
            const response = await fetch(originalImageUrl);
            const blob = await response.blob();
            persistentOriginalUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          } catch (err) {
            console.warn('Failed to convert original image for gallery:', err);
          }
        }

        addToGallery({
          userId: user.id,
          originalImage: persistentOriginalUrl,
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

  const handleApplyCustomStyle = async (styleImageUrl: string, styleDescription: string) => {
    if (!imageFile || !originalImageUrl) {
      addToast('Please upload an image first', 'error');
      return;
    }

    setIsLoading(true);
    setIsCustomStyleOpen(false);

    try {
      // Convert blob URL to base64 for the style reference image
      let styleImageBase64 = '';
      let styleMimeType = 'image/jpeg';

      if (styleImageUrl.startsWith('blob:')) {
        const response = await fetch(styleImageUrl);
        const blob = await response.blob();
        styleMimeType = blob.type || 'image/jpeg';

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            if (result && result.includes(',')) {
              resolve(result.split(',')[1]);
            } else {
              reject(new Error('Failed to read style image'));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        styleImageBase64 = base64;
      }

      // ✅ Custom style prompt updated to force render-mode transfer (not color overlay)
      const customPrompt = `You are given two images:
- IMAGE 1: STYLE REFERENCE (learn rendering mode: illustration vs photo, linework, shading model, palette, lighting)
- IMAGE 2: TARGET PHOTO (keep identity/pose/framing)

${styleDescription ? `USER NOTES: ${styleDescription}\n\n` : ''}TASK:
1) Determine whether IMAGE 1 is illustrated or photographic.
2) RE-RENDER IMAGE 2 using the SAME rendering mode as IMAGE 1 (not a color overlay).
3) Preserve identity, facial geometry, pose, framing from IMAGE 2.
4) Recreate linework/shading/surface treatment/palette/lighting from IMAGE 1.

IMPORTANT:
- Output must depict the person from IMAGE 2, not IMAGE 1.
- If IMAGE 1 is illustrated, output must clearly look illustrated (not photoreal).
- If IMAGE 1 is photographic, output must remain photographic (not cartoon).`;

      const base64Data = await applyImageFilter(imageFile, customPrompt, {
        styleImageBase64,
        styleMimeType,
      });

      // Convert base64 to data URL (same as normal filter flow)
      const newImageUrl = `data:image/png;base64,${base64Data}`;
      setGeneratedImageUrl(newImageUrl);
      setActiveFilter({ id: 'custom', name: 'Custom Style', prompt: customPrompt });

      // Add to history
      const newHistoryItem: HistoryItem = {
        id: `custom_${Date.now()}`,
        imageUrl: newImageUrl,
        filterName: 'Custom Style',
        filterId: 'custom',
        timestamp: Date.now(),
      };
      const newHistory = history.slice(0, currentHistoryIndex + 1);
      const updatedHistory = [...newHistory, newHistoryItem].slice(-MAX_HISTORY);
      setHistory(updatedHistory);
      setCurrentHistoryIndex(updatedHistory.length - 1);

      addToast('Custom style applied!', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply custom style';
      setError(errorMessage);
      addToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
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
    // Fixed height for consistent sizing like Glamatron
    const CONTAINER_HEIGHT = 'h-[400px] sm:h-[500px] md:h-[65vh] lg:h-[70vh] md:max-h-[750px]';

    return (
      <>
        {/* Fixed Left Sidebar - Like Glamatron, aligned with image container top */}
        <div className="hidden lg:block fixed left-0 xl:left-[max(0px,calc((100vw-72rem)/2))] top-32 z-40">
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
            onOpenCustomStyle={() => setIsCustomStyleOpen(true)}
          />
        </div>

        {/* Main Content Area - Offset for fixed sidebar */}
        <div className="w-full max-w-6xl mx-auto lg:pl-20">
          <div className={`w-full ${CONTAINER_HEIGHT}`}>
            {!originalImageUrl ? (
              <ImageUploader onImageUpload={handleImageUpload} />
            ) : (
              <div className="w-full h-full relative">
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
                    onRemoveImage={handleReset}
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
                    onRemoveImage={handleReset}
                  />
                )}
              </div>
            )}
          </div>

          {/* Style History - Accordion below image - hidden during loading to prevent layout shift */}
          {history.length > 0 && !isLoading && !isTransitioning && (
            <div className="mt-4">
              <StyleHistory
                history={history}
                currentIndex={currentHistoryIndex}
                onSelectHistory={handleSelectHistory}
                onClearHistory={handleClearHistory}
              />
            </div>
          )}
        </div>
      </>
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

      <Header onLogoClick={handleReset} hideMenu={isEditorOpen} onOpenGallery={() => setIsGalleryOpen(true)} onOpenHelp={() => setShowHelp(true)} />
      <main className="w-full max-w-6xl mx-auto flex-1 flex items-start justify-center px-4 sm:px-6 overflow-y-auto pt-4 md:pt-8">
        {renderContent()}
      </main>
      <Footer
        onOpenContact={() => setShowContact(true)}
        onOpenTerms={() => setShowTerms(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
      />
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

      {/* Contact and Help Modals */}
      <ContactModal isOpen={showContact} onClose={() => setShowContact(false)} />
      <HelpFAQModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Gallery Modal */}
      {user && (
        <GalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          userId={user.id}
        />
      )}

      {/* Custom Style Upload Modal */}
      <CustomStyleUploader
        isOpen={isCustomStyleOpen}
        onClose={() => setIsCustomStyleOpen(false)}
        onApplyCustomStyle={handleApplyCustomStyle}
        isLoading={isLoading}
        disabled={!originalImageUrl}
      />

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
