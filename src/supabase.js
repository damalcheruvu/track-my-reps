import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xngixesduoopbgtxadyk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhuZ2l4ZXNkdW9vcGJndHhhZHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwNjgwNjcsImV4cCI6MjA4MDY0NDA2N30.3o2dc2yr0o56r1-0zWtqdTRqrv5HgpaK0LtY73q5Ky0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    headers: {
      'Accept': 'application/json'
    }
  }
})
