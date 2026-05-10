import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://rznaraurwmwpxlmscsdw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function check() {
  await supabase.auth.signInWithPassword({
    email: 'marcoscheffen@gmail.com',
    password: '12345678'
  });
  
  const { data: msg } = await supabase.from('chat_message').select('*').eq('id', 'bc0c511b-f4e4-4e35-aa66-95d3c535aafb');
  console.log("Message:", msg);
  
  if (msg && msg.length > 0) {
      const phone = msg[0].phone;
      console.log(`Searching clients for phone: ${phone}`);
      const { data: clients } = await supabase.from('clients').select('id, phone, chatname').eq('phone', phone);
      console.log("Clients with this phone:", clients);
  }
}

check();
