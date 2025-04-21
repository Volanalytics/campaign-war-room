// Supabase client setup
const SUPABASE_URL = 'https://xhqzjelmxblchcdcdigv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhocXpqZWxteGJsY2hjZGNkaWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NDIwNzAsImV4cCI6MjA2MDQxODA3MH0.9IaodsGAvJXHwndCCTms3JT2f5dBqNNIrxE0EqOhT7s';

// Export as supabaseClient for consistency with main.js
try {
  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase client initialized successfully as supabaseClient');
} catch (error) {
  console.error('Error initializing Supabase client:', error);
}
