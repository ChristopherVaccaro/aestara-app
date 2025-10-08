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
import ComparisonModeToggle from './components/ComparisonModeToggle';
import TermsOfService from './components/TermsOfService';
import PrivacyPolicy from './components/PrivacyPolicy';
import FeedbackForm from './components/FeedbackForm';
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
      { id: 'anime', name: 'Anime', prompt: 'Apply authentic Japanese anime art style inspired by Studio Ghibli films: LINEWORK - Delicate, soft outlines with subtle line weight. Gentle, hand-drawn quality (not digital precision). SHADING - Soft watercolor-like cel-shading with gentle gradients and natural color transitions. Painterly quality with atmospheric lighting. COLORS - Warm, natural color palette with soft saturation. Earthy tones, gentle pastels, harmonious color relationships. FACIAL FEATURES - Refined anime proportions with large, soulful expressive eyes, small delicate nose, natural gentle mouth. Innocent, appealing character design. HAIR - Flowing, organic hair with soft texture and natural movement. Individual strands with gentle highlights and depth. ATMOSPHERE - Dreamy, nostalgic quality with soft lighting and gentle mood. Hand-painted aesthetic. DETAILS - Meticulous but soft detail work. Natural, organic forms. AVOID - Sharp digital lines, harsh shadows, oversaturated colors, aggressive styling, western cartoon look. AIM FOR - Studio Ghibli film aesthetic (Spirited Away, My Neighbor Totoro, Howl\'s Moving Castle) with soft hand-painted quality, gentle warmth, and emotional depth.' },
      { id: 'anime_v2', name: 'Anime Enhanced', prompt: 'Apply premium anime art style (similar to Ufotable or Kyoto Animation quality): VISUAL APPROACH - High-fidelity anime illustration with exceptional detail. LINEART - Precise, varied line weights with thinner lines for fine details. COLORING - Rich color palette with subtle gradients and atmospheric lighting. SHADING - Layered cel-shading with ambient occlusion and soft rim lighting. DETAILS - Meticulous rendering of hair strands, fabric textures, and environmental elements. COMPOSITION - Maintain depth and dimensional quality. AVOID - Flat coloring, thick outlines, oversimplification, cartoonish features. AIM FOR - Professional anime illustration with cinematic quality and artistic refinement like high-budget anime series.' },
      { id: 'anime_v3', name: 'Anime Cinematic', prompt: 'Transform into theatrical anime movie style (think Makoto Shinkai or Studio Ghibli film quality): ATMOSPHERE - Dramatic cinematic lighting with rich ambient effects. LINEWORK - Dynamic, expressive lines with varied thickness for depth and motion. COLORING - Vibrant, saturated colors with complex gradients and atmospheric perspective. SHADING - Advanced cel-shading with dramatic light/shadow contrast and volumetric lighting effects. DETAIL LEVEL - Film-grade quality with intricate textures, detailed backgrounds, and layered elements. MOOD - Emotional depth through lighting and color temperature. MOVEMENT - Suggest motion through hair flow and dynamic composition. AVOID - Static poses, flat colors, simple shading. AIM FOR - Movie poster quality anime art with theatrical polish and emotional impact.' },
      { id: 'cartoon', name: '3D Cartoon', prompt: 'Recreate in modern 3D animated film style (DreamWorks/Illumination quality): MODELING - Smooth, rounded 3D forms with soft edges and gentle curves. TEXTURING - Clean, painted textures without excessive detail or realism. LIGHTING - Soft, diffused three-point lighting with gentle shadows. FEATURES - Slightly exaggerated proportions, large expressive eyes, simplified but appealing facial structure. COLORS - Vibrant, saturated colors with subtle gradients. MATERIALS - Matte to semi-gloss surfaces, not hyper-realistic. AVOID - Photorealism, rough textures, harsh lighting, overly complex details. AIM FOR - Appealing, family-friendly 3D animation aesthetic with charm and personality.' },
      { id: 'pixar', name: 'Pixar Style', prompt: 'Transform into authentic Pixar Animation Studios style: CHARACTER DESIGN - Large, soulful eyes (most important feature), soft rounded shapes, appealing proportions, expressive eyebrows. MODELING - Smooth, stylized 3D forms with emphasis on readability and appeal over realism. TEXTURING - Clean, artistic textures with subtle detail (not photorealistic). LIGHTING - Warm, cinematic lighting with soft bounce light and rich colors. SHADING - Smooth gradients with subtle subsurface scattering on skin. COLORS - Rich, saturated palette with warm undertones. MOOD - Emotional warmth and inviting atmosphere. AVOID - Uncanny valley, excessive realism, harsh lighting, cold tones. REFERENCE - Think Toy Story, Inside Out, Up quality with emphasis on heart and charm.' },
      { id: 'western', name: 'Western Theme', prompt: 'Reimagine in classic American Old West aesthetic with authentic frontier atmosphere. Apply rugged cowboy styling with weathered textures, cowboy hats, boots, leather elements, vests, bandanas, and duster coats. Create a dusty frontier setting with wooden buildings, hitching posts, tumbleweeds, and vast open skies. Use warm golden hour lighting with dramatic shadows and atmospheric dust. Apply sepia-toned or desaturated color palette with browns, oranges, and muted earth tones. Include authentic western details like horses, cattle, cacti, and weathered wood textures for immersive Wild West atmosphere.' },
      { id: 'oil', name: 'Oil Painting', prompt: 'Recreate as classical oil painting with authentic traditional technique: BRUSHWORK - Visible, directional brushstrokes with varied thickness and texture. Apply impasto technique where appropriate. COLORS - Rich, layered pigments with subtle color mixing on canvas. Use warm and cool color temperatures. TEXTURE - Heavy paint application with dimensional surface quality. BLENDING - Wet-on-wet blending in some areas, distinct strokes in others. COMPOSITION - Traditional painting composition with attention to light and form. SURFACE - Canvas texture visible through paint layers. AVOID - Digital smoothness, photograph-like precision, flat colors. AIM FOR - Authentic oil painting appearance like classical masters (Rembrandt, Monet, Van Gogh style richness).' },
      { id: 'watercolor', name: 'Watercolor', prompt: 'Transform into authentic watercolor painting on paper: TECHNIQUE - Transparent washes with color bleeding and blooming effects. EDGES - Soft, irregular edges where water and pigment interact naturally. COLORS - Luminous, translucent layers with visible paper showing through in places. TEXTURE - Granulation effects, salt textures, water marks, and natural pigment settling. BRUSHWORK - Loose, fluid strokes with varying wetness. WHITES - Preserved paper whites for highlights (no white paint). COMPOSITION - Light, airy quality with spontaneous feel. AVOID - Opaque colors, hard edges, digital perfection, heavy coverage. AIM FOR - Delicate, ethereal quality of traditional watercolor with natural medium behavior.' },
      { id: 'sketch', name: 'Pencil Sketch', prompt: 'Create as realistic graphite pencil drawing on textured paper: LINE QUALITY - Varied pencil strokes from light to dark (2H to 6B range). SHADING - Crosshatching, hatching, and blending techniques for tonal values. TEXTURE - Visible paper tooth/grain, pencil grain direction. HIGHLIGHTS - Paper white for brightest areas, subtle eraser marks. DETAILS - Fine linework for important features, looser sketching for secondary elements. SMUDGING - Subtle blending in shadow areas. COMPOSITION - Artistic sketch quality, not mechanical precision. AVOID - Digital clean lines, perfect smoothness, photo tracing look. AIM FOR - Hand-drawn sketch authenticity with artistic spontaneity and traditional graphite characteristics.' },
      { id: 'comic', name: 'Comic Book', prompt: 'Transform into authentic comic book art style (Marvel/DC quality): LINEWORK - Bold, confident black ink outlines (2-4pt weight) with varied thickness for emphasis. COLORS - Vibrant, flat color blocks with limited palette. Primary and secondary colors dominate. SHADING - Ben-Day dot patterns for midtones, solid black shadows for drama. HIGHLIGHTS - Stark white areas for dramatic contrast. COMPOSITION - Dynamic angles, action-oriented poses, dramatic perspective. DETAILS - Simplified features with emphasis on strong silhouettes. EFFECTS - Speed lines, emanata, and comic visual vocabulary where appropriate. AVOID - Subtle gradients, soft shadows, painterly effects, photorealistic rendering. AIM FOR - Classic four-color comic book printing aesthetic with bold graphic impact.' },
      { id: 'lowpoly', name: 'Low Poly', prompt: 'Transform into low-polygon 3D art style: GEOMETRY - Simple triangular and polygonal facets, clearly visible edges. Reduce detail to basic geometric shapes. SHADING - Flat shading per polygon (no gradients within faces), single color per face. COLORS - Solid, distinct colors for each polygon with clear facet separation. EDGES - Sharp, well-defined polygon edges. COMPLEXITY - Simplified mesh with minimal polygon count. AESTHETIC - Geometric, crystalline appearance. AVOID - Smooth surfaces, curved lines, gradient shading, high detail. AIM FOR - Stylized low-poly 3D game aesthetic with clear geometric structure and minimalist appeal.' },
      { id: 'ukiyo', name: 'Ukiyo-e', prompt: 'Recreate as traditional Japanese Ukiyo-e woodblock print (Edo period style): LINEWORK - Elegant, flowing black outlines with varied thickness. Graceful curves and organic shapes. COLORS - Limited, flat color palette (4-8 colors maximum). Use traditional pigments: indigo, vermillion, ochre, green. TECHNIQUE - Flat color blocks with no gradients (woodblock printing limitations). Visible registration marks if appropriate. COMPOSITION - Asymmetrical balance, negative space, traditional Japanese aesthetic principles. PATTERNS - Decorative patterns in clothing and backgrounds. TEXTURE - Slight paper grain, woodblock texture. AVOID - Western perspective, gradients, photorealism, modern colors. AIM FOR - Authentic Ukiyo-e appearance like Hokusai or Hiroshige works with traditional Japanese artistic sensibility.' },
      { id: 'impressionist', name: 'Impressionism', prompt: 'Transform into Impressionist painting (Monet, Renoir, Pissarro style): BRUSHWORK - Short, broken brushstrokes with visible directional marks. Quick, spontaneous application. COLORS - Bright, vibrant palette without black. Juxtaposed pure colors that mix optically. Use complementary colors side by side. LIGHT - Emphasis on capturing changing light quality and atmospheric effects. EDGES - Soft, blurred boundaries. Forms suggested rather than defined. COMPOSITION - Natural, snapshot-like framing. Outdoor lighting quality even for indoor scenes. TECHNIQUE - Wet-on-wet painting, layered strokes, emphasis on color over line. AVOID - Sharp details, defined edges, dark shadows, precise rendering. AIM FOR - Luminous, shimmering quality with emphasis on light effects and momentary impression over photographic accuracy.' },
      { id: 'popart', name: 'Pop Art', prompt: 'Transform into bold Pop Art style (Andy Warhol, Roy Lichtenstein aesthetic): COLORS - Bright, saturated, limited palette (3-5 bold colors). High contrast with vibrant primaries and secondaries. TECHNIQUE - Flat, screen-printing appearance with clean color blocks. No gradients or subtle transitions. OUTLINES - Strong black outlines or solid color edges. HALFTONES - Ben-Day dots or similar printing patterns for shading where needed. COMPOSITION - Graphic, commercial art aesthetic. Bold, simplified forms. STYLE - Mass production feel, repetition elements, commercial advertising influence. CONTRAST - Extreme contrast between colors and areas. AVOID - Subtlety, complex shading, realistic textures, muted colors. AIM FOR - Bold graphic impact like 1960s commercial art and silkscreen printing with iconic, immediately recognizable style.' },
      { id: 'artdeco', name: 'Art Deco', prompt: 'Transform into Art Deco style (1920s-1930s luxury aesthetic): GEOMETRY - Strong geometric patterns, symmetrical designs, zigzags, chevrons, sunburst motifs. LINES - Bold, clean lines with streamlined forms. Angular and stepped shapes. COLORS - Sophisticated palette: gold, black, silver, rich jewel tones (emerald, sapphire, ruby), cream, metallics. ORNAMENTATION - Stylized decorative elements, Egyptian influences, machine-age aesthetics. PATTERNS - Repetitive geometric patterns, fan shapes, stepped forms. LUXURY - Glamorous, opulent feel with metallic accents and shine. COMPOSITION - Symmetry, balance, architectural quality. AVOID - Organic curves, muted colors, rustic textures, minimalism. AIM FOR - Elegant, sophisticated Jazz Age aesthetic with geometric precision and luxurious materials like Tamara de Lempicka or Erté artwork.' },
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
    ],
  },
  {
    name: 'Fun & Transformative',
    filters: [
      { id: 'realism', name: 'Realism', prompt: 'COMPLETELY REDESIGN this illustrated/cartoon/anime image as a real photograph. This is a FULL transformation from drawing to photography. MANDATORY CHANGES: 1) REMOVE ALL OUTLINES - No black lines, no cartoon borders, no illustration edges. 2) REPLACE FLAT COLORS - Remove all cel-shading and flat illustrated colors. Add realistic skin with visible pores, fine wrinkles, natural skin texture, subtle color variations, and subsurface light scattering. 3) HAIR TRANSFORMATION - Convert drawn hair clumps into thousands of individual photorealistic hair strands with natural shine, flyaways, and realistic texture. No illustrated hair shapes. 4) FABRIC REALISM - Replace flat clothing with realistic fabric showing weave patterns, wrinkles, folds, and material texture. 5) LIGHTING - Use natural photographic lighting with soft shadows, realistic highlights, ambient occlusion, and light bounce. Remove cartoon lighting. 6) FACIAL FEATURES - Transform simplified cartoon features into realistic human anatomy with natural proportions, real eye reflections, realistic lips with texture, natural nose structure. 7) DEPTH - Add photographic depth of field with realistic background blur. 8) COLORS - Use natural, muted photographic colors. No vibrant cartoon saturation. CRITICAL - This must look like a professional photograph taken with a camera, NOT an illustration or drawing. Remove every trace of cartoon/anime style. Think: cast photo for live-action adaptation of animated character. AVOID COMPLETELY - Any outlines, flat colors, simplified features, cartoon eyes, illustrated hair, cel-shading, drawing aesthetics. AIM FOR - Indistinguishable from a real photograph. Professional portrait photography quality with complete photorealism.' },
      { id: 'fantasy', name: 'Fantasy World', prompt: 'Transform into fantasy realm aesthetic (magical fairy tale world): ATMOSPHERE - Enchanted, magical environment with otherworldly quality. Glowing mystical elements. LIGHTING - Ethereal, soft magical lighting. Bioluminescent glows, sparkles, light particles. ELEMENTS - Fantasy elements like magical energy, glowing crystals, enchanted flora, mystical fog. COLORS - Rich, saturated fantasy palette with jewel tones and magical hues. ENVIRONMENT - Enchanted forest, magical landscapes, fairy tale settings. MOOD - Whimsical, wondrous, dreamlike atmosphere. DETAILS - Magical particles, glowing accents, fantasy embellishments. AVOID - Modern elements, realistic photography, mundane settings, harsh lighting. AIM FOR - High fantasy illustration aesthetic like fantasy book covers or fantasy films with magical, enchanting quality.' },
      { id: 'galaxy_bg', name: 'Galaxy BG', prompt: 'Transform background into cosmic galaxy scene while preserving subject: FOREGROUND - Keep main subject clear and well-defined in original form. BACKGROUND - Replace with deep space galaxy scene. Colorful nebulae, star fields, cosmic dust clouds. COLORS - Rich space colors: purples, blues, magentas, teals with bright stars. DEPTH - Multiple layers of cosmic elements creating deep space atmosphere. BLENDING - Natural edge blending between subject and space background. LIGHTING - Subject lit to match cosmic environment with rim lighting if appropriate. DETAILS - Detailed nebula clouds, star clusters, galaxy spirals, cosmic phenomena. AVOID - Flat background, poor subject isolation, unnatural edges, cartoonish space. AIM FOR - Professional space composite like Hubble telescope imagery behind subject with cosmic majesty.' },
      { id: '1890s', name: '1890s Photo', prompt: 'Transform into authentic 1890s antique photograph: COLOR - Sepia tone or albumen print coloring. Warm brown/tan monochrome. DAMAGE - Aged photograph artifacts: cracked emulsion, faded areas, edge deterioration, foxing spots. TEXTURE - Visible paper texture, photographic plate texture, period-appropriate surface. QUALITY - Soft focus typical of 19th century photography. Slightly blurred, low contrast. COMPOSITION - Victorian era photographic aesthetic. Formal poses, studio quality. WEAR - Age spots, water damage marks, creases, vintage wear patterns. CLARITY - Reduced sharpness matching old lens quality. AVOID - Modern sharpness, digital effects, vibrant colors, contemporary styling. AIM FOR - Genuine antique photograph appearance from Victorian era with authentic aging and period photography characteristics.' },
      { id: 'halloween', name: 'Halloween', prompt: 'Transform into Halloween festive autumn atmosphere: LIGHTING - Warm orange and purple color grading. Soft glowing illumination like candlelight. ATMOSPHERE - Mysterious, slightly spooky ambiance. Evening or twilight mood. Atmospheric mist or fog. COLORS - Autumn palette: oranges, purples, deep browns, blacks. Warm glowing accents. MOOD - Festive yet mysterious. Playful spooky rather than scary. EFFECTS - Glowing lights, volumetric fog, subtle magical atmosphere. Soft bokeh lights. ENVIRONMENT - Autumn evening setting with warm atmospheric glow. SEASON - Clear autumn aesthetic with harvest season feel. AVOID - Gore, explicit scary elements, harsh lighting, summer brightness. AIM FOR - Festive Halloween card aesthetic with warm atmospheric lighting and family-friendly mysterious autumn evening mood.' },
      { id: 'steampunk', name: 'Steampunk', prompt: 'Transform into Steampunk aesthetic (Victorian science fiction): ELEMENTS - Mechanical gears, brass fittings, copper pipes, gauges, clockwork mechanisms, steam-powered machinery. MATERIALS - Brass, copper, bronze, polished metal, leather, dark wood, rivets. ERA - Victorian era (1850s-1900s) fashion and architecture with anachronistic technology. DETAILS - Exposed machinery, intricate mechanical details, pressure gauges, pipes, valves. COLORS - Warm metallic tones: brass gold, copper, bronze, brown leather, sepia. ATMOSPHERE - Industrial revolution meets science fiction. Mechanical elegance. MOOD - Retro-futuristic, industrial, Victorian sophistication. AVOID - Modern technology, plastic materials, digital displays, bright neon. AIM FOR - Victorian-era industrial aesthetic with fantastical mechanical elements like Jules Verne novels or steampunk illustrations.' },
      { id: 'stainedglass', name: 'Stained Glass', prompt: 'Transform into stained glass window art (church window style): STRUCTURE - Colored glass segments separated by dark lead came/solder lines. Clear geometric or organic divisions. COLORS - Vibrant, translucent jewel-tone colors. Light shining through glass effect. TECHNIQUE - Individual glass pieces with distinct boundaries. Lead lines defining each segment. LIGHT - Backlit quality with luminous, glowing colors. Light transmission through colored glass. PATTERNS - Geometric patterns, art nouveau flowing lines, or pictorial scenes in glass. TEXTURE - Slight glass texture, uneven color within pieces. BORDERS - Heavy lead outlines (black lines) around each glass piece. AVOID - Solid opaque colors, photographic detail, smooth gradients within pieces, missing lead lines. AIM FOR - Authentic cathedral stained glass window appearance with translucent luminous quality and traditional glass art craftsmanship.' },
      { id: 'mosaic', name: 'Mosaic', prompt: 'Transform into mosaic tile artwork (ancient Roman/Byzantine style): TILES - Small square or irregular tiles (tesserae) clearly visible. Each tile distinct. SPACING - Visible grout lines between tiles creating grid or irregular pattern. COLORS - Solid color per tile from limited palette. No gradients within individual tiles. TECHNIQUE - Tiles arranged to create image through color placement. Opus tessellatum style. TEXTURE - Three-dimensional surface quality. Slight variations in tile height. MATERIALS - Stone, glass, or ceramic tile appearance. Matte or slight sheen. COMPOSITION - Image formed by aggregate of small colored pieces. Pixelated quality at close view. SHADOWS - Subtle shadows between tiles adding depth. AVOID - Smooth surfaces, photo-realistic detail, perfect alignment, modern digital look. AIM FOR - Authentic ancient mosaic art appearance with handcrafted tile-by-tile quality and classical mosaic technique.' },
      { id: 'chineseink', name: 'Chinese Ink', prompt: 'Transform into traditional Chinese ink painting (Sumi-e/Shui-mo style): BRUSHWORK - Flowing, expressive brush strokes with varied ink density. Calligraphic quality. INK - Black ink with gradations from deep black to pale gray washes. Minimal color if any. TECHNIQUE - Wet-on-wet ink bleeding, brush texture visible. Traditional brush painting marks. COMPOSITION - Minimalist with emphasis on negative space (empty white areas). Asymmetrical balance. PHILOSOPHY - Capture essence rather than detail. Suggestion over definition. ELEMENTS - Traditional subjects: landscapes, bamboo, birds, mountains interpreted artistically. PAPER - Rice paper texture, ink absorption and bleeding effects. AVOID - Western painting techniques, heavy detail, filled composition, opaque coverage. AIM FOR - Authentic Chinese brush painting aesthetic with philosophical minimalism and masterful ink control like traditional literati paintings.' },
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
  
  // Modal states
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  
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
              {/* Comparison Mode Toggle */}
              <div className="mt-6 flex justify-center">
                <ComparisonModeToggle
                  useSlider={useComparisonSlider}
                  onToggle={setUseComparisonSlider}
                />
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
              {/* Comparison Mode Toggle */}
              {generatedImageUrl && (
                <div className="mt-6 flex justify-center">
                  <ComparisonModeToggle
                    useSlider={useComparisonSlider}
                    onToggle={setUseComparisonSlider}
                  />
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
      <Footer 
        onOpenTerms={() => setShowTerms(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onOpenFeedback={() => setShowFeedback(true)}
      />
      {isPreviewOpen && generatedImageUrl && (
        <ImagePreviewModal 
          imageUrl={generatedImageUrl} 
          onClose={handleClosePreview}
          filterName={activeFilter?.name}
        />
      )}
      
      {/* Legal and Feedback Modals */}
      {showTerms && <TermsOfService onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
      {showFeedback && <FeedbackForm onClose={() => setShowFeedback(false)} />}
    </div>
  );
};

export default App;
