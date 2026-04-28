import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkBuckets() {
  console.log('Checking Supabase connection...')
  console.log('URL:', supabaseUrl)

  // 1. Try listing buckets
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) {
    console.log('List Buckets Error:', listError.message)
  } else {
    console.log('Visible Buckets:', buckets.map(b => b.name).join(', ') || 'None')
  }

  // 2. Try direct access
  const { data: bucket, error: getError } = await supabase.storage.getBucket('signs_library')
  if (getError) {
    console.log('Direct getBucket("signs_library"): FAILED -', getError.message)
  } else {
    console.log('Direct getBucket("signs_library"): SUCCESS - Found bucket')
  }

  // 3. Try listing files in the bucket
  const { data: files, error: filesError } = await supabase.storage.from('signs_library').list()
  if (filesError) {
    console.log('Listing files in "signs_library": FAILED -', filesError.message)
  } else {
    console.log('Listing files in "signs_library": SUCCESS - Found', files.length, 'files')
    if (files.length > 0) {
        console.log('Sample file:', files[0].name)
    }
  }
}

checkBuckets()
