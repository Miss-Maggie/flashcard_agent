import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { Database } from '../../src/integrations/supabase/types';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'YOUR_LOCAL_ANON_KEY';

const supabase = createClient<Database>(LOCAL_URL, LOCAL_KEY);

async function importData() {
  console.log('🔄 Importing data to local Supabase...');

  // Read export file
  const exportData = JSON.parse(readFileSync('data-export.json', 'utf-8'));

  // Import profiles first (as other tables may reference user_id)
  if (exportData.profiles?.length > 0) {
    const { error: profilesError } = await supabase
      .from('profiles')
      .upsert(exportData.profiles);
    
    if (profilesError) {
      console.error('Error importing profiles:', profilesError);
    } else {
      console.log(`✅ Imported ${exportData.profiles.length} profiles`);
    }
  }

  // Import flashcards
  if (exportData.flashcards?.length > 0) {
    const { error: flashcardsError } = await supabase
      .from('flashcards')
      .upsert(exportData.flashcards);
    
    if (flashcardsError) {
      console.error('Error importing flashcards:', flashcardsError);
    } else {
      console.log(`✅ Imported ${exportData.flashcards.length} flashcards`);
    }
  }

  // Import quiz_results
  if (exportData.quiz_results?.length > 0) {
    const { error: quizResultsError } = await supabase
      .from('quiz_results')
      .upsert(exportData.quiz_results);
    
    if (quizResultsError) {
      console.error('Error importing quiz_results:', quizResultsError);
    } else {
      console.log(`✅ Imported ${exportData.quiz_results.length} quiz results`);
    }
  }

  console.log('✨ Import complete!');
}

importData().catch(console.error);
