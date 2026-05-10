import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';
const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});
  
  // Try to fetch via API with the service role? No, we just have anon + authed user
  // Let's use RPC if possible, or direct select
  const { data: msg, error: err } = await s.from('chat_message').select('*').eq('id', 'bc0c511b-f4e4-4e35-aa66-95d3c535aafb');
  console.log("Direct select error if any:", err);
  console.log("Direct select msg:", msg);
}
run();
