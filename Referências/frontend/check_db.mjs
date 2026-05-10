import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'marcoscheffen@gmail.com',
    password: '12345678'
  });
  
  if (authError) {
    console.log('Auth error:', authError);
    return;
  }

  const { data: companies } = await supabase.rpc('get_user_companies');
  if (!companies || companies.length === 0) {
    console.log('No companies found');
    return;
  }
  
  const companyId = companies[0].company_id;
  
  const { data: messages, error } = await supabase.rpc('get_chat_messages', {
      p_company_id: companyId
  });
  
  if (error) {
    console.log('Error fetching messages:', error);
    return;
  }

  console.log(`Found ${messages.length} messages.`);
  messages.forEach(m => {
    console.log(`[${m.created_at}] fromme: ${m.fromme}, texto: ${m.message_texto_text}`);
  });
}

check();
