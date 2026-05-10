import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'marcoscheffen@gmail.com',
    password: '12345678'
  });
  
  const { data: companies } = await supabase.rpc('get_user_companies');
  const companyId = companies[0].company_id;
  
  const { data: messages } = await supabase.rpc('get_chat_messages', {
      p_company_id: companyId
  });
  
  console.log(`Total messages in company: ${messages.length}`);
  const clientMsgs = messages.filter(m => m.fromme === false);
  console.log(`Messages from client (fromme = false): ${clientMsgs.length}`);
  if (clientMsgs.length > 0) {
      console.log("Sample client message:", clientMsgs[0]);
  }
}

check();
