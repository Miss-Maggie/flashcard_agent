import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { Database } from '../../src/integrations/supabase/types';

// Load environment variables from .env file
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey);

async function exportData() {
  console.log('🔄 Exporting data from Lovable Cloud...');

  // Export flashcards
  const { data: flashcards, error: flashcardsError } = await supabase
    .from('flashcards')
    .select('*');
  
  if (flashcardsError) {
    console.error('Error exporting flashcards:', flashcardsError);
  } else {
    console.log(`✅ Exported ${flashcards?.length || 0} flashcards`);
  }

  // Export profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*');
  
  if (profilesError) {
    console.error('Error exporting profiles:', profilesError);
  } else {
    console.log(`✅ Exported ${profiles?.length || 0} profiles`);
  }

  // Export quiz_results
  const { data: quizResults, error: quizResultsError } = await supabase
    .from('quiz_results')
    .select('*');
  
  if (quizResultsError) {
    console.error('Error exporting quiz_results:', quizResultsError);
  } else {
    console.log(`✅ Exported ${quizResults?.length || 0} quiz results`);
  }

  const exportData = {
    flashcards: flashcards || [],
    profiles: profiles || [],
    quiz_results: quizResults || [],
    exported_at: new Date().toISOString()
  };

  // Save to file
  writeFileSync('data-export.json', JSON.stringify(exportData, null, 2));
  console.log('💾 Data saved to data-export.json');
}

exportData().catch(console.error);
