import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';
const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectStrings() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});
  
  const { data: msg } = await s.from('chat_message')
      .select('phone')
      .eq('id', 'bc0c511b-f4e4-4e35-aa66-95d3c535aafb')
      .single();
  
  const { data: cli } = await s.from('clients')
      .select('phone')
      .eq('id', 'be15d460-2522-4e89-8c19-fd77d84bda17')
      .single();

  console.log("Msg phone:", JSON.stringify(msg?.phone));
  console.log("Cli phone:", JSON.stringify(cli?.phone));
  console.log("Are they equal?", msg?.phone === cli?.phone);
}
inspectStrings();
