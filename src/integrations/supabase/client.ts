import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function makeClient() {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Exported supabase client (singleton in dev)
// @ts-ignore - we intentionally attach a runtime value to globalThis for dev reuse
let _supabase: ReturnType<typeof makeClient>;
if (import.meta.env.DEV) {
  if (!(globalThis as any).__supabase) {
    (globalThis as any).__supabase = makeClient();
  }
  _supabase = (globalThis as any).__supabase as ReturnType<typeof makeClient>;
} else {
  _supabase = makeClient();
}

export const supabase = _supabase;

// Debug: log runtime detection of env vars (safe - does not print secret value)
try {
  // This will appear in the browser console when the app loads in dev
  // Useful when diagnosing login issues (missing/incorrect env variables)
  // eslint-disable-next-line no-console
  console.debug('[supabase] URL:', SUPABASE_URL);
  // eslint-disable-next-line no-console
  console.debug('[supabase] publishable key present:', !!SUPABASE_PUBLISHABLE_KEY);
} catch (e) {
  /* ignore in non-browser environments */
}