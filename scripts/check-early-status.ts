
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStatus() {
    const { data, error } = await supabase
        .from('attendance_logs')
        .select('status')

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    const statuses = data.map(d => d.status)
    const uniqueStatuses = [...new Set(statuses)]
    console.log('Unique statuses found:', uniqueStatuses)

    const earlyCount = statuses.filter(s => s === 'early').length
    console.log('Count of "early" status:', earlyCount)

    const presentCount = statuses.filter(s => s === 'present').length
    console.log('Count of "present" status:', presentCount)
}

checkStatus()
