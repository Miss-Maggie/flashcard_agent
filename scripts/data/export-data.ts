import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { Database } from '../../src/integrations/supabase/types';

// Lovable Cloud credentials (from your .env)
const CLOUD_URL = 'https://nffmxxmpccakdylnhjqf.supabase.co';
const CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZm14eG1wY2Nha2R5bG5oanFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MTIzNjMsImV4cCI6MjA3OTQ4ODM2M30.Ts46YsawfW_0oPpE500Rmx4Rnol6xcNiyvlu7cu6zn0';

const supabase = createClient<Database>(CLOUD_URL, CLOUD_KEY);

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
