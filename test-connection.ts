// test-connection.ts
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables')
  process.exit(1)
}


const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  const { data, error } = await supabase
    .from('pg_tables')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Connection error:', error)
  } else {
    console.log('Connection successful!')
  }
}

testConnection()