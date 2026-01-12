import { supabase } from '../utils/supabaseClient';
import { logDbCall } from '../utils/supabaseDebug';

// Admin email - set this in your .env file as VITE_ADMIN_EMAIL
// @ts-ignore - Vite env variables
const ADMIN_EMAIL = import.meta.env?.VITE_ADMIN_EMAIL || 'your-email@example.com';

export const isAdmin = (userEmail: string | undefined): boolean => {
  if (!userEmail) return false;
  return userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();
};

export interface StyleInfo {
  filter_id: string;
  filter_name: string;
  generation_count: number;
  prompt_version: number;
  last_updated: string;
}

export const getStyleStats = async (): Promise<StyleInfo[]> => {
  try {
    logDbCall('style_prompts', 'select');
    
    const { data: prompts, error: promptError } = await supabase
      .from('style_prompts')
      .select('filter_id, filter_name, generation_count, prompt_version, updated_at')
      .order('filter_name');

    if (promptError) throw promptError;

    return (prompts || []).map(prompt => ({
      filter_id: prompt.filter_id,
      filter_name: prompt.filter_name,
      generation_count: prompt.generation_count || 0,
      prompt_version: prompt.prompt_version,
      last_updated: prompt.updated_at,
    }));
  } catch (error) {
    console.error('Error fetching style stats:', error);
    throw error;
  }
};

export const getOverallStats = async () => {
  try {
    const styles = await getStyleStats();
    
    const totalStyles = styles.length;
    const totalGenerations = styles.reduce((sum, s) => sum + s.generation_count, 0);

    return {
      totalStyles,
      totalGenerations,
    };
  } catch (error) {
    console.error('Error fetching overall stats:', error);
    throw error;
  }
};
