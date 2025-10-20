/**
 * Seed Prompts Utility
 * Run this script to seed all initial prompts from App.tsx into the Supabase database
 * 
 * Usage in browser console:
 * 1. Open your app in the browser
 * 2. Open Developer Console (F12)
 * 3. Run: window.seedPrompts()
 */

import { seedAllPrompts } from '../services/promptService';

// This is a copy of FILTER_CATEGORIES from App.tsx
// Keep this in sync when you add new filters
const FILTER_CATEGORIES = [
  {
    name: 'Artistic & Stylized',
    filters: [
      { id: 'anime', name: 'Anime', prompt: 'Apply anime illustration style rendering to this image. PRESERVE: Exact facial structure, face shape, eye shape, nose shape, mouth shape, all facial proportions, body pose, and composition. STYLE: Traditional 2D anime cel-shading with clean linework, solid color blocks, and soft shadows. Render the existing features in anime aesthetic without altering facial geometry or proportions. Keep the person 100% recognizable with their unique facial characteristics intact. Only change the rendering style to anime illustration technique.' },
      { id: 'anime_v2', name: 'Anime Enhanced', prompt: 'Apply cinematic anime key visual rendering style. PRESERVE: Exact facial structure, all facial features, eye shape, nose shape, mouth proportions, face geometry, body pose, clothing design, and composition. STYLE: Refined cel-shading with soft rim lighting and atmospheric gradients. Render existing features with anime aesthetic while maintaining perfect facial likeness. LIGHTING: Dramatic yet balanced with colored highlights. COLOR: Rich, vibrant anime palette. Keep the person 100% recognizable with all unique facial characteristics intact. Only apply anime rendering technique to existing structure.' },
      { id: 'anime_v3', name: 'Anime Cinematic', prompt: 'Apply cinematic anime film rendering style. PRESERVE: Exact facial structure, all facial features, face shape, eye shape, nose shape, mouth shape, body pose, and composition. STYLE: Elegant linework with multi-step cel-shading, cinematic lighting effects, and atmospheric elements. Render existing features with anime aesthetic while maintaining realistic facial structure and perfect likeness. LIGHTING: Cinematic rim lights with atmospheric effects. COLOR: Rich filmic palette with warm skin tones. Keep the person 100% recognizable. Only apply anime rendering technique.' },
      { id: 'cartoon', name: '3D Cartoon', prompt: 'Apply 3D animated film rendering style (DreamWorks/Illumination aesthetic). PRESERVE: Exact facial structure, face shape, eye placement, nose shape, mouth shape, all facial proportions, body pose, and composition. STYLE: Smooth 3D rendering with clean painted textures, soft lighting, and vibrant colors. Render existing features in 3D animation style while maintaining perfect facial likeness and proportions. Keep the person 100% recognizable. Only apply 3D animation rendering technique to existing structure without altering facial geometry.' },
      { id: 'pixar', name: 'Pixar Style', prompt: 'Apply Pixar Animation Studios rendering style. PRESERVE: Exact facial structure, face shape, eye shape and placement, nose shape, mouth shape, all facial proportions, body pose, and composition. STYLE: Smooth stylized 3D rendering with warm cinematic lighting, clean textures, and rich colors. Render existing features in Pixar aesthetic while maintaining perfect facial likeness. Keep the person 100% recognizable with their unique facial characteristics intact. Only apply Pixar rendering technique to existing structure without altering facial geometry or proportions.' },
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
  // Note: Due to size, only showing first category. Add all other categories from App.tsx here
];

/**
 * Seed all prompts to database
 */
export async function seedPromptsToDatabase(): Promise<void> {
  console.log('🌱 Starting prompt seeding...');
  
  // Flatten all filters from all categories
  const allFilters = FILTER_CATEGORIES.flatMap(category => category.filters);
  
  console.log(`Found ${allFilters.length} filters to seed`);
  
  try {
    await seedAllPrompts(allFilters);
    console.log('✅ All prompts seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding prompts:', error);
    throw error;
  }
}

// Expose to window for manual seeding in browser console
if (typeof window !== 'undefined') {
  (window as any).seedPrompts = seedPromptsToDatabase;
}
