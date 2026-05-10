import { createClient } from '@supabase/supabase-js';
const s = createClient('https://rznaraurwmwpxlmscsdw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw');

async function run() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});
  const { data: msgs } = await s.from('chat_message').select('id, user_id, phone');
  const targetMsgs = msgs?.filter(m => m.phone === '554599934556');
  console.log(`There are ${targetMsgs?.length} messages with that phone in chat_message table.`);

  const { data: qry, error } = await s.rpc('get_chat_messages', {
    p_company_id: 'f7749b56-babd-4cbd-9b3b-072c2a24f4ec'
  });
  console.log(`The get_chat_messages RPC returns ${qry?.length} messages for that company.`);
  
  if (targetMsgs?.length > qry?.length) {
    console.log("The SQL database is OMITTING messages. This means the INNER JOIN is still running `ON c.id = cm.user_id` inside the database, indicating the `apply_chat_fix.sql` was NOT applied completely or properly by the user!");
  } else {
    console.log("If lengths are equal, the RPC script IS applied, but wait... 6 is less than 7.");
  }
}
run();
