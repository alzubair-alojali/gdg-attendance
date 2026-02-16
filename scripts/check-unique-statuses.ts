
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// We might need service role key if RLS blocks anon read
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function checkStatus() {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('status, scanned_at, session_id')
        .limit(100)

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    if (!data || data.length === 0) {
        console.log('No data found in attendance_logs')
        return
    }

    const statuses = data.map(d => d.status)
    const uniqueStatuses = [...new Set(statuses)]
    console.log('Unique statuses found:', uniqueStatuses)

    // check scanned_at format
    console.log('Sample scanned_at:', data[0].scanned_at)
}

checkStatus()
