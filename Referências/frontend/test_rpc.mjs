import { createClient } from '@supabase/supabase-js';
const s = createClient('https://rznaraurwmwpxlmscsdw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bmFyYXVyd213cHhsbXNjc2R3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjcxODgsImV4cCI6MjA3OTUwMzE4OH0.rGdjs4ibRJJgTVnWeIulfnd3VB_68F8wtZduY9shvqw');

async function testRPC() {
  await s.auth.signInWithPassword({email: 'marcoscheffen@gmail.com', password: '12345678'});
  const compId = 'f7749b56-babd-4cbd-9b3b-072c2a24f4ec'; // from the dbgCli output
  const clientId = 'be15d460-2522-4e89-8c19-fd77d84bda17';

  // call the RPC directly with the company and client
  const { data: messages, error } = await s.rpc('get_chat_messages', {
    p_company_id: compId,
    p_client_id: clientId
  });

  if (error) {
    console.error("RPC Error:", error);
    return;
  }
  
  if (!messages) {
    console.log("No messages returned by RPC.");
    return;
  }

  // search for our missing message
  const missingMsg = messages.find(m => m.id === 'bc0c511b-f4e4-4e35-aa66-95d3c535aafb');
  console.log(`RPC returned ${messages.length} messages.`);
  if (missingMsg) {
    console.log("Missing message WAS FOUND by RPC:", missingMsg.message_texto_text, "fromme:", missingMsg.fromme);
  } else {
    console.log("Missing message was NOT FOUND in the RPC output. Investigating...");
    // let's grab all messages to see what DID get returned
    console.log("All returned ids:", messages.map(m => m.id));
  }
}
testRPC();
