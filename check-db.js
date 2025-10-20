/**
 * Database Check Script
 * Run this to see what's in your Supabase database
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://seedglnzvhnbjwcfniup.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZWRnbG56dmhuYmp3Y2ZuaXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MDg5OTksImV4cCI6MjA3NjQ4NDk5OX0.j7ATY4CN9554aLmyBakB9ImKtfa9DXsCTY1iHMMdVdY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Connection...\n');
  console.log('📊 Project URL:', SUPABASE_URL);
  console.log('=' .repeat(80));
  
  // Check style_votes table
  console.log('\n📋 TABLE: style_votes');
  console.log('-'.repeat(80));
  try {
    const { data: styleVotes, error: styleError } = await supabase
      .from('style_votes')
      .select('*')
      .order('total_votes', { ascending: false });
    
    if (styleError) {
      console.error('❌ Error:', styleError.message);
    } else {
      console.log(`✅ Found ${styleVotes?.length || 0} records`);
      if (styleVotes && styleVotes.length > 0) {
        console.log('\nTop voted styles:');
        styleVotes.slice(0, 10).forEach((vote, i) => {
          console.log(`  ${i + 1}. ${vote.filter_name}`);
          console.log(`     👍 ${vote.thumbs_up} | 👎 ${vote.thumbs_down} | Total: ${vote.total_votes}`);
          console.log(`     Last modified: ${new Date(vote.last_modified).toLocaleString()}`);
        });
      } else {
        console.log('  (No votes recorded yet)');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  // Check user_votes table
  console.log('\n📋 TABLE: user_votes');
  console.log('-'.repeat(80));
  try {
    const { data: userVotes, error: userError, count } = await supabase
      .from('user_votes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (userError) {
      console.error('❌ Error:', userError.message);
    } else {
      console.log(`✅ Total votes: ${count || 0}`);
      if (userVotes && userVotes.length > 0) {
        console.log('\nRecent votes:');
        userVotes.forEach((vote, i) => {
          const voteIcon = vote.vote_type === 'up' ? '👍' : '👎';
          const userType = vote.user_id ? '🔐 Auth' : '👤 Anon';
          console.log(`  ${i + 1}. ${voteIcon} ${vote.filter_name} - ${userType}`);
          console.log(`     Generation: ${vote.generation_id}`);
          console.log(`     Time: ${new Date(vote.created_at).toLocaleString()}`);
        });
      } else {
        console.log('  (No individual votes recorded yet)');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  // Check prompt_overrides table
  console.log('\n📋 TABLE: prompt_overrides');
  console.log('-'.repeat(80));
  try {
    const { data: overrides, error: overrideError } = await supabase
      .from('prompt_overrides')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (overrideError) {
      console.error('❌ Error:', overrideError.message);
    } else {
      console.log(`✅ Found ${overrides?.length || 0} prompt overrides`);
      if (overrides && overrides.length > 0) {
        console.log('\nActive overrides:');
        overrides.forEach((override, i) => {
          console.log(`  ${i + 1}. ${override.filter_name}`);
          console.log(`     Reason: ${override.reason}`);
          console.log(`     Updated: ${new Date(override.updated_at).toLocaleString()}`);
        });
      } else {
        console.log('  (No prompt overrides yet)');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
  
  // Check auth users
  console.log('\n📋 AUTH: Current User');
  console.log('-'.repeat(80));
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (anonymous mode)');
    } else if (user) {
      console.log('✅ Authenticated user:');
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
    } else {
      console.log('ℹ️  No authenticated user (anonymous mode)');
    }
  } catch (err) {
    console.log('ℹ️  No authenticated user (anonymous mode)');
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ Database check complete!\n');
}

checkDatabase().catch(console.error);
