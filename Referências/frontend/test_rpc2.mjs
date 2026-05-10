import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';
const s = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDef() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});

  // We cannot read pg_proc natively without service role, but what if there's syntax we can use remotely?
  // Let's test the other branch of the function (fetch all messages without client_id)
  const { data: c } = await s.rpc('get_user_companies');
  const compId = c[0].company_id;
  
  const { data: allMsgs } = await s.rpc('get_chat_messages', {p_company_id: compId, p_client_id: null});
  console.log("Total messages without client filter:", allMsgs?.length);
  if (allMsgs) {
      const missing = allMsgs.find(m => m.id === 'bc0c511b-f4e4-4e35-aa66-95d3c535aafb');
      console.log("Is it there without client filter?", !!missing);
      
      // Let's check what user_id is on this message inside the rpc response if it is returned
      if (missing) console.log("Missing msg from RPC:", missing);
  }
}
checkDef();
