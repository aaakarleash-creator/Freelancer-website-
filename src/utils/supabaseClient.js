import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⛔ SUPABASE ENV VARS MISSING!\n' +
    'Create a .env file in your project ROOT (same folder as package.json):\n\n' +
    'REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co\n' +
    'REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...\n\n' +
    'Then RESTART the dev server: npm start\n' +
    'Do NOT use VITE_ prefix — this is a CRA project, use REACT_APP_ prefix.'
  );
}

export const supabase = createClient(
  SUPABASE_URL  || 'https://udufxyzdpjczqlozkero.supabase.co',
  SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdWZ4eXpkcGpjenFsb3prZXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MTYwNDcsImV4cCI6MjA5NDA5MjA0N30.Q4oDNa8TXdGBFNL-xvoQVD6nBdb3FhWWtRaFddRZvqg',
  {
    auth: {
      persistSession:     false,  // Do NOT persist session across page reloads
      autoRefreshToken:   false,  // Do NOT auto refresh
      detectSessionInUrl: false,  // Do NOT restore from URL
    },
  }
);

console.log('🔗 Supabase client initialized');