const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wzebzcgaiazkrkprhgen.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZWJ6Y2dhaWF6a3JrcHJoZ2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzAwOTYsImV4cCI6MjA4OTgwNjA5Nn0.Z00T3HSK8FtRAeqEsBKUu1TQTGxZVwc-l69AsNuHHjU';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSchema() {
  // Query information_schema for driver_checkins columns
  console.log('=== driver_checkins schema ===');
  const dc = await sb.rpc('get_columns', { table_name: 'driver_checkins' });
  console.log('RPC result:', dc);
  
  // Alternative: try to get from pg_catalog
  console.log('\n=== guide_checkins schema ===');
  const gc = await sb.rpc('get_columns', { table_name: 'guide_checkins' });
  console.log('RPC result:', gc);
}

checkSchema().catch(console.error);
