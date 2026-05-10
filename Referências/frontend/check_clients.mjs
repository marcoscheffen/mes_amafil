import { createClient } from '@supabase/supabase-js';
const s = createClient('https://rznaraurwmwpxlmscsdw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw');

async function check() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});
  const { data: c } = await s.rpc('get_user_companies');
  const compId = c[0].company_id;
  const { data: clients } = await s.from('clients').select('id, phone, company_id, chatname, chatlid').eq('phone', '554599934556');
  console.log("Clients:", clients, "Current company:", compId);
}
check();
